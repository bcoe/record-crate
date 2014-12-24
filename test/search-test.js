var _ = require('lodash'),
  Code = require('code'),
  fs = require('fs'),
  Search = require('../lib/search'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  nock = require('nock');

lab.experiment('Search', function () {
  lab.it('should return the first page of search results if no pagination given', function(done) {
    var defaultSearch = nock('http://localhost:9200')
      .post('/record-crate/song/_search?size=100&from=0&q=*', {
        "sort": [{bpm: {order: "desc"}}, {sortable_title: {order: "asc"}}]
      })
      .reply(
        200,
        JSON.parse(fs.readFileSync('./test/fixtures/search/star-p0.json', 'utf-8'))
      ),
      search = new Search();

    search.search(0, [], '*', function(err, obj) {
      Code.expect(obj[0].title).to.equal('Enter The Seed (Original Mix)');
      Code.expect(obj[0].artist).to.equal('Plantrae');
      Code.expect(obj.total).to.equal(317);
      return done();
    });
  });

  lab.it('replaces missing bpm with n/a', function(done) {
    var defaultSearch = nock('http://localhost:9200')
      .post('/record-crate/song/_search?size=100&from=0&q=*', {
        "sort": [{bpm: {order: "desc"}}, {sortable_title: {order: "asc"}}]
      })
      .reply(
        200,
        JSON.parse(fs.readFileSync('./test/fixtures/search/star-p0.json', 'utf-8'))
      ),
      search = new Search();

    search.search(0, [], '*', function(err, obj) {
      Code.expect(obj[0].bpm).to.equal('n/a');
      return done();
    });
  });

  lab.it('replaces missing artist with unknown', function(done) {
    var defaultSearch = nock('http://localhost:9200')
      .post('/record-crate/song/_search?size=100&from=0&q=*', {
        "sort": [{bpm: {order: "desc"}}, {sortable_title: {order: "asc"}}]
      })
      .reply(
        200,
        JSON.parse(fs.readFileSync('./test/fixtures/search/star-p0.json', 'utf-8'))
      ),
      search = new Search();

    search.search(0, [], '*', function(err, obj) {
      Code.expect(obj[1].artist).to.equal('unknown');
      return done();
    });
  });
});
