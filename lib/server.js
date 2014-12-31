'use strict';

var _ = require('lodash'),
  es = require('elasticsearch'),
  restify = require('restify'),
  Search = require('./search'),
  server = restify.createServer(),
  spawn = require('child_process').spawn,
  Indexer = require('../lib/indexer.js');

function Server(opts) {
  _.extend(this, {
    app: '/Applications/Ableton Live 9 Standard.app/',
    openCommand: 'open -a',
    esUrl: 'localhost:9200',
    indexName: 'record-crate',
    port: 5000
  }, opts);

  this.es = new es.Client({
    host: this.esUrl
  });

  this.s = new Search({
    esUrl: this.esUrl,
    pageSize: 1000
  });

  this._createRoutes();
}

//CORS middleware
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:9000');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
};

Server.prototype._createRoutes = function() {
  var _this = this;

  server.use(restify.queryParser());
  server.use(restify.bodyParser());
  server.use(allowCrossDomain);

  server.get('/', function(req, res, next) { _this.search(req, res, next); });
  server.post('/open', function(req, res, next) { _this.open(req, res, next); });
  server.post('/save', function(req, res, next) { _this.save(req, res, next); });
  server.post('/reindex', function(req, res, next) { _this.index(req, res, next); });
};

Server.prototype.start = function() {
  server.listen(this.port, function () {
    console.log('%s listening at %s', server.name, server.url);
  });
};

// serach your music collection.
Server.prototype.search = function(req, res, next) {
  this.s.search(
    req.params.page || 0,
    req.params.sort,
    req.params.q || '*',
    function(err, tracks) {
      res.send(200, {
        tracks: tracks,
        page: tracks.page,
        page_size: tracks.page_size,
        total: tracks.total
      });
      return next();
    }
  );
};

// open your track in an app on your computer, e.g.,
// Ableton.
Server.prototype.open = function(req, res, next) {
  var path = req.params.path,
    command = this.openCommand + ' \'' + this.app + '\' \'' + path + '\'';

  var proc = spawn('sh', ['-c', command], {
    cwd: './',
    env: process.env,
    stdio: [process.stdin, process.stdout, null]
  });

  proc.stderr.on('data', function(data) {
    console.error('  ', data.toString().trim());
  });

  proc.on('close', function(output) {
    console.info('  ', output);
  });

  res.send(200, {
    result: true
  });
  return next();
};

// save tags/bpm.
Server.prototype.save = function(req, res, next) {
  var bpm = req.params.bpm,
      tags = req.params.tags,
      id = req.params.id;

  var doc = {
    bpm: parseInt(bpm, 10),
    tags: (tags !== null && (typeof tags !== 'undefined') ? tags.split(',') : null)
  };

  this.es.update({
    id: id,
    index: this.indexName,
    type: 'song',
    body: {
      doc: doc
    }
  })
  .then(function() {
    res.send(200, {
      result: true
    });
    return next();
  });
};

Server.prototype.index = function(req, res, next) {
  var path = req.params.path;

  (new Indexer({
    musicFolder: path,
    esUrl: this.esUrl
  })).index(function() {
    console.log('finished indexing ', path);
    res.send(200, {
      result: true
    });
    return next();
  });
};

module.exports = Server;
