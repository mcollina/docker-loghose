#! /usr/bin/env node

var nes = require('never-ending-stream')
var through = require('through2')
var bl = require('bl')
var pump = require('pump')
var allContainers = require('docker-allcontainers')
var minimist = require('minimist')

function loghose (opts) {
  opts = opts || {}
  var result = through.obj()
  var events = opts.events || allContainers(opts)
  var streams = {}
  var oldDestroy = result.destroy
  var toLine = opts.json ? toLineJSON : toLineString

  result.setMaxListeners(0)

  result.destroy = function() {
    Object.keys(streams).forEach(detachContainer)
    events.destroy()
    oldDestroy.call(this)
  }

  events.on('start', attachContainer)
  events.on('stop', function(meta) {
    detachContainer(meta.id)
  })

  function detachContainer(id) {
    if (streams[id]) {
      streams[id].destroy()
      delete streams[id]
    }
  }

  return result

  function attachContainer(data, container) {
    // we are trying to tap into this container
    // we should not do that, or we might be stuck in
    // an output loop
    if (data.id.indexOf(process.env.HOSTNAME) === 0) {
      return
    }
    var stream = nes(function(cb) {
          container.attach({stream: true, stdout: true, stderr: true}, cb)
        })

    var filter = through.obj(parse)
    filter.list = bl()
    filter.data = data
    filter.length = 0
    filter.readingHeader = true

    streams[data.id] = stream
    pump(
      stream,
      filter
    ).pipe(result, { end: false })
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

  function parse(chunk, enc, cb) {
    if (chunk) {
      this.list.append(chunk)
    }

    if (this.readingHeader) {
      if (this.list.length < 8) {
        // nothing to do
        return cb()
      }
      // weird protocol by Docker
      // https://docs.docker.com/reference/api/docker_remote_api_v1.16/#attach-to-a-container
      this.length = this.list.readUInt32BE(4)
      this.list.consume(8)
      this.readingHeader = false
    }

    if (this.list.length < this.length) {
      return cb()
    }

    this.push({
      v: 0,
      id: this.data.id.slice(0, 12),
      image: this.data.image,
      name: this.data.name,
      line: toLine(this.list.slice(0, this.length))
    })
    this.list.consume(this.length)
    this.readingHeader = true
    this._transform(null, enc, cb)
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
    console.log('Usage: docker-loghose [--json] [--help]\n' +
                '                      [--matchByImage REGEXP] [--matchByName REGEXP]\n' +
                '                      [--skipByImage REGEXP] [--skipByName REGEXP]')
    process.exit(1)
  }

  loghose({
    matchByName: argv.matchByName,
    matchByImage: argv.matchByImage,
    skipByName: argv.skipByName,
    skipByImage: argv.skipByImage,
    json: argv.json
  }).pipe(through.obj(function(chunk, enc, cb) {
    this.push(JSON.stringify(chunk))
    this.push('\n')
    cb()
  })).pipe(process.stdout)
}

if (require.main === module) {
  cli()
}
