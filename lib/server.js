var _ = require('lodash'),
  es = require('elasticsearch'),
  fs = require('fs'),
  restify = require('restify'),
  spawn = require('child_process').spawn;

function Server() {
  var _this = this;

  var opts = {
    app: '/Applications/Ableton Live 9 Standard.app/'
  };

  if (process.env.KEY) {
    opts.key = fs.readFileSync(process.env.KEY);
    opts.certificate = fs.readFileSync(process.env.CERTIFICATE);
  }

  this.es = new es.Client({
    host: 'localhost:9200'
  });

  var server = restify.createServer(opts);
  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  // serve static JavaScript and CSS.
  server.get(/\/javascript|css|images\/?.*/, restify.serveStatic({
    directory: './assets'
  }));

  // serve the static index page.
  server.get('/', restify.serveStatic({
    directory: './assets',
    default: 'index.html'
  }));

  server.post('/', function(req, res, next) {
    _this.es.search({
      index: 'setlist',
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
  });

  server.post('/open', function(req, res, next) {
    var command = "open -a '" + opts.app + "' '" + req.params.path + "'";

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
  });

  server.post('/save', function(req, res, next) {
    var doc = {
      bpm: parseInt(req.params.bpm),
      tags: req.params.tags.split(',')
    };

    _this.es.update({
      id: req.params.id,
      index: 'setlist',
      type: 'song',
      body: {
        doc: doc
      }
    })
    .then(function() {
      res.send(200);
      return next();
    });
  });

  // bind server to on port 5000, or the port provided.
  server.listen(process.env.PORT || 5000, function () {
    console.log('%s listening at %s', server.name, server.url);
  });
};

module.exports = Server;
