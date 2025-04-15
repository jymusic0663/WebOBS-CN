var h = require('hyperscript')

function Transitions () {
  var self = this

  self.element = h('div.transitions',
                  h('label', '转场动画'))
}

Transitions.prototype.method = function () {
  var self = this
  
}
  
module.exports = Transitions