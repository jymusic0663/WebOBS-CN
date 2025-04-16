var vex = require('vex-js')
vex.registerPlugin(require('vex-dialog'))

require('./../../less/vex.css')
require('./../../less/vex-theme-plain.css')

vex.defaultOptions.className = 'vex-theme-plain'

var h = require('hyperscript')
var getusermedia = require('getusermedia')
var enumerateDevices = require('enumerate-devices')

function getMediaPermissions (cb) {
  getusermedia({audio: true, video:true}, cb)
}

function getReadableName (device, counter) {
  if (device.label) {
    return '['+formatKind(device.kind)+'] ' + device.label
  } else {
    return formatKind(device.kind)+ ' ' + counter
  }
}

function formatKind (kind) {
  switch (kind) {
    case 'audioinput':
      return '音频输入'
      break
    case 'videoinput':
      return '视频输入'
      break
    case 'audiooutput':
      return '音频输出'
      break
    case 'videooutput':
      return '视频输出'
      break
  }
}

function contains (str, substr) {
  return str.indexOf(substr) !== -1
}

function InputManager (opts) {
  var self = this

  self.inputs = opts.inputs
  var counter = -1

  self.inputs.forEach(device => {
    counter++
    device.id = counter
  })

  // add default inputs
  getMediaPermissions(function (err) {
    if (err) return console.error(err)

    self.inputs.push({
      id: ++counter,
      name: '图像资源',
      getStream: function (cb) {
        self.getFile(file => {
          const imageElement = document.createElement('img')
          const reader = new FileReader()
          console.log(file)
          reader.onload = function(event) {
            console.log('图像已加载')
            imageElement.src = event.target.result
            cb(null, file.name, true, imageElement)
          }
          reader.readAsDataURL(file)
        })
      }
    })

    if (navigator.mediaDevices.getDisplayMedia) {
      self.inputs.push({
        id: ++counter,
        name: '窗口获取',
        getStream: function (cb) {
          navigator.mediaDevices.getDisplayMedia({ audio: false, video: true }).then(stream => {
            cb(null, '窗口获取', true, stream)
          })
        }
      })
    }

    enumerateDevices().then((devices) => {
      devices.forEach(function (device) {
        var deviceName = getReadableName(device, counter)
        var hasVideo = contains(device.kind, 'video')
        self.inputs.push({
          id: ++counter,
          name: deviceName,
          getStream: function (cb) {
            getusermedia({
              audio: contains(device.kind, 'audio') ? {exact: device.deviceId}: undefined,
              video: contains(device.kind, 'video') ? {exact: device.deviceId} : undefined
            }, function (err, stream) {
              cb(err, deviceName, hasVideo, stream)
            })
          }
        })
      })
    })
  })
}

InputManager.prototype.getFile = function (cb) {
  var self = this
  
  vex.dialog.open({
    message: '选择文件',
    input: [
        '<style>',
            '.vex-custom-field-wrapper {',
                'margin: 1em 0;',
            '}',
            '.vex-custom-field-wrapper > label {',
                'display: inline-block;',
                'margin-bottom: .2em;',
            '}',
        '</style>',
        '<div class="vex-custom-field-wrapper">',
          '<input id="fileUpload" type="file" accept="image/jpeg, image/png, image/gif, image/svg+xml" />',
        '</div>'
    ].join(''),
    callback: function () {
        const file = document.querySelector('#fileUpload').files[0]
        if (!file) return
        cb(file)
    }
  })
}

InputManager.prototype.chooseDevice = function (cb) {
  var self = this
  
  vex.dialog.open({
    message: '选择窗口源',
    input: [
        '<style>',
            '.vex-custom-field-wrapper {',
                'margin: 1em 0;',
            '}',
            '.vex-custom-field-wrapper > label {',
                'display: inline-block;',
                'margin-bottom: .2em;',
            '}',
        '</style>',
        '<div class="vex-custom-field-wrapper">',
            '<div class="vex-custom-input-wrapper">',
                '<select name="chosen">',
                  self.inputs.map(function (a) {
                    return '<option value="'+a.id+'">'+a.name+'</option>'
                  }).join(''),
                '</select>',
            '</div>',
        '</div>'
    ].join(''),
    callback: function (data) {
        if (!data) return
        self.inputs[data.chosen].getStream(cb)
    }
  })
}
  
module.exports = InputManager