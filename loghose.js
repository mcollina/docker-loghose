#! /usr/bin/env node

var nes = require('never-ending-stream')
var through = require('through2')
var split = require('split2')
var Docker = require('dockerode')
var pump = require('pump')

function loghose (opts) {
  var docker = new Docker(opts)
  var result = through.obj()
  var events = nes(function(cb) {
        docker.getEvents(cb)
      })
  var streams = {}
  var oldDestroy = result.destroy

  result.destroy = function() {
    Object.keys(streams).forEach(function(stream) {
      stream.destroy()
    })
    oldDestroy.call(this)
  }

  events.pipe(through(function(chunk, enc, cb) {
    var data = JSON.parse(chunk)
    if (data.status === 'start') {
      data.Id = data.id
      data.Image = data.from
      attachContainer(data)
    } else if (data.status === 'stop' || data.status === 'die') {
      if (streams[data.id]) {
        streams[data.id].destroy()
        delete streams[data.id]
      }
    }
    cb()
  }))

  docker.listContainers(function(err, containers) {
    if (err) {
      return result.emit('error', err);
    }
    containers.forEach(attachContainer);
  });

  return result

  function attachContainer(data) {
    var container = docker.getContainer(data.Id);
    var stream = nes(function(cb) {
          container.attach({stream: true, stdout: true, stderr: true}, cb)
        })
    streams[data.Id] = stream
    pump(
      stream,
      split(),
      through.obj(function(chunk, enc, cb) {
        this.push({
          v: 0,
          id: data.Id,
          image: data.Image,
          line: chunk
        })
        cb()
      }))
      .pipe(result, { end: false })
  }
}

module.exports = loghose

if (require.main === module) {
  loghose().pipe(through.obj(function(chunk, enc, cb) {
    this.push(JSON.stringify(chunk))
    this.push('\n')
    cb()
  })).pipe(process.stdout)
}
