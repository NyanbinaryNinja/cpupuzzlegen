class grid_maker {
  constructor(canvas_el, ctx) {
    this.canvas_el = canvas_el;
    this.ctx = ctx;
    this.scan_y = 0;
  }

  draw_background(colors) {
    this.ctx.fillStyle = '#050505';
    this.ctx.fillRect(0, 0, this.canvas_el.width, this.canvas_el.height);
    for (let i = 0; i < this.canvas_el.height; i += 4) {
      this.ctx.fillStyle = colors.c_a1;
      this.ctx.fillRect(0, i, this.canvas_el.width, 1);
    }
  }

  draw_scanline(colors) {
    this.ctx.fillStyle = colors.c_a2;
    this.ctx.fillRect(0, this.scan_y, this.canvas_el.width, 5);
    
    this.scan_y += 2;
    let reset_happened = false;
    
    if (this.scan_y >= this.canvas_el.height) {
      this.scan_y = 0;
      reset_happened = true;
    }
    
    return reset_happened;
  }
}