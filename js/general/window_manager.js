(function(){
  const windows=document.querySelectorAll('.window');
  let active=null, mode=null, dir=null;
  let start_x=0,start_y=0,start_left=0,start_top=0,start_w=0,start_h=0;
  let max_z=100;

  function rects_intersect(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
  function clamp_scalar(v,m,M){return Math.min(Math.max(v,m),M);}
  function snap_edge(v,M){if(Math.abs(v)<16)return 0; if(Math.abs(v-M)<16)return M; return v;}
  function get_coord(e){if(e.type.startsWith('touch')){const t=e.touches[0]||e.changedTouches[0];return{x:t.clientX,y:t.clientY};}return{x:e.clientX,y:e.clientY};}

  function create_handles(w){['tl','tr','bl','br','t','b','l','r'].forEach(d=>{const h=document.createElement('div');h.className='handle '+d;h.dataset.dir=d;w.appendChild(h);});}

  function down(e){if(window.matchMedia('(max-width:820px)').matches)return; const t=e.target; const w=t.closest('.window'); if(!w)return;
    const c=get_coord(e); const h=t.closest('.handle');
    if(h){mode='resize'; dir=h.dataset.dir;} else if(t.closest('.title-bar')){mode='move';} else return;
    if(e.cancelable) e.preventDefault();
    if(w.style.transform){
      const rect=w.getBoundingClientRect();
      w.style.transform='none';
      const new_rect=w.getBoundingClientRect();
      w.style.left=(w.offsetLeft-(new_rect.left-rect.left))+'px';
      w.style.top=(w.offsetTop-(new_rect.top-rect.top))+'px';
    }
    active=w; start_x=c.x; start_y=c.y; start_left=w.offsetLeft; start_top=w.offsetTop; start_w=w.offsetWidth; start_h=w.offsetHeight;
    active.style.zIndex=++max_z; document.body.style.userSelect='none'; document.body.style.cursor=mode==='move'?'grabbing':'se-resize';
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up); window.addEventListener('pointercancel',up);
    window.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
    window.addEventListener('touchmove',move,{passive:false}); window.addEventListener('touchend',up); window.addEventListener('touchcancel',up);
  }

  function move(e){if(!active)return; const c=get_coord(e); if(e.cancelable) e.preventDefault(); const dx=c.x-start_x, dy=c.y-start_y;
    const canvas=document.getElementById('canvas_el').getBoundingClientRect();
    if(mode==='move'){
      let l=clamp_scalar(start_left+dx,0,window.innerWidth-start_w);
      let t=clamp_scalar(start_top+dy,0,window.innerHeight-start_h);
      l=snap_edge(l,window.innerWidth-start_w); t=snap_edge(t,window.innerHeight-start_h);
      const R={left:l,right:l+start_w,top:t,bottom:t+start_h};
      if(rects_intersect(R,canvas)){
        const over_l = R.right - canvas.left;
        const over_r = canvas.right - R.left;
        const over_t = R.bottom - canvas.top;
        const over_b = canvas.bottom - R.top;
        const min_over = Math.min(over_l, over_r, over_t, over_b);
        if(min_over===over_l) l = canvas.left - start_w - 10;
        else if(min_over===over_r) l = canvas.right + 10;
        else if(min_over===over_t) t = canvas.top - start_h - 10;
        else if(min_over===over_b) t = canvas.bottom + 10;
      }
      active.style.left=clamp_scalar(l,0,window.innerWidth-start_w)+'px'; active.style.top=clamp_scalar(t,0,window.innerHeight-start_h)+'px';
    } else if(mode==='resize'){
      let l=start_left,t=start_top,w=start_w,h=start_h;
      if(dir.includes('r')) w=clamp_scalar(Math.max(100,start_w+dx),100,window.innerWidth-start_left);
      if(dir.includes('b')) h=clamp_scalar(Math.max(80,start_h+dy),80,window.innerHeight-start_top);
      if(dir.includes('l')){const nw=Math.max(100,start_w-dx); const nl=start_left+dx; if(nl>=0&&nw+nl<=window.innerWidth){w=nw; l=nl;}}
      if(dir.includes('t')){const nh=Math.max(80,start_h-dy); const nt=start_top+dy; if(nt>=0&&nh+nt<=window.innerHeight){h=nh; t=nt;}}
      const R={left:l,right:l+w,top:t,bottom:t+h};
      if(rects_intersect(R,canvas)){
        if(t<h&&t<canvas.bottom) h=Math.max(80,canvas.top-t-10);
      }
      active.style.left=l+'px'; active.style.top=t+'px'; active.style.width=w+'px'; active.style.height=h+'px';
    }
  }

  function up(){active=null; mode=null; dir=null; document.body.style.userSelect=''; document.body.style.cursor='';
    window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); window.removeEventListener('pointercancel',up);
    window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up);
    window.removeEventListener('touchmove',move); window.removeEventListener('touchend',up); window.removeEventListener('touchcancel',up);
  }

  windows.forEach(w=>{create_handles(w); const t=w.querySelector('.title-bar'); if(t) t.style.cursor='grab';});
  document.addEventListener('pointerdown',down); document.addEventListener('mousedown',down); document.addEventListener('touchstart',down,{passive:false});
})();