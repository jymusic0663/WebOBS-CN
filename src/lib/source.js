// wraps an input MediaStream

var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')
var cuid = require('cuid')

inherits(Source, EventEmitter)

function Source (streamData, name, hasVideo) {
  var self = this

  self.stream = streamData.stream || streamData || null
  self.id = self.stream.id || cuid()
  self.name = name || '来源'
  self.hasVideo = ('hasVideo' in streamData) ? streamData.hasVideo : false;
  self.hasAudio = ('hasAudio' in streamData) ? streamData.hasAudio : false;
  self.mover = null
}

Source.prototype.destroy = function () {
  var self = this
  
  self.stream = null
  self.id = null
  self.name = null
  if (self.mover) self.mover.destroy()
  self.mover = null
}
  
module.exports = Source