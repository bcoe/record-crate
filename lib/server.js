'use strict';

var _ = require('lodash'),
  es = require('elasticsearch'),
  restify = require('restify'),
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

  server.post('/', function(req, res, next) { _this.search(req, res, next); });
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
  var search = null,
      from = null;

  // new situation
  Object.keys(req.params).forEach(function(key) {
    if(key.indexOf('{"') > -1) {
      search = key.replace(/\'/g, '');
      try {
        search = JSON.parse(search);
        search = search.q;
        if('from' in search) {
          from = search.from;
        }
      } catch(e) {
        search = '*';
      }
    }
  });

  // fallback for old situation
  if(search === null) {
    search = req.params.q;
  }
  if(from === null) {
    from = req.params.from;
  }

  this.es.search({
    index: this.indexName,
    type: 'song',
    size: 1000,
    q: search,
    body: {
      sort: [{bpm: {order: 'desc'}}, {'sortable_title': {order: 'asc'}}],
    },
    from: from || 0
  }, function (error, response) {
    res.send(200, {
      tracks: _.map(response.hits.hits, function(h) {
        if(!('bpm' in h._source))
          h._source.bpm = 'n/a';
        if(!('artist' in h._source) || h._source.artist == '')
          h._source.artist = 'unknown';
        return h._source;
      })
    });
    return next();
  });
};

// open your track in an app on your computer, e.g.,
// Ableton.
Server.prototype.open = function(req, res, next) {
  var path = null;

  // new situation
  Object.keys(req.params).forEach(function(key) {
    if(key.indexOf('{"') > -1) {
      path = key.replace(/\'/g, '');
      try {
        path = JSON.parse(path);
        path = path.path;
      } catch(e) {
        // nothing
      }
    }
  });

  // fallback
  if(path === null) {
    path = req.params.path;
  }

  var command = this.openCommand + ' \'' + this.app + '\' \'' + path + '\'';

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
  var bpm = null,
      tags = null,
      id = null;

  // new situation
  Object.keys(req.params).forEach(function(key) {
    if(key.indexOf('{"') > -1) {
      var params = key.replace(/\'/g, '');
      try {
        params = JSON.parse(params);
        id = params.id;
        if('bpm' in params)
          bpm = params.bpm;
        if('tags' in params)
          tags = params.tags;
      } catch(e) {
        // nothing
      }
    }
  });

  // fallback
  if(id === null) {
    id = req.params.id;
  }
  if(bpm === null) {
    bpm = req.params.bpm;
  }
  if(tags === null) {
    tags = req.params.tags;
  }

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
  var path = null;

  // new situation
  Object.keys(req.params).forEach(function(key) {
    if(key.indexOf('{"') > -1) {
      var params = key.replace(/\'/g, '');
      try {
        params = JSON.parse(params);
        path = params.path;
      } catch(e) {
        // nothing
      }
    }
  });

  // fallback situation
  if(path === null)
    path = req.params.path;

  (new Indexer({
    musicFolder: path,
    esUrl: 'localhost:9200'
  })).index(function() {
    console.log('finished indexing ' + path);
    res.send(200, {
      result: true
    });
    return next();
  });
};

module.exports = Server;
