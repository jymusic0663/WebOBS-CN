(function (global, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    factory()(global);
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  class Recorder {
    constructor(opts = {}) {
      const supportedMimeTypes = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=h264",
        "video/webm",
      ].find((mime) => MediaRecorder.isTypeSupported(mime));

      this.opts = {
        mimeType: supportedMimeTypes || "video/webm",
        filename: `wbs-record-${Date.now()}.webm`,
        ...opts,
      };
      this.stream = null;
      this.recorder = null;
      this.chunks = [];
    }

    start() {
      if (!this.stream || this.stream.getTracks().length === 0) {
        throw new Error("No media tracks available in stream");
      }
      if (!this.recorder) {
        this.recorder = new MediaRecorder(this.stream, {
          mimeType: this.opts.mimeType,
        });
        this.chunks = [];
        this.recorder.ondataavailable = (e) => {
          this.chunks.push(e.data);
        };
      }
      if (this.recorder.state === "inactive") {
        this.recorder.start(1000); // 收集1秒的数据块
      }
    }

    stop() {
      return new Promise((resolve) => {
        this.recorder.onstop = () => {
          // 生成webm格式的Blob
          const blob = new Blob(this.chunks, { type: this.opts.mimeType });
          this.saveFile(blob);
          resolve();
        };
        this.recorder.state === "recording" && this.recorder.stop();
      });
    }

    saveFile(blob) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = this.opts.filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }
  return function (global) {
    global.WBSRecorder = Recorder;
  };
});
