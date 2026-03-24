class grid_maker {
  constructor(canvas_el, ctx) {
    this.canvas_el = canvas_el;
    this.ctx = ctx;
    this.scan_p = 0;
  }

  draw_background(colors) {
    this.ctx.fillStyle = '#050505';
    this.ctx.fillRect(0, 0, this.canvas_el.width, this.canvas_el.height);
    if (window.fx && window.fx.cfg.grid_en) {
      this.ctx.globalAlpha = window.fx.cfg.grid_v;
      for (let i = 0; i < this.canvas_el.height; i += 4) {
        this.ctx.fillStyle = colors.c_a1;
        this.ctx.fillRect(0, i, this.canvas_el.width, 1);
      }
      this.ctx.globalAlpha = 1;
    }
  }

  draw_scanline(colors, split_mode, split_y) {
    let reset_happened = false;
    if (window.fx && window.fx.cfg.scan_en) {
      this.ctx.globalAlpha = window.fx.cfg.scan_v;
      this.ctx.fillStyle = colors.c_a2;
      if (split_mode) {
        this.ctx.fillRect(0, this.scan_p * split_y, this.canvas_el.width, 5);
        this.ctx.fillRect(0, split_y + this.scan_p * (this.canvas_el.height - split_y), this.canvas_el.width, 5);
      } else {
        this.ctx.fillRect(0, this.scan_p * this.canvas_el.height, this.canvas_el.width, 5);
      }
      this.ctx.globalAlpha = 1;
    }
    this.scan_p += 2 / this.canvas_el.height;
    if (this.scan_p >= 1) {
      this.scan_p = 0;
      reset_happened = true;
    }
    return reset_happened;
  }
}