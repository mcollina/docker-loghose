
var through = require('through2')
var data = require('./data')
var expect = require('chai').expect

function expectedData (line) {
  var clone = JSON.parse(JSON.stringify(data.sampleOutput))
  clone.line = line
  return clone
}

function buildHeader (line) {
  var buffer = new Buffer(8)
  buffer.writeUInt32BE(1, 0)
  buffer.writeUInt32BE(line.length, 4)
  return buffer
}

function buildBufferFromString (string) {
  if (/^0\.10.+/.test(process.versions.node)) {
    return new Buffer(string.length + 8, 'utf-8')
  } else {
    return new Buffer(Buffer.byteLength(string, 'utf-8') + 8)
  }
}

module.exports.buildHeader = buildHeader

module.exports.buildBufferFromString = buildBufferFromString

module.exports.buildBuffer = function (line) {
  var string = new Buffer(line, 'utf-8')
  var buffer = buildBufferFromString(string)
  buildHeader(string).copy(buffer)
  string.copy(buffer, 8)
  return buffer
}

module.exports.expectData = function (lineParser, data, done) {
  var index = 0
  lineParser.pipe(through.obj(function (chunk, enc, cb) {
    expect(chunk).to.have.property('time')
    expect(chunk.time).to.be.a('number')
    expect(chunk.time).to.be.at.most(Date.now())
    expect(chunk.time).to.be.at.least(Date.now() - 100)
    delete chunk.time
    expect(chunk).to.deep.equals(expectedData(data[index]))
    if (index === data.length - 1) {
      done()
    }
    index++
    cb()
  }))
}

module.exports.writeChunks = function (parser, chunks) {
  chunks.forEach(function (chunk) {
    parser.write(chunk)
  })
  parser.end()
}
