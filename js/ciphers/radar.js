class radar_cipher {
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
    let cols = 8;
    let rows = Math.max(1, Math.ceil(this.cipher_coords.length / cols));
    this.split_y = Math.floor(40 + rows * 60 + 20);
    this.canvas_el.width = 60 + cols * 60;
    this.canvas_el.height = this.split_y + 300;
  }

  draw(colors) {
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.strokeStyle = colors.c_main;
    this.ctx.lineWidth = 2;
    let r_small = 20;
    let spacing = 60;
    let cols = 8;
    let start_x = 60;
    let start_y = 60;
    for (let j = 0; j < this.cipher_coords.length; j++) {
      let col = j % cols;
      let row = Math.floor(j / cols);
      let cx = start_x + col * spacing;
      let cy = start_y + row * spacing;
      let idx = this.cipher_coords[j];
      let angle = (idx / 26) * Math.PI * 2 - Math.PI / 2;
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
    let key_cy = this.split_y + 140;
    let key_cx = this.canvas_el.width / 2;
    let r_large = 100;
    this.ctx.strokeStyle = colors.c_drk;
    this.ctx.beginPath();
    this.ctx.arc(key_cx, key_cy, r_large, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.fillStyle = colors.c_main;
    this.ctx.font = 'bold 18px monospace';
    for (let i = 0; i < 26; i++) {
      let angle = (i / 26) * Math.PI * 2 - Math.PI / 2;
      let tx = key_cx + Math.cos(angle) * (r_large + 24);
      let ty = key_cy + Math.sin(angle) * (r_large + 24);
      let inner_x = key_cx + Math.cos(angle) * r_large;
      let inner_y = key_cy + Math.sin(angle) * r_large;
      let outer_x = key_cx + Math.cos(angle) * (r_large + 8);
      let outer_y = key_cy + Math.sin(angle) * (r_large + 8);
      this.ctx.beginPath();
      this.ctx.moveTo(inner_x, inner_y);
      this.ctx.lineTo(outer_x, outer_y);
      this.ctx.stroke();
      this.ctx.fillText(this.char_pool[i] || '', tx, ty);
    }
    this.ctx.textBaseline = 'alphabetic';
  }
}