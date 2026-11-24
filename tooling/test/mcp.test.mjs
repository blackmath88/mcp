import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
test('real stdio discovery, tools, resource and validation',async()=>{const root=mkdtempSync(join(tmpdir(),'lab-mcp-'));const client=new Client({name:'test',version:'1'});try{await client.connect(new StdioClientTransport({command:process.execPath,args:[new URL('../src/server.mjs',import.meta.url).pathname],env:{...process.env,LAB_HOME:root},stderr:'pipe'}));const listed=await client.listTools();assert.ok(listed.tools.some(t=>t.name==='personas_render'));const call=async(name,args={})=>client.callTool({name,arguments:args});const m=(await call('mission_create',{subject:'wire',question:'MCP?',criteria:[{id:'json',kind:'check',description:'JSON',verifier:'json-valid'}]})).structuredContent;const a=(await call('artifact_store',{missionId:m.id,name:'test.json',content:'{"ok":true}'})).structuredContent;const resource=await client.readResource({uri:'lab://artifacts/'+a.id});assert.equal(JSON.parse(resource.contents[0].text).ok,true);assert.equal((await call('artifact_store',{missionId:m.id,name:'test.json',content:'{}'})).isError,true);}finally{await client.close();rmSync(root,{recursive:true});}});
