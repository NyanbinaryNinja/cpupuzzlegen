class pigpen_cipher {
  constructor(canvas_el, ctx) {
    this.canvas_el = canvas_el;
    this.ctx = ctx;
    this.char_pool = [];
    this.cipher_coords = [];
    this.split_y = 0;
  }

  generate(input_val) {
    let filter_data = input_filter.get_filtered_chars(input_val, 26);
    let random_leftovers = filter_data.leftovers.sort(() => Math.random() - 0.5).slice(0, 26 - filter_data.unique_chars.length);
    this.char_pool = [...filter_data.unique_chars, ...random_leftovers].sort(() => Math.random() - 0.5);
    this.cipher_coords = filter_data.clean_val.split('').filter(c => this.char_pool.includes(c)).map(char => this.char_pool.indexOf(char));
    let rows = Math.max(1, Math.ceil(this.cipher_coords.length / 8));
    this.split_y = Math.floor(40 + (rows - 1) * 45 + 50);
    this.canvas_el.width = 340;
    this.canvas_el.height = this.split_y + 360;
  }

  draw(colors) {
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.strokeStyle = colors.c_main;
    this.ctx.fillStyle = colors.c_main;
    this.ctx.lineWidth = 2;
    for (let j = 0; j < this.cipher_coords.length; j++) {
      let row = Math.floor(j / 8);
      let num_in_row = Math.min(8, this.cipher_coords.length - row * 8);
      let offset = 0;
      if (num_in_row < 8) {
        let left = 44;
        let right = 44 + (num_in_row - 1) * 36;
        let center_symbols = (left + right) / 2;
        offset = 170 - center_symbols;
      }
      let sx = 44 + offset + (j % 8) * 36, sy = 40 + Math.floor(j / 8) * 45, i = this.cipher_coords[j], d = 12;
      this.ctx.beginPath();
      if (i < 18) {
        let r = Math.floor((i % 9) / 3), c = (i % 9) % 3;
        if (r > 0) { this.ctx.moveTo(sx - d, sy - d); this.ctx.lineTo(sx + d, sy - d); }
        if (r < 2) { this.ctx.moveTo(sx - d, sy + d); this.ctx.lineTo(sx + d, sy + d); }
        if (c > 0) { this.ctx.moveTo(sx - d, sy - d); this.ctx.lineTo(sx - d, sy + d); }
        if (c < 2) { this.ctx.moveTo(sx + d, sy - d); this.ctx.lineTo(sx + d, sy + d); }
        if (i > 8) this.ctx.fillRect(sx - 1, sy - 1, 3, 3);
      } else {
        let p = (i - 18) % 4;
        if (p === 0) { this.ctx.moveTo(sx - d, sy - d); this.ctx.lineTo(sx, sy); this.ctx.lineTo(sx + d, sy - d); }
        if (p === 1) { this.ctx.moveTo(sx + d, sy - d); this.ctx.lineTo(sx, sy); this.ctx.lineTo(sx + d, sy + d); }
        if (p === 2) { this.ctx.moveTo(sx - d, sy + d); this.ctx.lineTo(sx, sy); this.ctx.lineTo(sx + d, sy + d); }
        if (p === 3) { this.ctx.moveTo(sx - d, sy - d); this.ctx.lineTo(sx, sy); this.ctx.lineTo(sx - d, sy + d); }
        if (i > 21) {
          let dx = sx, dy = sy;
          if (p === 0) dy -= d / 2; if (p === 1) dx += d / 2; if (p === 2) dy += d / 2; if (p === 3) dx -= d / 2;
          this.ctx.fillRect(dx - 1, dy - 1, 3, 3);
        }
      }
      this.ctx.stroke();
    }
    let start_y = this.split_y + 40;
    this.ctx.strokeStyle = colors.c_drk;
    this.ctx.beginPath();
    [95, 245].forEach(gx => {
      let gy = start_y + 100;
      this.ctx.moveTo(gx - 25, gy - 75); this.ctx.lineTo(gx - 25, gy + 75);
      this.ctx.moveTo(gx + 25, gy - 75); this.ctx.lineTo(gx + 25, gy + 75);
      this.ctx.moveTo(gx - 75, gy - 25); this.ctx.lineTo(gx + 75, gy - 25);
      this.ctx.moveTo(gx - 75, gy + 25); this.ctx.lineTo(gx + 75, gy + 25);
    });
    [95, 245].forEach(gx => {
      let gy = start_y + 250;
      this.ctx.moveTo(gx - 50, gy - 50); this.ctx.lineTo(gx + 50, gy + 50);
      this.ctx.moveTo(gx - 50, gy + 50); this.ctx.lineTo(gx + 50, gy - 50);
    });
    this.ctx.stroke();
    this.ctx.font = 'bold 24px monospace';
    for (let i = 0; i < 26; i++) {
      let cx, cy, dt = false, dx, dy;
      if (i < 18) {
        let gx = 95 + (i > 8 ? 150 : 0), gy = start_y + 100, p = i % 9;
        cx = gx + (p % 3) * 50 - 50; cy = gy + Math.floor(p / 3) * 50 - 50;
        if (i > 8) { dt = true; dx = cx + (p % 3 === 0 ? 15 : p % 3 === 2 ? -15 : 0); dy = cy + (Math.floor(p / 3) === 0 ? 15 : Math.floor(p / 3) === 2 ? -15 : (p === 4 ? 15 : 0)); }
      } else {
        let gx = 95 + (i > 21 ? 150 : 0), gy = start_y + 250, p = (i - 18) % 4;
        cx = gx + (p === 1 ? 30 : p === 3 ? -30 : 0); cy = gy + (p === 0 ? -30 : p === 2 ? 30 : 0);
        if (i > 21) { dt = true; dx = gx + (p === 1 ? 10 : p === 3 ? -10 : 0); dy = gy + (p === 0 ? -10 : p === 2 ? 10 : 0); }
      }
      this.ctx.fillStyle = colors.c_main;
      this.ctx.fillText(this.char_pool[i] || '', cx, cy);
      if (dt) this.ctx.fillRect(dx - 2, dy - 2, 4, 4);
    }
  }
}