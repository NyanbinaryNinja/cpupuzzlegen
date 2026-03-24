function generate_flag(prefix, flag) {
  let leet_map = {'a':'4', 'e':'3', 'i':'1', 'o':'0', 't':'7', 's':'5', 'g':'9'};
  let leet_flag = '';
  for (let char of flag) {
    let variants = [char.toUpperCase(), char.toLowerCase()];
    let lower = char.toLowerCase();
    if (leet_map[lower]) variants.push(leet_map[lower]);
    leet_flag += variants[Math.floor(Math.random() * variants.length)];
  }
  return prefix + '{' + leet_flag + '}';
}

function generate_custom_flag() {
  let prefix = document.getElementById('prefix_input').value;
  let flag = document.getElementById('flag_input').value;
  let output = generate_flag(prefix, flag);
  document.getElementById('flag_output').value = output;
  if (document.getElementById('add_to_cipher_cb').checked) {
    document.getElementById('input_box').value += output;
  }
}