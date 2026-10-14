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

  init(canvas_el, ctx) {
    let c = document.querySelector('#input_box').parentElement, p = document.querySelector('.options-window .window-body'), r = document.createElement('fieldset'), u = document.createElement('fieldset'), o = document.createElement('div'), d = document.createElement('select'), h = document.createElement('select'), i = document.createElement('input'), l = document.createElement('button'), n = document.createElement('span'), q = document.createElement('input'), y = document.createElement('input'), z = document.createElement('textarea'), s = document.createElement('input'), a = document.createElement('label'), v = document.createElement('label'), x = document.createElement('label'), e = document.createElement('label'), w = document.createElement('label'), g = document.createElement('label');
    this.canvas_el = canvas_el;
    this.ctx = ctx;
    this.input_fieldset = c;
    this.r = r;
    this.u = u;
    this.f = i;
    this.viewer_rows = [];
    this.viewer_hover = -1;
    this.viewer_pin = -1;
    this.viewer_steps = [];
    this.active_variant = '';
    this.active_filter = '';
    if (canvas_el) {
      canvas_el.addEventListener('mousemove', (ev) => {
        if (current_cipher !== this || !this.viewer_rows.length) return;
        let rect = canvas_el.getBoundingClientRect(), mx = ((ev.clientX - rect.left) / rect.width) * canvas_el.width, my = ((ev.clientY - rect.top) / rect.height) * canvas_el.height;
        let hit = this._viewer_hit(mx, my);
        this.viewer_hover = hit;
        canvas_el.style.cursor = hit >= 0 ? 'pointer' : 'default';
      });
      canvas_el.addEventListener('click', (ev) => {
        if (current_cipher !== this || !this.viewer_rows.length) return;
        let rect = canvas_el.getBoundingClientRect(), mx = ((ev.clientX - rect.left) / rect.width) * canvas_el.width, my = ((ev.clientY - rect.top) / rect.height) * canvas_el.height;
        let hit = this._viewer_hit(mx, my);
        if (hit >= 0) this.viewer_pin = hit;
      });
      canvas_el.addEventListener('mouseleave', () => {
        if (current_cipher !== this) return;
        this.viewer_hover = -1;
        canvas_el.style.cursor = 'default';
      });
    }
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
    d.innerHTML = '<option value="easy">Easy (Plaintext Protocols)</option><option value="intermediate">Intermediate (Encoded & Split)</option><option value="hard">Hard (Stego & Covert Channels)</option>';
    d.onchange = () => {
      this.difficulty = d.value;
      this._set_hint_options();
      if (window.generate_grid) window.generate_grid();
    };
    this.difficulty_select = d;
    a.textContent = 'Difficulty:';
    v.textContent = 'Look for / Variant:';
    h.className = 'mb-5 w-100';
    this.hint_select = h;
    h.onchange = () => {
      this.viewer_target = h.value;
      if (window.generate_grid) window.generate_grid();
    };
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
    w.textContent = 'Corruption (25%):';
    s.type = 'range';
    s.min = '0';
    s.max = '100';
    s.step = '1';
    s.value = '25';
    s.className = 'w-100';
    s.oninput = () => {
      w.textContent = 'Corruption (' + s.value + '%):';
      if (window.generate_grid) window.generate_grid();
    };
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
        ['http-auth', 'HTTP 200 OK Header & Body'],
        ['ftp-transfer', 'FTP Cleartext File Transfer'],
        ['irc-chat', 'IRC Operator Channel Chatter'],
        ['smtp-mail', 'SMTP Intercepted Email'],
        ['dns-txt', 'DNS TXT Record Lookup']
      ],
      intermediate: [
        ['random', 'Random (Any Intermediate Variant)'],
        ['http-b64', 'HTTP Base64 Auth & Cookie'],
        ['dns-exfil', 'DNS Subdomain Hex Exfiltration'],
        ['icmp-carve', 'ICMP Ping Sequence Carving'],
        ['sip-digest', 'SIP VoIP Digest & SDP Key'],
        ['tcp-reassemble', 'TCP Segmented Hex Stream']
      ],
      hard: [
        ['random', 'Random (Any Hard Variant)'],
        ['ip-id', 'IPv4 Identification Header Stego'],
        ['ip-ttl', 'IPv4 TTL ASCII Covert Channel'],
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
    this.viewer_target = this.hint_select.value;
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
    let o = '', x = this._str(s), y = '@#$%&*+=/\\|~^!?<>[]{}01', v = Math.max(0, Math.min(1, Number(p || 0) / 100));
    if (v <= 0) return x;
    for (let i = 0; i < x.length; i++) {
      let c = x[i];
      o += (c !== '\n' && c !== '\r' && Math.random() < v) ? y[Math.floor(Math.random() * y.length)] : c;
    }
    return o;
  },

  _parse_cascadia(raw) {
    let out = [], t = this._str(raw).trim();
    if (!t) return out;
    if (t[0] === '{' || t[0] === '[') {
      try {
        let j = JSON.parse(t), arr = Array.isArray(j) ? j : (j.messages || []);
        for (let i = 0; i < arr.length; i++) {
          let c = arr[i] && (arr[i].content || arr[i]);
          if (typeof c === 'string' && c.trim().length > 8) out.push(c.trim().replace(/\s+/g, ' '));
        }
        if (out.length) return out;
      } catch (e) {}
    }
    let lines = t.split(/\r?\n/), skip = false;
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
        let base = "CPU - Weaver's Webway - news-rumors-cascadia-ic [982709436881723442]";
        let urls = [
          'json/' + encodeURIComponent(base + '.json'),
          'json/' + encodeURI(base + '.json'),
          'json/' + encodeURIComponent(base),
          'json/' + encodeURI(base)
        ];
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
    if (!n.length) {
      n = [
        'Cascadia sector 4 relay heartbeat nominal',
        'Webway node sync drift 0.04ms',
        'Harbor subnet routing table updated',
        'Telemetry collector ack from spire-02',
        'Unidentified carrier wave on sub-channel 9',
        'Grid transformer load balancing active'
      ];
    }
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
    let pkts = [], steps = [], filter = '', label = mode;
    let b64 = this._b64(flag), hex = this._hex(flag), u8 = this._u8(flag);
    if (mode === 'http-auth') {
      label = 'HTTP 200 OK Header & Body';
      filter = 'http';
      steps = ['1. Filter Wireshark by: http', '2. Select the HTTP/1.1 200 OK packet from 203.0.113.10.', '3. Read the X-Cascadia-Key header or JSON body to find the flag.'];
      let req = 'POST /api/v1/uplink HTTP/1.1\r\nHost: relay.cascadia.net\r\n\r\n{"node":"spire-04","action":"sync"}';
      let body = '{"status":"authenticated","flag":"' + flag + '"}';
      let res = 'HTTP/1.1 200 OK\r\nServer: cascadia-gw\r\nX-Cascadia-Key: ' + flag + '\r\nContent-Type: application/json\r\n\r\n' + body;
      pkts.push(this._tcp('10.10.20.14', '203.0.113.10', m1, m2, 51420, 80, 1000, 1, 0x18, req, 0x301));
      pkts.push(this._tcp('203.0.113.10', '10.10.20.14', m2, m1, 80, 51420, 1, 1000 + req.length, 0x18, res, 0x302));
    } else if (mode === 'ftp-transfer') {
      label = 'FTP Cleartext File Transfer';
      filter = 'ftp || ftp-data';
      steps = ['1. Filter Wireshark by: ftp || ftp-data', '2. Follow the USER netrunner login and RETR clearance_key.txt command.', '3. Inspect the port 20 FTP-DATA transfer packet to read the flag.'];
      pkts.push(this._tcp('10.10.20.22', '10.10.20.66', m1, m2, 49200, 21, 1, 1, 0x18, 'USER netrunner\r\nRETR clearance_key.txt\r\n', 0x311));
      pkts.push(this._tcp('10.10.20.66', '10.10.20.22', m2, m1, 20, 49201, 500, 1, 0x18, 'CASCADIA CLEARANCE MANIFEST\r\nTOKEN: ' + flag + '\r\n', 0x314));
    } else if (mode === 'irc-chat') {
      label = 'IRC Operator Channel Chatter';
      filter = 'irc || tcp.port == 6667';
      steps = ['1. Filter Wireshark by: irc || tcp.port == 6667', '2. Right-click -> Follow -> TCP Stream on #weavers-ops.', '3. Read the operator PRIVMSG line containing the plaintext flag.'];
      pkts.push(this._tcp('10.10.20.99', '10.10.20.31', m3, m1, 6667, 52667, 1, 100, 0x18, ':kestrel!op@cascadia PRIVMSG #weavers-ops :Did you rotate the relay cipher?\r\n', 0x321));
      pkts.push(this._tcp('10.10.20.31', '10.10.20.99', m1, m3, 52667, 6667, 100, 80, 0x18, 'PRIVMSG #weavers-ops :Affirmative, active key is ' + flag + '\r\n', 0x322));
    } else if (mode === 'smtp-mail') {
      label = 'SMTP Intercepted Email';
      filter = 'smtp || tcp.port == 25';
      steps = ['1. Filter Wireshark by: smtp || tcp.port == 25', '2. Inspect the email DATA sent from director@cascadia.net.', '3. Read the message body to extract the flag.'];
      pkts.push(this._tcp('10.10.20.44', '10.10.20.25', m1, m2, 50025, 25, 1, 30, 0x18, 'MAIL FROM:<director@cascadia.net>\r\nRCPT TO:<cell-09@cascadia.net>\r\nDATA\r\n', 0x331));
      pkts.push(this._tcp('10.10.20.44', '10.10.20.25', m1, m2, 50025, 25, 74, 30, 0x18, 'Subject: Priority Override\r\n\r\nAuthenticate terminal with: ' + flag + '\r\n.\r\n', 0x332));
    } else if (mode === 'dns-txt') {
      label = 'DNS TXT Record Lookup';
      filter = 'dns.qry.type == 16';
      steps = ['1. Filter Wireshark by: dns.qry.type == 16', '2. Find the DNS TXT query and response for _token.webway.cascadia.net.', '3. Read the TXT string inside the DNS Answer section.'];
      pkts.push(this._dns_q(0x4a21, '_token.webway.cascadia.net', 16, '10.10.20.18', '10.10.20.250', m1, m3, 0x340));
      pkts.push(this._dns_r(0x4a21, '_token.webway.cascadia.net', flag, '10.10.20.18', '10.10.20.250', m1, m3, 0x341));
    } else if (mode === 'http-b64') {
      label = 'HTTP Base64 Auth & Cookie';
      filter = 'http';
      steps = ['1. Filter Wireshark by: http', '2. Copy the Base64 string from Authorization: Bearer or Set-Cookie.', '3. Base64-decode "' + b64 + '" to reveal the flag.'];
      let req = 'GET /vault/telemetry HTTP/1.1\r\nHost: vault.cascadia.net\r\nAuthorization: Bearer ' + b64 + '\r\n\r\n';
      let res = 'HTTP/1.1 200 OK\r\nSet-Cookie: webway_session=' + b64 + '\r\n\r\n{"token_b64":"' + b64 + '"}';
      pkts.push(this._tcp('10.10.20.19', '198.51.100.42', m1, m2, 54080, 80, 500, 1, 0x18, req, 0x401));
      pkts.push(this._tcp('198.51.100.42', '10.10.20.19', m2, m1, 80, 54080, 1, 500 + req.length, 0x18, res, 0x402));
    } else if (mode === 'dns-exfil') {
      label = 'DNS Subdomain Hex Exfiltration';
      filter = 'dns.qry.name contains "exfil.cascadia.net"';
      steps = ['1. Filter Wireshark by: dns.qry.name contains "exfil.cascadia.net"', '2. Concatenate the hex subdomain chunks from p0, p1, p2... in order.', '3. Hex-decode "' + hex + '" to get the flag.'];
      for (let i = 0; i < hex.length; i += 12) {
        let idx = Math.floor(i / 12), qn = 'p' + idx + '.' + hex.slice(i, i + 12) + '.exfil.cascadia.net';
        pkts.push(this._dns_q(0x7100 + idx, qn, 16, '10.10.20.7', '10.10.20.250', m1, m3, 0x410 + idx));
      }
    } else if (mode === 'icmp-carve') {
      label = 'ICMP Ping Sequence Carving';
      filter = 'icmp && ip.src == 10.10.20.77';
      steps = ['1. Filter Wireshark by: icmp && ip.src == 10.10.20.77', '2. Sort Echo Requests by ICMP Sequence Number (100, 101, 102...).', '3. Join the 4-character chunks after "SYNC|" in each ping payload.'];
      for (let i = 0; i < flag.length; i += 4) {
        let idx = Math.floor(i / 4);
        pkts.push(this._icmp(8, 0, 0x2200, 100 + idx, '10.10.20.77', '10.10.20.250', m1, m3, 'SYNC|' + flag.slice(i, i + 4), 0x430 + idx));
      }
    } else if (mode === 'sip-digest') {
      label = 'SIP VoIP Digest & SDP Key';
      filter = 'sip || udp.port == 5060';
      steps = ['1. Filter Wireshark by: sip || udp.port == 5060', '2. Locate the SIP INVITE packet and check Authorization or SDP body.', '3. Hex-decode nonce="' + hex + '" or Base64-decode a=key-b64.'];
      let msg = 'INVITE sip:console@cascadia.net SIP/2.0\r\nFrom: "op" <sip:op@cascadia.net>\r\nAuthorization: Digest username="op", nonce="' + hex + '", response="' + b64 + '"\r\nContent-Type: application/sdp\r\n\r\nv=0\r\na=key-b64:' + b64 + '\r\n';
      pkts.push(this._udp('10.10.20.12', '10.10.20.20', m1, m3, 5060, 5060, msg, 0x450));
    } else if (mode === 'tcp-reassemble') {
      label = 'TCP Segmented Hex Stream';
      filter = 'tcp.port == 8443';
      steps = ['1. Filter Wireshark by: tcp.port == 8443 (or Follow TCP Stream).', '2. Join the "frag" hex values across all JSON segments in order.', '3. Convert hex "' + hex + '" to ASCII text.'];
      let seq = 1000;
      for (let i = 0; i < hex.length; i += 8) {
        let idx = Math.floor(i / 8), frag = '{"part":' + idx + ',"frag":"' + hex.slice(i, i + 8) + '"}\n';
        pkts.push(this._tcp('10.10.20.55', '10.10.20.88', m1, m2, 58443, 8443, seq, 1, 0x18, frag, 0x460 + idx));
        seq += frag.length;
      }
    } else if (mode === 'ip-id') {
      label = 'IPv4 Identification Header Stego';
      filter = 'ip.src == 10.10.30.9 && tcp.dstport == 443';
      steps = ['1. Filter Wireshark by: ip.src == 10.10.30.9 && tcp.dstport == 443', '2. Check the IPv4 Identification (ip.id) field on each SYN packet.', '3. Each ip.id is 0x1300 + ASCII code; convert the low byte to ASCII.'];
      for (let i = 0; i < u8.length; i++) {
        pkts.push(this._tcp('10.10.30.9', '10.10.40.9', m2, m1, 41000 + i, 443, 9000 + i * 10, 0, 0x02, 'SYN-PROBE-' + i, 0x1300 | u8[i]));
      }
    } else if (mode === 'ip-ttl') {
      label = 'IPv4 TTL ASCII Covert Channel';
      filter = 'ip.src == 10.10.30.17 && udp.dstport == 33434';
      steps = ['1. Filter Wireshark by: ip.src == 10.10.30.17 && udp.dstport == 33434', '2. Inspect the IPv4 Time-to-Live (ip.ttl) field of each UDP packet in order.', '3. Convert each TTL integer directly from decimal ASCII to a character.'];
      for (let i = 0; i < u8.length; i++) {
        pkts.push(this._udp('10.10.30.17', '10.10.40.17', m2, m1, 45000 + i, 33434, 'TRACE-HOP-' + i, 0x520 + i, u8[i]));
      }
    } else if (mode === 'tcp-urg') {
      label = 'TCP Urgent Pointer Stego';
      filter = 'tcp.dstport == 9001 && tcp.flags.urg == 1';
      steps = ['1. Filter Wireshark by: tcp.dstport == 9001 && tcp.flags.urg == 1', '2. Read the TCP Urgent Pointer (tcp.urgent_pointer) value in each packet.', '3. Convert the sequence of Urgent Pointer decimal ASCII values to text.'];
      for (let i = 0; i < u8.length; i++) {
        pkts.push(this._tcp('10.10.30.25', '10.10.40.25', m1, m2, 59000 + i, 9001, 2000 + i, 1, 0x30, 'URG-SEG-' + i, 0x550 + i, u8[i]));
      }
    } else if (mode === 'xor-otp') {
      label = 'UDP XOR Key-Stream Pair';
      filter = 'udp.port == 9999';
      steps = ['1. Filter Wireshark by: udp.port == 9999', '2. Copy the hex string after OTP_KEY= and the hex string after OTP_CIPHER=.', '3. XOR the two equal-length hex strings together (e.g. CyberChef XOR) for the flag.'];
      let key = [], enc = [];
      for (let i = 0; i < u8.length; i++) {
        let k = (0x5a + ((i * 19) & 0x3f)) & 0xff;
        key.push(k.toString(16).padStart(2, '0'));
        enc.push((u8[i] ^ k).toString(16).padStart(2, '0'));
      }
      pkts.push(this._udp('10.10.30.40', '10.10.40.40', m1, m3, 49999, 9999, 'OTP_KEY=' + key.join(''), 0x580));
      pkts.push(this._udp('10.10.30.40', '10.10.40.40', m1, m3, 49999, 9999, 'OTP_CIPHER=' + enc.join(''), 0x581));
    } else {
      label = 'UDP Source Port Knocking';
      filter = 'udp.dstport == 1337';
      steps = ['1. Filter Wireshark by: udp.dstport == 1337', '2. Read the UDP Source Port (udp.srcport) on each knock packet in order.', '3. Subtract 10000 from each source port and convert the ASCII codes to text.'];
      for (let i = 0; i < u8.length; i++) {
        pkts.push(this._udp('10.10.30.77', '10.10.40.77', m2, m3, 10000 + u8[i], 1337, 'KNOCK-SEQ-' + (i + 1), 0x5a0 + i));
      }
    }
    return { pkts, steps, filter, label };
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
    if (!pkt || pkt.length < 34) return { src: '0.0.0.0', dst: '0.0.0.0', protocol: 'RAW', info: 'Frame', hdr: '', payload: '' };
    let ip = pkt.subarray(14), ihl = (ip[0] & 0x0f) * 4, proto = ip[9], ttl = ip[8], ip_id = (ip[4] << 8) | ip[5];
    let src = [ip[12], ip[13], ip[14], ip[15]].join('.'), dst = [ip[16], ip[17], ip[18], ip[19]].join('.');
    let l4 = ip.subarray(ihl), hdr = 'IP.ID=0x' + ip_id.toString(16).padStart(4, '0') + ' (' + ip_id + ')  TTL=' + ttl;
    if (proto === 6 && l4.length >= 20) {
      let sp = (l4[0] << 8) | l4[1], dp = (l4[2] << 8) | l4[3], fl = l4[13], urg = (l4[18] << 8) | l4[19];
      let data = l4.subarray(20), txt = this._decode_ascii(data);
      let p = (sp === 80 || dp === 80) ? 'HTTP' : (sp === 21 || dp === 21 || sp === 20 || dp === 20) ? 'FTP' : (sp === 6667 || dp === 6667) ? 'IRC' : (sp === 25 || dp === 25) ? 'SMTP' : 'TCP';
      let extra = (fl & 0x20) ? '[URG=' + urg + '] ' : (fl === 0x02) ? '[SYN id=0x' + ip_id.toString(16) + '] ' : '';
      hdr += '  TCP ' + sp + '->' + dp + '  Flags=0x' + fl.toString(16) + '  UrgPtr=' + urg;
      return { src, dst, protocol: p, info: sp + '->' + dp + ' ' + extra + txt, hdr, payload: txt };
    }
    if (proto === 17 && l4.length >= 8) {
      let sp = (l4[0] << 8) | l4[1], dp = (l4[2] << 8) | l4[3], data = l4.subarray(8), txt = this._decode_ascii(data);
      hdr += '  UDP ' + sp + '->' + dp + '  Len=' + data.length;
      if (sp === 53 || dp === 53) {
        let qn = '', off = 12;
        while (off < data.length && data[off] > 0 && data[off] < 64) {
          let ln = data[off];
          qn += (qn ? '.' : '') + this._decode_ascii(data.subarray(off + 1, off + 1 + ln));
          off += 1 + ln;
        }
        let rest = this._decode_ascii(data.subarray(off + 5));
        return { src, dst, protocol: 'DNS', info: (dp === 53 ? 'Query ' : 'TXT ') + qn + (rest ? ' -> ' + rest : ''), hdr, payload: qn + (rest ? ' | TXT: ' + rest : '') };
      }
      let p = (sp === 5060 || dp === 5060) ? 'SIP' : 'UDP';
      return { src, dst, protocol: p, info: sp + '->' + dp + ' [TTL=' + ttl + '] ' + txt, hdr, payload: txt };
    }
    if (proto === 1 && l4.length >= 8) {
      let seq = (l4[6] << 8) | l4[7], txt = this._decode_ascii(l4.subarray(8));
      hdr += '  ICMP Echo Seq=' + seq;
      return { src, dst, protocol: 'ICMP', info: 'Echo seq=' + seq + ' ' + txt, hdr, payload: txt };
    }
    return { src, dst, protocol: 'IPv4', info: 'proto=' + proto, hdr, payload: '' };
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
    this.active_filter = built.filter;
    let decoys = [], domains = ['node.cascadia.net', 'grid.cascadia.net', 'relay.webway.local', 'auth.spire.internal'];
    let offset = Math.floor(Math.random() * noise.length);
    for (let i = 0; i < n; i++) {
      let rumor = noise[(offset + i * 3) % noise.length] || 'Cascadia relay signal', msg = this._corrupt(rumor, corr), kind = i % 4, p;
      let sip = '10.10.12.' + ((i % 40) + 2), dip = '10.10.18.' + ((i % 30) + 5);
      if (kind === 0) p = this._udp(sip, dip, m2, m3, 5514, 514, 'RUMOR_FEED: ' + msg, 0xa00 + i);
      else if (kind === 1) p = this._tcp(sip, dip, m1, m2, 40000 + i, 80, 5000 + i * 64, 1, 0x18, 'POST /webway/rumor HTTP/1.1\r\nHost: ' + domains[i % domains.length] + '\r\n\r\n' + msg, 0x900 + i);
      else if (kind === 2) p = this._icmp(8, 0, 0x0400, i + 1, sip, '10.10.20.250', m1, m3, 'CHATTER: ' + msg.slice(0, 72), 0xb00 + i);
      else p = this._dns_q(0x1000 + i, 'node-' + (i % 19) + '.' + domains[i % domains.length], 1, sip, '10.10.20.250', m1, m3, 0x800 + i);
      decoys.push({ pkt: p, flag: false });
    }
    let items = [], f_idx = 0, start = Math.min(2, Math.floor(decoys.length / 5));
    let step = Math.max(1, Math.floor((decoys.length - start) / (built.pkts.length + 2)));
    for (let i = 0; i < decoys.length; i++) {
      if (i >= start && f_idx < built.pkts.length && (i - start) % step === 0) {
        items.push({ pkt: built.pkts[f_idx++], flag: true });
      }
      items.push(decoys[i]);
    }
    while (f_idx < built.pkts.length) items.push({ pkt: built.pkts[f_idx++], flag: true });
    let rows = [], flag_items = [], decoy_items = [];
    for (let i = 0; i < items.length; i++) {
      let s = this._summary(items[i].pkt);
      let row = { no: i + 1, time: (i * 0.037).toFixed(3), src: s.src, dst: s.dst, protocol: s.protocol, len: items[i].pkt.length, info: s.info, hdr: s.hdr, payload: s.payload, flag: items[i].flag, flag_value: flag };
      if (row.flag) flag_items.push(row);
      else decoy_items.push(row);
    }
    let keep_flags = flag_items.slice(0, 6), keep_decoys = decoy_items.slice(0, 11 - keep_flags.length);
    rows = keep_flags.concat(keep_decoys).sort((a, b) => a.no - b.no);
    this.viewer_rows = rows;
    this.viewer_pin = rows.findIndex(r => r.flag);
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

  _viewer_hit(x, y) {
    if (!this.viewer_rows || !this.viewer_rows.length || !this.canvas_el) return -1;
    let top = 46, rh = 20, max_r = Math.min(this.viewer_rows.length, 11);
    let hit = Math.floor((y - top) / rh);
    if (y < top || hit < 0 || hit >= max_r || x < 8 || x > this.canvas_el.width - 8) return -1;
    return hit;
  },

  _clip(txt, max_w) {
    let s = this._str(txt);
    if (this.ctx.measureText(s).width <= max_w) return s;
    while (s.length > 0 && this.ctx.measureText(s + '...').width > max_w) s = s.slice(0, -1);
    return s + '...';
  },

  draw() {
    if (!this.ctx || !this.canvas_el) return;
    if (this.canvas_el.width !== 920 || this.canvas_el.height !== 520) {
      this.canvas_el.width = 920;
      this.canvas_el.height = 520;
    }
    let w = this.canvas_el.width, h = this.canvas_el.height, rows = (this.viewer_rows || []).slice(0, 11);
    let active_idx = this.viewer_hover >= 0 ? this.viewer_hover : (this.viewer_pin >= 0 ? this.viewer_pin : 0);
    let active = rows[active_idx] || rows[0] || null;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'alphabetic';
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = '#061014';
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.fillStyle = '#102830';
    this.ctx.fillRect(8, 6, w - 16, 22);
    this.ctx.strokeStyle = '#285566';
    this.ctx.strokeRect(8, 6, w - 16, 22);
    this.ctx.fillStyle = '#7be3f6';
    this.ctx.font = 'bold 11px monospace';
    let casc = (this.cascadia_cb && this.cascadia_cb.checked) ? 'ON (' + (this.corruption_sld ? this.corruption_sld.value : 0) + '% corrupt)' : 'OFF';
    this.ctx.fillText('PCAP ANALYZER  |  Puzzle: ' + (this.active_variant || 'Ready') + '  |  Cascadia Rumors: ' + casc + '  |  Click/Hover any packet to inspect', 14, 21);
    let cols = [42, 54, 105, 105, 52, 44], labels = ['No.', 'Time', 'Source', 'Destination', 'Proto', 'Len', 'Info (Gold = Flag Packet, Cyan = Decoy / Cascadia Rumor)'], cx = 14;
    this.ctx.fillStyle = '#a9dce8';
    this.ctx.font = 'bold 11px monospace';
    for (let i = 0; i < labels.length; i++) {
      this.ctx.fillText(labels[i], cx, 41);
      cx += cols[i] || 0;
    }
    let top = 46, rh = 20;
    for (let i = 0; i < rows.length; i++) {
      let r = rows[i], ry = top + i * rh, sel = !!r.flag, is_act = (i === active_idx);
      this.ctx.fillStyle = sel ? 'rgba(255, 204, 0, 0.22)' : (i % 2 === 0 ? 'rgba(16, 34, 46, 0.92)' : 'rgba(10, 22, 30, 0.92)');
      this.ctx.fillRect(8, ry, w - 16, rh - 2);
      this.ctx.strokeStyle = is_act ? '#00ffcc' : (sel ? '#f4c542' : '#1d3842');
      this.ctx.lineWidth = is_act ? 1.5 : 1;
      this.ctx.strokeRect(8, ry, w - 16, rh - 2);
      this.ctx.lineWidth = 1;
      this.ctx.fillStyle = sel ? '#ffe47a' : '#d8f0f8';
      this.ctx.font = sel ? 'bold 11px monospace' : '11px monospace';
      let rx = 14, vals = [String(r.no), r.time, r.src, r.dst, r.protocol, String(r.len)];
      for (let j = 0; j < vals.length; j++) {
        this.ctx.fillText(vals[j], rx, ry + 13);
        rx += cols[j];
      }
      let prefix = sel ? '[FLAG] ' : '';
      this.ctx.fillText(this._clip(prefix + (r.info || ''), w - rx - 16), rx, ry + 13);
    }
    let iy = 272, ih = 96;
    this.ctx.fillStyle = '#0a1b22';
    this.ctx.fillRect(8, iy, w - 16, ih);
    this.ctx.strokeStyle = '#2d6275';
    this.ctx.strokeRect(8, iy, w - 16, ih);
    this.ctx.fillStyle = '#00ffcc';
    this.ctx.font = 'bold 11px monospace';
    if (active) {
      let tag = active.flag ? 'FLAG PACKET' : 'DECOY / RUMOR PACKET';
      this.ctx.fillText('INSPECTING FRAME #' + active.no + ' (' + tag + ')  —  ' + active.src + ' -> ' + active.dst + ' [' + active.protocol + ']', 16, iy + 18);
      this.ctx.fillStyle = '#ffe070';
      this.ctx.font = '11px monospace';
      this.ctx.fillText('Headers: ' + this._clip(active.hdr || '', w - 95), 16, iy + 38);
      this.ctx.fillStyle = '#dfeef7';
      let pay = active.payload || active.info || '';
      this.ctx.fillText('Payload: ' + this._clip(pay, w - 95), 16, iy + 58);
      let hex_preview = this._hex(pay.slice(0, 36)).replace(/(..)/g, '$1 ').trim();
      this.ctx.fillStyle = '#8ab8c7';
      this.ctx.fillText('Hex:     ' + this._clip(hex_preview, w - 95), 16, iy + 78);
    }
    let sy = 376, sh = 136;
    this.ctx.fillStyle = 'rgba(18, 28, 16, 0.96)';
    this.ctx.fillRect(8, sy, w - 16, sh);
    this.ctx.strokeStyle = '#f4c542';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(8, sy, w - 16, sh);
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = '#ffe47a';
    this.ctx.font = 'bold 12px monospace';
    this.ctx.fillText('HOW TO SOLVE THIS PCAP  |  Embedded Flag: ' + (this.active_flag || 'FLAG{...}'), 16, sy + 20);
    this.ctx.fillStyle = '#7be3f6';
    this.ctx.font = 'bold 11px monospace';
    this.ctx.fillText('Puzzle Type: ' + (this.active_variant || '-') + '   |   Wireshark Display Filter: ' + (this.active_filter || 'any'), 16, sy + 40);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '11px monospace';
    for (let i = 0; i < this.viewer_steps.length; i++) {
      this.ctx.fillText(this._clip(this.viewer_steps[i], w - 36), 16, sy + 64 + i * 20);
    }
  }
};