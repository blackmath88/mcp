// Derived views never mutate the demo or invent historical payload snapshots.
export function visualState(state,selectedEvent=null) {
  const selected=Number.isInteger(selectedEvent)?state.events[selectedEvent]:null;
  const history=selected?.visual??{nodes:[],stage:'setup',direction:'none',operation:null};
  return {
    selected,history,
    read:state.access!=='none',edit:state.access==='edit',
    app:[...state.items],received:state.retrieved?[...state.retrieved]:null,
    different:!!state.retrieved&&JSON.stringify(state.items)!==JSON.stringify(state.retrieved),
    changes:state.outcome==='edited'?1:0,
    changeLabel:state.outcome==='edited'?'+ Sunscreen · 1 change':state.outcome==='already-present'?'Already present · 0 new changes':'0 changes',
    guide:state.outcome==='read-only'?'Reading worked. Why did the edit stop?':state.outcome==='no-access'?'The note exists. The assistant cannot retrieve it.':state.outcome==='edited'||state.outcome==='already-present'?'The note changed. Did the earlier read change too?':state.retrieved?'Now try changing the note.':'Find a note. Watch what reaches the assistant.',
    caption:selected?`${selected.action} → ${selected.outcome}`:'One common interface connects an AI app to different tools.'
  };
}
