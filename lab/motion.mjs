// Presentation-only playback. It never executes a tool or mutates the specimen.
export function createPlayback({onStep,onState=()=>{},schedule=setTimeout,cancel=clearTimeout}) {
  let timer=null,playing=false,index=0,end=0,delay=900;
  const state=()=>({playing,index,end,delay});
  const clear=()=>{if(timer!==null)cancel(timer);timer=null;};
  const queue=()=>{timer=schedule(()=>{timer=null;if(!playing)return;if(index>=end){playing=false;onState(state());return;}index++;onStep(index);if(index>=end){playing=false;onState(state());}else queue();},delay);};
  return {
    play(start,last){clear();index=start;end=last;playing=start<last;onStep(index);onState(state());if(playing)queue();},
    pause(){clear();playing=false;onState(state());},
    speed(ms){delay=ms;if(playing){clear();queue();}onState(state());},
    state,
    dispose(){clear();playing=false;}
  };
}
export function animateStep(root,event,{reduced=false}={}) {
  if(reduced||!event)return;
  root.querySelectorAll('.diagram-node.lit, .human-request.lit').forEach(el=>el.animate([{transform:'translateY(3px)',boxShadow:'0 0 0 0 #5c956500'},{transform:'translateY(0)',boxShadow:'0 0 0 4px #5c956522'},{transform:'translateY(0)',boxShadow:'0 0 0 0 #5c956500'}],{duration:550,easing:'ease-out'}));
  const link=root.querySelector('#mcp-link');
  if(link&&['out','back'].includes(event.visual?.direction)){
    const dot=document.createElement('i');dot.className='flow-packet';dot.setAttribute('aria-hidden','true');link.append(dot);
    const vertical=matchMedia('(max-width:780px)').matches;
    const wire=link.querySelector('.protocol-wire');if(wire&&!vertical)dot.style.top=wire.offsetTop+'px';
    const distance=vertical?30:Math.max(32,link.clientWidth-16);const sign=event.visual.direction==='back'?-1:1;
    const transform=n=>vertical?`translate(-50%,${n}px)`:`translate(${n}px,-50%)`;
    const a=dot.animate([{transform:transform(-sign*distance/2),opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.85},{transform:transform(sign*distance/2),opacity:0}],{duration:650,easing:'ease-in-out'});
    a.onfinish=()=>dot.remove();a.oncancel=()=>dot.remove();
  }
}
