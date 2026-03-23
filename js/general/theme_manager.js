class theme_manager {
  static get_theme(theme_id, custom_hex, canvas_el, ctx) {
    let c_main, c_a1, c_a2, c_sec = '#0ff', c_drk, c_lgt;
    let hex = '#00ff44';
    if (theme_id === '1') hex = '#00ff44';
    if (theme_id === '2') { hex = '#ffd700'; c_sec = '#00ffff'; }
    if (theme_id === '3') { hex = '#cc0000'; c_sec = '#ffaaaa'; }
    if (theme_id === '4') { hex = '#00ffff'; c_sec = '#ff00ff'; }
    if (theme_id === '6') hex = custom_hex;
    if (theme_id === '5') {
      let grad = ctx.createLinearGradient(0, 0, canvas_el.width, canvas_el.height);
      grad.addColorStop(0, '#ff0000');
      grad.addColorStop(0.16, '#ff8000');
      grad.addColorStop(0.33, '#ffff00');
      grad.addColorStop(0.5, '#00ff00');
      grad.addColorStop(0.66, '#0000ff');
      grad.addColorStop(0.83, '#4b0082');
      grad.addColorStop(1, '#ee82ee');
      c_main = grad;
      c_a1 = 'rgba(255,255,255,0.05)';
      c_a2 = 'rgba(255,255,255,0.15)';
      c_sec = '#fff';
      c_drk = 'rgba(255,255,255,0.2)';
      c_lgt = '#fff';
      document.body.style.color = '#ee82ee';
      canvas_el.style.boxShadow = `0 0 20px rgba(255,255,255,0.2)`;
    } else {
      let r = parseInt(hex.slice(1, 3), 16) || 0;
      let g = parseInt(hex.slice(3, 5), 16) || 0;
      let b = parseInt(hex.slice(5, 7), 16) || 0;
      c_main = hex;
      c_a1 = `rgba(${r},${g},${b},0.1)`;
      c_a2 = `rgba(${r},${g},${b},0.2)`;
      c_drk = `rgba(${Math.floor(r * 0.25)},${Math.floor(g * 0.25)},${Math.floor(b * 0.25)},1)`;
      c_lgt = `rgba(${Math.floor(r + (255 - r) * .8)},${Math.floor(g + (255 - g) * .8)},${Math.floor(b + (255 - b) * .8)},1)`;
      document.body.style.color = c_main;
      canvas_el.style.boxShadow = `0 0 20px rgba(${r},${g},${b},0.2)`;
    }
    return { c_main, c_a1, c_a2, c_sec, c_drk, c_lgt };
  }
}