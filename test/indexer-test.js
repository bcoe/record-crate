var _ = require('lodash'),
  Code = require('code'),
  fs = require('fs'),
  Indexer = require('../lib/indexer'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  mkdirp = require('mkdirp'),
  rimraf = require('rimraf');

lab.experiment('Indexer', function () {

  lab.experiment('index', function() {
    lab.it('should recursively find all music files in folder', function(done) {
      var indexer = new Indexer({
        musicFolder: './test/fixtures', // folder to crawl for music collection.
        imageFolder: './test/fixtures/images',
        _enqueueIndex: function(mp3s) {

          Code.expect(mp3s).to.include([
            'test/fixtures/id3v1.mp3',
            'test/fixtures/subfolder/id3v2-xheader.mp3'
          ]);

          Code.expect(mp3s).to.not.include([
            'test/fixtures/subfolder/foo.txt'
          ]);

          return done();
        }
      });

      indexer.index();
    });
  });

  lab.experiment('_enqueueIndex', function() {
    lab.it('should execute callback when all items are processed', function(done) {
      var indexer = new Indexer({
          musicFolder: './test/fixtures', // folder to crawl for music collection.
          imageFolder: './test/fixtures/images',
          _indexMp3: function(mp3, cb) {
            return cb();
          }
        }),
        mp3s = [];

      for (var i = 0; i < 500; i++) mp3s.push('foo.mp3');

      indexer._enqueueIndex(mp3s, done);
    });
  });

  lab.experiment('_indexMp3', function() {
    lab.it('extracts meta-information from mp3', function(done) {
      var indexer = new Indexer({
        musicFolder: './test/fixtures', // folder to crawl for music collection.
        imageFolder: './test/fixtures/images',
        _saveImages: function(meta, cb) {
          // unique-id based on full path.
          Code.expect(meta.id).to.equal('efbeb3e12f555bededc64343f3ed3b2631f4e913');

          // extracted title tag.
          Code.expect(meta.title).to.equal('Blood Sugar');

          // full path to mp3.
          Code.expect(meta.path).to.equal('./test/fixtures/id3v1.mp3');
          return done();
        }
      });

      indexer._indexMp3('./test/fixtures/id3v1.mp3');
    });

    lab.it('populates title with filename if no title meta-info found', function(done) {
      var indexer = new Indexer({
        musicFolder: './test/fixtures', // folder to crawl for music collection.
        imageFolder: './test/fixtures/images',
        _saveImages: function(meta, cb) {
          Code.expect(meta.title).to.equal('foo.txt');
          return done();
        }
      });

      indexer._indexMp3('./test/fixtures/subfolder/foo.txt');
    });

    lab.it('populates created with ctime from fs.stat', function(done) {
      var indexer = new Indexer({
        musicFolder: './test/fixtures', // folder to crawl for music collection.
        imageFolder: './test/fixtures/images',
        _saveImages: function(meta, cb) {
          Code.expect(_.isDate(meta.created)).to.equal(true);
          return done();
        }
      });

      indexer._indexMp3('./test/fixtures/subfolder/foo.txt');
    });
  });

  lab.experiment('_indexMp3', function() {
    lab.beforeEach(function(done) {
      mkdirp('./test/fixtures/images', done);
    });

    lab.afterEach(function(done) {
      rimraf('./test/fixtures/images', done);
    });

    lab.it('it extracts images from music file and writes them to assets folder', function(done) {
      var indexer = new Indexer({
        musicFolder: './test/fixtures', // folder to crawl for music collection.
        imageFolder: './test/fixtures/images',
        _indexMeta: function(meta, cb) {
          Code.expect(fs.existsSync('./test/fixtures/images/' + meta.images[0])).to.equal(true);
          Code.expect(fs.existsSync('./test/fixtures/images/' + meta.images[1])).to.equal(true);
          return done();
        }
      });

      indexer._indexMp3('./test/fixtures/subfolder/images.mp3');
    });

    lab.it('handles music files that have no images', function(done) {
      var indexer = new Indexer({
        musicFolder: './test/fixtures', // folder to crawl for music collection.
        imageFolder: './test/fixtures/images',
        _indexMeta: function(meta, cb) {
          Code.expect(meta.images.length).to.equal(0);
          return done();
        }
      });

      indexer._indexMp3('./test/fixtures/id3v1.mp3');
    });
  });
});
