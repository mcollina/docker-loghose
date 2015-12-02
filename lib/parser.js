var through = require('through2')
var bl = require('bl')

function parser (data, opts) {
  var toLine = opts.json ? toLineJSON : toLineString

  var result = through.obj(parse)

  result.payload = bl()
  result.headers = bl()
  result.currentLength = 0
  result.payloadLength = 0
  result.readingHeader = true

  return result

  function parse (chunk, enc, cb) {
    var buffer = bl(chunk)

    while (buffer.length) {
      if (this.readingHeader) {

        readAndConsume(buffer, this.headers, 8 - this.headers.length)

        if (this.headers.length !== 8) {
          return cb()
        }

        this.readingHeader = false
        this.payloadLength = this.headers.readUInt32BE(4)
        this.headers.consume(8)
      }

      if (!buffer.length) {
        return cb()
      }

      var pointer = this.payloadLength - this.currentLength

      readAndConsume(buffer, this.payload, pointer)

      this.currentLength += pointer

      this.readingHeader = true
      this.currentLength = 0
      this.payloadLength = 0
    }

    if (opts.newline) {
      var lines = this.payload.toString().split('\n')

      lines.forEach(function (line) {
        this.push(buildObject(line))
        this.payload.consume(new Buffer(line + '\n').length)
      }.bind(this))
    } else {
      this.push(buildObject(this.payload))
      this.payload.consume(this.payload.length)
    }

    return cb()
  }

  function buildObject (chunk) {
    return {
      v: 0,
      id: data.id.slice(0, 12),
      image: data.image,
      name: data.name,
      line: toLine(chunk)
    }
  }

  function toLineJSON (line) {
    try {
      return JSON.parse(line)
    } catch(err) {
      return toLineString(line)
    }
  }

  function toLineString (line) {
    return line.toString()
  }

  function readAndConsume (src, dest, count) {
    dest.append(src.slice(0, count))
    src.consume(count)
    return count
  }
}

module.exports = parser
