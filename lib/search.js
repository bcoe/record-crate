var _ = require('lodash'),
  es = require('elasticsearch');

function Search(opts) {
  _.extend(this, {
    esUrl: 'localhost:9200',
    indexName: 'record-crate',
    pageSize: 100,
    defaultSort: [
      ['bpm', 'desc'],
      ['sortable_title', 'asc']
    ]
  }, opts);

  this.es = new es.Client({
    host: this.esUrl
  });
}

Search.prototype.search = function(page, sort, query, cb) {
  var _this = this;

  this.es.search({
    index: this.indexName,
    type: 'song',
    size: this.pageSize,
    from: this.pageSize * page,
    q: query,
    body: {
      sort: this.buildSortObj(sort)
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
      results.page_size = _this.pageSize;
      results.total = hits.total;

      return cb(null, results);
    }
  });
};

// given our simplified sort object.
// [[bpm, 'desc'], [sortable_title, 'desc']],
// format for ES.
Search.prototype.buildSortObj = function(_sort) {
  var sort = _sort || this.defaultSort,
    sortObj = [];

  // when searching by strings other than '*'
  // _score should have an effect on results.
  sort.unshift(['_score', 'desc']);

  sort.forEach(function(s) {
    var obj = {};
    obj[s[0]] = {order: s[1]};
    sortObj.push(obj);
  });

  return sortObj;
};

module.exports = Search;
