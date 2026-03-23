class polybius_cipher {
  constructor(canvas_el, ctx) {
    this.canvas_el = canvas_el;
    this.ctx = ctx;
    this.grid_size = 5;
    this.char_pool = [];
    this.cipher_coords = [];
    this.split_y = 0;
  }

  generate(input_val) {
    let filter_data = input_filter.get_filtered_chars(input_val);
    this.grid_size = Math.max(5, Math.ceil(Math.sqrt(filter_data.unique_chars.length)));
    let pool_size = this.grid_size * this.grid_size;
    let random_leftovers = filter_data.leftovers.sort(() => Math.random() - 0.5).slice(0, pool_size - filter_data.unique_chars.length);
    this.char_pool = [...filter_data.unique_chars, ...random_leftovers].sort(() => Math.random() - 0.5);
    this.cipher_coords = filter_data.clean_val.split('').map(char => {
      let idx = this.char_pool.indexOf(char);
      return `${Math.floor(idx / this.grid_size) + 1}${idx % this.grid_size + 1}`;
    });
    let rows = Math.max(1, Math.ceil(this.cipher_coords.length / this.grid_size));
<<<<<<< HEAD
    this.split_y = 40 + (rows - 1) * 30 + 50;
=======
    this.split_y = 40 + rows * 30 + 20;
>>>>>>> d210e7ce0b687fc099356d50fdb4708db823ba9e
    let box = 50, step = 60;
    let grid_w = (this.grid_size - 1) * step + box;
    let grid_h = (this.grid_size - 1) * step + box;
    this.canvas_el.width = Math.max(300, grid_w + 100);
<<<<<<< HEAD
    this.canvas_el.height = this.split_y + 80 + grid_h + 60;
=======
    this.canvas_el.height = this.split_y + 40 + grid_h + 40;
>>>>>>> d210e7ce0b687fc099356d50fdb4708db823ba9e
  }

  draw(colors) {
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = colors.c_main;
    for (let i = 0; i < this.cipher_coords.length; i += this.grid_size) {
      this.ctx.font = 'bold 20px monospace';
      this.ctx.fillText(this.cipher_coords.slice(i, i + this.grid_size).join(' '), this.canvas_el.width / 2, 40 + (i / this.grid_size) * 30);
    }
<<<<<<< HEAD
    let start_y = this.split_y + 60;
    let box = 50, step = 60;
    let grid_w = (this.grid_size - 1) * step + box;
    let offset_x = (this.canvas_el.width - grid_w) / 2;
    let offset_y = start_y;
=======
    let start_y = this.split_y;
    let box = 50, step = 60;
    let grid_w = (this.grid_size - 1) * step + box;
    let offset_x = (this.canvas_el.width - grid_w) / 2;
    let offset_y = start_y + 40;
>>>>>>> d210e7ce0b687fc099356d50fdb4708db823ba9e
    for (let i = 0; i < this.grid_size * this.grid_size; i++) {
      let col_idx = i % this.grid_size;
      let row_idx = Math.floor(i / this.grid_size);
      let pos_x = offset_x + col_idx * step;
      let pos_y = offset_y + row_idx * step;
      this.ctx.fillStyle = colors.c_sec;
      this.ctx.font = '14px monospace';
<<<<<<< HEAD
      if (row_idx === 0) this.ctx.fillText(col_idx + 1, pos_x + box / 2, offset_y - 20);
=======
      if (row_idx === 0) this.ctx.fillText(col_idx + 1, pos_x + box / 2, offset_y - 15);
>>>>>>> d210e7ce0b687fc099356d50fdb4708db823ba9e
      if (col_idx === 0) this.ctx.fillText(row_idx + 1, offset_x - 20, pos_y + box / 2 + 5);
      this.ctx.strokeStyle = colors.c_drk;
      this.ctx.strokeRect(pos_x, pos_y, box, box);
      this.ctx.fillStyle = colors.c_main;
      this.ctx.font = 'bold 24px monospace';
      this.ctx.fillText(this.char_pool[i], pos_x + box / 2, pos_y + box / 2 + 8);
    }
  }
}