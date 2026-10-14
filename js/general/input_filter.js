class input_filter {
  static get_filtered_chars(raw_input, max_chars = null) {
    let clean_val = String(raw_input || '').toUpperCase().replace(/[^\x21-\x7E]/g, '');
    let unique_chars = [...new Set(clean_val)];
    if (max_chars) {
      unique_chars = unique_chars.slice(0, max_chars);
      clean_val = [...clean_val].filter(c => unique_chars.includes(c)).join('');
    }
    let leftovers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}".split('').filter(a => !unique_chars.includes(a));
    return { clean_val, unique_chars, leftovers };
  }
}