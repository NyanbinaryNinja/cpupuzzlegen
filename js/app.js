const canvas_el = document.getElementById('canvas_el');
const ctx = canvas_el.getContext('2d');
const input_box = document.getElementById('input_box');
const rec_btn = document.getElementById('rec_btn');
const generate_btn = document.getElementById('generate_btn');
const split_cb = document.getElementById('split_cb');
const input_fieldset = document.getElementById('input_fieldset');
const split_fieldset = document.getElementById('split_fieldset');
const spectrogram_options = document.getElementById('opt_spectrogram');

const recorder = new gif_generator(canvas_el, rec_btn);
const grid_manager = new grid_maker(canvas_el, ctx);
const fx = new effects_manager(canvas_el, ctx);
window.fx = fx;

const ciphers = {
  'poly': new polybius_cipher(canvas_el, ctx),
  'pig': new pigpen_cipher(canvas_el, ctx),
  'radar': new radar_cipher(canvas_el, ctx),
  'circuit': new circuit_cipher(canvas_el, ctx),
  'maze': new maze_cipher(canvas_el, ctx),
  'pcap': pcap
};

let current_cipher = null;
let anim_frame = null;

spectrogram.init(canvas_el, ctx);
pcap.init(canvas_el, ctx);

window.generate_grid = async function() {
  let c_type = document.getElementById('cipher_select').value;
  let input_val = input_box.value;
  document.getElementById('opt_poly').style.display = c_type === 'poly' ? 'block' : 'none';
  document.getElementById('opt_radar').style.display = c_type === 'radar' ? 'block' : 'none';
  document.getElementById('opt_maze').style.display = c_type === 'maze' ? 'block' : 'none';
  spectrogram_options.style.display = c_type === 'spectrogram' ? 'block' : 'none';
  split_fieldset.style.display = c_type === 'spectrogram' || c_type === 'pcap' ? 'none' : 'block';
  if (c_type === 'spectrogram') spectrogram.set_image_mode(spectrogram.use_image);
  else { spectrogram.hide(); }
  if (c_type === 'pcap') { pcap.show(); pcap.set_image_mode(pcap.use_image); input_fieldset.style.display = 'flex'; }
  else { pcap.hide(); input_fieldset.style.display = 'flex'; }
  generate_btn.textContent = c_type === 'spectrogram' ? 'Generate Spectrogram' : c_type === 'pcap' ? 'Generate PCAP' : 'Generate Grid';
  rec_btn.disabled = false;
  if (c_type === 'spectrogram') {
    current_cipher = spectrogram;
    rec_btn.disabled = true;
    try {
      await spectrogram.gen(input_val);
    } catch (error) {
      console.error('Unable to generate spectrogram:', error);
    } finally {
      rec_btn.disabled = false;
    }
    return;
  }
  if (c_type === 'pcap') {
    current_cipher = pcap;
    try {
      await pcap.gen(input_val);
    } catch (error) {
      console.error('Unable to generate pcap:', error);
    }
    return;
  }
  current_cipher = ciphers[c_type];
  current_cipher.generate(input_val);
  if (!anim_frame) {
    draw_frame();
  }
};

window.toggle_spectrogram_image = function(enabled) {
  spectrogram.set_image_mode(enabled);
};

window.start_recording = function() {
  if (current_cipher === spectrogram) return spectrogram.save();
  if (current_cipher === pcap) return pcap.save();
  recorder.start_recording(split_cb.checked, current_cipher.split_y);
};

function draw_frame() {
  if (current_cipher === spectrogram) {
    current_cipher.draw();
    anim_frame = requestAnimationFrame(draw_frame);
    return;
  }
  let theme_id = document.getElementById('theme_sel').value;
  let custom_hex = document.getElementById('c_pick').value;
  let colors = theme_manager.get_theme(theme_id, custom_hex, canvas_el, ctx);
  grid_manager.draw_background(colors);
  if (current_cipher) {
    current_cipher.draw(colors);
  }
  recorder.check_start(grid_manager.scan_p);
  let reset_happened = grid_manager.draw_scanline(colors, split_cb.checked, current_cipher ? current_cipher.split_y : 0);
  fx.apply_effects();
  recorder.capture_frame();
  recorder.check_stop(reset_happened);
  anim_frame = requestAnimationFrame(draw_frame);
}

window.generate_grid();
fx.init_ui();