const pcap = {
    f: null,
    r: null,
    use_image: false,
    input_fieldset: null,
    canvas_el: null,
    ctx: null,
    b: null,
    buffer: null,
    init(canvas_el, ctx) {
        let c = document.querySelector("#input_box").parentElement, r = document.createElement("fieldset"), d = document.createElement("select"), i = document.createElement("input"), l = document.createElement("button"), n = document.createElement("span"), q = document.createElement("input"), y = document.createElement("input"), z = document.createElement("textarea"), s = document.createElement("input"), a = document.createElement("label"), e = document.createElement("label"), w = document.createElement("label"), m = document.createElement("div");
        this.canvas_el = canvas_el; this.ctx = ctx; this.input_fieldset = c; this.r = r; this.f = i;
        r.className = "mb-5 w-100"; r.style.cssText = "display:block;width:100%;margin-top:8px";
        d.className = "mb-5 w-100"; d.innerHTML = '<option value="easy">Easy (HTTP Plaintext)</option><option value="intermediate">Intermediate (DNS Exfiltration)</option><option value="hard">Hard (Header Steganography)</option>';
        d.onchange = () => { this.difficulty = d.value; if (this.r) this.r.style.display = "block"; };
        this.difficulty_select = d;
        i.type = "file"; i.accept = ".txt,.json,.bin,.pcap,image/*"; i.style.display = "none"; i.id = "pcap-f";
        l.type = "button"; l.textContent = "Upload File"; l.className = "mb-5"; l.onclick = () => i.click();
        n.textContent = "No file selected"; n.style.marginLeft = "8px";
        i.onchange = (event) => {
            let file = event.target.files[0];
            if (file) {
                let reader = new FileReader();
                n.textContent = file.name;
                reader.onload = (result) => { this.file_text = String(result.target.result || ""); };
                reader.readAsText(file);
            }
        };
        q.type = "checkbox"; q.checked = false; q.id = "pcap-cascadia";
        y.type = "number"; y.min = "4"; y.max = "4096"; y.step = "1"; y.value = "64"; y.className = "w-100";
        z.className = "w-100"; z.rows = "4"; z.placeholder = "Custom noise lines";
        s.type = "range"; s.min = "0"; s.max = "100"; s.step = "1"; s.value = "25"; s.className = "w-100";
        a.textContent = "Difficulty:"; a.style.display = "block"; a.className = "mb-5";
        e.textContent = "Include Cascadia news rumors noise"; e.style.display = "block"; e.className = "mb-5";
        w.textContent = "Corruption:"; w.style.display = "block"; w.className = "mb-5";
        m.style.cssText = "display:flex;flex-direction:column;gap:8px;";
        m.append(a, d, l, n, y, e, q, z, w, s);
        r.append(m);
        c.parentElement.insertBefore(r, c.nextSibling);
        this.noise_input = y; this.cascadia_cb = q; this.custom_noise = z; this.corruption_sld = s; this.file_text = ""; this.difficulty = d.value;
    },
    show() { if (this.r) this.r.style.display = "block"; },
    hide() { if (this.r) this.r.style.display = "none"; },
    set_image_mode(enabled) {
        this.use_image = enabled;
        if (this.input_fieldset) this.input_fieldset.style.display = enabled ? "none" : "flex";
        this.show();
    },
    generate(t) { return this.gen(t); },
    _enc(s) {
        if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(String(s));
        let o = unescape(encodeURIComponent(String(s))), b = new Uint8Array(o.length);
        for (let i = 0; i < o.length; i++) b[i] = o.charCodeAt(i);
        return b;
    },
    _str(v) {
        return String(v || "");
    },
    _hex(b) {
        let s = "";
        for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
        return s;
    },
    _ip32(v) {
        let a = this._str(v).split(".").map((x) => parseInt(x, 10) || 0), c = ((a[0] << 24) | (a[1] << 16) | (a[2] << 8) | a[3]) >>> 0;
        return c;
    },
    _csum(b) {
        let s = 0;
        for (let i = 0; i < b.length; i += 2) {
            let v = (b[i] << 8) + (i + 1 < b.length ? b[i + 1] : 0);
            s += v;
        }
        while (s > 0xffff) s = (s & 0xffff) + (s >>> 16);
        return (~s) & 0xffff;
    },
    _dns_name(s) {
        let o = [], k = this._str(s).replace(/\.+/g, ".").replace(/^\./, "").replace(/\.$/, "").split(".");
        for (let i = 0; i < k.length; i++) {
            let p = k[i];
            if (!p) continue;
            o.push(p.length);
            for (let j = 0; j < p.length; j++) o.push(p.charCodeAt(j));
        }
        o.push(0, 0, 1, 0, 1);
        return new Uint8Array(o);
    },
    _corrupt(s, p) {
        let o = "", x = this._str(s), y = ".@#$%&*+=/\\|~^";
        let v = Math.max(0, Math.min(1, Number(p || 0) / 100));
        for (let i = 0; i < x.length; i++) {
            let c = x[i], r = Math.random();
            if (c === "\n" || c === "\r") { o += c; continue; }
            if (r < v * 0.75) o += y[Math.floor(Math.random() * y.length)];
            else o += c;
        }
        return o;
    },
    async _noise() {
        let n = [];
        if (this.cascadia_cb && this.cascadia_cb.checked) {
            try {
                let u = "./json/" + encodeURI("CPU - Weaver's Webway - news-rumors-cascadia-ic [982709436881723442].json");
                let r = await fetch(u);
                if (r.ok) {
                    let d = await r.json();
                    if (d && Array.isArray(d.messages)) {
                        for (let i = 0; i < d.messages.length; i++) {
                            let v = d.messages[i], c = v && v.content ? String(v.content) : "";
                            if (c) n.push(c);
                        }
                    }
                }
            } catch (e) {}
        }
        if (this.custom_noise && this.custom_noise.value) {
            n = n.concat(this.custom_noise.value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean));
        }
        if (!n.length) n = ["Recovered chatter", "Intercepted relay", "Cascadia rumor stream", "ICS telemetry", "Market signal", "Harbor traffic", "Signal drift"]; 
        return n;
    },
    _make_udp_packet(src_ip, dst_ip, src_port, dst_port, payload) {
        let p = new Uint8Array(14 + 20 + 8 + payload.length), v = new DataView(p.buffer);
        let d = [0x00, 0x11, 0x22, 0x33, 0x44, 0x55];
        let s = [0x00, 0x66, 0x77, 0x88, 0x99, 0xaa];
        for (let i = 0; i < 6; i++) { v.setUint8(i, d[i]); v.setUint8(i + 6, s[i]); }
        v.setUint16(12, 0x0800, false);
        let o = 14;
        v.setUint8(o, 0x45); v.setUint8(o + 1, 0); v.setUint16(o + 2, 20 + 8 + payload.length, false); v.setUint16(o + 4, 0x1000, false); v.setUint16(o + 6, 0, false); v.setUint8(o + 8, 64); v.setUint8(o + 9, 17); v.setUint16(o + 10, 0, false); v.setUint32(o + 12, this._ip32(src_ip), false); v.setUint32(o + 16, this._ip32(dst_ip), false);
        let h = new Uint8Array(p.buffer, 14, 20); h[10] = h[11] = 0; let c = this._csum(h); v.setUint16(o + 10, c, false);
        let u = o + 20; v.setUint16(u, src_port, false); v.setUint16(u + 2, dst_port, false); v.setUint16(u + 4, 8 + payload.length, false); v.setUint16(u + 6, 0, false);
        for (let i = 0; i < payload.length; i++) v.setUint8(u + 8 + i, payload[i]);
        return p;
    },
    _make_tcp_packet(src_ip, dst_ip, src_port, dst_port, seq, ack, flags, payload, id) {
        let n = 14 + 20 + 20 + payload.length, p = new Uint8Array(n), v = new DataView(p.buffer);
        let d = [0x00, 0x11, 0x22, 0x33, 0x44, 0x55];
        let s = [0x00, 0x66, 0x77, 0x88, 0x99, 0xaa];
        for (let i = 0; i < 6; i++) { v.setUint8(i, d[i]); v.setUint8(i + 6, s[i]); }
        v.setUint16(12, 0x0800, false);
        let o = 14;
        v.setUint8(o, 0x45); v.setUint8(o + 1, 0); v.setUint16(o + 2, 20 + 20 + payload.length, false); v.setUint16(o + 4, id || 0, false); v.setUint16(o + 6, 0, false); v.setUint8(o + 8, 64); v.setUint8(o + 9, 6); v.setUint16(o + 10, 0, false); v.setUint32(o + 12, this._ip32(src_ip), false); v.setUint32(o + 16, this._ip32(dst_ip), false);
        let h = new Uint8Array(p.buffer, 14, 20); h[10] = h[11] = 0; let c = this._csum(h); v.setUint16(o + 10, c, false);
        let t = o + 20; v.setUint16(t, src_port, false); v.setUint16(t + 2, dst_port, false); v.setUint32(t + 4, seq >>> 0, false); v.setUint32(t + 8, ack >>> 0, false); v.setUint8(t + 12, 0x50); v.setUint8(t + 13, flags); v.setUint16(t + 14, 0x4000, false); v.setUint16(t + 16, 0, false); v.setUint16(t + 18, 0, false);
        let b = new Uint8Array(12 + 20 + payload.length), q = new DataView(b.buffer);
        q.setUint32(0, this._ip32(src_ip), false); q.setUint32(4, this._ip32(dst_ip), false); q.setUint8(8, 0); q.setUint8(9, 6); q.setUint16(10, 20 + payload.length, false);
        for (let i = 0; i < 20; i++) b[12 + i] = p[14 + 20 + i];
        for (let i = 0; i < payload.length; i++) b[12 + 20 + i] = payload[i];
        v.setUint16(t + 16, this._csum(b), false);
        for (let i = 0; i < payload.length; i++) v.setUint8(t + 20 + i, payload[i]);
        return p;
    },
    _pcap(t, packets) {
        let n = 24 + packets.reduce((a, p) => a + 16 + p.byteLength, 0), ba = new ArrayBuffer(n), v = new DataView(ba), off = 24, sec = Math.floor(Date.now() / 1000), usec = Math.floor((Date.now() % 1000) * 1000);
        v.setUint32(0, 0xa1b2c3d4, true); v.setUint16(4, 2, true); v.setUint16(6, 4, true); v.setUint32(8, 0, true); v.setUint32(12, 65535, true); v.setUint32(16, 1, true);
        for (let i = 0; i < packets.length; i++) {
            let p = packets[i], l = p.byteLength;
            v.setUint32(off, sec - i, true); v.setUint32(off + 4, usec + i, true); v.setUint32(off + 8, l, true); v.setUint32(off + 12, l, true);
            let b = new Uint8Array(ba, off + 16, l);
            b.set(new Uint8Array(p));
            off += 16 + l;
        }
        return ba;
    },
    async gen(t) {
        let flag = this.use_image && this.f && this.f.files && this.f.files[0] ? (this.file_text || String(t || "")) : String(t || "");
        if (!flag) flag = "FLAG{pcap_fake_traffic}";
        if (this.use_image && this.f && this.f.files && this.f.files[0] && !this.file_text) {
            let r = this.f.files[0], read = new FileReader();
            await new Promise((resolve) => {
                read.onload = (ev) => { this.file_text = String(ev.target.result || ""); resolve(); };
                read.readAsText(r);
            });
            flag = this.file_text;
        }
        let d = this.difficulty_select ? this.difficulty_select.value : "easy", n = Number(this.noise_input ? this.noise_input.value : 64) || 64, p = await this._noise(), packets = [], b = this._enc(flag), c = Math.max(4, Math.ceil(n / 2)), q = Math.max(1, Math.ceil(n / 10));
        for (let i = 0; i < n; i++) {
            let m = p[i % p.length], x = this._corrupt(m + " " + i, Number(this.corruption_sld ? this.corruption_sld.value : 25));
            if (d === "easy") {
                let payload = i === Math.floor(n / 2) ? b : this._enc(x);
                packets.push(this._make_tcp_packet("10.0.0.2", "10.0.0.3", 40000 + i, 80, 1000 + i * 100, 0, 0x18, payload, (i + 1) * 13));
            } else if (d === "intermediate") {
                let s = this._hex(b);
                let k = [];
                for (let j = 0; j < s.length; j += 12) k.push(s.slice(j, j + 12));
                let h = k.length ? k[i % k.length] : "deadbeef";
                let qn = i % 2 === 0 ? "chunk" + i + "." + h + ".example.com" : "query" + i + "." + x.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) + ".example.com";
                if (i === Math.floor(n / 2) && b.length) qn = "flag." + this._hex(b).slice(0, 18) + ".example.com";
                packets.push(this._make_udp_packet("10.0.0.5", "10.0.0.8", 53000 + i, 53, this._dns_name(qn)));
            } else {
                let payload = this._enc(this._corrupt(m + " " + i, Number(this.corruption_sld ? this.corruption_sld.value : 25)));
                packets.push(this._make_tcp_packet("10.0.0.7", "10.0.0.9", 50000 + i, 443, 7000 + i * 1000, 0, 0x02, payload, ((b[i % b.length] || 0) << 8) | (i & 0xff)));
            }
        }
        this.buffer = this._pcap(flag, packets);
        this.b = new Blob([this.buffer], { type: "application/vnd.tcpdump.pcap" });
        return this.buffer;
    },
    save() {
        if (!this.buffer) return;
        let u = URL.createObjectURL(this.b || new Blob([this.buffer], { type: "application/vnd.tcpdump.pcap" })), a = document.createElement("a");
        a.href = u; a.download = "challenge.pcap"; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(u), 0);
    },
    draw() {}
};
