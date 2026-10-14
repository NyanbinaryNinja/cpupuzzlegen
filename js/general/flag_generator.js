const crypto_list = [
  ['none', 'None (Plaintext)', []],
  ['caesar', 'Caesar Shift', [['Shift:', 'number', '3', 1, 25]]],
  ['rot13', 'ROT13', []],
  ['rot47', 'ROT47', [['Shift:', 'number', '47', 1, 93]]],
  ['atbash', 'Atbash Mirror', []],
  ['vigenere', 'Vigenere Cipher', [['Key:', 'text', 'CASCADIA']]],
  ['beaufort', 'Beaufort Cipher', [['Key:', 'text', 'CASCADIA']]],
  ['variant_beaufort', 'Variant Beaufort', [['Key:', 'text', 'CASCADIA']]],
  ['autokey', 'Autokey Cipher', [['Primer:', 'text', 'WEBWAY']]],
  ['affine', 'Affine Cipher', [['Slope A (1,3,5,7,9,11,15,17,19,21,23,25):', 'number', '5', 1, 25], ['Intercept B:', 'number', '8', 0, 25]]],
  ['railfence', 'Rail Fence', [['Rails:', 'number', '3', 2, 12]]],
  ['scytale', 'Scytale Cylinder', [['Columns:', 'number', '4', 2, 12]]],
  ['columnar', 'Columnar Transposition', [['Key:', 'text', 'SPIRE']]],
  ['keyword', 'Keyword Substitution', [['Keyword:', 'text', 'WINTON']]],
  ['bacon', 'Baconian (5-Bit)', [['Alphabet:', 'select', 'AB', ['AB', '01']]]],
  ['a1z26', 'A1Z26 Numbers', [['Separator:', 'text', '-']]],
  ['morse', 'Morse Code', [['Slash Word Sep:', 'text', ' / ']]],
  ['tap', 'Polybius Tap Code', [['Separator:', 'text', ' ']]],
  ['reverse', 'Reverse Text', []],
  ['base64', 'Base64', []],
  ['base32', 'Base32 (RFC 4648)', []],
  ['hex', 'Hexadecimal', [['Separator:', 'text', '']]],
  ['binary', 'Binary (8-Bit)', [['Separator:', 'text', ' ']]],
  ['octal', 'Octal', [['Separator:', 'text', ' ']]],
  ['decimal', 'ASCII Decimal', [['Separator:', 'text', ' ']]],
  ['url', 'URL Percent-Encode', []],
  ['xor', 'Repeating-Key XOR (Hex)', [['Key:', 'text', 'KEY']]],
  ['aes', 'AES-256', [['Passphrase:', 'text', 'cascadia']]],
  ['des', 'TripleDES', [['Passphrase:', 'text', 'cascadia']]],
  ['rc4', 'RC4 Stream', [['Passphrase:', 'text', 'cascadia']]],
  ['rabbit', 'Rabbit Stream', [['Passphrase:', 'text', 'cascadia']]],
  ['md5', 'MD5 Hash', []],
  ['sha1', 'SHA-1 Hash', []],
  ['sha256', 'SHA-256 Hash', []]
];

function init_crypto_ui() {
  let sel = document.getElementById('crypto_select');
  if (!sel) return;
  sel.innerHTML = '';
  for (let i = 0; i < crypto_list.length; i++) {
    let o = document.createElement('option');
    o.value = crypto_list[i][0];
    o.textContent = crypto_list[i][1];
    sel.appendChild(o);
  }
  update_crypto_ui(true);
}

function update_crypto_ui(skip_gen) {
  let sel = document.getElementById('crypto_select'), box = document.getElementById('crypto_opts');
  if (!sel || !box) return;
  let item = crypto_list.find(x => x[0] === sel.value) || crypto_list[0], defs = item[2];
  box.innerHTML = '';
  box.style.display = defs.length ? 'flex' : 'none';
  for (let i = 0; i < defs.length; i++) {
    let d = defs[i], lbl = document.createElement('label'), inp;
    lbl.textContent = d[0];
    if (d[1] === 'select') {
      inp = document.createElement('select');
      for (let j = 0; j < d[3].length; j++) {
        let op = document.createElement('option');
        op.value = d[3][j];
        op.textContent = d[3][j];
        inp.appendChild(op);
      }
      inp.value = d[2];
      inp.onchange = () => { if (window.generate_grid) window.generate_grid(); };
    } else {
      inp = document.createElement('input');
      inp.type = d[1];
      inp.value = d[2];
      if (d[3] !== undefined) inp.min = d[3];
      if (d[4] !== undefined) inp.max = d[4];
      inp.oninput = () => { if (window.generate_grid) window.generate_grid(); };
    }
    inp.id = 'c_opt_' + i;
    inp.className = 'w-100';
    box.append(lbl, inp);
  }
  if (!skip_gen && window.generate_grid) window.generate_grid();
}

