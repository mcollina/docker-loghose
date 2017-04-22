/* global describe it beforeEach */
var parser = require('../../lib/parser')
var helper = require('../helper.js')

var testData = require('../data')
var sampleOutput = testData.sampleOutput

describe('The parser', function () {
  var p

  describe('when passing --json', function () {
    describe('when not using --newline', function () {
      beforeEach(function (done) {
        p = parser(sampleOutput, {json: true})
        done()
      })

      describe('when sent a well formed json line', function () {
        it('outputs well formed json', function (done) {
          helper.expectData(p, [JSON.parse(testData.inputJSON)], done)
          helper.writeChunks(p, [helper.buildBuffer(testData.inputJSON + '\n')])
        })
      })

      describe('when sent well formed JSON in multiple chunks', function () {
        it('outputs the strings unchanged', function (done) {
          var data = [testData.jsonChunkOne, testData.jsonChunkTwo]
          helper.expectData(p, data, done)
          helper.writeChunks(p, [helper.buildBuffer(data[0]), helper.buildBuffer(data[1])])
        })
      })
    })

    describe('when using --newline', function () {
      beforeEach(function (done) {
        p = parser(sampleOutput, {json: true, newline: true})
        done()
      })

      describe('when sent JSON in multiple chunks', function () {
        it('outputs well formed JSON', function (done) {
          var data = [testData.jsonChunkOne, testData.jsonChunkTwo]
          helper.expectData(p, [JSON.parse(testData.inputJSON)], done)
          helper.writeChunks(p, [helper.buildBuffer(data[0]), helper.buildBuffer(data[1] + '\n')])
        })
      })
    })
  })
})
