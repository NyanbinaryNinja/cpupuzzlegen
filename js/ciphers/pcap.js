const pcap = {
  f: null,
  r: null,
  u: null,
  m: null,
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
    let c = document.querySelector('#input_box').parentElement, p = document.querySelector('.options-window .window-body'), r = document.createElement('fieldset'), u = document.createElement('fieldset'), m = document.createElement('fieldset'), o = document.createElement('div'), d = document.createElement('select'), h = document.createElement('select'), i = document.createElement('input'), l = document.createElement('button'), n = document.createElement('span'), q = document.createElement('input'), y = document.createElement('input'), z = document.createElement('textarea'), s = document.createElement('input'), a = document.createElement('label'), v = document.createElement('label'), x = document.createElement('label'), e = document.createElement('label'), w = document.createElement('label'), g = document.createElement('label'), ml1 = document.createElement('label'), mi1 = document.createElement('input'), ml2 = document.createElement('label'), mi2 = document.createElement('input');
    this.canvas_el = canvas_el;
    this.ctx = ctx;
    this.input_fieldset = c;
    this.r = r;
    this.u = u;
    this.m = m;
    this.f = i;
    this.meta_l1 = ml1;
    this.meta_i1 = mi1;
    this.meta_l2 = ml2;
    this.meta_i2 = mi2;

    m.style.cssText = 'display:none;align-items:center;gap:6px;flex-wrap:wrap;';
    m.className = 'control-fieldset';
    mi1.type = 'text';
    mi1.style.cssText = 'flex:1;min-width:90px;';
    mi2.type = 'text';
    mi2.style.cssText = 'flex:1;min-width:90px;';
    mi1.oninput = () => { if (window.generate_grid) window.generate_grid(); };
    mi2.oninput = () => { if (window.generate_grid) window.generate_grid(); };
    m.append(ml1, mi1, ml2, mi2);

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
    c.parentElement.insertBefore(m, u);

    r.className = 'mb-5 w-100';
    r.style.cssText = 'display:none;width:100%;margin-top:8px;';
    d.className = 'mb-5 w-100';
    d.innerHTML = '<option value="easy">Easy (Single Packet Lookup)</option><option value="intermediate">Intermediate (Multi-Packet / Stream)</option><option value="hard">Hard (Header Stego / Covert)</option>';
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
    h.onchange = () => {
      this._sync_meta_fields(h.value);
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
        ['http-creds', 'HTTP Login Credentials'],
        ['ftp-transfer', 'FTP File Transfer'],
        ['irc-chat', 'IRC Channel Chatter'],
        ['smtp-mail', 'SMTP Email Body'],
        ['dns-txt', 'DNS TXT Response']
      ],
      intermediate: [
        ['random', 'Random (Any Intermediate Variant)'],
        ['http-brute', 'HTTP Brute-Force (Find 200 OK)'],
        ['tcp-split', 'TCP Split Stream Segments'],
        ['icmp-order', 'ICMP Out-of-Order Ping Chunks'],
        ['dns-sub', 'DNS Subdomain Chunks'],
        ['sip-call', 'SIP VoIP Call Invite']
      ],
      hard: [
        ['random', 'Random (Any Hard Variant)'],
        ['ip-id', 'IPv4 Identification Stego'],
        ['ip-ttl', 'IPv4 TTL Covert Channel'],
        ['tcp-urg', 'TCP Urgent Pointer Stego'],
        ['port-knock', 'UDP Source Port Knocking'],
        ['evil-bit', 'IPv4 Evil-Bit Flag Chunks']
      ]
    };
  },

  _meta_cfg(mode) {
    let map = {
      'http-creds': ['User:', '', 'Host:', ''],
      'ftp-transfer': ['FTP User:', '', 'File:', ''],
      'irc-chat': ['Nick:', '', 'Channel:', ''],
      'smtp-mail': ['From:', '', 'To:', ''],
      'dns-txt': ['Domain:', '', 'Resolver:', ''],
      'http-brute': ['Valid User:', '', 'Host:', ''],
      'tcp-split': ['Service Port:', '', 'Server IP:', ''],
      'icmp-order': ['Sender IP:', '', 'Ping Tag:', ''],
      'dns-sub': ['Base Domain:', '', 'Client IP:', ''],
      'sip-call': ['Caller:', '', 'SIP Domain:', ''],
      'ip-id': ['Sender IP:', '', 'Target Port:', ''],
      'ip-ttl': ['Sender IP:', '', 'UDP Port:', ''],
      'tcp-urg': ['Sender IP:', '', 'TCP Port:', ''],
      'port-knock': ['Base Port:', '', 'Knock Port:', ''],
      'evil-bit': ['Sender IP:', '', 'UDP Port:', '']
    };
    return map[mode] || ['User/IP:', '', 'Target/Host:', ''];
  },

  _sync_meta_fields(mode) {
    if (!this.meta_l1) return;
    let cfg = this._meta_cfg(mode);
    this.meta_l1.textContent = cfg[0];
    this.meta_i1.placeholder = cfg[1] || 'default';
    this.meta_i1.value = cfg[1];
    this.meta_l2.textContent = cfg[2];
    this.meta_i2.placeholder = cfg[3] || 'default';
    this.meta_i2.value = cfg[3];
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
    this._sync_meta_fields(this.hint_select.value);
  },

  show() {
    if (this.r) this.r.style.display = 'block';
    if (this.u) this.u.style.display = 'flex';
    if (this.m) this.m.style.display = 'flex';
  },
  hide() {
    if (this.r) this.r.style.display = 'none';
    if (this.u) this.u.style.display = 'none';
    if (this.m) this.m.style.display = 'none';
  },
  set_image_mode(enabled) {
    this.use_image = enabled;
    this.show();
  },
  generate(t) { return this.gen(t); },
  _str(v) { return String(v || ''); },
  _u8(s) { return new TextEncoder().encode(this._str(s)); },
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

  _ipv4(sip, dip, proto, payload, id = 0, ttl = 64, flags = 0x4000) {
    let b = new Uint8Array(20 + payload.length), v = new DataView(b.buffer);
    v.setUint8(0, 0x45);
    v.setUint16(2, 20 + payload.length, false);
    v.setUint16(4, id & 0xffff, false);
    v.setUint16(6, flags & 0xffff, false);
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

  _udp(sip, dip, smac, dmac, sport, dport, payload, id = 0, ttl = 64, ip_flags = 0x4000) {
    let p = payload instanceof Uint8Array ? payload : this._u8(payload), h = new Uint8Array(8 + p.length), v = new DataView(h.buffer);
    v.setUint16(0, sport, false);
    v.setUint16(2, dport, false);
    v.setUint16(4, 8 + p.length, false);
    h.set(p, 8);
    v.setUint16(6, this._l4_csum(sip, dip, 17, h), false);
    return this._eth(smac, dmac, 0x0800, this._ipv4(sip, dip, 17, h, id, ttl, ip_flags));
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

  _build_puzzle(mode, flag, m1, m2, m3, v1, v2) {
    let pkts = [], decoys = [], steps = [], label = mode, u8 = this._u8(flag), d = this._meta_cfg(mode);
    let p1 = v1 || d[1], p2 = v2 || d[3];

    if (mode === 'http-creds') {
      label = 'HTTP Login Credentials';
      steps = [
        '1. Filter Wireshark by: http.request.method == "POST"',
        '2. Inspect the POST /login form payload from user "' + p1 + '" to ' + p2 + ' to read pass=' + flag
      ];
      pkts.push(this._tcp('10.10.20.14', '203.0.113.10', m1, m2, 51420, 80, 100, 1, 0x18, 'POST /login HTTP/1.1\r\nHost: ' + p2 + '\r\nContent-Type: application/x-www-form-urlencoded\r\n\r\nuser=' + p1 + '&pass=' + flag, 0x301));
    } else if (mode === 'ftp-transfer') {
      label = 'FTP File Transfer';
      steps = [
        '1. Filter Wireshark by: ftp || ftp-data',
        '2. Follow login for "' + p1 + '" and inspect the port 20 transfer of "' + p2 + '" for the flag.'
      ];
      pkts.push(this._tcp('10.10.20.22', '10.10.20.66', m1, m2, 49200, 21, 1, 1, 0x18, 'USER ' + p1 + '\r\nRETR ' + p2 + '\r\n', 0x311));
      pkts.push(this._tcp('10.10.20.66', '10.10.20.22', m2, m1, 20, 49201, 500, 1, 0x18, 'FILE ' + p2 + ': ' + flag + '\r\n', 0x314));
    } else if (mode === 'irc-chat') {
      label = 'IRC Channel Chatter';
      steps = [
        '1. Filter Wireshark by: irc || tcp.port == 6667',
        '2. Find the PRIVMSG from "' + p1 + '" in channel ' + p2 + ' containing the flag.'
      ];
      pkts.push(this._tcp('10.10.20.31', '10.10.20.99', m1, m3, 52667, 6667, 100, 80, 0x18, ':' + p1 + '!op@cascadia PRIVMSG ' + p2 + ' :Key is ' + flag + '\r\n', 0x322));
    } else if (mode === 'smtp-mail') {
      label = 'SMTP Email Body';
      steps = [
        '1. Filter Wireshark by: smtp || tcp.port == 25',
        '2. Locate the email sent from <' + p1 + '> to <' + p2 + '>.',
        '3. Read the message body text to extract the flag.'
      ];
      pkts.push(this._tcp('10.10.20.44', '10.10.20.25', m1, m2, 50025, 25, 74, 30, 0x18, 'From: ' + p1 + '\r\nTo: ' + p2 + '\r\nSubject: Dispatch\r\n\r\nClearance: ' + flag + '\r\n.\r\n', 0x332));
    } else if (mode === 'dns-txt') {
      label = 'DNS TXT Response';
      steps = [
        '1. Filter Wireshark by: dns.qry.type == 16',
        '2. Read the TXT answer returned by ' + p2 + ' for "' + p1 + '".'
      ];
      let dip = /^\d+\.\d+\.\d+\.\d+$/.test(p2) ? p2 : '10.10.20.250';
      pkts.push(this._dns_r(0x4a21, p1, flag, '10.10.20.18', dip, m1, m3, 0x341));
    } else if (mode === 'http-brute') {
      label = 'HTTP Brute-Force (Find 200 OK)';
      steps = [
        '1. Filter Wireshark by: http',
        '2. Ignore the failed 401 Unauthorized login attempts with decoy tokens.',
        '3. Locate the successful HTTP/1.1 200 OK login for user "' + p1 + '" on ' + p2 + '.',
        '4. Read the X-Session-Flag header in the 200 OK packet.'
      ];
      for (let i = 0; i < 3; i++) {
        decoys.push(this._tcp('203.0.113.50', '10.10.20.19', m2, m1, 80, 54000 + i, 1, 50, 0x18, 'HTTP/1.1 401 Unauthorized\r\nHost: ' + p2 + '\r\nX-Attempt: guest_' + i + '\r\n\r\nDenied: DECOY{invalid_attempt_' + i + '}', 0x400 + i));
      }
      pkts.push(this._tcp('203.0.113.50', '10.10.20.19', m2, m1, 80, 54010, 1, 50, 0x18, 'HTTP/1.1 200 OK\r\nHost: ' + p2 + '\r\nX-User: ' + p1 + '\r\nX-Session-Flag: ' + flag + '\r\n\r\nLogin OK', 0x409));
    } else if (mode === 'tcp-split') {
      let port = parseInt(p1, 10) || 8443, dip = /^\d+\.\d+\.\d+\.\d+$/.test(p2) ? p2 : '10.10.20.88';
      label = 'TCP Split Stream Segments';
      steps = [
        '1. Filter Wireshark by: tcp.port == ' + port,
        '2. Right-click any matching packet and select Follow -> TCP Stream (or sort by Seq #).',
        '3. Reassemble the plaintext chunks across the stream to read the full flag.'
      ];
      let seq = 1000;
      for (let i = 0; i < flag.length; i += 5) {
        let idx = Math.floor(i / 5), chunk = 'SEG[' + idx + ']=' + flag.slice(i, i + 5) + '\n';
        pkts.push(this._tcp('10.10.20.55', dip, m1, m2, 58443, port, seq, 1, 0x18, chunk, 0x460 + idx));
        seq += chunk.length;
      }
    } else if (mode === 'icmp-order') {
      let sip = /^\d+\.\d+\.\d+\.\d+$/.test(p1) ? p1 : '10.10.20.77', tag = p2 || 'SYNC';
      label = 'ICMP Out-of-Order Ping Chunks';
      steps = [
        '1. Filter Wireshark by: icmp && ip.src == ' + sip,
        '2. Notice the Echo Request packets arrived out of order.',
        '3. Sort the packets by ICMP Sequence Number (100, 101, 102...).',
        '4. Concatenate the plaintext chunks after "' + tag + '|" in sequence order.'
      ];
      let chunks = [];
      for (let i = 0; i < flag.length; i += 4) chunks.push({ seq: 100 + Math.floor(i / 4), txt: flag.slice(i, i + 4) });
      let shuffled = chunks.slice().sort((a, b) => ((a.seq * 7) % 13) - ((b.seq * 7) % 13));
      for (let i = 0; i < shuffled.length; i++) {
        pkts.push(this._icmp(8, 0, 0x2200, shuffled[i].seq, sip, '10.10.20.250', m1, m3, tag + '|seq=' + shuffled[i].seq + '|' + shuffled[i].txt, 0x430 + i));
      }
    } else if (mode === 'dns-sub') {
      let dom = p1 || 'exfil.cascadia.net', sip = /^\d+\.\d+\.\d+\.\d+$/.test(p2) ? p2 : '10.10.20.7';
      label = 'DNS Subdomain Chunks';
      steps = [
        '1. Filter Wireshark by: dns.qry.name contains "' + dom + '"',
        '2. Inspect the DNS queries sent from ' + sip + ' in order (part0, part1, part2...).',
        '3. Join the subdomain labels between "partN." and ".' + dom + '" to read the flag.'
      ];
      for (let i = 0; i < flag.length; i += 6) {
        let idx = Math.floor(i / 6), clean = flag.slice(i, i + 6);
        pkts.push(this._dns_q(0x7100 + idx, 'part' + idx + '.' + clean + '.' + dom, 1, sip, '10.10.20.250', m1, m3, 0x410 + idx));
      }
    } else if (mode === 'sip-call') {
      label = 'SIP VoIP Call Invite';
      steps = [
        '1. Filter Wireshark by: sip || udp.port == 5060',
        '2. Find the INVITE request from caller "' + p1 + '" at ' + p2 + '.',
        '3. Check the SIP Subject header and SDP session info (i=) for the flag.'
      ];
      let msg = 'INVITE sip:console@' + p2 + ' SIP/2.0\r\nFrom: "' + p1 + '" <sip:' + p1 + '@' + p2 + '>\r\nSubject: Auth-' + flag + '\r\nContent-Type: application/sdp\r\n\r\nv=0\r\ns=WebwayCall\r\ni=' + flag + '\r\n';
      pkts.push(this._udp('10.10.20.12', '10.10.20.20', m1, m3, 5060, 5060, msg, 0x450));
    } else if (mode === 'ip-id') {
      let sip = /^\d+\.\d+\.\d+\.\d+$/.test(p1) ? p1 : '10.10.30.9', dp = parseInt(p2, 10) || 443;
      label = 'IPv4 Identification Stego';
      steps = [
        '1. Filter Wireshark by: ip.src == ' + sip + ' && tcp.dstport == ' + dp,
        '2. Expand the IPv4 header on each SYN packet and check the Identification (ip.id) field.',
        '3. Each ip.id equals 0x1300 + the ASCII byte of a flag character.',
        '4. Take the low hex byte of each ip.id in packet order and convert from ASCII.'
      ];
      for (let i = 0; i < u8.length; i++) pkts.push(this._tcp(sip, '10.10.40.9', m2, m1, 41000 + i, dp, 9000 + i, 0, 0x02, 'SYN-' + i, 0x1300 | u8[i]));
    } else if (mode === 'ip-ttl') {
      let sip = /^\d+\.\d+\.\d+\.\d+$/.test(p1) ? p1 : '10.10.30.17', dp = parseInt(p2, 10) || 33434;
      label = 'IPv4 TTL Covert Channel';
      steps = [
        '1. Filter Wireshark by: ip.src == ' + sip + ' && udp.dstport == ' + dp,
        '2. Add IPv4 Time-to-Live (ip.ttl) as a column or inspect it in the IPv4 header.',
        '3. Record the TTL decimal value of each probe packet in sequence.',
        '4. Convert those decimal ASCII numbers into characters to spell the flag.'
      ];
      for (let i = 0; i < u8.length; i++) pkts.push(this._udp(sip, '10.10.40.17', m2, m1, 45000 + i, dp, 'HOP-' + i, 0x520 + i, u8[i]));
    } else if (mode === 'tcp-urg') {
      let sip = /^\d+\.\d+\.\d+\.\d+$/.test(p1) ? p1 : '10.10.30.25', dp = parseInt(p2, 10) || 9001;
      label = 'TCP Urgent Pointer Stego';
      steps = [
        '1. Filter Wireshark by: ip.src == ' + sip + ' && tcp.dstport == ' + dp + ' && tcp.flags.urg == 1',
        '2. Expand the TCP header on each matching packet.',
        '3. Read the Urgent Pointer (tcp.urgent_pointer) decimal value on each frame.',
        '4. Convert the Urgent Pointer ASCII codes into text.'
      ];
      for (let i = 0; i < u8.length; i++) pkts.push(this._tcp(sip, '10.10.40.25', m1, m2, 59000 + i, dp, 2000 + i, 1, 0x30, 'URG-' + i, 0x550 + i, u8[i]));
    } else if (mode === 'port-knock') {
      let base_p = parseInt(p1, 10) || 10000, dp = parseInt(p2, 10) || 1337;
      label = 'UDP Source Port Knocking';
      steps = [
        '1. Filter Wireshark by: udp.dstport == ' + dp,
        '2. Observe the UDP Source Port (udp.srcport) on each knock packet in order.',
        '3. Subtract ' + base_p + ' from each packet\'s UDP source port.',
        '4. Convert the resulting numbers from decimal ASCII into characters.',
        '5. Combine the characters in order to get the flag.'
      ];
      for (let i = 0; i < u8.length; i++) pkts.push(this._udp('10.10.30.77', '10.10.40.77', m2, m3, base_p + u8[i], dp, 'KNOCK-' + (i + 1), 0x5a0 + i));
    } else {
      let sip = /^\d+\.\d+\.\d+\.\d+$/.test(p1) ? p1 : '10.10.30.66', dp = parseInt(p2, 10) || 6666;
      label = 'IPv4 Evil-Bit Flag Chunks';
      steps = [
        '1. Filter traffic to port ' + dp + ': udp.dstport == ' + dp,
        '2. Notice many packets carry fake decoy chunks in their payload.',
        '3. Filter for packets with the IPv4 Reserved "Evil Bit" set: udp.dstport == ' + dp + ' && ip.flags.rb == 1',
        '4. Read the payload chunks only from packets where Flags = 0x8000 (Reserved bit set).',
        '5. Concatenate those valid chunks in order to assemble the flag.'
      ];
      for (let i = 0; i < flag.length; i += 4) {
        let idx = Math.floor(i / 4);
        decoys.push(this._udp(sip, '10.10.40.66', m1, m3, 46000 + idx, dp, 'CHUNK=' + this._corrupt(flag.slice(i, i + 4), 100), 0x600 + idx, 64, 0x4000));
        pkts.push(this._udp(sip, '10.10.40.66', m1, m3, 46100 + idx, dp, 'CHUNK=' + flag.slice(i, i + 4), 0x650 + idx, 64, 0x8000));
      }
    }
    return { pkts, decoys, steps, label };
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
    let ip = pkt.subarray(14), ihl = (ip[0] & 0x0f) * 4, proto = ip[9], ttl = ip[8], ip_id = (ip[4] << 8) | ip[5], ip_fl = (ip[6] << 8) | ip[7];
    let src = [ip[12], ip[13], ip[14], ip[15]].join('.'), dst = [ip[16], ip[17], ip[18], ip[19]].join('.'), l4 = ip.subarray(ihl);
    let evil = (ip_fl & 0x8000) ? '[EVIL=1] ' : '';
    if (proto === 6 && l4.length >= 20) {
      let sp = (l4[0] << 8) | l4[1], dp = (l4[2] << 8) | l4[3], fl = l4[13], urg = (l4[18] << 8) | l4[19], txt = this._decode_ascii(l4.subarray(20));
      let p = (sp === 80 || dp === 80) ? 'HTTP' : (sp === 21 || dp === 21 || sp === 20 || dp === 20) ? 'FTP' : (sp === 6667 || dp === 6667) ? 'IRC' : (sp === 25 || dp === 25) ? 'SMTP' : 'TCP';
      let extra = (fl & 0x20) ? '[URG=' + urg + '] ' : (fl === 0x02) ? '[ID=0x' + ip_id.toString(16) + '] ' : '';
      return { src, dst, protocol: p, info: sp + '->' + dp + ' ' + evil + extra + txt };
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
      return { src, dst, protocol: (sp === 5060 || dp === 5060) ? 'SIP' : 'UDP', info: sp + '->' + dp + ' ' + evil + '[TTL=' + ttl + '] ' + txt };
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
    if (sel === 'random' && this.last_mode !== mode) {
      this._sync_meta_fields(mode);
      this.last_mode = mode;
    }
    let v1 = this.meta_i1 ? this.meta_i1.value.trim() : '';
    let v2 = this.meta_i2 ? this.meta_i2.value.trim() : '';
    let n = Math.max(12, Math.min(512, Number(this.noise_input ? this.noise_input.value : 48) || 48));
    let corr = Number(this.corruption_sld ? this.corruption_sld.value : 25);
    let noise = await this._noise();
    let m1 = this._m8('00:16:3e:44:55:66'), m2 = this._m8('00:50:56:88:99:aa'), m3 = this._m8('00:1b:21:cc:dd:ee');
    let built = this._build_puzzle(mode, flag, m1, m2, m3, v1, v2);
    this.viewer_steps = built.steps;
    this.active_variant = built.label;
    let decoys = [], offset = Math.floor(Math.random() * noise.length);
    for (let i = 0; i < built.decoys.length; i++) decoys.push({ pkt: built.decoys[i], flag: false });
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
    let step_cnt = Math.max(2, this.viewer_steps.length);
    let box_h = 34 + step_cnt * 18;
    let target_h = 172 + box_h;
    if (this.canvas_el.width !== 740 || this.canvas_el.height !== target_h) {
      this.canvas_el.width = 740;
      this.canvas_el.height = target_h;
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

    this._bevel(10, 162, w - 20, box_h, true);
    ctx.fillStyle = '#000080';
    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.fillText('How to Solve (' + (this.active_variant || 'PCAP') + ')  —  Flag: ' + (this.active_flag || ''), 18, 179);

    ctx.fillStyle = '#000000';
    ctx.font = '11px Tahoma, sans-serif';
    for (let i = 0; i < this.viewer_steps.length; i++) {
      ctx.fillText(this._clip(this.viewer_steps[i], w - 36), 18, 199 + i * 18);
    }
  }
};