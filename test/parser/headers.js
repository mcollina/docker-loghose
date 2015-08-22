var parser = require('../../src/parser')
var helper = require('../helper.js')

var data = require('../data')

var sampleOutput = data.sampleOutput
var inputLine = data.inputLine

describe('The parser', function () {
  var lineParser

  describe('when processing headers', function () {

    beforeEach(function (done) {
      lineParser = parser(sampleOutput, {})
      done()
    })

    describe('split in two chunks', function () {
      it('consumes the headers correctly', function (done) {

        var firstFour = new Buffer(4)
        var lastFour = new Buffer(4)

        var line = new Buffer(inputLine + '\n')

        firstFour.writeUInt32LE(1)
        lastFour.writeUInt32BE(line.length)

        helper.expectData(lineParser, [inputLine], done)

        helper.writeChunks(lineParser, [firstFour, lastFour, line])

      })

      describe('where the last chunk contains both headers and payload data', function () {
        it('consumes the headers correctly', function (done) {

          var firstFour = new Buffer(4)
          var line = new Buffer(inputLine + '\n')
          var rest = new Buffer(4 + line.length)

          firstFour.writeUInt32LE(1)
          rest.writeUInt32BE(line.length)
          line.copy(rest, 4)

          helper.expectData(lineParser, [inputLine], done)

          helper.writeChunks(lineParser, [firstFour, rest])

        })
      })
    })
  })
})
