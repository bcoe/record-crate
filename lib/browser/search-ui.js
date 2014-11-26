// the track search UI -- in the cloud.
var _ = require("lodash"),
  lodash = require('lodash') ,
  mustache = require('mustache');

function SearchUI(opts) {
  _.extend(this, {
    $: require('jquery')
  }, opts);

  // create the track template.
  this.template = this.$('#track-tmpl').html();
  mustache.parse(this.template);

  this.wireUpEvents();
}

SearchUI.prototype.wireUpEvents = function() {
  var _this = this;

  this.$('#search').submit(function() {
    return _this.search(this.$('#query').val());
  });

  this.$('#tracks').on('click', '.open', function() {
    var path = _this.$(this).data('path');
    return _this.openTrack(path);
  });

  this.$('#tracks').on('click', '.save', function() {
    var id = _this.$(this).data('id'),
    parent = _this.$(this).parent('.controls'),
    bpm = parent.find('.bpm').val(),
    tags = parent.find('.tags').val();
    return _this.save(id, bpm, tags);
  });
};

SearchUI.prototype.search = function(query) {
  var _this = this;

  this.$.ajax({
    type: "POST",
    url: '/',
    data: {
      q: query
    },
    success: function(result) {
      _this.$('#tracks').html('');

      result.tracks.forEach(function(track) {
        var rendered = mustache.render(_this.template, {
          id: track.id,
          cover: track.images[0] || '../place-holder.jpg',
          title: track.title,
          path: track.path,
          artist: track.artist || 'unknown',
          bpm: track.bpm || 0,
          tags: (track.tags || []).join(', '),
          year: track.year || ''
        });

        console.log('hello world man dude', rendered)

        _this.$('#tracks').append(_this.$(rendered));
      });
    }
  });

  return false;
};

SearchUI.prototype.openTrack = function(path) {
  this.$.ajax({
    type: "POST",
    url: '/open',
    data: {
      path: path
    }
  });

  return false;
};

SearchUI.prototype.save = function(id, bpm, tags) {
  this.$.ajax({
    type: "POST",
    url: '/save',
    data: {
      bpm: bpm,
      tags: tags,
      id: id
    }
  });

  return false;
};

if (typeof document !== 'undefined') {
  var $ = require('jquery');

  $(document).ready(function() {
    new SearchUI();
  });
} else {
  module.exports = SearchUI;
}
