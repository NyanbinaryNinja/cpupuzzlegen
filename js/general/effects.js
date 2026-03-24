class effects_manager {
  constructor(canvas_el, ctx) {
    this.canvas_el = canvas_el;
    this.ctx = ctx;
    this.stutter_timer = 0;
    this.last_frame = null;
    this.cfg = { rgb_en: 0, rgb_v: 0, noise_en: 0, noise_v: 0, track_en: 0, track_v: 0, stut_en: 0, stut_v: 0, scan_en: 1, scan_v: 0.3, vig_en: 0, vig_v: 0, bloom_en: 0, bloom_v: 0 };
  }
  init_ui() {
    this.update_cfg();
  }
  update_cfg() {
    let ids = ['rgb', 'noise', 'track', 'stut', 'scan', 'vig', 'bloom'], arr = [];
    ids.forEach(id => {
      let cb = document.getElementById(`fx_${id}_en`), num = document.getElementById(`fx_${id}_num`), sld = document.getElementById(`fx_${id}_sld`);
      let en = cb && cb.checked ? 1 : 0, v = num ? parseFloat(num.value) || 0 : 0;
      this.cfg[`${id}_en`] = en; this.cfg[`${id}_v`] = v;
      if (sld) sld.disabled = !en; if (num) num.disabled = !en;
      arr.push(en, v);
    });
    let c = document.getElementById('fx_code');
    if (c) c.value = arr.join('|');
  }
  load_code(val) {
    let p = val.split('|').map(Number);
    if (p.length === 14 && !p.some(isNaN)) {
      ['rgb', 'noise', 'track', 'stut', 'scan', 'vig', 'bloom'].forEach((id, i) => {
        let cb = document.getElementById(`fx_${id}_en`), sld = document.getElementById(`fx_${id}_sld`), num = document.getElementById(`fx_${id}_num`);
        if (cb) cb.checked = p[i * 2] === 1;
        if (sld) sld.value = p[i * 2 + 1];
        if (num) num.value = p[i * 2 + 1];
      });
      this.update_cfg();
    }
  }
  sync_inputs(el) {
    let id = el.id.replace('_sld', '').replace('_num', ''), is_sld = el.id.includes('_sld');
    let other = document.getElementById(is_sld ? id + '_num' : id + '_sld');
    if (other) other.value = el.value;
    this.update_cfg();
  }
  apply_effects() {
    let cw = this.canvas_el.width, ch = this.canvas_el.height;
    if (cw === 0 || ch === 0) return;
    if (this.cfg.bloom_en) {
      let tmp = document.createElement('canvas');
      tmp.width = cw; tmp.height = ch;
      tmp.getContext('2d').drawImage(this.canvas_el, 0, 0);
      this.ctx.globalCompositeOperation = 'screen';
      this.ctx.filter = `blur(${this.cfg.bloom_v}px)`;
      this.ctx.drawImage(tmp, 0, 0);
      this.ctx.filter = 'none';
      this.ctx.globalCompositeOperation = 'source-over';
    }
    if (this.cfg.vig_en) {
      let gradient = this.ctx.createRadialGradient(cw/2, ch/2, Math.max(cw, ch) * 0.1, cw/2, ch/2, Math.max(cw, ch) * (1.5 - this.cfg.vig_v));
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,1)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, cw, ch);
    }
    if (this.cfg.stut_en && this.stutter_timer > 0) {
      this.stutter_timer--;
      if (this.last_frame) this.ctx.putImageData(this.last_frame, 0, 0);
      return;
    }
    if (this.cfg.stut_en && Math.random() < this.cfg.stut_v) this.stutter_timer = Math.floor(Math.random() * 5) + 2;
    if (this.cfg.track_en && Math.random() < 0.1) {
      let sy = Math.floor(Math.random() * ch), sh = Math.floor(Math.random() * 20) + 5, shift = (Math.random() - 0.5) * this.cfg.track_v * 10;
      if (sy + sh <= ch) {
        let slice = this.ctx.getImageData(0, sy, cw, sh);
        this.ctx.fillStyle = '#050505'; this.ctx.fillRect(0, sy, cw, sh);
        this.ctx.putImageData(slice, shift, sy);
      }
    }
    if (this.cfg.rgb_en) {
      let img = this.ctx.getImageData(0, 0, cw, ch), d = img.data, out = this.ctx.createImageData(cw, ch), od = out.data;
      let rx = Math.floor(this.cfg.rgb_v), bx = -Math.floor(this.cfg.rgb_v);
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          let i = (y * cw + x) * 4, ir = (y * cw + Math.max(0, Math.min(cw - 1, x - rx))) * 4, ib = (y * cw + Math.max(0, Math.min(cw - 1, x - bx))) * 4;
          od[i] = d[ir]; od[i+1] = d[i+1]; od[i+2] = d[ib+2]; od[i+3] = d[i+3];
        }
      }
      this.ctx.putImageData(out, 0, 0);
    }
    if (this.cfg.noise_en) {
      let out = this.ctx.getImageData(0, 0, cw, ch), od = out.data, pts = Math.floor(cw * ch * this.cfg.noise_v * 0.5);
      for (let k = 0; k < pts; k++) {
        let i = Math.floor(Math.random() * (cw * ch)) * 4, n = Math.random() * 255;
        od[i] = Math.min(255, od[i] + n); od[i+1] = Math.min(255, od[i+1] + n); od[i+2] = Math.min(255, od[i+2] + n);
      }
      this.ctx.putImageData(out, 0, 0);
    }
    this.last_frame = this.ctx.getImageData(0, 0, cw, ch);
  }
}