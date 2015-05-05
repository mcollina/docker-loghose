# docker-loghose

Collect all the logs from all docker containers

## Install

As a command line tool:

```bash
npm install docker-loghose -g
```

Embedded usage

```bash
npm install docker-loghose --save
```

## Embedded Usage

```js
var loghose = require('loghose')
var opts = {
  json: false, // parse the lines that are coming as JSON
  docker: null, // here goes options for Dockerode
  events: null, // an instance of docker-allcontainers

  // the following options limit the containers being matched
  // so we can avoid catching logs for unwanted containers
  matchByName: /hello/, // optional
  matchByImage: /matteocollina/, //optional
  skipByName: /.*pasteur.*/, //optional
  skipByImage: /.*dockerfile.*/ //optional
}
loghose(opts).pipe(through.obj(function(chunk, enc, cb) {
  this.push(JSON.stringify(chunk))
  this.push('\n')
  cb()
})).pipe(process.stdout)
```

## Command Line Usage

```bash
docker-loghose [--json] [--help]
               [--matchByImage REGEXP] [--matchByName REGEXP]
               [--skipByImage REGEXP] [--skipByName REGEXP]
```

## Docker Usage

```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock matteocollina/docker-loghose
```

## Data format

```js
{
  v: 0,
  id: "3324acd73ad5ed7aa5d35675fd3e5f34d8a3ee4ea77c19239cfa113e47d0ddce",
  image: "myimage:latest",
  line: "This is a log line" // this will be an object if opts.jon is true
}
```

Acknowledgements
----------------

This project was kindly sponsored by [nearForm](http://nearform.com).


## License

MIT
