/* global describe it beforeEach */
var parser = require('../../lib/parser')
var helper = require('../helper.js')
var expect = require('chai').expect

var testData = require('../data')
var sampleOutput = testData.sampleOutput

describe('The parser', function () {
  var p

  beforeEach(function (done) {
    p = parser(sampleOutput, {})
    done()
  })

  it('is an object', function (done) {
    expect(p).to.be.an('object')
    done()
  })

  it('outputs the chunk wrapped in an object', function (done) {
    helper.expectData(p, [testData.inputLine], done)

    helper.writeChunks(p, [helper.buildBuffer(testData.inputLine + '\n')])
  })

  describe('when the sequence of chunks is [header-data] [data]', function () {
    it('outputs a single entry', function (done) {
      var firstPayload = new Buffer(testData.verseOne + testData.verseTwo, 'utf-8')
      var firstBuffer = helper.buildBufferFromString(firstPayload)
      var secondBuffer = new Buffer(testData.rest)

      helper.buildHeader(new Buffer(testData.inputLine, 'utf-8')).copy(firstBuffer)
      firstPayload.copy(firstBuffer, 8)

      helper.expectData(p, [testData.inputLine], done)

      helper.writeChunks(p, [firstBuffer, secondBuffer])
    })
  })

  describe('when is sent multiple chunks', function () {
    it('outputs each chunk separately', function (done) {
      var data = [testData.verseOne, testData.verseTwo, testData.rest]

      helper.expectData(p, data, done)

      helper.writeChunks(p, data.map(function (chunk) { return helper.buildBuffer(chunk) }))
    })
  })
})
