class input_filter {
  static get_filtered_chars(raw_input, max_chars = null) {
    let raw_val = String(raw_input || '').replace(/[^\x21-\x7E]/g, '');
    let mixed_case = /[A-Z]/.test(raw_val) && /[a-z]/.test(raw_val);
    let clean_val = mixed_case ? raw_val : raw_val.toUpperCase();
    let unique_chars = [...new Set(clean_val)];
    if (max_chars) {
      unique_chars = unique_chars.slice(0, max_chars);
      clean_val = [...clean_val].filter(c => unique_chars.includes(c)).join('');
    }
    let leftovers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}".split('').filter(a => !unique_chars.includes(a));
    let lowercase_leftovers = mixed_case ? 'abcdefghijklmnopqrstuvwxyz'.split('').filter(a => !unique_chars.includes(a)) : [];
    return { clean_val, unique_chars, leftovers, lowercase_leftovers, mixed_case };
  }

  static get_random_leftovers(filter_data, count) {
    let regular = filter_data.leftovers.slice().sort(() => Math.random() - 0.5);
    if (!filter_data.mixed_case || count <= 0) return regular.slice(0, count);
    let lowercase = filter_data.lowercase_leftovers.slice().sort(() => Math.random() - 0.5);
    let lowercase_count = Math.min(4, count, lowercase.length);
    return [
      ...lowercase.slice(0, lowercase_count),
      ...regular.slice(0, count - lowercase_count)
    ].sort(() => Math.random() - 0.5);
  }
}