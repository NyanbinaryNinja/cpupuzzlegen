(function(){
  const windows=document.querySelectorAll('.window');
  let active=null, action=null;
  let start_x=0,start_y=0,start_left=0,start_top=0,start_w=0,start_h=0;
  let max_z=100;

  function rects_intersect(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;}
  function clamp_scalar(v,m,M){return Math.min(Math.max(v,m),M);}
  function snap_edge(v,M){if(Math.abs(v)<16)return 0; if(Math.abs(v-M)<16)return M; return v;}

  function win_pointer_down(e){if(window.matchMedia('(max-width:820px)').matches)return; const t=e.target; const w=t.closest('.window'); if(!w)return; e.preventDefault();
    if(t.closest('.resizer')){action='resize'; start_w=w.offsetWidth; start_h=w.offsetHeight;} else if(t.closest('.title-bar')){action='move'; const r=w.getBoundingClientRect(); start_left=r.left; start_top=r.top;} else return;
    active=w; start_x=e.clientX; start_y=e.clientY; active.style.zIndex=++max_z; document.body.style.userSelect='none'; document.body.style.cursor=action==='resize'?'se-resize':'move';
    window.addEventListener('pointermove',win_pointer_move); window.addEventListener('pointerup',win_pointer_up); window.addEventListener('pointercancel',win_pointer_up);
  }

  function win_pointer_move(e){if(!active)return; const dx=e.clientX-start_x, dy=e.clientY-start_y;
    const c=document.getElementById('canvas_el').getBoundingClientRect(); const w=active.offsetWidth, h=active.offsetHeight;
    if(action==='move'){
      let l=start_left+dx, t=start_top+dy;
      l=clamp_scalar(l,0,window.innerWidth-w); t=clamp_scalar(t,0,window.innerHeight-h);
      l=snap_edge(l,window.innerWidth-w); t=snap_edge(t,window.innerHeight-h);
      const R={left:l,right:l+w,top:t,bottom:t+h};
      if(rects_intersect(R,c)){
        if(start_top+h<=c.top)t=c.top-h-10; else if(start_top>=c.bottom)t=c.bottom+10; else if(start_left+w<=c.left)l=c.left-w-10; else if(start_left>=c.right)l=c.right+10;
      }
      active.style.left=clamp_scalar(l,0,window.innerWidth-w)+'px'; active.style.top=clamp_scalar(t,0,window.innerHeight-h)+'px'; active.style.transform='none';
    } else if(action==='resize'){
      const min_w=220,min_h=120; let W=Math.max(min_w,start_w+dx), H=Math.max(min_h,start_h+dy);
      const l=active.offsetLeft, t=active.offsetTop; const R={left:l,right:l+W,top:t,bottom:t+H};
      if(rects_intersect(R,c)){
        if(t+H>c.top&&t<c.bottom)H=Math.max(min_h,c.top-t-10);
        if(l+W>c.left&&l<c.right)W=Math.max(min_w,c.left-l-10);
      }
      W=clamp_scalar(W,min_w,window.innerWidth-l); H=clamp_scalar(H,min_h,window.innerHeight-t);
      active.style.width=W+'px'; active.style.height=H+'px';
    }
  }

  function win_pointer_up(){active=null; action=null; document.body.style.userSelect=''; document.body.style.cursor=''; window.removeEventListener('pointermove',win_pointer_move); window.removeEventListener('pointerup',win_pointer_up); window.removeEventListener('pointercancel',win_pointer_up);}

  windows.forEach(w=>w.addEventListener('pointerdown',win_pointer_down));
})();