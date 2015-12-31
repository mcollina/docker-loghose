/* global describe it beforeEach */
var parser = require('../../lib/parser')
var helper = require('../helper.js')
var expect = require('chai').expect

var testData = require('../data')
var sampleOutput = testData.sampleOutput

function buildBuffer (line) {
  return new Buffer(line, 'utf-8')
}

describe('The parser when using tty options', function () {
  describe('when using a tty option', function () {
    var lineParser

    beforeEach(function (done) {
      lineParser = parser(sampleOutput, {tty: true})
      done()
    })

    it('is an object', function (done) {
      expect(lineParser).to.be.an('object')
      done()
    })

    it('outputs the chunk wrapped in an object', function (done) {
      helper.expectData(lineParser, [testData.inputLine], done)

      helper.writeChunks(lineParser, [buildBuffer(testData.inputLine + '\n')])
    })

    describe('when is sent multiple chunks', function () {
      it('outputs each chunk separately', function (done) {
        var data = [testData.verseOne, testData.verseTwo, testData.rest]

        helper.expectData(lineParser, data, done)

        helper.writeChunks(lineParser, data.map(function (chunk) { return buildBuffer(chunk) }))
      })
    })
  })
})
