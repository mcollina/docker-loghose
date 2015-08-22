var parser = require('../../src/parser')
var helper = require('../helper.js')

var testData = require('../data')
var sampleOutput = testData.sampleOutput

describe('The parser', function () {
  var lineParser

  describe('when passing --newline', function () {

    beforeEach(function (done) {
      lineParser = parser(sampleOutput, {newline: true})
      done()
    })

    describe('when sent a single chunk ending with a new line', function () {
      it('outputs the line', function (done) {
        helper.expectData(lineParser, [testData.inputLine], done)
        helper.writeChunks(lineParser, [helper.buildBuffer(testData.inputLine + '\n')])
      })
    })

    describe('when sent multiple chunks ending with new lines', function () {
      it('outputs the lines separately', function (done) {
        var data = [testData.verseOne, testData.verseTwo, testData.rest]
        helper.expectData(lineParser, data, done)
        helper.writeChunks(lineParser, data.map(function (c) { return helper.buildBuffer(c + '\n')}))
      })
    })

    describe('when sent a newline terminated string in multiple chunks', function () {
      it('outputs the chunks concatenated', function (done) {
        helper.expectData(lineParser, [testData.inputLine], done)
        helper.writeChunks(lineParser, [helper.buildBuffer(testData.verseOne), helper.buildBuffer(testData.verseTwo), helper.buildBuffer(testData.rest + '\n')])
      })
    })

    describe('when sent a chunk with multiple newlines', function () {
      it('outputs multiple newline delimited strings', function (done) {
        var inputData = [testData.verseOne + '\n' + testData.verseTwo, testData.rest + '\n']
        var outputData = [testData.verseOne, testData.verseTwo + testData.rest]

        helper.expectData(lineParser, outputData, done)

        helper.writeChunks(lineParser, inputData.map(function (c) { return helper.buildBuffer(c)}))

      })
    })

    it('merges incomplete buffers into one', function (done) {
      var data = ['abcd', 'efgh']

      helper.expectData(lineParser, data, done)

      var wholeBuffer = new Buffer(8 * 3 + 3 + testData.verseOne.length + testData.verseTwo.length + testData.rest.length)
      helper.buildBuffer('abcd\n').copy(wholeBuffer)
      helper.buildBuffer('efgh\n').copy(wholeBuffer, 8 + 5)
      helper.writeChunks(lineParser, [wholeBuffer])
    })
  })
})
