var parser = require('../../lib/parser')
var helper = require('../helper.js')
var expect = require('chai').expect

var testData = require('../data')
var sampleOutput = testData.sampleOutput

describe('The parser', function () {
  var lineParser

  beforeEach(function (done) {
    lineParser = parser(sampleOutput, {})
    done()
  })

  it('is an object', function (done) {
    expect(lineParser).to.be.an('object')
    done()
  })

  it('outputs the chunk wrapped in an object', function (done) {

    helper.expectData(lineParser, [testData.inputLine], done)

    helper.writeChunks(lineParser, [helper.buildBuffer(testData.inputLine + '\n')])
  })

  describe('when is sent multiple chunks', function () {
    it('outputs each chunk separately', function (done) {
      var data = [testData.verseOne, testData.verseTwo, testData.rest]

      helper.expectData(lineParser, data, done)

      helper.writeChunks(lineParser, data.map(function (chunk) { return helper.buildBuffer(chunk)}))
    })
  })
})
