const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function markdown(r) {
  const lines = [`# ${r.mission.subject}`, '', r.mission.question, '', `Mission: ${r.mission.id}`, '', '## Criteria', '', '| Criterion | Kind | Status | Current revisions |', '|---|---|---|---|'];
  for (const c of r.criteria) lines.push(`| ${c.id} | ${c.kind} | ${c.status} | ${c.currentHeads ?? 'unmeasured'} |`);
  lines.push('', '## Runs', '');
  for (const run of r.runs) lines.push(`- ${run.role}: ${run.status}; ${run.summary || run.question}; usage: ${run.usage ? JSON.stringify(run.usage) : 'unknown'}`);
  lines.push('', '## Evidence', '');
  for (const a of r.artifacts) lines.push(`- ${a.name} — ${a.id} — ${a.sha256} — ${a.integrity}`);
  lines.push('', '## Human feedback', '', ...(r.feedback.length ? r.feedback.map(f=>`- ${f.source}: ${f.note}`) : ['Not collected.']), '', '## Timeline', '');
  for (const e of r.events) lines.push(`- ${e.at} ${e.type}: ${JSON.stringify(e.data)}`);
  lines.push('', '## Limits', '', ...r.limitations.map(x=>'- '+x)); return lines.join('\n')+'\n';
}
export function html(r, lab) {
  const explanation = r.artifacts.filter(a=>a.name==='lesson.md'&&a.integrity==='verified').map(a=>'<section><h2>What this experiment shows</h2><pre>'+escape(lab.artifact(a.id).bytes.toString('utf8'))+'</pre></section>').join('');
  const verdicts = '<ul>'+r.criteria.map(c=>'<li><strong>'+escape(c.id)+': '+escape(c.status)+'</strong> — '+escape(c.description)+'</li>').join('')+'</ul>';
  const pictures = r.artifacts.filter(a=>a.mediaType==='image/png'&&a.integrity==='verified').map(a=>`<figure><img alt="${escape(a.name)}" src="data:image/png;base64,${lab.artifact(a.id).bytes.toString('base64')}"><figcaption>${escape(a.name)} · ${escape(a.id)}</figcaption></figure>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><title>${escape(r.mission.subject)} — Lab record</title><style>body{font:16px/1.6 system-ui;margin:2rem auto;padding:0 1rem;max-width:1100px;color:#17212b;background:#fafaf7}h1{line-height:1.2}pre{white-space:pre-wrap;overflow-wrap:anywhere}img{width:100%;height:auto;border:1px solid #ccd}figure{margin:2rem 0}figcaption{font-size:.8rem;overflow-wrap:anywhere}summary{cursor:pointer;font-weight:bold}</style><h1>${escape(r.mission.subject)}</h1><p>${escape(r.mission.question)}</p><p>Local evidence report. Human feedback: ${r.feedback.length ? 'recorded' : 'not yet collected'}. No overall quality score.</p>${verdicts}${explanation}${pictures}<p>Adapted from blackmath88/msteams-personas; imported atlas, data and tokens retain CC BY 4.0 attribution to blackmath88/m365-toolbox. Changes: room relocation and compact preview.</p><details><summary>Checks, judgments, timeline and limitations</summary><pre>${escape(markdown(r))}</pre></details></html>`;
}
