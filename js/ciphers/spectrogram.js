class spectrogram_cipher {
  constructor(canvas_el, ctx) {
    this.canvas_el = canvas_el;
    this.ctx = ctx;
    this.split_y = 0;
    this.image = null;
    this.file = null;
    this.buffer = null;
    this.render = null;
    this.file_input = document.createElement('input');
    this.file_input.type = 'file';
    this.file_input.accept = 'image/*';
    this.file_input.style.display = 'none';
    document.querySelector('.controls-body').appendChild(this.file_input);
    this.file_input.addEventListener('change', e => { let f = e.target.files[0], r = new FileReader(); if (f) { r.onload = () => { let i = new Image(); i.onload = () => { this.file = i; this.encode(i); }; i.src = r.result; }; r.readAsDataURL(f); } });
  }
  set_active(v) { this.file_input.style.display = v ? 'block' : 'none'; }
  generate(t) { if (this.file) return this.encode(this.file); let c = document.createElement('canvas'), x = c.getContext('2d'); c.width = 640; c.height = 320; x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#fff'; x.font = '28px monospace'; x.textBaseline = 'middle'; x.fillText(t || '', 20, c.height / 2); this.encode(c); }
  async encode(i) { let c = document.createElement('canvas'), x = c.getContext('2d'), w = 640, h = 320, s = 44100, d = 4, n = s * d, q = new OfflineAudioContext(1, n, s), p; c.width = w; c.height = h; x.drawImage(i, 0, 0, w, h); p = x.getImageData(0, 0, w, h).data; this.image = c; this.canvas_el.width = w; this.canvas_el.height = h; this.split_y = h; for (let y = 0; y < h; y += 8) { let o = q.createOscillator(), g = q.createGain(), f = 80 + y * 18; o.frequency.value = f; for (let z = 0; z < w; z++) { let a = 0; for (let j = 0; j < 8; j++) a += p[((y + j) * w + z) * 4] / 255; g.gain.setValueAtTime(a / 8 * .8, z / w * d); } o.connect(g).connect(q.destination); o.start(); o.stop(d); } this.render = q.startRendering(); this.buffer = await this.render; }
  async save_file() { if (this.render) await this.render; if (!this.buffer) return; let a = this.buffer.getChannelData(0), v = new DataView(new ArrayBuffer(44 + a.length * 2)), w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0))); w(0, 'RIFF'); v.setUint32(4, 36 + a.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, this.buffer.sampleRate, true); v.setUint32(28, this.buffer.sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, a.length * 2, true); for (let i = 0; i < a.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, a[i])) * 32767, true); let b = new Blob([v], { type: 'audio/wav' }); try { let h = await window.showSaveFilePicker({ suggestedName: 'spectrogram.wav', types: [{ description: 'WAV Audio', accept: { 'audio/wav': ['.wav'] } }] }), s = await h.createWritable(); await s.write(b); await s.close(); } catch (e) { let l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = 'spectrogram.wav'; l.click(); } }
  draw() { if (this.image) this.ctx.drawImage(this.image, 0, 0); }
}