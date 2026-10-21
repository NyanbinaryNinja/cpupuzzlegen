const spectrogram = {
    f: null,
    i: null,
    split_y: 0,
    canvas_el: null,
    ctx: null,
    analyser: null,
    frequency_data: null,
    use_image: false,
    init(canvas_el, ctx) {
        let c = document.querySelector("#input_box").parentElement, r = document.createElement("fieldset"), i = document.createElement("input"), l = document.createElement("button"), n = document.createElement("span"), a = document.createElement("audio");
        i.type = "file";
        i.accept = "image/*";
        i.id = "sg-f";
        i.style.display = "none";
        l.type = "button";
        l.textContent = "Upload Image";
        l.onclick = () => i.click();
        n.textContent = "No image selected";
        n.style.marginLeft = "8px";
        i.onchange = (event) => {
            if (event.target.files[0]) {
                let reader = new FileReader();
                n.textContent = event.target.files[0].name;
                reader.onload = (result) => this.i = result.target.result;
                reader.readAsDataURL(event.target.files[0]);
            }
        };
        r.style.cssText = "display:none;width:100%;margin-top:8px";
        r.append(i, l, n);
        c.parentElement.insertBefore(r, c.nextSibling);
        a.controls = true; a.preload = "metadata"; a.style.cssText = "display:none;width:100%;margin-top:8px";
        canvas_el.parentElement.insertBefore(a, canvas_el.nextSibling);
        this.r = r;
        this.f = i;
        this.input_fieldset = c;
        this.a = a;
        this.canvas_el = canvas_el;
        this.ctx = ctx;
        this.audio_ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audio_ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0;
        this.analyser.minDecibels = -80;
        this.analyser.maxDecibels = -20;
        this.frequency_data = new Uint8Array(this.analyser.frequencyBinCount);
        this.audio_ctx.createMediaElementSource(a).connect(this.analyser).connect(this.audio_ctx.destination);
        a.onplay = () => {
            this.audio_ctx.resume();
            if (a.currentTime < 0.1 && this.ctx && this.canvas_el) {
                this.ctx.fillStyle = "#050505";
                this.ctx.fillRect(0, 0, this.canvas_el.width, this.canvas_el.height);
            }
        };
    },
    show() { if (this.r) this.r.style.display = this.use_image ? "block" : "none"; },
    hide() { if (this.r) this.r.style.display = "none"; if (this.a) this.a.style.display = "none"; },
    set_image_mode(enabled) {
        this.use_image = enabled;
        if (this.input_fieldset) this.input_fieldset.style.display = enabled ? "none" : "flex";
        this.show();
    },
    async gen(t) {
        let w = 600, h = 200, c = document.createElement("canvas"), x = c.getContext("2d");
        this.b = null;
        c.width = w; c.height = h;
        x.fillStyle = "#000"; x.fillRect(0, 0, w, h);
        await new Promise((resolve, reject) => {
            if (this.use_image && this.i) {
                let image = new Image();
                image.onload = () => { x.drawImage(image, 0, 0, w, h); resolve(); };
                image.onerror = () => reject(new Error("Unable to load the selected image."));
                image.src = this.i;
            } else {
                let font_size = Math.floor(h * 0.72);
                x.letterSpacing = "6px";
                x.font = `900 ${font_size}px monospace,sans-serif`;
                while (x.measureText(t).width > w - 80 && font_size > 16) {
                    font_size -= 2;
                    x.font = `900 ${font_size}px monospace,sans-serif`;
                }
                x.fillStyle = "#fff";
                x.textAlign = "center";
                x.textBaseline = "middle";
                x.fillText(t, w / 2, h / 2);
                resolve();
            }
        });
        let d = x.getImageData(0, 0, w, h).data, sr = this.audio_ctx.sampleRate || 44100, dr = 5, ac = new OfflineAudioContext(1, sr * dr, sr);
        this.canvas_el.width = w;
        this.canvas_el.height = h;
        this.split_y = h;
        this.ctx.fillStyle = "#050505";
        this.ctx.fillRect(0, 0, w, h);
        for (let j = 0; j < h; j++) {
            let o = ac.createOscillator(), g = ac.createGain(), p = Math.random() * 6.28, f = 18500 - (j / h) * 18000;
            o.setPeriodicWave(ac.createPeriodicWave(new Float32Array([0, Math.cos(p)]), new Float32Array([0, Math.sin(p)])));
            o.frequency.value = f; g.gain.setValueAtTime(0, 0);
            for (let i = 0; i < w; i += 2) {
                let k = (j * w + i) * 4, q = (d[k] + d[k + 1] + d[k + 2]) / 765;
                g.gain.linearRampToValueAtTime((q * q) / h * 3, (i + 1) / w * dr);
            }
            g.gain.linearRampToValueAtTime(0, dr);
            o.connect(g).connect(ac.destination); o.start(); o.stop(dr);
        }
        let rb = await ac.startRendering(), l = rb.length, ch = rb.numberOfChannels, ba = new ArrayBuffer(44 + l * 2), v = new DataView(ba), ws = (str, o) => { for (let k = 0; k < str.length; k++) v.setUint8(o + k, str.charCodeAt(k)); };
        ws("RIFF", 0); v.setUint32(4, 36 + l * 2, true); ws("WAVEfmt ", 8); v.setUint32(16, 16, true);
        v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, sr, true);
        v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
        ws("data", 36); v.setUint32(40, l * 2, true);
        let fcd = rb.getChannelData(0), pk = 1e-4;
        for (let i = 0; i < l; i++) if (Math.abs(fcd[i]) > pk) pk = Math.abs(fcd[i]);
        for (let i = 0; i < l; i++) v.setInt16(44 + i * 2, (fcd[i] / pk) * 31000, true);
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
        if (this.analyser && this.ctx && this.canvas_el && !this.a?.paused) {
            this.analyser.getByteFrequencyData(this.frequency_data);
            let width = this.canvas_el.width, height = this.canvas_el.height, nyq = this.audio_ctx.sampleRate / 2, len = this.frequency_data.length;
            this.ctx.drawImage(this.canvas_el, -2, 0);
            for (let y = 0; y < height; y++) {
                let f0 = 18500 - ((y + 1) / height) * 18000, f1 = 18500 - (y / height) * 18000;
                let b0 = Math.max(0, Math.floor(f0 / nyq * len)), b1 = Math.min(len - 1, Math.ceil(f1 / nyq * len)), intensity = 0;
                for (let b = b0; b <= b1; b++) if (this.frequency_data[b] > intensity) intensity = this.frequency_data[b];
                let v = Math.max(0, (intensity - 35) / 220) ** 1.5;
                this.ctx.fillStyle = `hsl(${260 - v * 200}, 100%, ${3 + v * 62}%)`;
                this.ctx.fillRect(width - 2, y, 2, 1);
            }
        }
    }
};