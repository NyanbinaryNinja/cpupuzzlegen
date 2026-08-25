class maze_cipher {
  constructor(canvas_el, ctx) {
    this.canvas_el = canvas_el;
    this.ctx = ctx;
    this.grid = [];
    this.path = [];
    this.split_y = 0;
  }
  
  generate(input_val) {
    let filter_data = input_filter.get_filtered_chars(input_val);
    let msg = filter_data.clean_val || "A";
    let success = false, tries = 0;
    while (!success && tries < 1000) {
      tries++;
      this.path = [];
      this.grid = new Array(64).fill('');
      let x = Math.floor(Math.random() * 8), y = Math.floor(Math.random() * 8);
      this.grid[y * 8 + x] = msg[0];
      this.path.push({ x, y, dir: '', dist: 0 });
      let failed = false;
      for (let i = 1; i < msg.length; i++) {
        let moves = [];
        for (let d = 1; d <= y; d++) if (this.grid[(y - d) * 8 + x] === '' || this.grid[(y - d) * 8 + x] === msg[i]) moves.push({ x, y: y - d, dir: 'UP', dist: d });
        for (let d = 1; d < 8 - y; d++) if (this.grid[(y + d) * 8 + x] === '' || this.grid[(y + d) * 8 + x] === msg[i]) moves.push({ x, y: y + d, dir: 'DOWN', dist: d });
        for (let d = 1; d <= x; d++) if (this.grid[y * 8 + (x - d)] === '' || this.grid[y * 8 + (x - d)] === msg[i]) moves.push({ x: x - d, y, dir: 'LEFT', dist: d });
        for (let d = 1; d < 8 - x; d++) if (this.grid[y * 8 + (x + d)] === '' || this.grid[y * 8 + (x + d)] === msg[i]) moves.push({ x: x + d, y, dir: 'RIGHT', dist: d });
        if (!moves.length) { failed = true; break; }
        let m = moves[Math.floor(Math.random() * moves.length)];
        x = m.x; y = m.y;
        this.grid[y * 8 + x] = msg[i];
        this.path.push({ x, y, dir: m.dir, dist: m.dist });
      }
      if (!failed) success = true;
    }
    let pool = [...filter_data.unique_chars, ...filter_data.leftovers];
    for (let i = 0; i < 64; i++) if (!this.grid[i]) this.grid[i] = pool[Math.floor(Math.random() * pool.length)];
    this.split_y = Math.max(100, 60 + this.path.length * 30 + 20);
    this.canvas_el.width = 600;
    this.canvas_el.height = this.split_y + 440;
  }
  draw(colors) {
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = colors.c_main;
    this.ctx.font = 'bold 20px monospace';
    let start_y = 60;
    let show_jmp_dir = document.getElementById('maze_jmp_dir_cb') && document.getElementById('maze_jmp_dir_cb').checked;
    this.ctx.fillText(`START: [X:${this.path[0].x + 1}, Y:${this.path[0].y + 1}]`, this.canvas_el.width / 2, start_y);
    for (let i = 1; i < this.path.length; i++) this.ctx.fillText(`JMP: ${this.path[i].dist}${show_jmp_dir ? ` ${this.path[i].dir}` : ''}`, this.canvas_el.width / 2, start_y + i * 30);
    let box = 40, offset_x = (this.canvas_el.width - 8 * box) / 2, offset_y = this.split_y + 80;
    let show_axes = document.getElementById('maze_axes_cb') && document.getElementById('maze_axes_cb').checked;
    if (show_axes) {
      this.ctx.fillStyle = colors.c_sec;
      this.ctx.font = '16px monospace';
      for (let i = 0; i < 8; i++) {
        this.ctx.fillText(i + 1, offset_x + i * box + box / 2, offset_y - 15);
        this.ctx.fillText(i + 1, offset_x - 15, offset_y + i * box + box / 2);
      }
      this.ctx.strokeStyle = colors.c_sec;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath(); this.ctx.moveTo(offset_x, offset_y - 35); this.ctx.lineTo(offset_x + 8 * box, offset_y - 35); this.ctx.moveTo(offset_x + 5, offset_y - 40); this.ctx.lineTo(offset_x, offset_y - 35); this.ctx.lineTo(offset_x + 5, offset_y - 30); this.ctx.moveTo(offset_x + 8 * box - 5, offset_y - 40); this.ctx.lineTo(offset_x + 8 * box, offset_y - 35); this.ctx.lineTo(offset_x + 8 * box - 5, offset_y - 30); this.ctx.stroke();
      this.ctx.fillStyle = '#050505'; this.ctx.fillRect(offset_x + 4 * box - 15, offset_y - 45, 30, 20); this.ctx.fillStyle = colors.c_sec; this.ctx.fillText('X', offset_x + 4 * box, offset_y - 35);
      this.ctx.beginPath(); this.ctx.moveTo(offset_x - 35, offset_y); this.ctx.lineTo(offset_x - 35, offset_y + 8 * box); this.ctx.moveTo(offset_x - 40, offset_y + 5); this.ctx.lineTo(offset_x - 35, offset_y); this.ctx.lineTo(offset_x - 30, offset_y + 5); this.ctx.moveTo(offset_x - 40, offset_y + 8 * box - 5); this.ctx.lineTo(offset_x - 35, offset_y + 8 * box); this.ctx.lineTo(offset_x - 30, offset_y + 8 * box - 5); this.ctx.stroke();
      this.ctx.fillStyle = '#050505'; this.ctx.fillRect(offset_x - 45, offset_y + 4 * box - 15, 20, 30); this.ctx.fillStyle = colors.c_sec; this.ctx.fillText('Y', offset_x - 35, offset_y + 4 * box);
    }
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 64; i++) {
      let cx = offset_x + (i % 8) * box, cy = offset_y + Math.floor(i / 8) * box;
      this.ctx.strokeStyle = colors.c_drk; this.ctx.strokeRect(cx, cy, box, box);
      this.ctx.fillStyle = colors.c_main; this.ctx.font = 'bold 24px monospace'; this.ctx.fillText(this.grid[i], cx + box / 2, cy + box / 2 + 2);
    }
  }
}