const spectrogram = {
    f: null,
    i: null,
    split_y: 0,
    canvas_el: null,
    ctx: null,
    analyser: null,
    frequency_data: null,
    init(canvas_el, ctx) {
        let c = document.querySelector("#input_box").parentElement, r = document.createElement("div"), i = document.createElement("input"), l = document.createElement("button"), n = document.createElement("span"), a = document.createElement("audio");
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
    show() { if (this.r) this.r.style.display = "block"; },
    hide() { if (this.r) this.r.style.display = "none"; if (this.a) this.a.style.display = "none"; },
    async gen(t) {
        let w = 600, h = 200, c = document.createElement("canvas"), x = c.getContext("2d");
        this.b = null;
        c.width = w; c.height = h;
        x.fillStyle = "#000"; x.fillRect(0, 0, w, h);
        await new Promise((resolve, reject) => {
            if (this.i) {
                let image = new Image();
                image.onload = () => { x.drawImage(image, 0, 0, w, h); resolve(); };
                image.onerror = () => reject(new Error("Unable to load the selected image."));
                image.src = this.i;
            } else {
                let font_size = h - 20;
                x.font = `${font_size}px sans-serif`;
                while (x.measureText(t).width > w - 20 && font_size > 20) {
                    font_size -= 2;
                    x.font = `${font_size}px sans-serif`;
                }
                x.fillStyle = "#fff";
                x.textAlign = "center";
                x.textBaseline = "middle";
                x.fillText(t, w / 2, h / 2);
                resolve();
            }
        });
        let d = x.getImageData(0, 0, w, h).data, sr = 44100, dr = 3, ac = new OfflineAudioContext(1, sr * dr, sr);
        this.canvas_el.width = w;
        this.canvas_el.height = h;
        this.split_y = h;
        this.ctx.fillStyle = "#050505";
        this.ctx.fillRect(0, 0, w, h);
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
            let width = this.canvas_el.width, height = this.canvas_el.height;
            this.ctx.drawImage(this.canvas_el, -1, 0);
            for (let y = 0; y < height; y++) {
                let index = Math.floor((height - 1 - y) / height * this.frequency_data.length);
                let intensity = this.frequency_data[index];
                this.ctx.fillStyle = `hsl(${240 - intensity / 255 * 240}, 100%, ${Math.max(8, intensity / 2)}%)`;
                this.ctx.fillRect(width - 1, y, 1, 1);
            }
        }
    }
};