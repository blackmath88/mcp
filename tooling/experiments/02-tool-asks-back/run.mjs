import {createHash} from 'node:crypto';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {fileURLToPath} from 'node:url';import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const server=fileURLToPath(new URL('./server.mjs',import.meta.url));
const cases=[{name:'unsupported',capabilities:{}},{name:'accept',action:'accept',confirm:true},{name:'unchecked',action:'accept',confirm:false},{name:'decline',action:'decline'},{name:'cancel',action:'cancel'},{name:'declared-without-handler',noHandler:true},{name:'overconstrained-form',schemaMode:'strict'}];
const results=[];
for(const era of ['2026-07-28','legacy-default'])for(const specimen of cases){
 const trace=[],capabilities=specimen.capabilities??{elicitation:{form:{}}};let prompts=0;
 const client=new Client({name:'synthetic-lab-host',version:'0.1.0'},{capabilities,...(era==='2026-07-28'?{versionNegotiation:{mode:{pin:era}}}:{})});
 if(specimen.action)client.setRequestHandler('elicitation/create',async request=>{prompts++;trace.push({direction:'host-decision',synthetic:true,message:request.params.message,action:specimen.action,confirm:specimen.confirm});return {action:specimen.action,...(specimen.action==='accept'?{content:{confirm:specimen.confirm}}:{})};});
 const transport=new StdioClientTransport({command:process.execPath,args:[server],stderr:'pipe'});
 const send=transport.send.bind(transport);transport.send=async m=>{trace.push({direction:'client-to-server',message:m});return send(m);};
 let receive;Object.defineProperty(transport,'onmessage',{configurable:true,get:()=>receive,set:fn=>{receive=fn?m=>{trace.push({direction:'server-to-client',message:m});fn(m);}:undefined;}});
 let outcome,error=null,snapshot;
 try{await client.connect(transport);try{outcome=await client.callTool({name:'move_room',arguments:{target:'campus',schemaMode:specimen.schemaMode||'minimal'}},{timeout:5000});}catch(e){error={name:e.name,message:e.message,code:e.code??null};}
 snapshot=(await client.callTool({name:'inspect_room',arguments:{}})).structuredContent;
 if(specimen.name==='accept'&&snapshot.room.parent!=='campus'){mkdirSync('.lab/tool-asks-back',{recursive:true});writeFileSync('.lab/tool-asks-back/debug-failure-'+Date.now()+'.json',JSON.stringify({era,specimen,error,outcome,snapshot,trace},null,2));console.error(JSON.stringify({era,case:specimen.name,error,outcome,snapshot}));}
 assert.equal(snapshot.room.parent,specimen.name==='accept'?'campus':'onboarding');assert.equal(snapshot.writes,specimen.name==='accept'?1:0);assert.deepEqual(snapshot.room.files,['pilot-checklist']);
 assert.equal(prompts,specimen.action?1:0);
 if(!['declared-without-handler','overconstrained-form'].includes(specimen.name)){assert.equal(error,null);assert.notEqual(outcome?.isError,true);}
 const status=outcome?.structuredContent?.status??(outcome?.isError?'tool-error':error?'client-error':'unknown');
 if(specimen.name==='accept')assert.equal(status,'moved');
 if(specimen.name==='overconstrained-form')assert.equal(status,'tool-error');
 if(specimen.name==='declared-without-handler')assert.ok(['tool-error','client-error'].includes(status));
 if(specimen.name==='unchecked')assert.equal(status,'not-confirmed');
 if(['decline','cancel','unsupported'].includes(specimen.name))assert.equal(status,specimen.name);
 if(specimen.name==='accept'){
  const messages=trace.map(t=>t.message).filter(Boolean);
  if(era==='2026-07-28'){assert.ok(messages.some(m=>m.result?.resultType==='input_required'));assert.ok(messages.some(m=>m.params?.inputResponses?.move?.action==='accept'));assert.ok(!messages.some(m=>m.method==='initialize'));}
  else {assert.ok(messages.some(m=>m.result?.protocolVersion==='2025-11-25'));assert.ok(messages.some(m=>m.method==='elicitation/create'));}
 }
 results.push({era,case:specimen.name,capabilities,prompts,status,error,toolError:outcome?.isError?outcome.content:null,snapshot,trace});
 }finally{await client.close();}
}
const output={schema:'mcp-lab/tool-asks-back/v1',executedAt:new Date().toISOString(),runtime:{node:process.version,clientSdk:JSON.parse(readFileSync(new URL('../../node_modules/@modelcontextprotocol/client/package.json',import.meta.url))).version,serverSdk:JSON.parse(readFileSync(new URL('../../node_modules/@modelcontextprotocol/server/package.json',import.meta.url))).version,transport:'stdio'},sourceHashes:Object.fromEntries(['server.mjs','run.mjs'].map(name=>[name,createHash('sha256').update(readFileSync(new URL(name,import.meta.url))).digest('hex')])),limits:['Host answers are deterministic fixtures, not real user consent.','No model provider or real Teams action is involved.','This tests the pinned SDK pair, not all MCP hosts.','Elicitation is not an authentication boundary; no security guarantee against forged client responses.'],results};
const dir=resolve(process.argv[2]||'.lab/tool-asks-back');mkdirSync(dir,{recursive:true});writeFileSync(dir+'/results.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({output:dir+'/results.json',cases:results.map(({era,case:name,status,prompts,snapshot})=>({era,case:name,status,prompts,writes:snapshot.writes,parent:snapshot.room.parent}))},null,2));
