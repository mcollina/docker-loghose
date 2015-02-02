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

```
var loghose = require('loghose')
loghose().pipe(through.obj(function(chunk, enc, cb) {
  this.push(JSON.stringify(chunk))
  this.push('\n')
  cb()
})).pipe(process.stdout)
```

## Data format

```js
{
  v: 0,
  id: "3324acd73ad5ed7aa5d35675fd3e5f34d8a3ee4ea77c19239cfa113e47d0ddce",
  image: "mosca:latest"
}
```

## Command Line Usage

```bash
docker-loghose
```

Acknowledgements
----------------

This project was kindly sponsored by [nearForm](http://nearform.com).


## License

MIT
