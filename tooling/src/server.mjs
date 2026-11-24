#!/usr/bin/env node
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { Lab, VERSION } from './core.mjs';
import { personasExample, personasMove, personasRender } from './personas.mjs';
const lab=new Lab();
const str=z.string().min(1), refs=z.array(str).max(20);
const criterion=z.object({id:str,description:str,kind:z.enum(['check','judge','human']),verifier:z.enum(['artifact-integrity','json-valid','personas-move','png']).optional()}).strict();
const tools=[
 ['lab_capabilities',z.object({}),()=>({version:VERSION,transport:'stdio',modules:[{id:'personas',configured:Boolean(process.env.PERSONAS_ROOT)}],orchestration:'Lead agent dispatches through Happier and links external run IDs; this server stores shared state, not an unattended scheduler.',privacy:'Local events and evidence only. No transcript capture. No remote telemetry.',maxWorkers:2})],
 ['mission_create',z.object({subject:str,question:str,criteria:z.array(criterion).min(1).max(20)}),a=>lab.createMission(a)],
 ['mission_list',z.object({}),()=>lab.list()],
 ['mission_inspect',z.object({missionId:str}),a=>lab.snapshot(a.missionId)],
 ['run_assign',z.object({missionId:str,role:str,question:str,inputRefs:refs.optional(),dependsOn:refs.optional(),provider:str.optional(),sourceRevision:str.optional()}),a=>lab.createRun(a)],
 ['run_link',z.object({runId:str,externalRunId:str}),a=>lab.linkRun(a)],
 ['run_finish',z.object({runId:str,status:z.enum(['succeeded','failed','interrupted']),summary:str,usage:z.object({inputTokens:z.number().nonnegative().nullable().optional(),outputTokens:z.number().nonnegative().nullable().optional(),costUsd:z.number().nonnegative().nullable().optional(),durationMs:z.number().nonnegative().nullable().optional()}).strict().nullable().optional()}),a=>lab.finishRun(a)],
 ['artifact_store',z.object({missionId:str,name:str,mediaType:z.enum(['application/json','image/png','text/plain','text/markdown']).optional(),content:z.string().max(12000000),encoding:z.enum(['utf8','base64']).optional(),expectedRevision:str.nullable().optional(),runId:str.nullable().optional(),inputRefs:refs.optional()}),a=>lab.putArtifact(a)],
 ['artifact_inspect',z.object({artifactId:str}),a=>lab.artifactInfo(a.artifactId)],
 ['verify_artifacts',z.object({runId:str,criterionId:str,artifactIds:refs}),a=>lab.verify(a)],
 ['judge_submit',z.object({runId:str,evaluator:str,rubricVersion:str,findings:z.array(z.object({criterionId:str,status:z.enum(['satisfied','contradicted','unverified','not-applicable']),reason:str,artifactIds:refs}).strict()).min(1).max(20)}),a=>lab.submitJudge(a)],
 ['feedback_record',z.object({missionId:str,note:str,source:z.enum(['user-reported','operator-note']).optional()}),a=>lab.feedback(a)],
 ['personas_example',z.object({missionId:str,runId:str}),a=>personasExample(lab,a)],
 ['personas_move',z.object({missionId:str,runId:str,beforeId:str,recipe:z.object({schema:z.literal('lab-factory/move-room/v1'),nodeId:str,sourceId:str,targetId:str,notes:z.array(z.object({slideId:str,before:z.string(),after:z.string()}).strict()).optional()}).strict(),expectedRevision:str.nullable().optional()}),a=>personasMove(lab,a)],
 ['personas_render',z.object({missionId:str,runId:str,artifactId:str,label:str}),a=>personasRender(lab,a)]
];
const descriptions={mission_create:'Start a bounded experiment with separate check, judge and human criteria.',mission_inspect:'Read runs, evidence revisions, freshness, judgments and events for one mission.',run_assign:'Reserve a bounded worker record; does not launch an agent. Dispatch through the host, then run_link.',run_link:'Attach the actual Happier execution run ID to a reserved worker.',artifact_store:'Store exact evidence bytes. Replacing a name requires its current artifact ID as expectedRevision; inputRefs records provenance dependencies.',verify_artifacts:'Execute the named deterministic criterion against explicit artifact IDs. PNG verifier checks headers only.',judge_submit:'Record advisory findings with evidence. Cannot satisfy checks or human criteria.',personas_move:'Validate and move one channel between teams, preserving IDs and repairing selected scene roots and explicitly supplied notes.',personas_render:'Render a stored project through the existing Personas MCP. Hash-check and atomically save images plus manifest under a new label.',feedback_record:'Record attributed feedback without inferring human acceptance.'};
await serveStdio(()=>{
 const server=new McpServer({name:'lab-factory',version:VERSION},{instructions:'Shared local experiment state. Inspect missions before assigning work. Assign a run, launch a bounded Happier worker through the host, then link its external ID. Runs are not evidence of success: verify artifact revisions. Judges are advisory; human feedback is never inferred. No arbitrary code execution or server installation is exposed. Personas operations compose the existing local MCP renderer.'});
 for(const [name,schema,fn] of tools)server.registerTool(name,{description:descriptions[name] || name.replaceAll('_',' '),inputSchema:schema.strict(),annotations:{readOnlyHint:['lab_capabilities','mission_list','mission_inspect','artifact_inspect'].includes(name),openWorldHint:false,destructiveHint:false}},async args=>{
   try{const value=await fn(args);return {content:[{type:'text',text:JSON.stringify(value)}],structuredContent:Array.isArray(value)?{items:value}:value};}
   catch(e){return {isError:true,content:[{type:'text',text:e.message}]};}
 });
 server.registerResource('artifact',new ResourceTemplate('lab://artifacts/{artifactId}',{list:undefined}),{description:'Exact stored artifact revision; hash checked on read'},async(uri,{artifactId})=>{
   const a=lab.artifact(String(artifactId));
   return {contents:[a.mediaType==='image/png'?{uri:uri.href,mimeType:a.mediaType,blob:a.bytes.toString('base64')}:{uri:uri.href,mimeType:a.mediaType,text:a.bytes.toString('utf8')}]};
 });
 return server;
});
