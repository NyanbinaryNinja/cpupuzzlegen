const spectrogram = {
    f: null,
    i: null,
    split_y: 0,
    canvas_el: null,
    ctx: null,
    analyser: null,
    frequency_data: null,
    init(canvas_el, ctx) {
        let a = document.createElement("audio");
        a.controls = true; a.preload = "metadata"; a.style.cssText = "display:none;width:100%;margin-top:8px";
        canvas_el.parentElement.insertBefore(a, canvas_el.nextSibling);
        this.a = a;
        this.canvas_el = canvas_el;
        this.ctx = ctx;
        this.audio_ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audio_ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.frequency_data = new Uint8Array(this.analyser.frequencyBinCount);
        this.audio_ctx.createMediaElementSource(a).connect(this.analyser).connect(this.audio_ctx.destination);
        a.onplay = () => this.audio_ctx.resume();
    },
    show() {},
    hide() { if (this.a) this.a.style.display = "none"; },
    async gen(t) {
        let w = 600, h = 200, c = document.createElement("canvas"), x = c.getContext("2d");
        this.b = null;
        c.width = w; c.height = h;
        x.fillStyle = "#000"; x.fillRect(0, 0, w, h);
        await new Promise((resolve) => {
            x.fillStyle = "#fff"; x.font = "40px sans-serif";
            x.fillText(t, 10, h / 2); resolve();
        });
        let d = x.getImageData(0, 0, w, h).data, sr = 44100, dr = 3, ac = new OfflineAudioContext(1, sr * dr, sr);
        this.canvas_el.width = w;
        this.canvas_el.height = h;
        this.split_y = h;
        for (let j = 0; j < h; j += 2) {
            let o = ac.createOscillator(), g = ac.createGain(), f = 20000 - (j / h) * 20000;
            o.frequency.value = f; g.gain.setValueAtTime(0, 0);
            for (let i = 0; i < w; i++) {
                let q = (d[(j * w + i) * 4] + d[(j * w + i) * 4 + 1] + d[(j * w + i) * 4 + 2]) / 765;
                g.gain.setValueAtTime(q / h * 2, i / w * dr);
            }
            o.connect(g).connect(ac.destination); o.start(); o.stop(dr);
        }
        let rb = await ac.startRendering(), l = rb.length, ch = rb.numberOfChannels, ba = new ArrayBuffer(44 + l * 2), v = new DataView(ba), ws = (str, o) => { for (let k = 0; k < str.length; k++) v.setUint8(o + k, str.charCodeAt(k)); };
        ws("RIFF", 0); v.setUint32(4, 36 + l * 2, true); ws("WAVEfmt ", 8); v.setUint32(16, 16, true);
        v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, sr, true);
        v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
        ws("data", 36); v.setUint32(40, l * 2, true);
        let fcd = rb.getChannelData(0);
        for (let i = 0; i < l; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, fcd[i])) * 32767, true);
        this.b = new Blob([ba], { type: "audio/wav" });
        this.a.src = URL.createObjectURL(this.b);
        this.a.style.display = "block";
        this.draw();
    },
    save() {
        if (!this.b) return;
        let u = URL.createObjectURL(this.b), a = document.createElement("a");
        a.href = u; a.download = "spectrogram.wav";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(u), 0);
    },
    draw() {
        if (this.analyser && this.ctx && this.canvas_el) {
            this.analyser.getByteFrequencyData(this.frequency_data);
            this.ctx.fillStyle = "#050505";
            this.ctx.fillRect(0, 0, this.canvas_el.width, this.canvas_el.height);
            this.ctx.fillStyle = "#00ff66";
            let bar_width = this.canvas_el.width / this.frequency_data.length;
            for (let i = 0; i < this.frequency_data.length; i++) {
                let bar_height = this.frequency_data[i] / 255 * this.canvas_el.height;
                this.ctx.fillRect(i * bar_width, this.canvas_el.height - bar_height, Math.max(1, bar_width), bar_height);
            }
        }
    }
};