var through = require('through2')
var pump = require('pump')
var allContainers = require('docker-allcontainers')
var parser = require('./parser')

function loghose (opts) {
  opts = opts || {}
  var result = through.obj()
  var events = opts.events || allContainers(opts)
  var streams = {}
  var oldDestroy = result.destroy

  result.setMaxListeners(0)

  result.destroy = function () {
    Object.keys(streams).forEach(detachContainer)
    events.destroy()
    oldDestroy.call(this)
  }

  events.on('start', attachContainer)
  events.on('stop', function (meta) {
    detachContainer(meta.id)
  })

  function detachContainer (id) {
    if (streams[id]) {
      streams[id].destroy()
      delete streams[id]
    }
  }

  return result

  function attachContainer (data, container) {
    // we are trying to tap into this container
    // we should not do that, or we might be stuck in
    // an output loop
    if (!opts.includeCurrentContainer && data.id.indexOf(process.env.HOSTNAME) === 0) {
      return
    }

    container.inspect(function (err, info) {
      if (err) {
        throw err
      }

      container.attach({stream: true, stdout: true, stderr: true}, function (err, stream) {
        if (err) {
          throw err
        }

        opts.tty = info.Config.Tty

        streams[data.id] = stream
        pump(
            stream,
            parser(data, opts)
        ).pipe(result, {end: false})
      })
    })
  }
}

module.exports = loghose
