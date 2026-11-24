import { LAB_ROOT } from './paths.mjs';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export const VERSION = '0.1.0';
export const hash = b => createHash('sha256').update(b).digest('hex');
const id = prefix => `${prefix}-${randomUUID()}`;
const stamp = () => new Date().toISOString();
const parse = row => row ? JSON.parse(row.data) : null;
const need = (condition, message) => { if (!condition) throw new Error(message); };
const text = (s, name, max = 2000) => { need(typeof s === 'string' && s.trim().length > 0 && s.length <= max, `${name}: expected nonempty text up to ${max} characters`); return s; };
const statuses = ['satisfied', 'contradicted', 'unverified', 'not-applicable'];

export class Lab {
  constructor(root = LAB_ROOT) {
    this.root = resolve(root);
    mkdirSync(this.root, { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(join(this.root, 'lab.sqlite'));
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS missions (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, mission TEXT NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS artifacts (id TEXT PRIMARY KEY, mission TEXT NOT NULL, name TEXT NOT NULL, data TEXT NOT NULL, bytes BLOB NOT NULL);
      CREATE TABLE IF NOT EXISTS heads (mission TEXT NOT NULL, name TEXT NOT NULL, artifact TEXT NOT NULL, PRIMARY KEY(mission,name));
      CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, mission TEXT NOT NULL, type TEXT NOT NULL, at TEXT NOT NULL, data TEXT NOT NULL);
      CREATE TRIGGER IF NOT EXISTS immutable_events_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'events are append-only'); END;
      CREATE TRIGGER IF NOT EXISTS immutable_events_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'events are append-only'); END;`);
    const schema = this.db.prepare('SELECT value FROM meta WHERE key=?').get('schema');
    need(!schema || schema.value === 'lab-factory/v1', 'Unsupported store schema');
    this.db.prepare('INSERT OR IGNORE INTO meta VALUES (?,?)').run('schema', 'lab-factory/v1');
  }
  close() { this.db.close(); }
  tx(fn) { if(this.inTransaction)return fn(); this.db.exec('BEGIN IMMEDIATE'); this.inTransaction=true; try { const r = fn(); this.db.exec('COMMIT'); return r; } catch (e) { this.db.exec('ROLLBACK'); throw e; } finally { this.inTransaction=false; } }
  event(mission, type, data) {
    const e = { id: id('event'), missionId: mission, type, at: stamp(), data };
    this.db.prepare('INSERT INTO events(id,mission,type,at,data) VALUES (?,?,?,?,?)').run(e.id, mission, type, e.at, JSON.stringify(data));
    return e;
  }
  mission(mid) { const m = parse(this.db.prepare('SELECT data FROM missions WHERE id=?').get(mid)); need(m, 'Unknown mission'); return m; }
  run(rid) { const r = parse(this.db.prepare('SELECT data FROM runs WHERE id=?').get(rid)); need(r, 'Unknown run'); return r; }
  artifact(aid) {
    const row = this.db.prepare('SELECT data,bytes FROM artifacts WHERE id=?').get(aid); need(row, 'Unknown artifact');
    const a = parse(row); const bytes = Buffer.from(row.bytes);
    need(hash(bytes) === a.sha256, 'Artifact integrity mismatch');
    return { ...a, bytes };
  }
  artifactInfo(aid) { const { bytes, ...a } = this.artifact(aid); return a; }
  references(mid, refs) {
    need(Array.isArray(refs), 'Expected artifact references');
    for (const ref of refs) need(this.artifact(ref).missionId === mid, 'Cross-mission evidence rejected');
    return refs;
  }
  createMission({ subject, question, criteria }) {
    text(subject, 'subject', 120); text(question, 'question');
    need(Array.isArray(criteria) && criteria.length > 0 && criteria.length <= 20, 'Provide 1–20 criteria');
    const seen = new Set();
    for (const c of criteria) {
      text(c.id, 'criterion id', 80); text(c.description, 'criterion description');
      need(!seen.has(c.id), 'Duplicate criterion'); seen.add(c.id);
      need(['check','judge','human'].includes(c.kind), 'Criterion kind must be check, judge, or human');
      if (c.kind === 'check') need(['artifact-integrity','json-valid','personas-move','png'].includes(c.verifier), 'Unknown verifier');
    }
    const m = { id: id('mission'), subject, question, criteria, createdAt: stamp(), methodVersion: VERSION, scope: 'local lab; no external publication', maxWorkers: 2 };
    return this.tx(() => { this.db.prepare('INSERT INTO missions VALUES (?,?)').run(m.id, JSON.stringify(m)); this.event(m.id, 'mission.started', m); return m; });
  }
  list() { return this.db.prepare('SELECT data FROM missions ORDER BY rowid').all().map(parse); }
  createRun({ missionId, role, question, inputRefs = [], dependsOn = [], provider = 'codex', sourceRevision = 'unknown' }) {
    const m = this.mission(missionId); text(role, 'role', 80); text(question, 'question'); text(provider, 'provider', 80); text(sourceRevision, 'source revision', 120);
    this.references(missionId, inputRefs); need(Array.isArray(dependsOn), 'Invalid dependencies');
    return this.tx(() => {
      for (const dep of dependsOn) { const r = this.run(dep); need(r.missionId === missionId && r.status === 'succeeded', 'Dependency not completed successfully'); }
      const running = this.db.prepare('SELECT data FROM runs WHERE mission=?').all(missionId).map(parse).filter(r => ['assigned','running'].includes(r.status));
      need(running.length < m.maxWorkers, 'Worker capacity reached');
      const r = { id: id('run'), missionId, role, question, inputRefs, dependsOn, provider, sourceRevision, status: 'assigned', createdAt: stamp(), externalRunId: null, usage: null };
      this.db.prepare('INSERT INTO runs VALUES (?,?,?)').run(r.id, missionId, JSON.stringify(r)); this.event(missionId, 'run.assigned', r); return r;
    });
  }
  linkRun({ runId, externalRunId }) {
    text(externalRunId, 'external run', 160);
    return this.tx(() => { const r = this.run(runId); need(r.status === 'assigned', 'Run already linked or terminal'); r.externalRunId = externalRunId; r.status = 'running'; this.db.prepare('UPDATE runs SET data=? WHERE id=?').run(JSON.stringify(r), runId); this.event(r.missionId, 'run.linked', { runId, externalRunId }); return r; });
  }
  finishRun({ runId, status, summary, usage = null }) {
    need(['succeeded','failed','interrupted'].includes(status), 'Invalid terminal status'); text(summary, 'summary');
    if (usage !== null) { need(typeof usage === 'object', 'Invalid usage'); for (const key of Object.keys(usage)) need(['inputTokens','outputTokens','costUsd','durationMs'].includes(key) && (usage[key] === null || (Number.isFinite(usage[key]) && usage[key] >= 0)), 'Invalid usage metric'); }
    return this.tx(() => { const r = this.run(runId); need(['assigned','running'].includes(r.status), 'Run already terminal'); Object.assign(r, {status,summary,usage,finishedAt:stamp()}); this.db.prepare('UPDATE runs SET data=? WHERE id=?').run(JSON.stringify(r), runId); this.event(r.missionId, 'run.finished', {runId,status,summary,usage}); return r; });
  }
  putArtifact({ missionId, name, mediaType = 'application/json', content, encoding = 'utf8', expectedRevision = null, runId = null, inputRefs = [] }) {
    this.mission(missionId); this.references(missionId,inputRefs); text(name, 'artifact name', 100); need(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name), 'Use a plain artifact name');
    need(['application/json','image/png','text/plain','text/markdown'].includes(mediaType), 'Unsupported artifact type');
    need(['utf8','base64'].includes(encoding) && typeof content === 'string', 'Invalid content');
    need(content.length <= 12_000_000, 'Artifact too large');
    if (encoding === 'base64') need(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(content), 'Invalid base64');
    const bytes = Buffer.from(content, encoding); need(bytes.length <= 8_000_000, 'Artifact too large');
    if (mediaType === 'application/json') JSON.parse(bytes.toString('utf8'));
    if (runId) need(this.run(runId).missionId === missionId, 'Cross-mission run rejected');
    return this.tx(() => {
      const head = this.db.prepare('SELECT artifact FROM heads WHERE mission=? AND name=?').get(missionId,name)?.artifact ?? null;
      need(head === expectedRevision, 'Stale revision: reload current artifact before changing it');
      const a = { id:id('artifact'),missionId,name,mediaType,sha256:hash(bytes),size:bytes.length,parentId:head,runId,inputRefs,createdAt:stamp() };
      this.db.prepare('INSERT INTO artifacts VALUES (?,?,?,?,?)').run(a.id,missionId,name,JSON.stringify(a),bytes);
      this.db.prepare('INSERT INTO heads VALUES (?,?,?) ON CONFLICT(mission,name) DO UPDATE SET artifact=excluded.artifact').run(missionId,name,a.id);
      this.event(missionId,'artifact.created',a); return a;
    });
  }
  verify({ runId, criterionId, artifactIds }) {
    const r = this.run(runId), m = this.mission(r.missionId), c = m.criteria.find(c => c.id === criterionId);
    need(c?.kind === 'check', 'Not a deterministic criterion'); need(Array.isArray(artifactIds) && artifactIds.length > 0 && artifactIds.length <= 20, 'Provide evidence artifacts');
    this.references(r.missionId, artifactIds);
    const artifacts = artifactIds.map(a => this.artifact(a)); let detail;
    try {
      if (c.verifier === 'artifact-integrity') detail = `SHA-256 verified for ${artifacts.length} artifacts`;
      if (c.verifier === 'json-valid') { for (const a of artifacts) JSON.parse(a.bytes.toString('utf8')); detail = 'All supplied artifacts parse as JSON'; }
      if (c.verifier === 'png') {
        for (const a of artifacts) need(a.bytes.length >= 24 && a.bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && a.bytes.readUInt32BE(16) === 1920 && a.bytes.readUInt32BE(20) === 1080, 'Expected a 1920×1080 PNG header');
        detail = 'PNG signatures and 1920×1080 dimensions checked; visual quality unverified';
      }
      if (c.verifier === 'personas-move') {
        need(artifacts.length === 3, 'Supply before, after, recipe in that order');
        const [before, after, recipe] = artifacts.map(a => JSON.parse(a.bytes.toString('utf8')));
        verifyMove(before, after, recipe);
        detail = 'Exact transformation verified: stable node identities, one parent move, only required scene focus changes';
      }
    } catch (e) {
      const result = {runId,criterionId,status:'contradicted',verifier:c.verifier,artifactIds,detail:e.message}; this.event(r.missionId,'check.completed',result); return result;
    }
    const result = {runId,criterionId,status:'satisfied',verifier:c.verifier,artifactIds,detail}; this.event(r.missionId,'check.completed',result); return result;
  }
  submitJudge({ runId, evaluator, rubricVersion, findings }) {
    const r = this.run(runId), m = this.mission(r.missionId); text(evaluator,'evaluator',160); text(rubricVersion,'rubric',80);
    need(Array.isArray(findings) && findings.length > 0 && findings.length <= 20, 'Provide 1–20 findings');
    const seen = new Set();
    for (const f of findings) {
      need(!seen.has(f.criterionId), 'Duplicate judge criterion'); seen.add(f.criterionId);
      need(m.criteria.some(c => c.id === f.criterionId && c.kind === 'judge'), 'Judge cannot satisfy deterministic or human criteria');
      need(statuses.includes(f.status), 'Invalid finding status'); text(f.reason,'finding reason'); this.references(m.id,f.artifactIds);
      need(f.status === 'unverified' || f.artifactIds.length > 0, 'A judgment needs evidence');
    }
    return this.event(m.id,'judge.submitted',{runId,evaluator,rubricVersion,findings,authority:'advisory; evaluator identity supplied by caller'});
  }
  feedback({ missionId, note, source = 'user-reported' }) { this.mission(missionId); text(note,'feedback'); need(['user-reported','operator-note'].includes(source),'Invalid feedback source'); return this.event(missionId,'feedback.recorded',{note,source,authority:'reported feedback, not authenticated acceptance'}); }
  events(mid) { this.mission(mid); return this.db.prepare('SELECT * FROM events WHERE mission=? ORDER BY seq').all(mid).map(e => ({seq:e.seq,id:e.id,missionId:e.mission,type:e.type,at:e.at,data:JSON.parse(e.data)})); }
  snapshot(mid) {
    const mission = this.mission(mid), events = this.events(mid);
    const runs = this.db.prepare('SELECT data FROM runs WHERE mission=? ORDER BY rowid').all(mid).map(parse);
    const artifacts = this.db.prepare('SELECT data FROM artifacts WHERE mission=? ORDER BY rowid').all(mid).map(parse).map(a => {
      try { this.artifact(a.id); return {...a,integrity:'verified'}; } catch { return {...a,integrity:'mismatch'}; }
    });
    const heads = this.db.prepare('SELECT name,artifact FROM heads WHERE mission=?').all(mid);
    const validRefs = refs => refs.length > 0 && refs.every(ref => artifacts.some(a => a.id === ref && a.integrity === 'verified'));
    const currentRefs = (refs, seen=new Set()) => refs.every(ref => { if(seen.has(ref))return false; const a=artifacts.find(a=>a.id===ref); return a && a.integrity==='verified' && heads.some(h=>h.name===a.name && h.artifact===ref) && currentRefs(a.inputRefs || [],new Set([...seen,ref])); });
    const criteria = mission.criteria.map(c => {
      const checks = events.filter(e => e.type === 'check.completed' && e.data.criterionId === c.id);
      const judgments = events.filter(e => e.type === 'judge.submitted').flatMap(e => e.data.findings.filter(f => f.criterionId === c.id).map(f => ({...f,evaluator:e.data.evaluator,rubricVersion:e.data.rubricVersion})));
      // Superseded evidence retains its historical result but cannot satisfy the current report.
      const latest = c.kind === 'check' ? checks.at(-1)?.data : judgments.at(-1);
      const status = latest && validRefs(latest.artifactIds) && currentRefs(latest.artifactIds) ? latest.status : 'unverified';
      return {...c,status,basis:latest ?? null,currentHeads:latest ? currentRefs(latest.artifactIds) : null,judgments};
    });
    return {schema:'lab-factory/report/v1',mission,runs,artifacts,heads,events,criteria,feedback:events.filter(e => e.type === 'feedback.recorded').map(e => e.data),limitations:['Judges are advisory and caller-attributed. Human learning is not inferred.','Checks apply only to their named artifact revisions; currentHeads indicates revision freshness.','PNG header checks do not establish visual fidelity. Usage absent from a runtime remains unknown.']};
  }
}
export function canonical(value) { if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']'; if (value && typeof value === 'object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}'; return JSON.stringify(value); }
export function moveRoom(project, recipe) {
  need(recipe?.schema === 'lab-factory/move-room/v1', 'Unknown move recipe');
  const p = structuredClone(project), nodes = p.workspace?.nodes; need(Array.isArray(nodes), 'Project has no workspace nodes');
  const node = nodes.find(n => n.id === recipe.nodeId), target = nodes.find(n => n.id === recipe.targetId);
  need(node?.kind === 'channel' && target?.kind === 'team', 'Move requires channel and team IDs');
  need(node.parent === recipe.sourceId && node.parent !== target.id, 'Move source mismatch or no-op');
  need(nodes.filter(n=>n.id===node.id).length===1 && nodes.filter(n=>n.id===target.id).length===1, 'Duplicate node identity');
  node.parent = target.id;
  const inside = value => { const seen = new Set(); let n = nodes.find(n=>n.id===value); while(n) { if(n.id===node.id)return true; if(seen.has(n.id))throw new Error('Workspace cycle'); seen.add(n.id); n=nodes.find(x=>x.id===n.parent); } return false; };
  for (const scene of p.scenes || []) if (scene.selected && inside(scene.selected)) {
    need(!scene.viewer || target.members?.includes(scene.viewer), 'Viewer is not a member of the destination team');
    scene.root = target.id;
  }
  for (const update of recipe.notes || []) {
    const slide = p.slides?.find(s=>s.id===update.slideId);
    need(slide && slide.presenterNotes===update.before && typeof update.after==='string', 'Presenter note revision mismatch');
    slide.presenterNotes=update.after;
  }
  return p;
}

// Independent diff audit: never calls the transformation used by the builder.
export function verifyMove(before, after, recipe) {
  need(recipe.schema === 'lab-factory/move-room/v1', 'Unknown recipe');
  const nodes = before.workspace?.nodes;
  need(Array.isArray(nodes), 'Missing nodes');
  need(nodes.every(n=>typeof n.id==='string') && new Set(nodes.map(n=>n.id)).size===nodes.length,'Duplicate or missing node identity');
  const byId=new Map(nodes.map(n=>[n.id,n]));
  for(const n of nodes){const seen=new Set();let cursor=n;while(cursor){need(!seen.has(cursor.id),'Workspace cycle');seen.add(cursor.id);if(cursor.parent)need(byId.has(cursor.parent),'Missing parent');cursor=byId.get(cursor.parent);}}
  const moved = nodes.find(n => n.id === recipe.nodeId), target = nodes.find(n => n.id === recipe.targetId);
  need(moved?.kind === 'channel' && target?.kind === 'team' && moved.parent === recipe.sourceId && recipe.sourceId !== recipe.targetId, 'Invalid move endpoints');
  const descendants = new Set([moved.id]);
  for(let i=0;i<nodes.length;i++) for(const n of nodes) if(descendants.has(n.parent)) descendants.add(n.id);
  const expected = new Map([[JSON.stringify(['workspace','nodes',nodes.indexOf(moved),'parent']), recipe.targetId]]);
  for(const [i,scene] of (before.scenes || []).entries()) if(descendants.has(scene.selected)) {
    need(!scene.viewer || target.members?.includes(scene.viewer), 'Destination viewer mismatch');
    if(scene.root !== recipe.targetId) expected.set(JSON.stringify(['scenes',i,'root']),recipe.targetId);
  }
  for(const note of recipe.notes || []) {
    const i=(before.slides || []).findIndex(s=>s.id===note.slideId);
    need(i>=0 && before.slides[i].presenterNotes===note.before && typeof note.after==='string', 'Invalid note revision');
    if(note.before!==note.after)expected.set(JSON.stringify(['slides',i,'presenterNotes']),note.after);
  }
  function walk(a,b,path=[]) {
    if(canonical(a)===canonical(b))return;
    const key=JSON.stringify(path);
    if(expected.has(key)){need(canonical(b)===canonical(expected.get(key)), 'Wrong changed value: '+key);expected.delete(key);return;}
    need(a && b && typeof a==='object' && typeof b==='object' && Array.isArray(a)===Array.isArray(b), 'Unexpected change: '+key);
    const keys=new Set([...Object.keys(a),...Object.keys(b)]);
    for(const k of keys)walk(a[k],b[k],[...path,Array.isArray(a)?Number(k):k]);
  }
  walk(before,after);need(expected.size===0,'Required changes missing');
}
