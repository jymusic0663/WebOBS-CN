var h = require('hyperscript')
var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')
var vex = require('vex-js')
require('./../../../less/vex.css')
require('./../../../less/vex-theme-plain.css')

inherits(Controls, EventEmitter)

function Controls (opts) {
  var self = this
  self.opts = opts
  self._startedStream = false
  self._startButton = h('button.stopped', {onclick: self.clickStream.bind(self)}, '开始直播')
  self._startButton.style.marginTop = '10px'

  // 添加录制按钮
  self._startedRecording = false
  self._recordButton = h('button.default', {onclick: self.clickRecord.bind(self)}, '开始录制')
  self._recordButton.style.marginTop = '5px'
  
  // 添加设置按钮
  self._settingsButton = h('button.settings-btn', {onclick: self.showSettings.bind(self)}, '设置')
  self._settingsButton.style.marginTop = '5px'
  
  var label = h('label')
  label.innerHTML = '&nbsp;'
  
  self.element = h('div.controls',
                    label,
                    self._startButton,
                    self._recordButton,
                    self._settingsButton
                  )
}

Controls.prototype.clickStream = function () {
  var self = this
  
  if (self._startedStream) {
    self._startButton.innerHTML = '开始直播'
    self._startButton.className = 'stopped'
    self.emit('stopstream')
  } else {
    self._startButton.innerHTML = '停止直播'
    self._startButton.className = 'started'
    self.emit('stream')
  }
  
  self._startedStream = !self._startedStream
}

Controls.prototype.clickRecord = function () {
  var self = this
  if (self._startedRecording) {
    self.emit('stoprecord')
    self._recordButton.innerHTML = '开始录制'
    self._recordButton.className = 'default'
  } else {
    self.emit('startrecord')
    self._recordButton.innerHTML = '停止录制'
    self._recordButton.className = 'started'
  }
  self._startedRecording = !self._startedRecording
}

// 添加设置弹窗方法
Controls.prototype.showSettings = function() {
  var self = this;
  vex.dialog.open({
    message: '直播设置',
    input: [
      '<label>SRS推流地址(rtc)</label>',
      '<input type="text" name="url" value="' + self.opts.server.url + '">',
      '<label>分辨率宽度</label>',
      '<input type="number" name="width" value="' + self.opts.output.width + '">',
      '<label>分辨率高度</label>',
      '<input type="number" name="height" value="' + self.opts.output.height + '">',
      '<label>帧率(FPS)</label>',
      '<input type="number" name="fps" value="' + self.opts.output.fps + '">',
      '<label>码率(Kbps)</label>',
      '<input type="number" name="bitrate" value="' + (self.opts.output.bitrate/1000) + '">'
    ].join(''),
    buttons: [
      {
        text: '清除设置', 
        type: 'button',
        className: 'vex-dialog-button-danger',
        click: function() {
          self.emit('clearSettings');
          vex.dialog.close();
        }
      },
      Object.assign({}, vex.dialog.buttons.NO, { text: '取消', className: 'vex-dialog-button-secondary' }),
      Object.assign({}, vex.dialog.buttons.YES, { text: '保存', className: 'vex-dialog-button-primary' })
    ],
    callback: function(data) {
      if (data) {
        self.emit('saveSettings', data)
      }
    }
  })
}

module.exports = Controls