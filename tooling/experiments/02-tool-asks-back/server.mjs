import {McpServer,inputRequired,inputResponse,acceptedContent} from '@modelcontextprotocol/server';
import {serveStdio} from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
// A synthetic room, private to this disposable server process. No real Teams action.
await serveStdio(()=>{
 const server=new McpServer({name:'mcp-lab-tool-asks-back',version:'0.1.0'});
 const room={id:'pilot',parent:'onboarding',files:['pilot-checklist']};let writes=0;const events=[];
 const answerSchema=z.object({confirm:z.boolean()}).strict();
 const result=(status,detail)=>({content:[{type:'text',text:detail}],structuredContent:{status,room:{...room},writes}});
 server.registerTool('inspect_room',{inputSchema:z.object({}),description:'Inspect the synthetic room and experiment events.',annotations:{readOnlyHint:true}},()=>({content:[{type:'text',text:JSON.stringify({room,writes,events})}],structuredContent:{room:{...room},writes,events:[...events]}}));
 server.registerTool('move_room',{inputSchema:z.object({target:z.literal('campus'),schemaMode:z.enum(['minimal','strict']).default('minimal')}),description:'Move a fictional room only after a positive form response. No external systems are affected.'},({target,schemaMode},ctx)=>{
  const response=inputResponse(ctx.mcpReq.inputResponses,'move');events.push({event:'handler.entered',response:response.kind==='elicit'?response.action:response.kind});
  if(response.kind==='elicit'){
   if(response.action==='decline'||response.action==='cancel')return result(response.action,'The host returned '+response.action+'. The room stays put.');
   const answer=acceptedContent(ctx.mcpReq.inputResponses,'move',answerSchema);
   if(!answer)return result('invalid-response','Accepted content failed validation. No move.');
   if(!answer.confirm)return result('not-confirmed','The form was submitted with confirm=false. No move.');
   if(room.parent!==target){room.parent=target;writes++;events.push({event:'room.moved',target});}
   return result('moved','The synthetic host supplied confirm=true; the room moved. This is not authenticated human consent.');
  }
  const declared=ctx.mcpReq.envelope?.['io.modelcontextprotocol/clientCapabilities'] ?? server.server.getClientCapabilities();
  const capability=declared?.elicitation;
  if(!capability || (!('form' in capability)&&Object.keys(capability).length>0))return result('unsupported','This client has not declared form elicitation. No move.');
  events.push({event:'input.requested'});
  return inputRequired({inputRequests:{move:inputRequired.elicit({message:'Move the fictional Pilotphase room from Onboarding to Campus?',requestedSchema:schemaMode==='strict'?answerSchema:{type:'object',properties:{confirm:{type:'boolean',title:'Move the fictional room'}},required:['confirm']}})}});
 });
 return server;
});
