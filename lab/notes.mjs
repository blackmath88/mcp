export const originalItems = ['Water bottle', 'Jacket', 'Charger'];
export function createNotesState() {
  return {access:'read',items:[...originalItems],retrieved:null,selected:'packing',outcome:'ready',events:[],highlight:false,reflection:null};
}
export function event(state,actor,action,outcome,detail,visual={nodes:[],stage:'setup',direction:'none',operation:null}) {
  state.events.push({actor,action,outcome,detail,visual,provenance:'Illustrative model — scripted, no MCP exchange'});
}
export function setAccess(state,access) {
  if(!['none','read','edit'].includes(access)) throw Error('Unknown access scenario');
  state.access=access;state.retrieved=null;state.outcome='scenario';state.highlight=false;
  event(state,'Lab control','Change access scenario',access,'The simulated assistant context is cleared. The underlying note is unchanged.');
}
export function findNote(state) {
  state.highlight=false;
  event(state,'Person','Find my packing list','requested','A fixed task is selected; there is no live model reasoning.',{nodes:['person'],stage:'ask',direction:'none',operation:'read'});
  if(state.access==='none') {
    state.retrieved=null;state.outcome='no-access';
    event(state,'Host / client','Check available capability','unavailable','No notes capability is available. No content reaches the simulated assistant.',{nodes:['client'],stage:'blocked',direction:'none',operation:'read'});return;
  }
  event(state,'Model (scripted)','Choose search by title','selected','A real model could propose a tool call. Here the choice is scripted.',{nodes:['model'],stage:'choose',direction:'none',operation:'read'});
  event(state,'Host / MCP client','Invoke exposed search operation','sent','The client would send a structured request. This is not a wire capture.',{nodes:['client','server'],stage:'request',direction:'out',operation:'read'});
  event(state,'Server / notes app','Search titles','Weekend packing list','The application returns the matching note identity.',{nodes:['server','app'],stage:'search',direction:'none',operation:'read'});
  state.retrieved=[...state.items];state.selected='packing';state.outcome='found';
  event(state,'Server / notes app','Read selected note','content returned','Note content reaches the simulated assistant context.',{nodes:['server','app','client'],stage:'result',direction:'back',operation:'read'});
  event(state,'Model (scripted)','Show sourced answer','shown','The answer uses retrieved content. MCP did not generate it.',{nodes:['model'],stage:'answer',direction:'none',operation:'read'});
}
export function addItem(state) {
  if(!state.retrieved){state.outcome='find-first';return;}
  event(state,'Person','Add sunscreen','requested','A request is not yet a completed write.',{nodes:['person'],stage:'ask',direction:'none',operation:'edit'});
  if(state.access!=='edit') {
    state.outcome='read-only';
    event(state,'Host / client','Check available edit capability','unavailable','The read-only scenario has no edit capability. The note stays unchanged.',{nodes:['client'],stage:'blocked',direction:'none',operation:'edit'});return;
  }
  const existed=state.items.includes('Sunscreen');
  event(state,'Model (scripted)','Propose note edit','selected','The model proposes; the application performs the write.',{nodes:['model'],stage:'choose',direction:'none',operation:'edit'});
  event(state,'Host / MCP client','Invoke exposed edit operation','sent','The client forwards the structured intention.',{nodes:['client','server'],stage:'request',direction:'out',operation:'edit'});
  if(!existed) state.items.push('Sunscreen');
  state.outcome=existed?'already-present':'edited';state.highlight=true;
  event(state,'Server / notes app','Ensure Sunscreen is on the list',existed?'no change':'one item added','Duplicate avoidance belongs to this lab application, not MCP.',{nodes:['server','app'],stage:'write',direction:'none',operation:'edit'});
}
