const canvas_el = document.getElementById('canvas_el');
const ctx = canvas_el.getContext('2d');
const input_box = document.getElementById('input_box');
const rec_btn = document.getElementById('rec_btn');
const split_cb = document.getElementById('split_cb');

const recorder = new gif_generator(canvas_el, rec_btn);
const grid_manager = new grid_maker(canvas_el, ctx);

const ciphers = {
  'poly': new polybius_cipher(canvas_el, ctx),
  'pig': new pigpen_cipher(canvas_el, ctx),
  'radar': new radar_cipher(canvas_el, ctx),
  'circuit': new circuit_cipher(canvas_el, ctx)
};

let current_cipher = null;
let anim_frame = null;

window.generate_grid = function() {
  let c_type = document.getElementById('cipher_select').value;
  let input_val = input_box.value;
  document.getElementById('opt_poly').style.display = c_type === 'poly' ? 'block' : 'none';
  document.getElementById('opt_radar').style.display = c_type === 'radar' ? 'block' : 'none';
  current_cipher = ciphers[c_type];
  current_cipher.generate(input_val);
  if (!anim_frame) {
    draw_frame();
  }
};

window.start_recording = function() {
  recorder.start_recording(split_cb.checked, current_cipher.split_y);
};

function draw_frame() {
  let theme_id = document.getElementById('theme_sel').value;
  let custom_hex = document.getElementById('c_pick').value;
  let colors = theme_manager.get_theme(theme_id, custom_hex, canvas_el, ctx);
  grid_manager.draw_background(colors);
  if (current_cipher) {
    current_cipher.draw(colors);
  }
  recorder.check_start(grid_manager.scan_p);
  let reset_happened = grid_manager.draw_scanline(colors, split_cb.checked, current_cipher ? current_cipher.split_y : 0);
  recorder.capture_frame();
  recorder.check_stop(reset_happened);
  anim_frame = requestAnimationFrame(draw_frame);
}

window.generate_grid();