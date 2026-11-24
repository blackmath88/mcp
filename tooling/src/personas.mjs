import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { resolve, join } from 'node:path';
import { existsSync, mkdirSync, rmdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { moveRoom, hash } from './core.mjs';

export async function withPersonas(lab, fn) {
  const root=process.env.PERSONAS_ROOT;
  if(!root || !existsSync(join(root,'tools/mcp-server.mjs')))throw new Error('Personas module unavailable: set PERSONAS_ROOT to an inspected local checkout');
  const lock=join(lab.root,'personas.lock');
  try{mkdirSync(lock);}catch{throw new Error('Personas module busy or interrupted; verify no renderer is running before removing .lab/personas.lock');}
  const client=new Client({name:'lab-factory-personas-adapter',version:'0.1.0'});
  try {
    const transport=new StdioClientTransport({command:process.execPath,args:[resolve(root,'tools/mcp-server.mjs')],env:{...process.env,MTP_ARTIFACT_DIR:join(lab.root,'personas-cache')},stderr:'pipe'});
    await client.connect(transport);
    const call=async(name,args={})=>{const r=await client.callTool({name,arguments:args},{timeout:180000});if(r.isError)throw new Error(JSON.stringify(r.structuredContent??r.content));return r;};
    let revision='unknown'; try{revision=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}
    return await fn({call,revision});
  } finally { try { await client.close(); } finally { rmdirSync(lock); } }
}
export async function personasExample(lab,{missionId,runId}) {
  if(lab.run(runId).missionId!==missionId)throw new Error('Cross-mission run rejected');
  return withPersonas(lab,async({call,revision})=>{
    const p=(await call('get_example',{kind:'workspace-houses'})).structuredContent;
    const v=(await call('validate_project',{project:p})).structuredContent;
    if(!v.ok)throw new Error('Personas example failed its own validator');
    const artifact=lab.putArtifact({missionId,runId,name:'before.json',content:JSON.stringify(p)});
    lab.event(missionId,'module.observed',{module:'personas',sourceRevision:revision,operation:'get_example + validate_project',artifactIds:[artifact.id],validation:v});
    return {artifact,sourceRevision:revision,validation:v};
  });
}
export async function personasMove(lab,{missionId,runId,beforeId,recipe,expectedRevision=null}) {
  if(lab.run(runId).missionId!==missionId)throw new Error('Cross-mission run rejected');
  const before=lab.artifact(beforeId);if(before.missionId!==missionId)throw new Error('Cross-mission artifact');
  const source=JSON.parse(before.bytes.toString('utf8')), after=moveRoom(source,recipe);
  return withPersonas(lab,async({call,revision})=>{
    const baseline=(await call('validate_project',{project:source})).structuredContent;
    if(!baseline.ok)throw new Error('Input project invalid: '+JSON.stringify(baseline.errors));
    const validation=(await call('validate_project',{project:after})).structuredContent;
    if(!validation.ok)throw new Error('Move rejected by Personas: '+JSON.stringify(validation.errors));
    // Commit only after validation. expectedRevision provides compare-and-swap on shared state.
    const artifact=lab.putArtifact({missionId,runId,name:'project.json',content:JSON.stringify(after),expectedRevision});
    const recipeArtifact=lab.putArtifact({missionId,runId,name:'move-'+artifact.id+'.json',content:JSON.stringify(recipe)});
    lab.event(missionId,'module.observed',{module:'personas',sourceRevision:revision,operation:'move + validate_project',artifactIds:[beforeId,artifact.id,recipeArtifact.id],validation});
    return {artifact,recipe:recipeArtifact,validation,sourceRevision:revision};
  });
}
export async function personasRender(lab,{missionId,runId,artifactId,label}) {
  if(lab.run(runId).missionId!==missionId)throw new Error('Cross-mission run rejected');
  if(!/^[a-z][a-z0-9-]{0,39}$/.test(label))throw new Error('Invalid render label');
  const a=lab.artifact(artifactId);if(a.missionId!==missionId)throw new Error('Cross-mission artifact');
  return withPersonas(lab, context=>collectRender(lab,{missionId,runId,artifactId,label},context));
}
export async function collectRender(lab,{missionId,runId,artifactId,label},{call,revision}) {
    const a=lab.artifact(artifactId);
    const manifest=(await call('render_project',{project:JSON.parse(a.bytes.toString('utf8')),scale:1})).structuredContent;
    if(!Array.isArray(manifest.slides) || !manifest.slides.length)throw new Error('Empty render manifest');
    const pending=[];
    for(const slide of manifest.slides){
      const result=await call('retrieve_artifact',{renderId:manifest.renderId,file:slide.file});
      const img=result.content.find(c=>c.type==='image');if(!img)throw new Error('Renderer returned no image');
      if(hash(Buffer.from(img.data,'base64'))!==slide.sha256)throw new Error('Renderer manifest hash mismatch');
      pending.push({missionId,runId,name:`${label}-${slide.index+1}.png`,mediaType:'image/png',encoding:'base64',content:img.data,inputRefs:[artifactId]});
    }
    return lab.tx(()=>{
      const images=pending.map(p=>lab.putArtifact(p));
      const record=lab.putArtifact({missionId,runId,name:`${label}-manifest.json`,inputRefs:[artifactId,...images.map(i=>i.id)],content:JSON.stringify({inputArtifactId:artifactId,inputSha256:a.sha256,sourceRevision:revision,manifest})});
      lab.event(missionId,'module.observed',{module:'personas',operation:'render_project',inputRefs:[artifactId],artifactIds:[record.id,...images.map(i=>i.id)],sourceRevision:revision});
      return {images,manifest:record,sourceRevision:revision};
    });
}
