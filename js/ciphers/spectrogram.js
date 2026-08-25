class spectrogram_cipher {
  constructor(canvas_el, ctx) {
    this.canvas_el = canvas_el;
    this.ctx = ctx;
    this.split_y = 0;
    this.image = null;
    this.file = null;
    this.buffer = null;
    this.file_input = document.createElement('input');
    this.file_input.type = 'file';
    this.file_input.accept = 'image/*';
    this.file_input.style.display = 'none';
    document.querySelector('.controls-body').appendChild(this.file_input);
    this.file_input.onchange = e => { let f = e.target.files[0], r = new FileReader(); if (f) { r.onload = () => { let i = new Image(); i.onload = () => { this.file = i; this.encode(i); }; i.src = r.result; }; r.readAsDataURL(f); } };
  }
  set_active(v) { this.file_input.style.display = v ? 'block' : 'none'; }
  generate(v) { if (this.file) return this.encode(this.file); let c = document.createElement('canvas'), x = c.getContext('2d'); c.width = 640; c.height = 320; x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#fff'; x.font = '28px monospace'; x.textBaseline = 'middle'; x.fillText(v || '', 20, c.height / 2); this.encode(c); }
  encode(i) { let c = document.createElement('canvas'), x = c.getContext('2d'), w = 640, h = 320, s = 44100, d = 4, u = new (window.AudioContext || window.webkitAudioContext)(), b = u.createBuffer(1, s * d, s), a = b.getChannelData(0), p; c.width = w; c.height = h; x.drawImage(i, 0, 0, w, h); p = x.getImageData(0, 0, w, h).data; this.image = c; for (let q = 0; q < a.length; q++) { let k = Math.floor(q / a.length * w), z = 0; for (let j = 0; j < h; j += 8) z += p[(j * w + k) * 4] / 255 * Math.sin(2 * Math.PI * (80 + j * 18) * q / s); a[q] = z / (h / 8) * .8; } this.buffer = b; this.canvas_el.width = w; this.canvas_el.height = h; this.split_y = h; }
  draw(colors) { if (this.image) this.ctx.drawImage(this.image, 0, 0); }
}