const pcap = {
  f: null,
  r: null,
  u: null,
  use_image: false,
  input_fieldset: null,
  canvas_el: null,
  ctx: null,
  b: null,
  buffer: null,
  cached_rumors: null,
  viewer_rows: [],
  viewer_steps: [],
  active_variant: '',
  active_flag: '',

  init(canvas_el, ctx) {
    let c = document.querySelector('#input_box').parentElement, p = document.querySelector('.options-window .window-body'), r = document.createElement('fieldset'), u = document.createElement('fieldset'), o = document.createElement('div'), d = document.createElement('select'), h = document.createElement('select'), i = document.createElement('input'), l = document.createElement('button'), n = document.createElement('span'), q = document.createElement('input'), y = document.createElement('input'), z = document.createElement('textarea'), s = document.createElement('input'), a = document.createElement('label'), v = document.createElement('label'), x = document.createElement('label'), e = document.createElement('label'), w = document.createElement('label'), g = document.createElement('label');
    this.canvas_el = canvas_el;
    this.ctx = ctx;
    this.input_fieldset = c;
    this.r = r;
    this.u = u;
    this.f = i;
    u.style.cssText = 'display:none;align-items:center;gap:8px;flex-wrap:wrap;';
    u.className = 'mb-5';
    i.type = 'file';
    i.accept = '.txt,.json,.bin,.pcap';
    i.style.display = 'none';
    l.type = 'button';
    l.textContent = 'Upload File';
    l.onclick = () => i.click();
    n.textContent = 'No file selected';
    i.onchange = (ev) => {
      let file = ev.target.files[0];
      if (!file) return;
      let reader = new FileReader();
      n.textContent = file.name;
      reader.onload = (res) => {
        this.file_text = String(res.target.result || '').trim();
        this.use_image = Boolean(this.file_text);
        if (window.generate_grid) window.generate_grid();
      };
      reader.readAsText(file);
    };
    u.append(l, n);
    c.parentElement.insertBefore(u, c.nextSibling);
    r.className = 'mb-5 w-100';
    r.style.cssText = 'display:none;width:100%;margin-top:8px;';
    d.className = 'mb-5 w-100';
    d.innerHTML = '<option value="easy">Easy (Plaintext)</option><option value="intermediate">Intermediate (Encoded / Split)</option><option value="hard">Hard (Header Stego / Covert)</option>';
    d.onchange = () => {
      this.difficulty = d.value;
      this._set_hint_options();
      if (window.generate_grid) window.generate_grid();
    };
    this.difficulty_select = d;
    a.textContent = 'Difficulty:';
    v.textContent = 'Look for:';
    h.className = 'mb-5 w-100';
    this.hint_select = h;
    h.onchange = () => { if (window.generate_grid) window.generate_grid(); };
    x.textContent = 'Packet count / file length:';
    y.type = 'number';
    y.min = '12';
    y.max = '512';
    y.value = '48';
    y.className = 'w-100';
    y.onchange = () => { if (window.generate_grid) window.generate_grid(); };
    q.type = 'checkbox';
    q.checked = true;
    q.id = 'pcap-cascadia';
    q.onchange = () => { if (window.generate_grid) window.generate_grid(); };
    e.textContent = 'Use Cascadia news/rumours';
    e.htmlFor = q.id;
    g.style.cssText = 'display:flex;align-items:center;gap:8px;';
    g.append(q, e);
    z.className = 'w-100';
    z.rows = '3';
    z.placeholder = 'Custom noise lines';
    z.oninput = () => { if (window.generate_grid) window.generate_grid(); };
    w.textContent = 'Corruption:';
    s.type = 'range';
    s.min = '0';
    s.max = '100';
    s.step = '1';
    s.value = '25';
    s.className = 'w-100';
    s.oninput = () => { if (window.generate_grid) window.generate_grid(); };
    o.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    o.append(a, d, v, h, x, y, g, z, w, s);
    r.appendChild(o);
    if (p) p.appendChild(r);
    this.noise_input = y;
    this.cascadia_cb = q;
    this.custom_noise = z;
    this.corruption_sld = s;
    this.file_text = '';
    this.difficulty = d.value;
    this._set_hint_options();
  },

  _variants() {
    return {
      easy: [
        ['random', 'Random (Any Easy Variant)'],
        ['http-auth', 'HTTP 200 OK Header'],
        ['ftp-transfer', 'FTP File Transfer'],
        ['irc-chat', 'IRC Channel Chatter'],
        ['smtp-mail', 'SMTP Email Body'],
        ['dns-txt', 'DNS TXT Response']
      ],
      intermediate: [
        ['random', 'Random (Any Intermediate Variant)'],
        ['http-b64', 'HTTP Base64 Token'],
        ['dns-exfil', 'DNS Subdomain Hex Chunks'],
        ['icmp-carve', 'ICMP Ping Sequence'],
        ['sip-digest', 'SIP Auth Nonce / SDP'],
        ['tcp-reassemble', 'TCP Segmented Hex Stream']
      ],
      hard: [
        ['random', 'Random (Any Hard Variant)'],
        ['ip-id', 'IPv4 Identification Stego'],
        ['ip-ttl', 'IPv4 TTL Covert Channel'],
        ['tcp-urg', 'TCP Urgent Pointer Stego'],
        ['xor-otp', 'UDP XOR Key-Stream Pair'],
        ['port-knock', 'UDP Source Port Knocking']
      ]
    };
  },

  _set_hint_options() {
    if (!this.hint_select) return;
    let list = this._variants()[this.difficulty] || this._variants().easy;
    this.hint_select.innerHTML = '';
    for (let i = 0; i < list.length; i++) {
      let opt = document.createElement('option');
      opt.value = list[i][0];
      opt.textContent = list[i][1];
      this.hint_select.appendChild(opt);
    }
  },

  show() {
    if (this.r) this.r.style.display = 'block';
    if (this.u) this.u.style.display = 'flex';
  },
  hide() {
    if (this.r) this.r.style.display = 'none';
    if (this.u) this.u.style.display = 'none';
  },
  set_image_mode(enabled) {
    this.use_image = enabled;
    this.show();
  },
  generate(t) { return this.gen(t); },
  _str(v) { return String(v || ''); },
  _u8(s) { return new TextEncoder().encode(this._str(s)); },
  _hex(v) { return Array.from(this._u8(v)).map(b => b.toString(16).padStart(2, '0')).join(''); },
  _b64(v) { return btoa(unescape(encodeURIComponent(this._str(v)))); },
  _ip32(v) {
    let a = this._str(v).split('.').map(x => parseInt(x, 10) || 0);
    return ((a[0] << 24) | (a[1] << 16) | (a[2] << 8) | a[3]) >>> 0;
  },
  _csum(b) {
    let s = 0;
    for (let i = 0; i < b.length; i += 2) s += (b[i] << 8) + (i + 1 < b.length ? b[i + 1] : 0);
    while (s > 0xffff) s = (s & 0xffff) + (s >>> 16);
    return (~s) & 0xffff;
  },
  _m8(v) { return new Uint8Array(v.split(':').map(x => parseInt(x, 16) || 0)); },
  _dns_name(s) {
    let o = [], k = this._str(s).replace(/^\.+|\.+$/g, '').split('.');
    for (let i = 0; i < k.length; i++) {
      let p = k[i].slice(0, 63);
      if (!p) continue;
      o.push(p.length);
      for (let j = 0; j < p.length; j++) o.push(p.charCodeAt(j));
    }
    o.push(0);
    return new Uint8Array(o);
  },

  _corrupt(s, p) {
    let o = '', x = this._str(s), y = '@#$%&*+=/\\|~^!?<>[]{}', v = Math.max(0, Math.min(1, Number(p || 0) / 100));
    if (v <= 0) return x;
    for (let i = 0; i < x.length; i++) {
      let c = x[i];
      o += (c !== '\n' && c !== '\r' && Math.random() < v) ? y[Math.floor(Math.random() * y.length)] : c;
    }
    return o;
  },

  _parse_cascadia(raw) {
    let out = [], lines = this._str(raw).split(/\r?\n/), skip = false;
    for (let i = 0; i < lines.length; i++) {
      let ln = lines[i].trim();
      if (!ln || ln === '.') { skip = false; continue; }
      if (/^\[\d{4}-\d{2}-\d{2}\s/.test(ln)) { skip = false; continue; }
      if (/^\{(Attachments|Reactions|Embed)\}/i.test(ln)) { skip = true; continue; }
      if (skip || /^https?:\/\//i.test(ln)) continue;
      let clean = ln.replace(/[*_~`]+/g, '').replace(/\s+/g, ' ').trim();
      if (clean.length >= 12) out.push(clean);
    }
    return out;
  },

  async _noise() {
    let n = [];
    if (this.cascadia_cb && this.cascadia_cb.checked) {
      if (!this.cached_rumors || !this.cached_rumors.length) {
        let base = "json/CPU - Weaver's Webway - news-rumors-cascadia-ic [982709436881723442]";
        let urls = [encodeURI(base + '.json'), encodeURI(base), 'json/' + encodeURIComponent(base.slice(5) + '.json'), 'json/' + encodeURIComponent(base.slice(5))];
        for (let i = 0; i < urls.length; i++) {
          try {
            let r = await fetch(urls[i]);
            if (r && r.ok) {
              let parsed = this._parse_cascadia(await r.text());
              if (parsed.length) { this.cached_rumors = parsed; break; }
            }
          } catch (e) {}
        }
      }
      if (this.cached_rumors && this.cached_rumors.length) n = n.concat(this.cached_rumors);
    }
    if (this.custom_noise && this.custom_noise.value) {
      n = n.concat(this.custom_noise.value.split(/\r?\n/).map(x => x.trim()).filter(Boolean));
    }
    if (!n.length) n = ['Cascadia sector 4 relay heartbeat', 'Webway node sync drift', 'Harbor subnet routing update', 'Spire telemetry collector ack'];
    return n;
  },

  _eth(smac, dmac, proto, payload) {
    let b = new Uint8Array(14 + payload.length), v = new DataView(b.buffer);
    for (let i = 0; i < 6; i++) { b[i] = dmac[i]; b[i + 6] = smac[i]; }
    v.setUint16(12, proto, false);
    b.set(payload, 14);
    return b;
  },

  _ipv4(sip, dip, proto, payload, id = 0, ttl = 64) {
    let b = new Uint8Array(20 + payload.length), v = new DataView(b.buffer);
    v.setUint8(0, 0x45);
    v.setUint16(2, 20 + payload.length, false);
    v.setUint16(4, id & 0xffff, false);
    v.setUint16(6, 0x4000, false);
    v.setUint8(8, ttl & 0xff);
    v.setUint8(9, proto);
    v.setUint32(12, this._ip32(sip), false);
    v.setUint32(16, this._ip32(dip), false);
    v.setUint16(10, this._csum(b.subarray(0, 20)), false);
    b.set(payload, 20);
    return b;
  },

  _l4_csum(sip, dip, proto, seg) {
    let b = new Uint8Array(12 + seg.length), d = new DataView(b.buffer);
    d.setUint32(0, this._ip32(sip), false);
    d.setUint32(4, this._ip32(dip), false);
    d.setUint8(9, proto);
    d.setUint16(10, seg.length, false);
    b.set(seg, 12);
    return this._csum(b);
  },

  _tcp(sip, dip, smac, dmac, sport, dport, seq, ack, flags, payload, id = 0, urg = 0, ttl = 64) {
    let p = payload instanceof Uint8Array ? payload : this._u8(payload), h = new Uint8Array(20 + p.length), v = new DataView(h.buffer);
    v.setUint16(0, sport, false);
    v.setUint16(2, dport, false);
    v.setUint32(4, seq >>> 0, false);
    v.setUint32(8, ack >>> 0, false);
    v.setUint8(12, 0x50);
    v.setUint8(13, flags);
    v.setUint16(14, 0x4000, false);
    v.setUint16(18, urg & 0xffff, false);
    h.set(p, 20);
    v.setUint16(16, this._l4_csum(sip, dip, 6, h), false);
    return this._eth(smac, dmac, 0x0800, this._ipv4(sip, dip, 6, h, id, ttl));
  },

  _udp(sip, dip, smac, dmac, sport, dport, payload, id = 0, ttl = 64) {
    let p = payload instanceof Uint8Array ? payload : this._u8(payload), h = new Uint8Array(8 + p.length), v = new DataView(h.buffer);
    v.setUint16(0, sport, false);
    v.setUint16(2, dport, false);
    v.setUint16(4, 8 + p.length, false);
    h.set(p, 8);
    v.setUint16(6, this._l4_csum(sip, dip, 17, h), false);
    return this._eth(smac, dmac, 0x0800, this._ipv4(sip, dip, 17, h, id, ttl));
  },

  _icmp(type, code, id, seq, sip, dip, smac, dmac, payload, ip_id = 0, ttl = 64) {
    let p = payload instanceof Uint8Array ? payload : this._u8(payload), h = new Uint8Array(8 + p.length), v = new DataView(h.buffer);
    v.setUint8(0, type);
    v.setUint8(1, code);
    v.setUint16(4, id & 0xffff, false);
    v.setUint16(6, seq & 0xffff, false);
    h.set(p, 8);
    v.setUint16(2, this._csum(h), false);
    return this._eth(smac, dmac, 0x0800, this._ipv4(sip, dip, 1, h, ip_id, ttl));
  },

  _dns_q(id, qname, qtype, sip, dip, smac, dmac, ip_id) {
    let q = this._dns_name(qname), b = new Uint8Array(16 + q.length), v = new DataView(b.buffer);
    v.setUint16(0, id, false);
    v.setUint16(2, 0x0100, false);
    v.setUint16(4, 1, false);
    b.set(q, 12);
    v.setUint16(12 + q.length, qtype, false);
    v.setUint16(14 + q.length, 1, false);
    return this._udp(sip, dip, smac, dmac, 53100 + (id & 0xff), 53, b, ip_id);
  },

  _dns_r(id, qname, txt, sip, dip, smac, dmac, ip_id) {
    let q = this._dns_name(qname), t = this._u8(txt.slice(0, 250)), b = new Uint8Array(29 + q.length + t.length), v = new DataView(b.buffer);
    v.setUint16(0, id, false);
    v.setUint16(2, 0x8180, false);
    v.setUint16(4, 1, false);
    v.setUint16(6, 1, false);
    b.set(q, 12);
    v.setUint16(12 + q.length, 16, false);
    v.setUint16(14 + q.length, 1, false);
    let o = 16 + q.length;
    b[o] = 0xc0;
    b[o + 1] = 0x0c;
    v.setUint16(o + 2, 16, false);
    v.setUint16(o + 4, 1, false);
    v.setUint32(o + 6, 120, false);
    v.setUint16(o + 10, t.length + 1, false);
    b[o + 12] = t.length;
    b.set(t, o + 13);
    return this._udp(dip, sip, dmac, smac, 53, 53100 + (id & 0xff), b, ip_id);
  },

  _build_puzzle(mode, flag, m1, m2, m3) {
    let pkts = [], steps = [], label = mode, b64 = this._b64(flag), hex = this._hex(flag), u8 = this._u8(flag);
    if (mode === 'http-auth') {
      label = 'HTTP 200 OK Header';
      steps = ['1. Filter Wireshark by: http', '2. Find the HTTP/1.1 200 OK response from 203.0.113.10.', '3. Read the X-Flag header or JSON body for the flag.'];
      pkts.push(this._tcp('203.0.113.10', '10.10.20.14', m2, m1, 80, 51420, 1, 100, 0x18, 'HTTP/1.1 200 OK\r\nX-Flag: ' + flag + '\r\n\r\n{"flag":"' + flag + '"}', 0x302));
    } else if (mode === 'ftp-transfer') {
      label = 'FTP File Transfer';
      steps = ['1. Filter Wireshark by: ftp-data || tcp.port == 20', '2. Locate the file transfer from 10.10.20.66.', '3. Read the plaintext flag inside the packet payload.'];
      pkts.push(this._tcp('10.10.20.66', '10.10.20.22', m2, m1, 20, 49201, 500, 1, 0x18, 'RETR clearance_key.txt -> ' + flag + '\r\n', 0x314));
    } else if (mode === 'irc-chat') {
      label = 'IRC Channel Chatter';
      steps = ['1. Filter Wireshark by: irc || tcp.port == 6667', '2. Inspect the PRIVMSG sent to #weavers-ops.', '3. Read the plaintext flag at the end of the message.'];
      pkts.push(this._tcp('10.10.20.31', '10.10.20.99', m1, m3, 52667, 6667, 100, 80, 0x18, 'PRIVMSG #weavers-ops :Active key is ' + flag + '\r\n', 0x322));
    } else if (mode === 'smtp-mail') {
      label = 'SMTP Email Body';
      steps = ['1. Filter Wireshark by: smtp || tcp.port == 25', '2. Select the email DATA packet from 10.10.20.44.', '3. Read the email body text for the flag.'];
      pkts.push(this._tcp('10.10.20.44', '10.10.20.25', m1, m2, 50025, 25, 74, 30, 0x18, 'Subject: Override\r\n\r\nAuth token: ' + flag + '\r\n.\r\n', 0x332));
    } else if (mode === 'dns-txt') {
      label = 'DNS TXT Response';
      steps = ['1. Filter Wireshark by: dns.qry.type == 16', '2. Find the DNS response for _token.webway.cascadia.net.', '3. Read the TXT record string in the Answers section.'];
      pkts.push(this._dns_r(0x4a21, '_token.webway.cascadia.net', flag, '10.10.20.18', '10.10.20.250', m1, m3, 0x341));
    } else if (mode === 'http-b64') {
      label = 'HTTP Base64 Token';
      steps = ['1. Filter Wireshark by: http', '2. Copy the Bearer string from the GET /vault/telemetry packet.', '3. Base64-decode "' + b64 + '" to get the flag.'];
      pkts.push(this._tcp('10.10.20.19', '198.51.100.42', m1, m2, 54080, 80, 500, 1, 0x18, 'GET /vault/telemetry HTTP/1.1\r\nAuthorization: Bearer ' + b64 + '\r\n\r\n', 0x401));
    } else if (mode === 'dns-exfil') {
      label = 'DNS Subdomain Hex Chunks';
      steps = ['1. Filter by: dns.qry.name contains "exfil.cascadia.net"', '2. Combine the hex subdomains (p0, p1, p2...) in order.', '3. Hex-decode "' + hex + '" to get the flag.'];
      for (let i = 0; i < hex.length; i += 16) {
        let idx = Math.floor(i / 16);
        pkts.push(this._dns_q(0x7100 + idx, 'p' + idx + '.' + hex.slice(i, i + 16) + '.exfil.cascadia.net', 16, '10.10.20.7', '10.10.20.250', m1, m3, 0x410 + idx));
      }
    } else if (mode === 'icmp-carve') {
      label = 'ICMP Ping Sequence';
      steps = ['1. Filter by: icmp && ip.src == 10.10.20.77', '2. Order the Echo Requests by Sequence Number (100, 101...).', '3. Join the text chunks after "SYNC|" to form the flag.'];
      for (let i = 0; i < flag.length; i += 6) {
        let idx = Math.floor(i / 6);
        pkts.push(this._icmp(8, 0, 0x2200, 100 + idx, '10.10.20.77', '10.10.20.250', m1, m3, 'SYNC|' + flag.slice(i, i + 6), 0x430 + idx));
      }
    } else if (mode === 'sip-digest') {
      label = 'SIP Auth Nonce / SDP';
      steps = ['1. Filter Wireshark by: sip || udp.port == 5060', '2. Inspect the INVITE Authorization header or SDP body.', '3. Hex-decode nonce="' + hex + '" (or Base64-decode response).'];
      pkts.push(this._udp('10.10.20.12', '10.10.20.20', m1, m3, 5060, 5060, 'INVITE sip:op@cascadia.net SIP/2.0\r\nAuthorization: Digest nonce="' + hex + '", response="' + b64 + '"\r\n\r\n', 0x450));
    } else if (mode === 'tcp-reassemble') {
      label = 'TCP Segmented Hex Stream';
      steps = ['1. Filter Wireshark by: tcp.port == 8443', '2. Follow TCP Stream and join the "frag" hex strings in order.', '3. Hex-decode "' + hex + '" into ASCII.'];
      let seq = 1000;
      for (let i = 0; i < hex.length; i += 12) {
        let idx = Math.floor(i / 12), frag = '{"part":' + idx + ',"frag":"' + hex.slice(i, i + 12) + '"}\n';
        pkts.push(this._tcp('10.10.20.55', '10.10.20.88', m1, m2, 58443, 8443, seq, 1, 0x18, frag, 0x460 + idx));
        seq += frag.length;
      }
    } else if (mode === 'ip-id') {
      label = 'IPv4 Identification Stego';
      steps = ['1. Filter by: ip.src == 10.10.30.9 && tcp.dstport == 443', '2. Inspect the IPv4 Identification (ip.id) field of each SYN packet.', '3. Convert the low byte of each ip.id (0x1300 + char) from ASCII.'];
      for (let i = 0; i < u8.length; i++) pkts.push(this._tcp('10.10.30.9', '10.10.40.9', m2, m1, 41000 + i, 443, 9000 + i, 0, 0x02, 'SYN-' + i, 0x1300 | u8[i]));
    } else if (mode === 'ip-ttl') {
      label = 'IPv4 TTL Covert Channel';
      steps = ['1. Filter by: ip.src == 10.10.30.17 && udp.dstport == 33434', '2. Check the IPv4 Time-to-Live (ip.ttl) value of each UDP packet.', '3. Convert the sequence of TTL numbers from decimal ASCII to text.'];
      for (let i = 0; i < u8.length; i++) pkts.push(this._udp('10.10.30.17', '10.10.40.17', m2, m1, 45000 + i, 33434, 'HOP-' + i, 0x520 + i, u8[i]));
    } else if (mode === 'tcp-urg') {
      label = 'TCP Urgent Pointer Stego';
      steps = ['1. Filter by: tcp.dstport == 9001 && tcp.flags.urg == 1', '2. Inspect the TCP Urgent Pointer field in each packet.', '3. Convert the Urgent Pointer decimal values from ASCII to text.'];
      for (let i = 0; i < u8.length; i++) pkts.push(this._tcp('10.10.30.25', '10.10.40.25', m1, m2, 59000 + i, 9001, 2000 + i, 1, 0x30, 'URG-' + i, 0x550 + i, u8[i]));
    } else if (mode === 'xor-otp') {
      label = 'UDP XOR Key-Stream Pair';
      steps = ['1. Filter Wireshark by: udp.port == 9999', '2. Copy the hex string after OTP_KEY= and after OTP_CIPHER=.', '3. XOR the two hex strings together to reveal the flag.'];
      let key = [], enc = [];
      for (let i = 0; i < u8.length; i++) {
        let k = (0x5a + ((i * 19) & 0x3f)) & 0xff;
        key.push(k.toString(16).padStart(2, '0'));
        enc.push((u8[i] ^ k).toString(16).padStart(2, '0'));
      }
      pkts.push(this._udp('10.10.30.40', '10.10.40.40', m1, m3, 49999, 9999, 'OTP_KEY=' + key.join('') + ' | OTP_CIPHER=' + enc.join(''), 0x580));
    } else {
      label = 'UDP Source Port Knocking';
      steps = ['1. Filter Wireshark by: udp.dstport == 1337', '2. Read the UDP Source Port (udp.srcport) on each packet.', '3. Subtract 10000 from each source port and convert ASCII to text.'];
      for (let i = 0; i < u8.length; i++) pkts.push(this._udp('10.10.30.77', '10.10.40.77', m2, m3, 10000 + u8[i], 1337, 'KNOCK-' + (i + 1), 0x5a0 + i));
    }
    return { pkts, steps, label };
  },

  _pcap(items) {
    let n = 24 + items.reduce((a, x) => a + 16 + x.pkt.length, 0), ba = new ArrayBuffer(n), v = new DataView(ba), o = 24;
    let sec = Math.floor(Date.now() / 1000) - 600, usec = 120000;
    v.setUint32(0, 0xa1b2c3d4, true);
    v.setUint16(4, 2, true);
    v.setUint16(6, 4, true);
    v.setUint32(16, 65535, true);
    v.setUint32(20, 1, true);
    for (let i = 0; i < items.length; i++) {
      let p = items[i].pkt, l = p.length;
      usec += 15000 + Math.floor(Math.random() * 45000);
      if (usec >= 1000000) { sec += 1; usec -= 1000000; }
      v.setUint32(o, sec, true);
      v.setUint32(o + 4, usec, true);
      v.setUint32(o + 8, l, true);
      v.setUint32(o + 12, l, true);
      new Uint8Array(ba, o + 16, l).set(p);
      o += 16 + l;
    }
    return ba;
  },

  _decode_ascii(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
      let b = bytes[i];
      out += (b >= 32 && b < 127) ? String.fromCharCode(b) : ' ';
    }
    return out.replace(/\s+/g, ' ').trim();
  },

  _summary(pkt) {
    if (!pkt || pkt.length < 34) return { src: '0.0.0.0', dst: '0.0.0.0', protocol: 'RAW', info: 'Frame' };
    let ip = pkt.subarray(14), ihl = (ip[0] & 0x0f) * 4, proto = ip[9], ttl = ip[8], ip_id = (ip[4] << 8) | ip[5];
    let src = [ip[12], ip[13], ip[14], ip[15]].join('.'), dst = [ip[16], ip[17], ip[18], ip[19]].join('.'), l4 = ip.subarray(ihl);
    if (proto === 6 && l4.length >= 20) {
      let sp = (l4[0] << 8) | l4[1], dp = (l4[2] << 8) | l4[3], fl = l4[13], urg = (l4[18] << 8) | l4[19], txt = this._decode_ascii(l4.subarray(20));
      let p = (sp === 80 || dp === 80) ? 'HTTP' : (sp === 21 || dp === 21 || sp === 20 || dp === 20) ? 'FTP' : (sp === 6667 || dp === 6667) ? 'IRC' : (sp === 25 || dp === 25) ? 'SMTP' : 'TCP';
      let extra = (fl & 0x20) ? '[URG=' + urg + '] ' : (fl === 0x02) ? '[ID=0x' + ip_id.toString(16) + '] ' : '';
      return { src, dst, protocol: p, info: sp + '->' + dp + ' ' + extra + txt };
    }
    if (proto === 17 && l4.length >= 8) {
      let sp = (l4[0] << 8) | l4[1], dp = (l4[2] << 8) | l4[3], data = l4.subarray(8), txt = this._decode_ascii(data);
      if (sp === 53 || dp === 53) {
        let qn = '', off = 12;
        while (off < data.length && data[off] > 0 && data[off] < 64) {
          let ln = data[off];
          qn += (qn ? '.' : '') + this._decode_ascii(data.subarray(off + 1, off + 1 + ln));
          off += 1 + ln;
        }
        let rest = this._decode_ascii(data.subarray(off + 5));
        return { src, dst, protocol: 'DNS', info: (dp === 53 ? 'Q: ' : 'TXT: ') + qn + (rest ? ' ' + rest : '') };
      }
      return { src, dst, protocol: (sp === 5060 || dp === 5060) ? 'SIP' : 'UDP', info: sp + '->' + dp + ' [TTL=' + ttl + '] ' + txt };
    }
    if (proto === 1 && l4.length >= 8) {
      return { src, dst, protocol: 'ICMP', info: 'Seq=' + ((l4[6] << 8) | l4[7]) + ' ' + this._decode_ascii(l4.subarray(8)) };
    }
    return { src, dst, protocol: 'IPv4', info: 'proto=' + proto };
  },

  async gen(t) {
    let raw = (this.use_image && this.file_text) ? this.file_text : this._str(t || '');
    let flag = raw.trim() || 'FLAG{packet_sniffing_forensics}';
    this.active_flag = flag;
    let d = this.difficulty_select ? this.difficulty_select.value : 'easy';
    let sel = this.hint_select ? this.hint_select.value : 'random';
    let pool = (this._variants()[d] || this._variants().easy).slice(1).map(x => x[0]);
    let mode = (sel === 'random' || !pool.includes(sel)) ? pool[Math.floor(Math.random() * pool.length)] : sel;
    let n = Math.max(12, Math.min(512, Number(this.noise_input ? this.noise_input.value : 48) || 48));
    let corr = Number(this.corruption_sld ? this.corruption_sld.value : 25);
    let noise = await this._noise();
    let m1 = this._m8('00:16:3e:44:55:66'), m2 = this._m8('00:50:56:88:99:aa'), m3 = this._m8('00:1b:21:cc:dd:ee');
    let built = this._build_puzzle(mode, flag, m1, m2, m3);
    this.viewer_steps = built.steps;
    this.active_variant = built.label;
    let decoys = [], domains = ['node.cascadia.net', 'grid.cascadia.net', 'relay.webway.local', 'auth.spire.internal'];
    let offset = Math.floor(Math.random() * noise.length);
    for (let i = 0; i < n; i++) {
      let rumor = noise[(offset + i * 3) % noise.length] || 'Cascadia relay signal', msg = this._corrupt(rumor, corr), kind = i % 3, p;
      let sip = '10.10.12.' + ((i % 40) + 2), dip = '10.10.18.' + ((i % 30) + 5);
      if (kind === 0) p = this._udp(sip, dip, m2, m3, 5514, 514, msg, 0xa00 + i);
      else if (kind === 1) p = this._tcp(sip, dip, m1, m2, 40000 + i, 80, 5000 + i * 64, 1, 0x18, 'POST /rumor HTTP/1.1\r\n\r\n' + msg, 0x900 + i);
      else p = this._icmp(8, 0, 0x0400, i + 1, sip, '10.10.20.250', m1, m3, msg.slice(0, 72), 0xb00 + i);
      decoys.push({ pkt: p, flag: false });
    }
    let mid = Math.floor(decoys.length / 2);
    let items = decoys.slice(0, mid).concat(built.pkts.map(p => ({ pkt: p, flag: true })), decoys.slice(mid));
    let first_flag = items.findIndex(x => x.flag);
    let win_start = Math.max(0, Math.min(items.length - 6, first_flag - 2));
    let slice = items.slice(win_start, win_start + 6);
    this.viewer_rows = slice.map((it, idx) => {
      let s = this._summary(it.pkt), no = win_start + idx + 1;
      return { no, time: (no * 0.04).toFixed(2), src: s.src, dst: s.dst, proto: s.protocol, info: s.info, flag: it.flag };
    });
    this.buffer = this._pcap(items);
    this.b = new Blob([this.buffer], { type: 'application/vnd.tcpdump.pcap' });
    return this.buffer;
  },

  save() {
    if (!this.buffer) return;
    let u = URL.createObjectURL(this.b || new Blob([this.buffer], { type: 'application/vnd.tcpdump.pcap' })), a = document.createElement('a');
    a.href = u;
    a.download = 'challenge.pcap';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 0);
  },

  _clip(txt, max_w) {
    let s = this._str(txt);
    if (this.ctx.measureText(s).width <= max_w) return s;
    while (s.length > 0 && this.ctx.measureText(s + '...').width > max_w) s = s.slice(0, -1);
    return s + '...';
  },

  _bevel(x, y, w, h, sunken) {
    let ctx = this.ctx;
    ctx.strokeStyle = sunken ? '#808080' : '#ffffff';
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
    ctx.strokeStyle = sunken ? '#ffffff' : '#808080';
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y); ctx.stroke();
  },

  draw() {
    if (!this.ctx || !this.canvas_el) return;
    if (this.canvas_el.width !== 740 || this.canvas_el.height !== 265) {
      this.canvas_el.width = 740;
      this.canvas_el.height = 265;
    }
    let w = this.canvas_el.width, h = this.canvas_el.height, ctx = this.ctx;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, w, h);
    this._bevel(1, 1, w - 2, h - 2, false);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 10, w - 20, 142);
    this._bevel(10, 10, w - 20, 142, true);

    ctx.fillStyle = '#dfdfdf';
    ctx.fillRect(11, 11, w - 22, 18);
    this._bevel(11, 11, w - 22, 18, false);

    let cols = [38, 48, 96, 96, 48], headers = ['No.', 'Time', 'Source', 'Destination', 'Proto', 'Info'], hx = 16;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 11px Tahoma, sans-serif';
    for (let i = 0; i < headers.length; i++) {
      ctx.fillText(headers[i], hx, 24);
      hx += cols[i] || 0;
    }

    ctx.font = '11px monospace';
    for (let i = 0; i < this.viewer_rows.length; i++) {
      let r = this.viewer_rows[i], ry = 31 + i * 19;
      if (r.flag) {
        ctx.fillStyle = '#000080';
        ctx.fillRect(12, ry, w - 24, 18);
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#000000';
      }
      let rx = 16, vals = [String(r.no), r.time, r.src, r.dst, r.proto];
      for (let j = 0; j < vals.length; j++) {
        ctx.fillText(vals[j], rx, ry + 13);
        rx += cols[j];
      }
      ctx.fillText(this._clip((r.flag ? '[FLAG] ' : '') + r.info, w - rx - 18), rx, ry + 13);
    }

    this._bevel(10, 162, w - 20, 93, true);
    ctx.fillStyle = '#000080';
    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.fillText('How to Solve (' + (this.active_variant || 'PCAP') + ')  —  Flag: ' + (this.active_flag || ''), 18, 178);

    ctx.fillStyle = '#000000';
    ctx.font = '11px Tahoma, sans-serif';
    for (let i = 0; i < this.viewer_steps.length; i++) {
      ctx.fillText(this._clip(this.viewer_steps[i], w - 36), 18, 198 + i * 18);
    }
  }
};