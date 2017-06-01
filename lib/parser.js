var through = require('through2')
var bl = require('bl')

function parser (data, opts) {
  var toLine = opts.json ? toLineJSON : toLineString

  var result = through.obj(opts.tty ? parseTty : parse)

  var name = (data.labels && opts.nameLabel && data.labels[opts.nameLabel]) ? data.labels[opts.nameLabel] : data.name

  result.payload = bl()
  result.headers = bl()
  result.currentLength = 0
  result.payloadLength = 0
  result.readingHeader = true
  result.publish = publish

  return result

  function parseTty (chunk, enc, cb) {
    this.payload.append(chunk)

    this.publish()

    return cb()
  }

  function parse (chunk, enc, cb) {
    var buffer = bl(chunk)

    while (buffer.length) {
      if (this.readingHeader) {
        var readHeaders = buffer.shallowSlice(0, 8 - this.headers.length)

        this.headers.append(readHeaders)

        buffer = buffer.shallowSlice(readHeaders.length)

        if (this.headers.length !== 8) {
          return cb()
        }

        this.readingHeader = false
        this.payloadLength = this.headers.readUInt32BE(4)
        this.headers = this.headers.consume(8)
      }

      if (!buffer.length) {
        return cb()
      }

      var readPayload = buffer.shallowSlice(0, this.payloadLength - this.currentLength)
      this.payload.append(readPayload)
      buffer = buffer.shallowSlice(readPayload.length)

      this.currentLength += readPayload.length

      if (this.currentLength >= this.payloadLength) {
        this.readingHeader = true
        this.currentLength = 0
        this.payloadLength = 0
      } else {
        return cb()
      }
    }

    this.publish()

    return cb()
  }

  function publish () {
    if (opts.newline) {
      var lines = this.payload.toString().split('\n').slice(0, -1)
      lines.forEach(function (line) {
        this.push(buildObject(line))
        this.payload = this.payload.shallowSlice(Buffer.byteLength(line) + 1)
      }.bind(this))
    } else {
      this.push(buildObject(this.payload))
      this.payload.consume(this.payload.length)
    }
  }

  function buildObject (chunk) {
    return {
      v: 0,
      id: data.id.slice(0, 12),
      long_id: data.id,
      image: data.image,
      name: name,
      time: Date.now(),
      line: toLine(chunk)
    }
  }

  function toLineJSON (line) {
    try {
      return JSON.parse(line)
    } catch (err) {
      return toLineString(line)
    }
  }

  function toLineString (line) {
    return line.toString().replace(/\n$/, '')
  }
}

module.exports = parser