function toggle_prefix(enabled) {
  let pb = document.getElementById('prefix_box');
  if (pb) pb.style.display = enabled ? 'inline-block' : 'none';
  if (window.generate_grid) window.generate_grid();
}

function generate_flag(prefix, flag) {
  let leet_map = { 'a': '4', 'e': '3', 'i': '1', 'o': '0', 't': '7', 's': '5', 'g': '9' };
  let leet_flag = '';
  for (let char of flag) {
    let variants = [char.toUpperCase(), char.toLowerCase()];
    let lower = char.toLowerCase();
    if (leet_map[lower]) variants.push(leet_map[lower]);
    leet_flag += variants[Math.floor(Math.random() * variants.length)];
  }
  return prefix ? (prefix + '{' + leet_flag + '}') : leet_flag;
}

function _alpha_shift(s, fn) {
  let out = '', idx = 0;
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c >= 65 && c <= 90) out += String.fromCharCode(65 + ((fn(c - 65, idx++) % 26) + 26) % 26);
    else if (c >= 97 && c <= 122) out += String.fromCharCode(97 + ((fn(c - 97, idx++) % 26) + 26) % 26);
    else out += s[i];
  }
  return out;
}

function _clean_key(k) {
  let s = String(k || 'KEY').toUpperCase().replace(/[^A-Z]/g, '');
  return s.length ? s : 'KEY';
}

