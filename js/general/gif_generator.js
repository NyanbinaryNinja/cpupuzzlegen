class gif_generator {
  constructor(canvas_el, rec_btn) {
    this.canvas_el = canvas_el;
    this.rec_btn = rec_btn;
    this.rec_state = 0;
    this.frames = [];
    this.frames2 = [];
    this.split_mode = false;
    this.split_y = 0;
  }

  start_recording(split_mode, split_y) {
    if (this.rec_state === 0) {
      this.rec_state = 1;
      this.split_mode = split_mode;
      this.split_y = split_y;
      this.rec_btn.innerText = "RECORDING...";
      this.frames = [];
      this.frames2 = [];
    }
  }

  check_start(scan_y) {
    if (this.rec_state === 1 && scan_y === 0) {
      this.rec_state = 2;
    }
  }

  capture_frame() {
    if (this.rec_state === 2) {
      if (this.split_mode) {
        let c1 = document.createElement('canvas');
        c1.width = this.canvas_el.width;
        c1.height = this.split_y;
        c1.getContext('2d').drawImage(this.canvas_el, 0, 0, this.canvas_el.width, this.split_y, 0, 0, this.canvas_el.width, this.split_y);
        this.frames.push(c1);

        let c2 = document.createElement('canvas');
        c2.width = this.canvas_el.width;
        c2.height = this.canvas_el.height - this.split_y;
        c2.getContext('2d').drawImage(this.canvas_el, 0, this.split_y, this.canvas_el.width, c2.height, 0, 0, this.canvas_el.width, c2.height);
        this.frames2.push(c2);
      } else {
        let c = document.createElement('canvas');
        c.width = this.canvas_el.width;
        c.height = this.canvas_el.height;
        c.getContext('2d').drawImage(this.canvas_el, 0, 0);
        this.frames.push(c);
      }
    }
  }

  check_stop(reset_happened) {
    if (reset_happened && this.rec_state === 2) {
      this.rec_state = 0;
      this.rec_btn.innerText = "PROCESSING...";
      this.process_gif();
    }
  }

  async process_gif() {
    let req = await fetch('https://cdn.jsdelivr.net/npm/gif.js/dist/gif.worker.js');
    let worker_blob = await req.blob();
    let worker_url = URL.createObjectURL(worker_blob);

    if (this.split_mode) {
      await this.save_file(this.frames, 'key.gif', worker_url);
      await this.save_file(this.frames2, 'grid.gif', worker_url);
    } else {
      await this.save_file(this.frames, 'puzzle.gif', worker_url);
    }
    this.rec_btn.innerText = "Record File";
  }

  save_file(frames_arr, default_name, worker_url) {
    return new Promise((resolve) => {
      let gif = new window.GIF({ workers: 2, quality: 10, workerScript: worker_url });
      frames_arr.forEach(cvs => gif.addFrame(cvs, { delay: 33 }));
      gif.on('finished', async (blob) => {
        try {
          let handle = await window.showSaveFilePicker({
            suggestedName: default_name,
            types: [{ description: 'GIF Image', accept: { 'image/gif': ['.gif'] } }]
          });
          let stream = await handle.createWritable();
          await stream.write(blob);
          await stream.close();
        } catch (e) {
          let a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = default_name;
          a.click();
        }
        resolve();
      });
      gif.render();
    });
  }
}