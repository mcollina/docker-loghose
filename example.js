
var through = require('through2')
var loghose = require('./')

var source = loghose({ json: true })

source.pipe(through.obj(function(chunk, enc, cb) {
  this.push(JSON.stringify(chunk))
  this.push('\n')
  cb()
})).pipe(process.stdout)

setTimeout(function() {
  source.destroy()
}, 2000)
