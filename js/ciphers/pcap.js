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
        let c = document.querySelector("#input_box").parentElement, p = document.querySelector(".options-window .window-body"), r = document.createElement("fieldset"), u = document.createElement("fieldset"), d = document.createElement("select"), i = document.createElement("input"), l = document.createElement("button"), n = document.createElement("span"), q = document.createElement("input"), y = document.createElement("input"), z = document.createElement("textarea"), s = document.createElement("input"), a = document.createElement("label"), e = document.createElement("label"), w = document.createElement("label"), m = document.createElement("div"), x = document.createElement("label"), o = document.createElement("div");
        this.canvas_el = canvas_el; this.ctx = ctx; this.input_fieldset = c; this.r = r; this.f = i;
        this.viewer_rows = [];
        this.viewer_hover = -1;
        this.viewer_steps = [];
        if (canvas_el) {
            canvas_el.width = 900;
            canvas_el.height = 360;
            canvas_el.onmousemove = (event) => {
                if (!this.viewer_rows || !this.viewer_rows.length) return;
                let rect = canvas_el.getBoundingClientRect(), x = ((event.clientX - rect.left) / rect.width) * canvas_el.width, y = ((event.clientY - rect.top) / rect.height) * canvas_el.height;
                let hit = this._viewer_hit(x, y);
                this.viewer_hover = hit;
                canvas_el.style.cursor = hit >= 0 ? "pointer" : "default";
            };
            canvas_el.onmouseleave = () => { this.viewer_hover = -1; canvas_el.style.cursor = "default"; };
        }
        u.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;"; u.className = "mb-5";
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
        u.append(l, n);
        c.parentElement.insertBefore(u, c.nextSibling);
        r.className = "mb-5 w-100"; r.style.cssText = "display:block;width:100%;margin-top:8px";
        d.className = "mb-5 w-100"; d.innerHTML = '<option value="easy">Easy (HTTP Plaintext)</option><option value="intermediate">Intermediate (DNS Exfiltration)</option><option value="hard">Hard (Header Steganography)</option>';
        d.onchange = () => { this.difficulty = d.value; if (this.r) this.r.style.display = "block"; };
        this.difficulty_select = d;
        q.type = "checkbox"; q.checked = false; q.id = "pcap-cascadia";
        y.type = "number"; y.min = "8"; y.max = "512"; y.step = "1"; y.value = "48"; y.className = "w-100";
        z.className = "w-100"; z.rows = "4"; z.placeholder = "Custom noise lines";
        s.type = "range"; s.min = "0"; s.max = "100"; s.step = "1"; s.value = "25"; s.className = "w-100";
        a.textContent = "Difficulty:"; a.style.display = "block"; a.className = "mb-5";
        e.textContent = "Use Cascadia news/rumours"; e.style.display = "block"; e.className = "mb-5"; e.htmlFor = q.id;
        w.textContent = "Corruption:"; w.style.display = "block"; w.className = "mb-5";
        x.textContent = "Packet count / file length:"; x.style.display = "block"; x.className = "mb-5";
        o.style.cssText = "display:flex;flex-direction:column;gap:8px;";
        let g = document.createElement("label");
        g.style.cssText = "display:flex;align-items:center;gap:8px;";
        g.appendChild(q); g.appendChild(e);
        o.append(a, d, x, y, g, z, w, s);
        r.append(o);
        if (p) p.appendChild(r);
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
    _str(v) { return String(v || ""); },
    _u8(s) { if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(this._str(s)); let b = unescape(encodeURIComponent(this._str(s))), o = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; },
    _hex(v) { let s = "", b = this._u8(v); for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0"); return s; },
    _b64(v) { return btoa(unescape(encodeURIComponent(this._str(v)))); },
    _ip32(v) { let a = this._str(v).split(".").map((x) => parseInt(x, 10) || 0), c = ((a[0] << 24) | (a[1] << 16) | (a[2] << 8) | a[3]) >>> 0; return c; },
    _csum(b) { let s = 0; for (let i = 0; i < b.length; i += 2) s += (b[i] << 8) + (i + 1 < b.length ? b[i + 1] : 0); while (s > 0xffff) s = (s & 0xffff) + (s >>> 16); return (~s) & 0xffff; },
    _m8(v) { let a = typeof v === "string" ? v.split(":").map((x) => parseInt(x, 16) || 0) : v; return new Uint8Array(a); },
    _dns_name(s) { let o = [], k = this._str(s).replace(/\.+/g, ".").replace(/^\./, "").replace(/\.$/, "").split("."); for (let i = 0; i < k.length; i++) { let p = k[i]; if (!p) continue; o.push(p.length); for (let j = 0; j < p.length; j++) o.push(p.charCodeAt(j)); } o.push(0); return new Uint8Array(o); },
    _corrupt(s, p) { let o = "", x = this._str(s), y = "@#$%&*+=/\\|~^"; let v = Math.max(0, Math.min(1, Number(p || 0) / 100)); for (let i = 0; i < x.length; i++) { let c = x[i], r = Math.random(); if (c === "\n" || c === "\r") { o += c; continue; } if (r < v * 0.9) o += y[Math.floor(Math.random() * y.length)]; else o += c; } return o; },
    _ts() { let b = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600), u = Math.floor(Math.random() * 1000000); return { sec: b, usec: u }; },
    async _noise() { let n = []; if (this.cascadia_cb && this.cascadia_cb.checked) { try { let u = "./json/" + encodeURI("CPU - Weaver's Webway - news-rumors-cascadia-ic [982709436881723442].json"), r = await fetch(u); if (r && r.ok) { let d = await r.json(); if (d && Array.isArray(d.messages)) for (let i = 0; i < d.messages.length; i++) { let v = d.messages[i], c = v && v.content ? String(v.content) : ""; if (c) n.push(c); } } } catch (e) {} } if (this.custom_noise && this.custom_noise.value) n = n.concat(this.custom_noise.value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)); if (!n.length) n = ["Recovered chatter", "Intercepted relay", "Cascadia rumor stream", "ICS telemetry", "Market signal", "Harbor traffic", "Signal drift", "Server sync error", "Correlating lognotes", "Tunnel status stabilizing"]; return n; },
    _eth(src, dst, proto, payload) { let b = new Uint8Array(14 + payload.length), v = new DataView(b.buffer); for (let i = 0; i < 6; i++) { v.setUint8(i, src[i]); v.setUint8(i + 6, dst[i]); } v.setUint16(12, proto, false); for (let i = 0; i < payload.length; i++) v.setUint8(14 + i, payload[i]); return b; },
    _ipv4(src_ip, dst_ip, proto, payload, id) { let b = new Uint8Array(20 + payload.length), v = new DataView(b.buffer); v.setUint8(0, 0x45); v.setUint8(1, 0); v.setUint16(2, 20 + payload.length, false); v.setUint16(4, id || 0, false); v.setUint16(6, 0, false); v.setUint8(8, 64); v.setUint8(9, proto); v.setUint16(10, 0, false); v.setUint32(12, this._ip32(src_ip), false); v.setUint32(16, this._ip32(dst_ip), false); v.setUint16(10, this._csum(b), false); for (let i = 0; i < payload.length; i++) v.setUint8(20 + i, payload[i]); return b; },
    _tcp_checksum(src_ip, dst_ip, seg) { let b = new Uint8Array(12 + seg.length), d = new DataView(b.buffer); d.setUint32(0, this._ip32(src_ip), false); d.setUint32(4, this._ip32(dst_ip), false); d.setUint8(8, 0); d.setUint8(9, 6); d.setUint16(10, seg.length, false); for (let i = 0; i < seg.length; i++) b[12 + i] = seg[i]; return this._csum(b); },
    _udp_checksum(src_ip, dst_ip, seg) { let b = new Uint8Array(12 + seg.length), d = new DataView(b.buffer); d.setUint32(0, this._ip32(src_ip), false); d.setUint32(4, this._ip32(dst_ip), false); d.setUint8(8, 0); d.setUint8(9, 17); d.setUint16(10, seg.length, false); for (let i = 0; i < seg.length; i++) b[12 + i] = seg[i]; return this._csum(b); },
    _tcp(src_ip, dst_ip, src_mac, dst_mac, src_port, dst_port, seq, ack, flags, payload, ident) { let h = new Uint8Array(20 + payload.length), v = new DataView(h.buffer); v.setUint16(0, src_port, false); v.setUint16(2, dst_port, false); v.setUint32(4, seq >>> 0, false); v.setUint32(8, ack >>> 0, false); v.setUint8(12, 0x50); v.setUint8(13, flags); v.setUint16(14, 0x4000, false); v.setUint16(16, 0, false); v.setUint16(18, 0, false); for (let i = 0; i < payload.length; i++) v.setUint8(20 + i, payload[i]); v.setUint16(16, this._tcp_checksum(src_ip, dst_ip, h), false); return this._eth(src_mac, dst_mac, 0x0800, this._ipv4(src_ip, dst_ip, 6, h, ident)); },
    _udp(src_ip, dst_ip, src_mac, dst_mac, src_port, dst_port, payload, ident) { let h = new Uint8Array(8 + payload.length), v = new DataView(h.buffer); v.setUint16(0, src_port, false); v.setUint16(2, dst_port, false); v.setUint16(4, 8 + payload.length, false); v.setUint16(6, 0, false); for (let i = 0; i < payload.length; i++) v.setUint8(8 + i, payload[i]); v.setUint16(6, this._udp_checksum(src_ip, dst_ip, h), false); return this._eth(src_mac, dst_mac, 0x0800, this._ipv4(src_ip, dst_ip, 17, h, ident)); },
    _icmp_echo(type, code, id, seq, src_ip, dst_ip, src_mac, dst_mac, payload, ident) { let p = payload || []; let h = new Uint8Array(8 + p.length), v = new DataView(h.buffer); v.setUint8(0, type || 8); v.setUint8(1, code || 0); v.setUint16(2, 0, false); v.setUint16(4, id || 0, false); v.setUint16(6, seq || 0, false); for (let i = 0; i < p.length; i++) v.setUint8(8 + i, p[i]); return this._eth(src_mac, dst_mac, 0x0800, this._ipv4(src_ip, dst_ip, 1, h, ident)); },
    _dns_query(id, qname, qtype, src_ip, dst_ip, src_mac, dst_mac, ident) { let q = this._dns_name(qname), b = new Uint8Array(12 + q.length + 4), v = new DataView(b.buffer); v.setUint16(0, id, false); v.setUint16(2, 0x0100, false); v.setUint16(4, 1, false); v.setUint16(6, 0, false); v.setUint16(8, 0, false); v.setUint16(10, 0, false); for (let i = 0; i < q.length; i++) b[12 + i] = q[i]; v.setUint16(12 + q.length, qtype, false); v.setUint16(12 + q.length + 2, 1, false); return this._udp(src_ip, dst_ip, src_mac, dst_mac, 53000, 53, b, ident); },
    _dns_response(id, qname, txt, src_ip, dst_ip, src_mac, dst_mac, ident) { let q = this._dns_name(qname), t = this._u8(txt), b = new Uint8Array(12 + q.length + 4 + 16 + 2 + t.length), v = new DataView(b.buffer); v.setUint16(0, id, false); v.setUint16(2, 0x8180, false); v.setUint16(4, 1, false); v.setUint16(6, 1, false); v.setUint16(8, 0, false); v.setUint16(10, 0, false); for (let i = 0; i < q.length; i++) b[12 + i] = q[i]; v.setUint16(12 + q.length, 16, false); v.setUint16(12 + q.length + 2, 1, false); let o = 12 + q.length + 4; b[o] = 0xc0; b[o + 1] = 0x0c; v.setUint16(o + 2, 16, false); v.setUint16(o + 4, 1, false); v.setUint32(o + 6, 300, false); v.setUint16(o + 10, t.length + 1, false); b[o + 12] = t.length; for (let i = 0; i < t.length; i++) b[o + 13 + i] = t[i]; return this._udp(dst_ip, src_ip, dst_mac, src_mac, 53, 53000, b, ident); },
    _http_req(method, path, host, headers, body, src_ip, dst_ip, src_mac, dst_mac, ident) { let h = [method + " " + path + " HTTP/1.1", "Host: " + host, "User-Agent: Mozilla/5.0", "Accept: text/html,application/json", "Connection: keep-alive"].concat(headers || []), p = this._u8(h.join("\r\n") + "\r\n\r\n" + (body || "")); return this._tcp(src_ip, dst_ip, src_mac, dst_mac, 50000, 80, 123456789, 0, 0x18, p, ident); },
    _http_resp(code, reason, headers, body, src_ip, dst_ip, src_mac, dst_mac, ident) { let h = ["HTTP/1.1 " + code + " " + reason, "Server: nginx/1.18.0", "Content-Type: text/html; charset=utf-8", "Connection: close"].concat(headers || []), p = this._u8(h.join("\r\n") + "\r\n\r\n" + (body || "")); return this._tcp(src_ip, dst_ip, src_mac, dst_mac, 80, 50000, 123456790, 0x1000, 0x18, p, ident); },
    _ftp_session(flag, src_ip, dst_ip, src_mac, dst_mac) { let pw = "ftp_" + flag.slice(0, 12).replace(/[^a-zA-Z0-9]/g, "") + "!", banner = this._u8("220 ftp.example.net FTP server ready\r\n"), user = this._u8("331 Password required for admin\r\n"), pass = this._u8("230 Login successful\r\n"), list = this._u8("150 Opening ASCII mode data connection for /bin/ls\r\n\r\n"), data = this._u8("drwxr-xr-x  3 admin  users  4096 Jan  01  00:00 /var/log\r\n-rw-r--r--  1 admin  users  52 Jan  05  12:13 notes.txt\r\n"), file = this._u8("150 Opening BINARY mode data connection for flag.log\r\n226 Transfer complete\r\n"); return [this._tcp(src_ip, dst_ip, src_mac, dst_mac, 35000, 21, 1000, 0, 0x12, banner, 0x100), this._tcp(dst_ip, src_ip, dst_mac, src_mac, 21, 35000, 0, 1001, 0x18, this._u8("USER admin\r\n"), 0x101), this._tcp(dst_ip, src_ip, dst_mac, src_mac, 21, 35000, 0, 1001, 0x18, this._u8("PASS " + pw + "\r\n"), 0x102), this._tcp(src_ip, dst_ip, src_mac, dst_mac, 35001, 21, 2000, 0, 0x18, this._u8("LIST\r\n"), 0x103), this._tcp(dst_ip, src_ip, dst_mac, src_mac, 21, 35001, 0, 2001, 0x18, list, 0x104), this._tcp(dst_ip, src_ip, dst_mac, src_mac, 21, 35001, 0, 2001, 0x18, this._u8("NLST\r\n"), 0x105), this._tcp(dst_ip, src_ip, dst_mac, src_mac, 21, 35001, 0, 2001, 0x18, file, 0x106), this._tcp(src_ip, dst_ip, src_mac, dst_mac, 35002, 20, 4000, 0, 0x18, data, 0x107)]; },
    _sip_invite(flag, src_ip, dst_ip, src_mac, dst_mac) { let cid = "84f4d9af" + this._hex(flag).slice(0, 8), tag = "tag-" + this._hex(flag).slice(0, 12), uri = "sip:alice@corp.example.net", body = ["INVITE sip:alice@corp.example.net SIP/2.0", "Via: SIP/2.0/UDP 10.0.0.12:5060;branch=z9hG4bK" + cid, "Max-Forwards: 70", "To: <sip:alice@corp.example.net>", "From: \"bob\" <sip:bob@corp.example.net>;tag=" + tag, "Call-ID: " + cid, "CSeq: 201 INVITE", "Contact: <sip:bob@10.0.0.12:5060>", "Authorization: Digest username=\"bob\", realm=\"corp.example.net\", nonce=\"" + cid + "\", uri=\"" + uri + "\", response=\"" + this._b64(flag).slice(0, 24) + "\"", "Content-Type: application/sdp", "Content-Length: 144", "", "v=0\r\no=- 486401 1 IN IP4 10.0.0.12\r\ns=Phone Call\r\nc=IN IP4 10.0.0.12\r\nm=audio 5044 RTP/AVP 0 8\r\na=rtpmap:0 PCMU/8000\r\n"].join("\r\n"); let resp = ["SIP/2.0 200 OK", "Via: SIP/2.0/UDP 10.0.0.12:5060;branch=z9hG4bK" + cid, "From: \"bob\" <sip:bob@corp.example.net>;tag=" + tag, "To: <sip:alice@corp.example.net>;tag=77", "Call-ID: " + cid, "CSeq: 201 INVITE", "Contact: <sip:alice@10.0.0.20:5060>", "Content-Type: application/sdp", "Content-Length: 122", "", "v=0\r\no=- 486402 1 IN IP4 10.0.0.20\r\ns=Call Connected\r\nc=IN IP4 10.0.0.20\r\nm=audio 5052 RTP/AVP 0 8\r\na=rtpmap:0 PCMU/8000\r\n"].join("\r\n"); return [this._udp(src_ip, dst_ip, src_mac, dst_mac, 5060, 5060, this._u8(body), 0x200), this._udp(dst_ip, src_ip, dst_mac, src_mac, 5060, 5060, this._u8(resp), 0x201)]; },
    _pcap(packets) { let n = 24 + packets.reduce((a, p) => a + 16 + p.length, 0), ba = new ArrayBuffer(n), v = new DataView(ba), o = 24; v.setUint32(0, 0xa1b2c3d4, true); v.setUint16(4, 2, true); v.setUint16(6, 4, true); v.setUint32(8, 0, true); v.setUint32(12, 0xffffffff, true); v.setUint32(16, 1, true); for (let i = 0; i < packets.length; i++) { let p = packets[i], l = p.length, t = this._ts(); v.setUint32(o, t.sec, true); v.setUint32(o + 4, t.usec, true); v.setUint32(o + 8, l, true); v.setUint32(o + 12, l, true); let b = new Uint8Array(ba, o + 16, l); b.set(p); o += 16 + l; } return ba; },
    _viewer_hit(x, y) { if (!this.viewer_rows || !this.viewer_rows.length || !this.ctx || !this.canvas_el) return -1; let row_h = 18, left = 8, top = 24; let hit = Math.floor((y - top) / row_h); if (y < top || y > top + this.viewer_rows.length * row_h + 4 || x < left || x > this.canvas_el.width - 8) return -1; if (hit < 0 || hit >= this.viewer_rows.length) return -1; return this.viewer_rows[hit].flag ? hit : -1; },
    _viewer_rows_for(flag) { let rows = []; let flag_text = flag || "FLAG{packet_sniffing_forensics}"; let packet_desc = [
        { time: "09:14:08.221", src: "10.10.20.5", dst: "203.0.113.5", protocol: "HTTP", info: "GET /login?user=admin&token=...&trace=...", flag: true },
        { time: "09:14:08.451", src: "203.0.113.5", dst: "10.10.20.5", protocol: "HTTP", info: "200 OK - Access granted for admin. X-Flag: " + flag_text, flag: true },
        { time: "09:14:09.002", src: "10.10.20.5", dst: "10.10.20.250", protocol: "DNS", info: "Standard query A flag-" + flag_text.slice(0, 16) + ".corp.example.net", flag: false },
        { time: "09:14:09.015", src: "10.10.20.250", dst: "10.10.20.5", protocol: "DNS", info: "Standard query response - TXT: " + flag_text.slice(0, 32), flag: true },
        { time: "09:14:11.736", src: "10.10.20.8", dst: "10.10.20.66", protocol: "FTP", info: "USER admin / PASS ftp_" + flag_text.slice(0, 10).replace(/[^A-Za-z0-9]/g, "") + "!", flag: false },
        { time: "09:14:12.114", src: "10.10.20.12", dst: "10.10.20.20", protocol: "SIP", info: "INVITE sip:alice@corp.example.net Authorization: Digest response=...", flag: false },
        { time: "09:14:20.804", src: "10.10.20.7", dst: "10.10.20.250", protocol: "ICMP", info: "echo request - forensic-trace=relay 0", flag: false },
        { time: "09:14:22.540", src: "10.10.20.2", dst: "198.51.100.3", protocol: "HTTP", info: "POST /api/collect?tag=intercepted&m=...", flag: false },
        { time: "09:14:25.330", src: "10.10.20.250", dst: "224.0.0.1", protocol: "MDNS", info: "mDNS forensic relay " + flag_text.slice(0, 12), flag: false },
        { time: "09:14:28.110", src: "10.10.20.8", dst: "10.10.20.66", protocol: "HTTP", info: "GET /forensics/trace?session=...&tag=exfiltrated", flag: false }
    ];
    for (let i = 0; i < packet_desc.length; i++) rows.push({ no: i + 1, time: packet_desc[i].time, src: packet_desc[i].src, dst: packet_desc[i].dst, protocol: packet_desc[i].protocol, info: packet_desc[i].info, length: 128 + (i * 7), flag: !!packet_desc[i].flag, flag_value: flag_text });
    return rows;
    },
    async gen(t) { let flag = this.use_image && this.f && this.f.files && this.f.files[0] ? (this.file_text || this._str(t || "")) : this._str(t || ""); if (!flag) flag = "FLAG{packet_sniffing_forensics}"; if (this.use_image && this.f && this.f.files && this.f.files[0] && !this.file_text) { let r = this.f.files[0], read = new FileReader(); await new Promise((resolve) => { read.onload = (ev) => { this.file_text = this._str(ev.target.result || ""); resolve(); }; read.readAsText(r); }); flag = this.file_text; } let d = this.difficulty_select ? this.difficulty_select.value : "easy", n = Number(this.noise_input ? this.noise_input.value : 48) || 48, noise = await this._noise(), packets = [], base = this._b64(flag), hex = this._hex(flag), mac1 = this._m8("00:11:22:33:44:55"), mac2 = this._m8("00:66:77:88:99:aa"), mac3 = this._m8("00:99:bb:cc:dd:ee"), mac4 = this._m8("00:12:34:56:78:9a"), db = ["http.example.net", "dns.example.net", "ftp.example.net", "sip.example.net"], forensic_tags = ["intercepted", "replayed", "exfiltrated", "retransmitted", "staged", "tampered", "misrouted", "forensic-sample"]; this.viewer_steps = ["1. Review the HTTP and DNS queries for the same hostnames and payload markers.", "2. Correlate the client and server addresses to identify the command-and-control and resolver hosts.", "3. Reassemble the exfiltrated fragments and decode the embedded flag string.", "4. Confirm the flag is present in the highlighted packet and verify it against the response metadata."]; if (d === "easy") { packets.push(this._http_req("GET", "/login?user=admin&token=" + base.slice(0, 12) + "&trace=" + hex.slice(0, 16), "app.example.net", ["X-Trace: " + hex.slice(0, 24), "Authorization: Bearer " + base.slice(0, 18), "Cookie: session=8dca91b6a3eb; theme=dark", "X-Forensics: " + forensic_tags[0]], "", "10.10.20.5", "203.0.113.5", mac1, mac2, 0x500)); packets.push(this._http_resp(200, "OK", ["Date: Tue, 11 Aug 2026 09:21:42 GMT", "Content-Length: 168", "Set-Cookie: session=8dca91b6a3eb; Path=/; HttpOnly", "X-Flag: " + flag, "X-Relay: " + forensic_tags[1]], "<html><body>Access granted for admin.</body></html>", "203.0.113.5", "10.10.20.5", mac2, mac1, 0x501)); packets.push(this._dns_query(0x42f1, "flag-" + base.slice(0, 8) + ".corp.example.net", 16, "10.10.20.5", "10.10.20.250", mac1, mac3, 0x502)); packets.push(this._dns_response(0x42f1, "flag-" + base.slice(0, 8) + ".corp.example.net", flag.slice(0, 63), "10.10.20.250", "10.10.20.5", mac3, mac1, 0x503)); } else if (d === "intermediate") { for (let i = 0; i < 6; i++) { let qn = "chunk" + i + "." + base.slice(0, 10) + "." + db[i % db.length]; packets.push(this._dns_query(0x7000 + i, qn, 16, "10.10.20.7", "10.10.20.250", mac4, mac3, 0x600 + i)); packets.push(this._dns_response(0x7000 + i, qn, this._corrupt(base.slice(i * 3, i * 3 + 24), Number(this.corruption_sld ? this.corruption_sld.value : 25)), "10.10.20.250", "10.10.20.7", mac3, mac4, 0x620 + i)); packets.push(this._icmp_echo(8, 0, 0x1000 + i, 200 + i, "10.10.20.7", "10.10.20.250", mac4, mac3, this._u8("forensic-trace=relay " + i), 0x650 + i)); } packets.push(...this._sip_invite(flag, "10.10.20.12", "10.10.20.20", mac1, mac3)); } else { let b = this._u8(flag); for (let i = 0; i < Math.min(b.length, 16); i++) { let msg = this._corrupt(noise[i % noise.length] + " " + i, Number(this.corruption_sld ? this.corruption_sld.value : 25)); packets.push(this._tcp("10.10.30." + (i % 10 + 1), "10.10.40." + ((i % 8) + 1), mac2, mac1, 50000 + i, 443, 100000 + i * 777, 0, 0x02, this._u8(msg), b[i])); } } for (let i = 0; i < n; i++) { let s = noise[i % noise.length] || "relay telemetry", x = this._corrupt(s + " " + i, Number(this.corruption_sld ? this.corruption_sld.value : 25)), step = i % 5; if (step === 0) packets.push(this._dns_query(0x8000 + i, "rumor-" + i + "." + db[i % db.length], 16, "10.10.20." + ((i % 9) + 1), "10.10.20.250", mac1, mac2, 0x900 + i)); else if (step === 1) packets.push(this._http_req("POST", "/api/collect?tag=" + forensic_tags[i % forensic_tags.length] + "&m=" + this._hex(String(i)), "api.example.net", ["X-Trace: " + hex.slice(0, 12), "Accept-Encoding: gzip", "X-Flow-Id: " + (0x1000 + i).toString(16), "X-Session: " + this._b64(x.slice(0, 16))], this._corrupt("payload=" + x.slice(0, 96) + "\n" + flag.slice(0, 24), Number(this.corruption_sld ? this.corruption_sld.value : 25)), "10.10.20." + ((i % 12) + 2), "198.51.100." + ((i % 10) + 1), mac4, mac3, 0x1000 + i)); else if (step === 2) packets.push(this._udp("10.10.20." + ((i % 10) + 3), "10.10.20." + ((i % 8) + 5), mac3, mac4, 5060 + (i % 5), 5060 + (i % 3), this._u8("INVITE sip:server@example.net SIP/2.0\r\nVia: SIP/2.0/UDP 10.10.20.18:5060\r\nCSeq: " + (100 + i) + " INVITE\r\n\r\n" + x.slice(0, 64)), 0x1100 + i)); else if (step === 3) packets.push(this._icmp_echo(8, 0, 0x2000 + i, 300 + i, "10.10.20." + ((i % 7) + 4), "10.10.20.250", mac1, mac3, this._u8("echo " + forensic_tags[i % forensic_tags.length] + " " + x.slice(0, 32)), 0x1200 + i)); else packets.push(...this._ftp_session(flag, "10.10.20.8", "10.10.20.66", mac4, mac2)); } packets.push(...this._ftp_session(flag, "10.10.20.8", "10.10.20.66", mac4, mac2)); packets.push(this._http_req("GET", "/forensics/trace?session=" + this._b64(flag.slice(0, 20)) + "&tag=" + forensic_tags[2], "forensics.internal", ["X-Trace: " + hex.slice(0, 16), "X-Source: 10.10.20.8", "X-Destination: 10.10.20.66"], "", "10.10.20.8", "10.10.20.66", mac4, mac2, 0x1300)); packets.push(this._http_resp(200, "OK", ["Date: Tue, 11 Aug 2026 09:21:49 GMT", "Content-Length: 96", "X-Case: forensic-review"], "<html><body>analysis complete</body></html>", "10.10.20.66", "10.10.20.8", mac2, mac4, 0x1301)); let mdsn = this._corrupt("mDNS forensic relay " + flag.slice(0, 24), Number(this.corruption_sld ? this.corruption_sld.value : 25)); packets.push(this._udp("10.10.20.250", "224.0.0.1", mac3, this._m8("ff:ff:ff:ff:ff:ff"), 5353, 5353, this._u8(mdsn.slice(0, 48)), 0x1400)); this.viewer_rows = this._viewer_rows_for(flag); this.buffer = this._pcap(packets); this.b = new Blob([this.buffer], { type: "application/vnd/tcpdump.pcap" }); return this.buffer; },
    save() { if (!this.buffer) return; let u = URL.createObjectURL(this.b || new Blob([this.buffer], { type: "application/vnd/tcpdump.pcap" })), a = document.createElement("a"); a.href = u; a.download = "challenge.pcap"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 0); },
    draw() {
        if (!this.ctx || !this.canvas_el) return;
        let w = this.canvas_el.width, h = this.canvas_el.height, rows = this.viewer_rows || [], hover = this.viewer_hover >= 0 ? this.viewer_rows[this.viewer_hover] : null;
        this.ctx.clearRect(0, 0, w, h);
        this.ctx.fillStyle = "#071114";
        this.ctx.fillRect(0, 0, w, h);
        this.ctx.strokeStyle = "#1a3439";
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = "#d9f5ff";
        this.ctx.font = "11px monospace";
        let start_x = 6, col_w = [32, 72, 90, 84, 120, 330], row_h = 18, top = 26;
        let x = start_x;
        this.ctx.fillText("No.", x, 16); x += col_w[0]; this.ctx.fillText("Time", x, 16); x += col_w[1]; this.ctx.fillText("Src", x, 16); x += col_w[2]; this.ctx.fillText("Dst", x, 16); x += col_w[3]; this.ctx.fillText("Proto", x, 16); x += col_w[4]; this.ctx.fillText("Info", x, 16);
        for (let i = 0; i < rows.length; i++) {
            let r = rows[i], y = top + i * row_h;
            let selected = !!r.flag;
            if (selected) this.ctx.fillStyle = "rgba(255, 204, 0, 0.18)"; else this.ctx.fillStyle = i % 2 === 0 ? "rgba(18, 34, 50, 0.9)" : "rgba(10, 24, 30, 0.9)";
            this.ctx.fillRect(4, y - 12, w - 8, row_h - 2);
            if (hover && hover === r) this.ctx.strokeStyle = "#ffdb4d"; else this.ctx.strokeStyle = selected ? "#f4c542" : "#213d46";
            this.ctx.strokeRect(4, y - 12, w - 8, row_h - 2);
            this.ctx.fillStyle = selected ? "#fff3b0" : "#dfeef7";
            let cx = start_x;
            this.ctx.fillText(String(r.no), cx, y);
            cx += col_w[0]; this.ctx.fillText(r.time, cx, y);
            cx += col_w[1]; this.ctx.fillText(r.src, cx, y);
            cx += col_w[2]; this.ctx.fillText(r.dst, cx, y);
            cx += col_w[3]; this.ctx.fillText(r.protocol, cx, y);
            cx += col_w[4]; let info = r.info || ""; if (r.flag && r.flag_value) {
                let index = info.indexOf(r.flag_value);
                if (index >= 0) {
                    let prefix = info.slice(0, index), suffix = info.slice(index + r.flag_value.length), x0 = cx, width_prefix = this.ctx.measureText(prefix).width;
                    this.ctx.fillStyle = "#dfeef7"; this.ctx.fillText(prefix, x0, y);
                    let x1 = x0 + width_prefix;
                    this.ctx.fillStyle = "#ffde59"; this.ctx.fillText(r.flag_value, x1, y);
                    this.ctx.fillStyle = "#dfeef7"; this.ctx.fillText(suffix, x1 + this.ctx.measureText(r.flag_value).width, y);
                } else {
                    this.ctx.fillStyle = selected ? "#fff3b0" : "#dfeef7"; this.ctx.fillText(info, cx, y);
                }
            } else {
                this.ctx.fillStyle = selected ? "#fff3b0" : "#dfeef7"; this.ctx.fillText(info, cx, y);
            }
        }
        if (hover && hover.flag) {
            let box_w = 440, box_h = 110, box_x = Math.min(w - box_w - 20, 30), box_y = Math.max(24, h - 150);
            this.ctx.fillStyle = "rgba(6, 18, 24, 0.94)";
            this.ctx.fillRect(box_x, box_y, box_w, box_h);
            this.ctx.strokeStyle = "#ffe070";
            this.ctx.strokeRect(box_x, box_y, box_w, box_h);
            this.ctx.fillStyle = "#fff6b2"; this.ctx.font = "bold 12px monospace"; this.ctx.fillText("Flag pointer: " + hover.flag_value, box_x + 12, box_y + 22);
            this.ctx.fillStyle = "#dfeef7"; this.ctx.font = "11px monospace"; for (let i = 0; i < this.viewer_steps.length; i++) {
                this.ctx.fillText(this.viewer_steps[i], box_x + 12, box_y + 44 + i * 15);
            }
        }
    }
};