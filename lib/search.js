var _ = require('lodash'),
  es = require('elasticsearch');

function Search(opts) {
  _.extend(this, {
    esUrl: 'localhost:9200',
    indexName: 'record-crate',
    pageSize: 100,
    defaultSort: [{bpm: {order: 'desc'}}, {'sortable_title': {order: 'asc'}}]
  }, opts);

  this.es = new es.Client({
    host: this.esUrl
  });
}

Search.prototype.search = function(page, sort, query, cb) {
  this.es.search({
    index: this.indexName,
    type: 'song',
    size: this.pageSize,
    from: this.pageSize * page,
    q: query,
    body: {
      sort: this.defaultSort
    }
  }, function (err, obj) {
    if (err) return cb(err);
    else {
      var hits = obj.hits,
        // return the source document, why make
        // the controller do this work?
        results = _.map(hits.hits, function(r) {
          var _source = r._source;
          _source._score = r._score;
          _source.bpm = _source.bpm || 'n/a';
          _source.artist = _source.artist || 'unknown';
          return _source;
        });

      results.page = page;
      results.total = hits.total;

      return cb(null, results);
    }
  });
};

module.exports = Search;
