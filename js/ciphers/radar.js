class radar_cipher {
  constructor(canvas_el, ctx) {
    this.canvas_el = canvas_el;
    this.ctx = ctx;
    this.char_pool = [];
    this.cipher_coords = [];
    this.split_y = 0;
    this.sweep_angle = 0;
  }

  generate(input_val) {
    let filter_data = input_filter.get_filtered_chars(input_val);
    let pool_size = Math.max(12, filter_data.unique_chars.length);
    let random_leftovers = filter_data.leftovers.sort(() => Math.random() - 0.5).slice(0, pool_size - filter_data.unique_chars.length);
    this.char_pool = [...filter_data.unique_chars, ...random_leftovers].sort(() => Math.random() - 0.5);
    this.cipher_coords = filter_data.clean_val.split('').map(char => this.char_pool.indexOf(char));
    let cols = 8;
    let rows = Math.max(1, Math.ceil(this.cipher_coords.length / cols));
    this.split_y = Math.floor(180 + rows * 60 + 20);
    this.canvas_el.width = 60 + cols * 60;
    this.canvas_el.height = this.split_y + 420;
  }

  draw(colors) {
    this.sweep_angle += 0.04;
    if (this.sweep_angle > Math.PI * 2) this.sweep_angle -= Math.PI * 2;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.lineWidth = 2;
    let pool_len = this.char_pool.length;
    let clock_cx = this.canvas_el.width / 2;
    let clock_cy = 80;
    let clock_r = 40;
    this.ctx.strokeStyle = colors.c_drk;
    this.ctx.beginPath();
    this.ctx.arc(clock_cx, clock_cy, clock_r, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.fillStyle = colors.c_main;
    this.ctx.font = 'bold 16px monospace';
    this.ctx.strokeStyle = colors.c_main;
    for (let i = 0; i < pool_len; i++) {
      let angle = (i / pool_len) * Math.PI * 2 - Math.PI / 2;
      let inner_x = clock_cx + Math.cos(angle) * (clock_r - 6);
      let inner_y = clock_cy + Math.sin(angle) * (clock_r - 6);
      let outer_x = clock_cx + Math.cos(angle) * clock_r;
      let outer_y = clock_cy + Math.sin(angle) * clock_r;
      this.ctx.beginPath();
      this.ctx.moveTo(inner_x, inner_y);
      this.ctx.lineTo(outer_x, outer_y);
      this.ctx.stroke();
      let tx = clock_cx + Math.cos(angle) * (clock_r + 18);
      let ty = clock_cy + Math.sin(angle) * (clock_r + 18);
      this.ctx.fillText(i + 1, tx, ty);
    }
    let r_small = 20;
    let spacing = 60;
    let cols = 8;
    for (let j = 0; j < this.cipher_coords.length; j++) {
      let row = Math.floor(j / cols);
      let items_in_row = Math.min(cols, this.cipher_coords.length - row * cols);
      let row_width = (items_in_row - 1) * spacing;
      let start_x = (this.canvas_el.width - row_width) / 2;
      let col = j % cols;
      let cx = start_x + col * spacing;
      let cy = 180 + row * spacing;
      let idx = this.cipher_coords[j];
      let angle = (idx / pool_len) * Math.PI * 2 - Math.PI / 2;
      this.ctx.strokeStyle = colors.c_main;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r_small, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.lineTo(cx + Math.cos(angle) * r_small, cy + Math.sin(angle) * r_small);
      this.ctx.stroke();
      this.ctx.fillStyle = colors.c_sec;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
    let key_cy = this.split_y + 200;
    let key_cx = this.canvas_el.width / 2;
    let r_large = 150;
    this.ctx.fillStyle = colors.c_a2;
    this.ctx.beginPath();
    this.ctx.moveTo(key_cx, key_cy);
    this.ctx.arc(key_cx, key_cy, r_large, this.sweep_angle - Math.PI / 4, this.sweep_angle);
    this.ctx.lineTo(key_cx, key_cy);
    this.ctx.fill();
    this.ctx.strokeStyle = colors.c_lgt;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(key_cx, key_cy);
    this.ctx.lineTo(key_cx + Math.cos(this.sweep_angle) * r_large, key_cy + Math.sin(this.sweep_angle) * r_large);
    this.ctx.stroke();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = colors.c_drk;
    this.ctx.beginPath();
    this.ctx.arc(key_cx, key_cy, r_large, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.fillStyle = colors.c_main;
    this.ctx.font = 'bold 20px monospace';
    this.ctx.strokeStyle = colors.c_main;
    for (let i = 0; i < pool_len; i++) {
      let angle = (i / pool_len) * Math.PI * 2 - Math.PI / 2;
      let tx = key_cx + Math.cos(angle) * (r_large + 28);
      let ty = key_cy + Math.sin(angle) * (r_large + 28);
      let inner_x = key_cx + Math.cos(angle) * r_large;
      let inner_y = key_cy + Math.sin(angle) * r_large;
      let outer_x = key_cx + Math.cos(angle) * (r_large + 10);
      let outer_y = key_cy + Math.sin(angle) * (r_large + 10);
      this.ctx.beginPath();
      this.ctx.moveTo(inner_x, inner_y);
      this.ctx.lineTo(outer_x, outer_y);
      this.ctx.stroke();
      this.ctx.fillText(this.char_pool[i] || '', tx, ty);
    }
    this.ctx.textBaseline = 'alphabetic';
  }
}