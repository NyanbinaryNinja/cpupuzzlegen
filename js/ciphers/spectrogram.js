const spectrogram = {
    f: null,
    i: null,
    split_y: 0,
    init() {
        let c = document.querySelector("#input_box").parentElement, r = document.createElement("div"), i = document.createElement("input"), l = document.createElement("button"), n = document.createElement("span"), v = document.createElement("canvas"), a = document.createElement("audio");
        i.type = "file";
        i.accept = "image/*";
        i.id = "sg-f";
        i.style.display = "none";
        l.type = "button";
        l.textContent = "Choose Image";
        l.onclick = () => i.click();
        n.textContent = "No image selected";
        n.style.marginLeft = "8px";
        i.onchange = (e) => {
            if (e.target.files[0]) {
                let r = new FileReader();
                n.textContent = e.target.files[0].name;
                r.onload = (v) => this.i = v.target.result;
                r.readAsDataURL(e.target.files[0]);
            }
        };
        r.style.cssText = "display:none;width:100%;margin-top:8px";
        r.append(i, l, n); c.parentElement.insertBefore(r, c.nextSibling);
        v.width = 600; v.height = 200; v.style.cssText = "display:none;width:100%;height:auto;margin-top:8px";
        a.controls = true; a.preload = "metadata"; a.style.cssText = "display:none;width:100%;margin-top:8px";
        c.parentElement.insertBefore(v, r.nextSibling);
        c.parentElement.insertBefore(a, v.nextSibling);
        this.r = r;
        this.f = i;
        this.v = v;
        this.a = a;
    },
    show() { if (this.r) this.r.style.display = "block"; },
    hide() { if (this.r) this.r.style.display = "none"; if (this.v) this.v.style.display = "none"; if (this.a) this.a.style.display = "none"; },
    async gen(t) {
        let w = 600, h = 200, c = document.createElement("canvas"), x = c.getContext("2d");
        this.b = null;
        c.width = w; c.height = h;
        x.fillStyle = "#000"; x.fillRect(0, 0, w, h);
        await new Promise((r) => {
            if (this.i) {
                let m = new Image();
                m.onload = () => { x.drawImage(m, 0, 0, w, h); r(); };
                m.src = this.i;
            } else {
                x.fillStyle = "#fff"; x.font = "40px sans-serif";
                x.fillText(t, 10, h / 2); r();
            }
        });
        let d = x.getImageData(0, 0, w, h).data, sr = 44100, dr = 3, ac = new OfflineAudioContext(1, sr * dr, sr);
        this.canvas_el.width = w;
        this.canvas_el.height = h;
        this.split_y = h;
        this.v.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(d), w, h), 0, 0);
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
    },
    save() {
        if (!this.b) return;
        let u = URL.createObjectURL(this.b), a = document.createElement("a");
        a.href = u; a.download = "spectrogram.wav"; a.click();
    },
    draw() { if (this.v && this.b) this.ctx.drawImage(this.v, 0, 0, this.canvas_el.width, this.canvas_el.height); }
};