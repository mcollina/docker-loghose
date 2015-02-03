#! /usr/bin/env node

var nes = require('never-ending-stream')
var through = require('through2')
var Docker = require('dockerode')
var bl = require('bl')
var pump = require('pump')
var minimist = require('minimist')

function loghose (opts) {
  opts = opts || {}
  var docker = new Docker(opts.docker)
  var result = through.obj()
  var events = nes(function(cb) {
        docker.getEvents(cb)
      })
  var streams = {}
  var oldDestroy = result.destroy
  var toLine = opts.json ? toLineJSON : toLineString

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
      return result.emit('error', err)
    }
    containers.forEach(attachContainer)
  })

  return result

  function attachContainer(data) {
    // we are trying to tap into this container
    // we should not do that, or we might be stuck in
    // an output loop
    if (data.Id.indexOf(process.env.HOSTNAME) === 0) {
      return
    }
    var container = docker.getContainer(data.Id)
    var stream = nes(function(cb) {
          container.attach({stream: true, stdout: true, stderr: true}, cb)
        })
    var list = bl()
    var readingHeader = true
    var length = 0

    streams[data.Id] = stream
    pump(
      stream,
      through.obj(function(chunk, enc, cb) {
        list.append(chunk)
        parse(list, this)
        cb()
      })
    ).pipe(result, { end: false })

    function parse(list, filter) {
      if (readingHeader) {
        if (list.length < 8) {
          // nothing to do
          return
        }
        // weird protocol by Docker
        // https://docs.docker.com/reference/api/docker_remote_api_v1.16/#attach-to-a-container
        length = list.readUInt32BE(4)
        list.consume(8)
        readingHeader = false
      }

      if (list.length >= length) {
        filter.push({
          v: 0,
          id: data.Id.slice(0, 12),
          image: data.Image,
          line: toLine(list.slice(0, length))
        })
        list.consume(length)
        readingHeader = true
        parse(list, filter)
      }
    }
  }

  function toLineJSON(line) {
    try {
      return JSON.parse(line)
    } catch(err) {
      return toLineString(line)
    }
  }

  function toLineString(line) {
    return line.toString().trim()
  }
}

module.exports = loghose

function cli() {
  var argv = minimist(process.argv.slice(2), {
    boolean: ['json'],
    alias: {
      'help': 'h',
      'json': 'j'
    },
    default: {
      json: false
    }
  })

  if (argv.help) {
    console.log('Usage: docker-loghose [--json] [--help]')
    process.exit(1)
  }

  loghose({ json: argv.json }).pipe(through.obj(function(chunk, enc, cb) {
    this.push(JSON.stringify(chunk))
    this.push('\n')
    cb()
  })).pipe(process.stdout)
}

if (require.main === module) {
  cli()
}
