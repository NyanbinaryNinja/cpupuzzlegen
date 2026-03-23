class media_recorder_script {
  constructor(canvas_el, rec_btn) {
    this.canvas_el = canvas_el;
    this.rec_btn = rec_btn;
    this.rec_state = 0;
    this.media_rec = null;
    this.chunk_data = [];
  }

  start_recording() {
    if (this.rec_state === 0) {
      this.rec_state = 1;
      this.rec_btn.innerText = "RECORDING...";
    }
  }

  check_start(scan_y) {
    if (this.rec_state === 1 && scan_y === 0) {
      this.chunk_data = [];
      this.media_rec = new MediaRecorder(this.canvas_el.captureStream(60));
      this.media_rec.ondataavailable = event => this.chunk_data.push(event.data);
      this.media_rec.onstop = () => {
        let download_link = document.createElement('a');
        download_link.href = URL.createObjectURL(new Blob(this.chunk_data, { type: 'video/webm' }));
        download_link.download = 'puzzle.webm';
        download_link.click();
        this.rec_btn.innerText = "Record File";
      };
      this.media_rec.start();
      this.rec_state = 2;
    }
  }

  check_stop(reset_happened) {
    if (reset_happened && this.rec_state === 2) {
      this.media_rec.stop();
      this.rec_state = 0;
    }
  }
}