var _ = require('lodash'),
  es = require('elasticsearch'),
  fs = require('fs'),
  path = require('path'),
  restify = require('restify'),
  server = restify.createServer(),
  spawn = require('child_process').spawn;

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

  this._createRoutes();
}

Server.prototype._createRoutes = function() {
  var _this = this;

  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  // serve static JavaScript and CSS.
  server.get(/\/javascript|css|images\/?.*/, restify.serveStatic({
    directory: path.resolve(__dirname, '../assets')
  }));

  // serve the static index page.
  server.get('/', restify.serveStatic({
    directory: path.resolve(__dirname, '../assets'),
    default: 'index.html'
  }));

  server.post('/', function(req, res, next) { _this.search(req, res, next); });
  server.post('/open', function(req, res, next) { _this.open(req, res, next); });
  server.post('/save', function(req, res, next) { _this.save(req, res, next); });
};

Server.prototype.start = function() {
  server.listen(this.port, function () {
    console.log('%s listening at %s', server.name, server.url);
  });
};

// serach your music collection.
Server.prototype.search = function(req, res, next) {
  this.es.search({
    index: this.indexName,
    type: 'song',
    size: 1000,
    q: req.params.q,
    body: {
      sort: [{bpm: {order: 'desc'}}, {sortable_title: {order: 'asc'}}],
    },
    from: req.params.from || 0
  }, function (error, response) {
    res.send(200, {
      tracks: _.map(response.hits.hits, function(h) {return h._source})
    });
    return next();
  });
};

// open your track in an app on your computer, e.g.,
// Ableton.
Server.prototype.open = function(req, res, next) {
  var command = this.openCommand + " '" + this.app + "' '" + req.params.path + "'";

  var proc = spawn('sh', ['-c', command], {
    cwd: './',
    env: process.env,
    stdio: [process.stdin, process.stdout, null]
  });

  proc.stderr.on('data', function(data) {
    logger.error('  ' + data.toString().trim());
  });

  proc.on('close', function(output) {});

  res.send(200);
  return next();
};

// save tags/bpm.
Server.prototype.save = function(req, res, next) {
  var doc = {
    bpm: parseInt(req.params.bpm),
    tags: req.params.tags.split(',')
  };

  this.es.update({
    id: req.params.id,
    index: this.indexName,
    type: 'song',
    body: {
      doc: doc
    }
  })
  .then(function() {
    res.send(200);
    return next();
  });
};

module.exports = Server;
