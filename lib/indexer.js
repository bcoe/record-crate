// make your music collection searchable!
var _ = require('lodash'),
  async = require('async'),
  crypto = require('crypto'),
  es = require('elasticsearch'),
  fs = require('fs'),
  mkdirp = require('mkdirp'),
  mm = require('musicmetadata'),
  path = require('path'),
  rr = require('recursive-readdir');

function Indexer(opts) {
  _.extend(this, {
    musicFolder: null, // folder to crawl for music collection.
    imageFolder: path.resolve(__dirname, '../app/images/covers'),
    indexName: 'record-crate',
    esUrl: 'localhost:9200'
  }, opts);

  // make sure the covers directory exists.
  mkdirp.sync(path.resolve(__dirname, '../app/images/covers'));

  this.es = new es.Client({
    host: this.esUrl
  });
}

// begin indexing a folder.
Indexer.prototype.index = function(cb) {
  var _this = this;

  rr(_this.musicFolder, function(err, files) {
    if (err) throw err;
    var mp3s = _.select(files, function(n) {return n.match(/(\.mp3$)|(\.aiff$)/)});
    _this._enqueueIndex(mp3s, cb);
  });
};

// enqueue indexing work in an async queue,
// this throttles concurrent index operations.
Indexer.prototype._enqueueIndex = function(mp3s, cb) {
  var _this = this,
    q = async.queue(function(mp3, cb) {
      _this._indexMp3(mp3, cb);
    }, 10);

  q.push(mp3s);

  q.drain = cb;
};

// index a single mp3 file.
//
// 1. extracting its meta information.
// 2. indexing it in elasticsearch.
// 3. saving images to disk.
Indexer.prototype._indexMp3 = function(mp3, cb) {
  var _this = this,
    stream = fs.createReadStream(mp3),
    parser = mm(stream),
    meta = {};

  parser.on('metadata', function (result) {
    _.extend(meta, result);
  });

  parser.on('TBPM', function(bpm) {
    meta.bpm = parseInt(bpm);
  });

  parser.on('done', function (err) {
    stream.destroy();

    // populate all the fields we intend to index.
    meta.id = crypto.createHash('sha1').update(mp3).digest('hex');
    if (!meta.title) meta.title = mp3.split('/').pop(); // use filename as title, if missing in meta.
    meta.path = mp3; // path to MP3 on disk.
    meta.images = []; // populated by _saveImages.

    _this._indexFsStats(meta, function() {
      _this._saveImages(meta, function() {
        _this._indexMeta(meta, cb);
      });
    });
  });
};

// index file's meta-info.
Indexer.prototype._indexFsStats = function(meta, cb) {
  fs.stat(meta.path, function(err, stat) {
    if (err) return cb(err);
    meta.created = stat.ctime;
    return cb();
  });
};

Indexer.prototype._saveImages = function(meta, cb) {
  var _this = this,
    i = 0;

  if (!meta.picture) return cb();

  async.eachLimit(meta.picture, 1, function(pic, cb) {
    var image = meta.id + '_' + i + '.' + pic.format,
      stream = fs.createWriteStream(
        path.resolve(path.resolve(_this.imageFolder, './' + image))
      );

    meta.images.push(image); // store image names in search-index.

    stream.write(pic.data);
    stream.end();
    stream.on('finish', cb);
    stream.on('error', cb);
    i+=1;
  }, function(err) {
    return cb();
  });
};

Indexer.prototype._indexMeta = function(meta, cb) {
  var _this = this,
    doc = {
      id: meta.id,
      title: meta.title,
      sortable_title: meta.title,
      artist: (meta.artist ? meta.artist : []).join(', '),
      album: meta.album || '',
      path: meta.path,
      images: meta.images,
      year: meta.year ? parseInt(meta.year) : null,
      genre: meta.genre || [],
      created: meta.created || new Date()
    },
    mapping = {
      title: {type: 'string', store: true},
      created: {type: 'date', store: true},
      sortable_title: {type: 'string', index: 'not_analyzed', store: true},
      path: {type: 'string', index: 'not_analyzed', store: true},
      bpm: {type: 'integer', index: 'not_analyzed', store: true},
      year: {type: 'integer', index: 'not_analyzed', store: true}
    };

  if (meta.bpm) doc.bpm = meta.bpm;

  this.es.indices.create({
    index: this.indexName
  })
  .catch(function(err) {
    // index already existed, put a test around this!
  })
  .then(function() {
    return _this.es.indices.putMapping({
      index: _this.indexName,
      type: 'song',
      body: {
        song: {
          properties: mapping
        }
      }
    });
  })
  .then(function() {
    return _this.es.update({
      id: meta.id,
      index: _this.indexName,
      type: 'song',
      body: {
        doc: doc,
        upsert: doc
      }
    })
  })
  .then(function() {
    return cb();
  });
};

module.exports = Indexer;
