// Exercise the real Lab MCP -> Personas MCP -> validator/renderer path.
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { resolve,join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { LAB_ROOT, TOOLING_ROOT } from '../src/paths.mjs';
import { Lab } from '../src/core.mjs';
import { html,markdown } from '../src/report.mjs';
const client=new Client({name:'lab-pilot',version:'0.1.0'});
const root=LAB_ROOT;
let activeRun, activeMission;
const call=async(name,args={})=>{const r=await client.callTool({name,arguments:args},{timeout:240000});if(r.isError)throw new Error(r.content[0].text);return r.structuredContent;};
try{
 await client.connect(new StdioClientTransport({command:process.execPath,args:[join(TOOLING_ROOT,'src/server.mjs')],env:{...process.env,LAB_HOME:root},stderr:'inherit'}));
 const m=await call('mission_create',{subject:'MCP Lab — Move one room',question:'What becomes checkable when an assistant changes an editable project through MCP rather than describing a picture?',criteria:[
  {id:'move',kind:'check',verifier:'personas-move',description:'Exactly one channel moves; identities and descendant links survive; affected scene roots and explicit notes are repaired.'},
  {id:'images',kind:'check',verifier:'png',description:'Supplied render artifacts have PNG signatures and Full HD header dimensions; visual quality is reviewed separately.'},
  {id:'integrity',kind:'check',verifier:'artifact-integrity',description:'Recorded artifacts retain byte identity.'},
  {id:'explanation',kind:'judge',description:'Explain what changed, what stayed stable, and why the picture alone is insufficient to establish object identity. Cite before/after evidence.'},
  {id:'learning',kind:'human',description:'User tries or inspects the result and records what surprised them.'}
 ]});
 activeMission=m.id;
 writeFileSync(join(root,'pilot.json'),JSON.stringify({missionId:m.id},null,2),{mode:0o600});
 const run=await call('run_assign',{missionId:m.id,role:'deterministic-builder',question:'Build and measure the bounded Personas move through MCP.',provider:'node'});
 activeRun=run.id;
 let baseline=await call('personas_example',{missionId:m.id,runId:run.id});
 const resource=await client.readResource({uri:'lab://artifacts/'+baseline.artifact.id});
 const project=JSON.parse(resource.contents[0].text);
 if(process.env.LAB_COMPACT_VIEW==='1'){
   project.scenes.find(s=>s.id==='teams').profile='workspace-scene';
   const artifact=await call('artifact_store',{missionId:m.id,runId:run.id,name:'before-compact.json',content:JSON.stringify(project)});
   await call('feedback_record',{missionId:m.id,source:'operator-note',note:'Explicit presentation variant: preview profile workspace-house-teams → workspace-scene in both baseline and candidate. Original houses view overflowed after the move; source example is retained as before.json.'});
   baseline={...baseline,artifact};
 }
 const slide=project.slides.find(s=>s.id==='preview');
 const recipe={schema:'lab-factory/move-room/v1',nodeId:'pilot',sourceId:'onboarding',targetId:'campus',notes:[{slideId:'preview',before:slide.presenterNotes,after:'Verfolge den Weg in beiden Ansichten: Campus & People Development → Pilotphase → Dateien → Checkliste_Pilot.docx.'}]};
 const moved=await call('personas_move',{missionId:m.id,runId:run.id,beforeId:baseline.artifact.id,recipe});
 console.log('Mission started:',m.id,'— project move validated');
 const before=await call('personas_render',{missionId:m.id,runId:run.id,artifactId:baseline.artifact.id,label:'before'});
 const after=await call('personas_render',{missionId:m.id,runId:run.id,artifactId:moved.artifact.id,label:'after'});
 for(const [criterionId,artifactIds] of [['move',[baseline.artifact.id,moved.artifact.id,moved.recipe.id]],['images',[...before.images,...after.images].map(x=>x.id)],['integrity',[baseline.artifact.id,moved.artifact.id,moved.recipe.id,before.manifest.id,after.manifest.id]]]){
   const result=await call('verify_artifacts',{runId:run.id,criterionId,artifactIds});if(result.status!=='satisfied')throw new Error(JSON.stringify(result));
 }
 // Reusing the empty expected revision must be refused, never silently clobber the project.
 const stale=await client.callTool({name:'artifact_store',arguments:{missionId:m.id,name:'project.json',content:JSON.stringify(project)}});
 if(!stale.isError || !stale.content?.some(c=>c.type==='text'&&c.text.includes('Stale revision')))throw new Error('Expected a specific stale-revision rejection');
 await call('run_finish',{runId:run.id,status:'succeeded',summary:'Validated room move, four real rendered PNGs, exact transformation/integrity checks, and stale-write rejection. Visual review and human feedback remain outstanding.'});
 const r=await call('mission_inspect',{missionId:m.id});
 const local=new Lab(root);try{writeFileSync(join(root,'report.html'),html(r,local),{mode:0o600});writeFileSync(join(root,'report.md'),markdown(r),{mode:0o600});}finally{local.close();}
 console.log(JSON.stringify({missionId:m.id,runId:run.id,before:baseline.artifact.id,after:moved.artifact.id,recipe:moved.recipe.id,report:join(root,'report.html'),criteria:r.criteria.map(c=>({id:c.id,status:c.status}))},null,2));
}catch(e){console.error(e);process.exitCode=1;if(activeRun){try{await call('artifact_store',{missionId:activeMission,runId:activeRun,name:'failure.txt',mediaType:'text/plain',content:String(e)});await call('run_finish',{runId:activeRun,status:'failed',summary:String(e).slice(0,1900)});}catch(logError){console.error('Could not record failure:',logError.message);}}}finally{await client.close();}
