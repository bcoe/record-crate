var _ = require('lodash'),
  cheerio = require('cheerio'),
  Code = require('code'),
  fs = require('fs'),
  SearchUI = require('../../lib/browser/search-ui'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script();

lab.experiment('SearchUI', function () {

  lab.experiment('search', function() {
    lab.it('adds #tracks div with search results', function(done) {
      var $ = cheerio.load(fs.readFileSync('./assets/index.html'));

      var searchUI = new SearchUI({
        $: _.extend($, {
          ajax: function(opts) {
            opts.success({
              tracks: [
                {
                  id: 'abc123',
                  title: 'foo-title',
                  images: []
                }
              ]
            });

            Code.expect($.html()).to.match(/foo-title - unknown/);

            return done();
          }
        }),
        wireUpEvents: function() {}
      });

      searchUI.search('disco');
    });
  });

});
