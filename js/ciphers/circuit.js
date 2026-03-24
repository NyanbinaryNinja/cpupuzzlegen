class circuit_cipher {
  constructor(canvas_el, ctx) {
    this.canvas_el = canvas_el;
    this.ctx = ctx;
    this.char_pool = [];
    this.cipher_coords = [];
    this.char_mapping = {};
    this.split_y = 0;
    this.gates = [
      this.draw_and.bind(this),
      this.draw_or.bind(this),
      this.draw_xor.bind(this),
      this.draw_not.bind(this),
      this.draw_nand.bind(this),
      this.draw_nor.bind(this)
    ];
  }
  generate(input_val) {
    let filter_data = input_filter.get_filtered_chars(input_val, 36);
    let target_size = Math.max(12, filter_data.unique_chars.length);
    let random_leftovers = filter_data.leftovers.sort(() => Math.random() - 0.5).slice(0, target_size - filter_data.unique_chars.length);
    this.char_pool = [...filter_data.unique_chars, ...random_leftovers].sort(() => Math.random() - 0.5);
    let all_pairs = [];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        all_pairs.push([i, j]);
      }
    }
    all_pairs.sort(() => Math.random() - 0.5);
    this.char_mapping = {};
    for (let i = 0; i < this.char_pool.length; i++) {
      this.char_mapping[this.char_pool[i]] = all_pairs[i];
    }
    this.cipher_coords = filter_data.clean_val.split('').map(char => this.char_mapping[char]);
    let rows = Math.max(1, Math.ceil(this.cipher_coords.length / 4));
    this.split_y = Math.floor(40 + rows * 60 + 50);
    this.canvas_el.width = 600;
    let show_legend = document.getElementById('circuit_legend_cb') && document.getElementById('circuit_legend_cb').checked;
    this.canvas_el.height = this.split_y + Math.max(120, Math.ceil(this.char_pool.length / 6) * 40 + 60) + (show_legend ? 60 : 0);
  }
  draw_and(x, y) {
    this.ctx.beginPath();
    this.ctx.moveTo(x - 10, y - 10);
    this.ctx.lineTo(x, y - 10);
    this.ctx.arc(x, y, 10, -Math.PI / 2, Math.PI / 2);
    this.ctx.lineTo(x - 10, y + 10);
    this.ctx.closePath();
    this.ctx.stroke();
  }
  draw_or(x, y) {
    this.ctx.beginPath();
    this.ctx.moveTo(x - 10, y - 10);
    this.ctx.quadraticCurveTo(x, y, x - 10, y + 10);
    this.ctx.quadraticCurveTo(x + 5, y + 10, x + 10, y);
    this.ctx.quadraticCurveTo(x + 5, y - 10, x - 10, y - 10);
    this.ctx.stroke();
  }
  draw_xor(x, y) {
    this.draw_or(x, y);
    this.ctx.beginPath();
    this.ctx.moveTo(x - 15, y - 10);
    this.ctx.quadraticCurveTo(x - 5, y, x - 15, y + 10);
    this.ctx.stroke();
  }
  draw_not(x, y) {
    this.ctx.beginPath();
    this.ctx.moveTo(x - 10, y - 10);
    this.ctx.lineTo(x + 5, y);
    this.ctx.lineTo(x - 10, y + 10);
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(x + 8, y, 3, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  draw_nand(x, y) {
    this.draw_and(x, y);
    this.ctx.beginPath();
    this.ctx.arc(x + 13, y, 3, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  draw_nor(x, y) {
    this.draw_or(x, y);
    this.ctx.beginPath();
    this.ctx.arc(x + 13, y, 3, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  draw(colors) {
    this.ctx.strokeStyle = colors.c_main;
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = colors.c_main;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    let start_x = 40;
    let start_y = 60;
    let prev_x = start_x;
    let prev_y = start_y;
    for (let i = 0; i < this.cipher_coords.length; i++) {
      let pair = this.cipher_coords[i];
      let cx = start_x + (i % 4) * 130 + 30;
      let cy = start_y + Math.floor(i / 4) * 60;
      this.ctx.beginPath();
      if (i === 0) {
        this.ctx.moveTo(cx - 30, cy);
      } else if (i % 4 !== 0) {
        this.ctx.moveTo(prev_x, prev_y);
        this.ctx.lineTo(cx - 30, cy);
      } else {
        this.ctx.moveTo(prev_x, prev_y);
        this.ctx.lineTo(prev_x + 20, prev_y);
        this.ctx.lineTo(prev_x + 20, cy - 30);
        this.ctx.lineTo(cx - 30, cy - 30);
        this.ctx.lineTo(cx - 30, cy);
      }
      this.ctx.lineTo(cx - 15, cy);
      this.ctx.stroke();
      this.gates[pair[0]](cx, cy);
      this.ctx.beginPath();
      this.ctx.moveTo(cx + 15, cy);
      this.ctx.lineTo(cx + 25, cy);
      this.ctx.stroke();
      this.gates[pair[1]](cx + 40, cy);
      prev_x = cx + 55;
      prev_y = cy;
    }
    if (this.cipher_coords.length > 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(prev_x, prev_y);
      this.ctx.lineTo(prev_x + 20, prev_y);
      this.ctx.stroke();
    }
    let key_start_y = this.split_y + 40;
    this.ctx.font = 'bold 16px monospace';
    for (let i = 0; i < this.char_pool.length; i++) {
      let row = Math.floor(i / 6);
      let col = i % 6;
      let kx = 60 + col * 90;
      let ky = key_start_y + row * 40;
      let char = this.char_pool[i];
      let pair = this.char_mapping[char];
      this.ctx.fillText(char, kx - 30, ky);
      this.gates[pair[0]](kx - 10, ky);
      this.ctx.beginPath();
      this.ctx.moveTo(kx + 5, ky);
      this.ctx.lineTo(kx + 15, ky);
      this.ctx.stroke();
      this.gates[pair[1]](kx + 30, ky);
    }
    let show_legend = document.getElementById('circuit_legend_cb') && document.getElementById('circuit_legend_cb').checked;
    if (show_legend) {
      let legend_y = key_start_y + Math.ceil(this.char_pool.length / 6) * 40 + 20;
      let names = ["AND", "OR", "XOR", "NOT", "NAND", "NOR"];
      for (let i = 0; i < 6; i++) {
        let lx = 60 + i * 90;
        this.gates[i](lx - 15, legend_y);
        this.ctx.fillText(names[i], lx + 15, legend_y);
      }
    }
  }
}