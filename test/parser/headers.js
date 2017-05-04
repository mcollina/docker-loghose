/* global describe it beforeEach */
var parser = require('../../lib/parser')
var helper = require('../helper.js')

var data = require('../data')

var sampleOutput = data.sampleOutput
var inputLine = data.inputLine

describe('The parser', function () {
  var p

  describe('when processing headers', function () {
    beforeEach(function (done) {
      p = parser(sampleOutput, {})
      done()
    })

    describe('split in two chunks', function () {
      it('consumes the headers correctly', function (done) {
        var firstFour = new Buffer(4)
        var lastFour = new Buffer(4)

        var line = new Buffer(inputLine + '\n')

        firstFour.writeUInt32BE(1, 0)
        lastFour.writeUInt32BE(line.length, 0)

        helper.expectData(p, [inputLine], done)

        helper.writeChunks(p, [firstFour, lastFour, line])
      })

      describe('where the last chunk contains both headers and payload data', function () {
        it('consumes the headers correctly', function (done) {
          var firstFour = new Buffer(4)
          var line = new Buffer(inputLine + '\n')
          var rest = new Buffer(4 + line.length)

          firstFour.writeUInt32LE(1, 0)
          rest.writeUInt32BE(line.length, 0)
          line.copy(rest, 4)

          helper.expectData(p, [inputLine], done)

          helper.writeChunks(p, [firstFour, rest])
        })
      })
    })
  })
})
