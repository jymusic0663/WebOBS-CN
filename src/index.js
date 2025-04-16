var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')

var Display = require('./display/display')
var mixer = require('./lib/mixer')
var { SrsRtcWhipWhepAsync } = require('./lib/srs')

inherits(WBS, EventEmitter)

function WBS (element, opts) {
  var self = this
  if (!(self instanceof WBS)) return new WBS(element, opts)

  if (typeof element === 'string') {
    element = document.querySelector(element)
  }

  // 获取本地存储的配置
  const savedSettings = localStorage.getItem('wbsSettings');
  const storageOpts = savedSettings ? JSON.parse(savedSettings) : {};
  const defaultOpts = {
    output: {
      width: 640 * 3,
      height: 360 * 3,
      fps: 30,
      bitrate: 3000000
    },
    server: { url: '' },
    inputs: [],
    injectStyles: true
  };
  opts = {
    ...defaultOpts,
    ...(opts || {}),
    ...storageOpts
  };

  var audioContext = new AudioContext()
  mixer.setAudioContext(audioContext)
  opts.output = {
    ...opts.output,
    audioContext: audioContext
  }
  self.opts = opts
  self._srssdk = new SrsRtcWhipWhepAsync();
  
  if (opts.injectStyles) require('./../less/wbs.css')

  self._display = new Display(element, opts)
  self._display.on('saveSettings', (newSettings) => {
    self.opts.server.url = newSettings.url
    self.opts.output.width = parseInt(newSettings.width)
    self.opts.output.height = parseInt(newSettings.height)
    self.opts.output.fps = parseInt(newSettings.fps)
    self.opts.output.bitrate = parseInt(newSettings.bitrate) * 1000
    localStorage.setItem('wbsSettings', JSON.stringify({
      ...self.opts.server,
      output: {
        width: parseInt(newSettings.width),
        height: parseInt(newSettings.height),
        fps: parseInt(newSettings.fps),
        bitrate: parseInt(newSettings.bitrate) * 1000
      }
    }));
  })
  self._display.on('clearSettings', function (stream) {
    localStorage.removeItem('wbsSettings');
    location.reload();
  })
  self._display.on('stream', function (stream) {
    self.emit('stream', stream)
  })
  self._display.on('stopstream', function () {
    self.emit('stopstream')
  })
}

// 添加推流方法
WBS.prototype.startSRSStreaming = function(stream) {
  const self = this;
  self._srssdk.stream = stream;
  self._srssdk.publish(self.opts.server.url, {
    videoOnly: false,
    audioOnly: false,
    width: self.opts.output.width,
    height: self.opts.output.height,
    bitrate: self.opts.output.bitrate,
    fps: self.opts.output.fps
  }).catch(err => {
    setTimeout(() => self.startStreaming(stream), 1000);
  });
}
WBS.prototype.stopSRSStreaming = function() {
  if (this._srssdk) {
    this._srssdk.close();
    this._srssdk = new SrsRtcWhipWhepAsync();
  }
}
module.exports = WBS
