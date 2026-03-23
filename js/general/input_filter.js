class input_filter {
  static get_filtered_chars(raw_input, max_chars = null) {
    let clean_val = raw_input.toUpperCase().replace(/[^A-Z0-9{}]/g, '');
    let unique_chars = [...new Set(clean_val)];
    if (max_chars) {
      unique_chars = unique_chars.slice(0, max_chars);
    }
    let leftovers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}".split('').filter(a => !unique_chars.includes(a));
    return { clean_val, unique_chars, leftovers };
  }
}