function encode_cipher(text, mode, p0, p1) {
  let s = String(text || '');
  if (!s || mode === 'none') return s;
  if (mode === 'caesar') {
    let sh = parseInt(p0, 10) || 3;
    return _alpha_shift(s, x => x + sh);
  }
  if (mode === 'rot13') return _alpha_shift(s, x => x + 13);
  if (mode === 'rot47') {
    let sh = parseInt(p0, 10) || 47;
    return s.split('').map(c => {
      let n = c.charCodeAt(0);
      return (n >= 33 && n <= 126) ? String.fromCharCode(33 + ((n - 33 + sh) % 94 + 94) % 94) : c;
    }).join('');
  }
  if (mode === 'atbash') return _alpha_shift(s, x => 25 - x);
  if (mode === 'vigenere') {
    let k = _clean_key(p0);
    return _alpha_shift(s, (x, i) => x + (k.charCodeAt(i % k.length) - 65));
  }
  if (mode === 'beaufort') {
    let k = _clean_key(p0);
    return _alpha_shift(s, (x, i) => (k.charCodeAt(i % k.length) - 65) - x);
  }
  if (mode === 'variant_beaufort') {
    let k = _clean_key(p0);
    return _alpha_shift(s, (x, i) => x - (k.charCodeAt(i % k.length) - 65));
  }
  if (mode === 'autokey') {
    let k = _clean_key(p0) + s.toUpperCase().replace(/[^A-Z]/g, '');
    return _alpha_shift(s, (x, i) => x + (k.charCodeAt(i) - 65));
  }
  if (mode === 'affine') {
    let a = parseInt(p0, 10) || 5, b = parseInt(p1, 10) || 8;
    return _alpha_shift(s, x => a * x + b);
  }
  if (mode === 'railfence') {
    let r = Math.max(2, parseInt(p0, 10) || 3), rails = Array.from({ length: r }, () => ''), row = 0, dir = 1;
    for (let i = 0; i < s.length; i++) {
      rails[row] += s[i];
      if (row === 0) dir = 1;
      else if (row === r - 1) dir = -1;
      row += dir;
    }
    return rails.join('');
  }
  if (mode === 'scytale') {
    let cols = Math.max(2, parseInt(p0, 10) || 4), rows = Math.ceil(s.length / cols), out = '';
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        let idx = r * cols + c;
        if (idx < s.length) out += s[idx];
      }
    }
    return out;
  }
  if (mode === 'columnar') {
    let k = String(p0 || 'SPIRE'), cols = k.length || 1, rows = Math.ceil(s.length / cols);
    let order = k.split('').map((ch, i) => ({ ch, i })).sort((a, b) => a.ch.localeCompare(b.ch) || a.i - b.i);
    let out = '';
    for (let o = 0; o < order.length; o++) {
      let c = order[o].i;
      for (let r = 0; r < rows; r++) {
        let idx = r * cols + c;
        out += idx < s.length ? s[idx] : 'X';
      }
    }
    return out;
  }
  if (mode === 'keyword') {
    let kw = _clean_key(p0) + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', alpha = '';
    for (let i = 0; i < kw.length; i++) if (!alpha.includes(kw[i])) alpha += kw[i];
    return s.split('').map(c => {
      let n = c.charCodeAt(0);
      if (n >= 65 && n <= 90) return alpha[n - 65];
      if (n >= 97 && n <= 122) return alpha[n - 97].toLowerCase();
      return c;
    }).join('');
  }
  if (mode === 'bacon') {
    let z = p0 === '01' ? ['0', '1'] : ['A', 'B'];
    return s.toUpperCase().split('').map(c => {
      let n = c.charCodeAt(0) - 65;
      if (n < 0 || n > 25) return c;
      return n.toString(2).padStart(5, '0').replace(/0/g, z[0]).replace(/1/g, z[1]);
    }).join(' ');
  }
  if (mode === 'a1z26') {
    let sep = p0 !== undefined ? p0 : '-';
    return s.toUpperCase().split('').map(c => {
      let n = c.charCodeAt(0) - 64;
      return (n >= 1 && n <= 26) ? String(n) : c;
    }).join(sep);
  }
  if (mode === 'morse') {
    let m = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '{': '-.--.', '}': '-.--.-', '_': '..--.-' };
    let ws = p0 || ' / ';
    return s.toUpperCase().split('').map(c => c === ' ' ? ws : (m[c] || c)).join(' ');
  }
  if (mode === 'tap') {
    let sep = p0 !== undefined ? p0 : ' ';
    return s.toUpperCase().replace(/K/g, 'C').split('').map(c => {
      let n = c.charCodeAt(0) - 65;
      if (n < 0 || n > 25) return c;
      if (n > 9) n--;
      return (Math.floor(n / 5) + 1) + '' + ((n % 5) + 1);
    }).join(sep);
  }
  if (mode === 'reverse') return s.split('').reverse().join('');
  if (mode === 'base64') {
    if (typeof CryptoJS !== 'undefined') return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(s));
    return btoa(unescape(encodeURIComponent(s)));
  }
  if (mode === 'base32') {
    let abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', bytes = new TextEncoder().encode(s), bits = '', out = '';
    for (let i = 0; i < bytes.length; i++) bits += bytes[i].toString(2).padStart(8, '0');
    while (bits.length % 5 !== 0) bits += '0';
    for (let i = 0; i < bits.length; i += 5) out += abc[parseInt(bits.slice(i, i + 5), 2)];
    while (out.length % 8 !== 0) out += '=';
    return out;
  }
  if (mode === 'hex') {
    let sep = p0 || '';
    return Array.from(new TextEncoder().encode(s)).map(b => b.toString(16).padStart(2, '0')).join(sep);
  }
  if (mode === 'binary') {
    let sep = p0 !== undefined ? p0 : ' ';
    return Array.from(new TextEncoder().encode(s)).map(b => b.toString(2).padStart(8, '0')).join(sep);
  }
  if (mode === 'octal') {
    let sep = p0 !== undefined ? p0 : ' ';
    return Array.from(new TextEncoder().encode(s)).map(b => b.toString(8).padStart(3, '0')).join(sep);
  }
  if (mode === 'decimal') {
    let sep = p0 !== undefined ? p0 : ' ';
    return Array.from(new TextEncoder().encode(s)).map(b => String(b)).join(sep);
  }
  if (mode === 'url') {
    return Array.from(new TextEncoder().encode(s)).map(b => '%' + b.toString(16).padStart(2, '0').toUpperCase()).join('');
  }
  if (mode === 'xor') {
    let k = new TextEncoder().encode(p0 || 'KEY'), b = new TextEncoder().encode(s);
    return Array.from(b).map((v, i) => (v ^ k[i % k.length]).toString(16).padStart(2, '0')).join('');
  }
  if (typeof CryptoJS !== 'undefined') {
    let pass = String(p0 || 'cascadia');
    if (mode === 'aes') return CryptoJS.AES.encrypt(s, pass).toString();
    if (mode === 'des') return CryptoJS.TripleDES.encrypt(s, pass).toString();
    if (mode === 'rc4') return CryptoJS.RC4.encrypt(s, pass).toString();
    if (mode === 'rabbit') return CryptoJS.Rabbit.encrypt(s, pass).toString();
    if (mode === 'md5') return CryptoJS.MD5(s).toString();
    if (mode === 'sha1') return CryptoJS.SHA1(s).toString();
    if (mode === 'sha256') return CryptoJS.SHA256(s).toString();
  }
  return s;
}

function get_flag_input() {
  let ib = document.getElementById('input_box'), pb = document.getElementById('prefix_box'), pcb = document.getElementById('prefix_cb');
  let lcb = document.getElementById('leet_cb'), ecb = document.getElementById('enc_full_cb'), csel = document.getElementById('crypto_select');
  let raw = ib ? ib.value : '', pref = pb ? pb.value : '', use_pref = pcb ? pcb.checked : false;
  let mode = csel ? csel.value : 'none';
  let o0 = document.getElementById('c_opt_0'), o1 = document.getElementById('c_opt_1');
  let p0 = o0 ? o0.value : undefined, p1 = o1 ? o1.value : undefined;
  let body = (lcb && lcb.checked) ? generate_flag('', raw) : raw;
  if (ecb && ecb.checked) {
    let full = use_pref ? (pref + '{' + body + '}') : body;
    return encode_cipher(full, mode, p0, p1);
  }
  let enc_body = encode_cipher(body, mode, p0, p1);
  return use_pref ? (pref + '{' + enc_body + '}') : enc_body;
}

window.addEventListener('DOMContentLoaded', init_crypto_ui);