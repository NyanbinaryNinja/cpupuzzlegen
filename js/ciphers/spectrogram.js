const spectrogram = {
    f: null,
    i: null,
    init() {
        let c = document.querySelector("#controls"), i = document.createElement("input");
        i.type = "file";
        i.accept = "image/*";
        i.id = "sg-f";
        i.style.display = "none";
        i.onchange = (e) => {
            if (e.target.files[0]) {
                let r = new FileReader();
                r.onload = (v) => this.i = v.target.result;
                r.readAsDataURL(e.target.files[0]);
            }
        };
        c.appendChild(i);
        this.f = i;
    },
    show() { if (this.f) this.f.style.display = "block"; },
    hide() { if (this.f) this.f.style.display = "none"; },
    async gen(t) {
        let w = 600, h = 200, c = document.createElement("canvas"), x = c.getContext("2d");
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
        let d = x.getImageData(0, 0, w, h).data, sr = 44100, dr = 3, ac = new OfflineAudioContext(1, sr * dr, sr), b = ac.createBuffer(1, sr * dr, sr), cd = b.getChannelData(0);
        for (let i = 0; i < w; i++) {
            let ts = Math.floor((i / w) * sr * dr), te = Math.floor(((i + 1) / w) * sr * dr);
            for (let j = 0; j < h; j++) {
                let q = (d[(j * w + i) * 4] + d[(j * w + i) * 4 + 1] + d[(j * w + i) * 4 + 2]) / 765;
                if (q > 0.05) {
                    let f = 20000 - (j / h) * 20000;
                    for (let k = ts; k < te; k++) cd[k] += Math.sin(2 * Math.PI * f * (k / sr)) * (q / h);
                }
            }
        }
        let s = ac.createBufferSource();
        s.buffer = b; s.connect(ac.destination); s.start();
        let rb = await ac.startRendering(), l = rb.length, ch = rb.numberOfChannels, ba = new ArrayBuffer(44 + l * 2), v = new DataView(ba), ws = (str, o) => { for (let k = 0; k < str.length; k++) v.setUint8(o + k, str.charCodeAt(k)); };
        ws("RIFF", 0); v.setUint32(4, 36 + l * 2, true); ws("WAVEfmt ", 8); v.setUint32(16, 16, true);
        v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, sr, true);
        v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
        ws("data", 36); v.setUint32(40, l * 2, true);
        let fcd = rb.getChannelData(0);
        for (let i = 0; i < l; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, fcd[i])) * 32767, true);
        let u = URL.createObjectURL(new Blob([ba], { type: "audio/wav" })), a = document.createElement("a");
        a.href = u; a.download = "spectrogram.wav"; a.click();
    }
};