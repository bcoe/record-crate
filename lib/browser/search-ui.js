// the track search UI -- in the cloud.
var $ = require('jquery'),
  mustache = require('mustache');

function SearchUI() {
  var _this = this;

  // create the mustache track template.
  this.template = $('#track-tmpl').html();
  mustache.parse(this.template);

  $('#search').submit(function() { return _this.search(); });
  $('#tracks').on('click', '.open', function() {
    var path = $(this).data('path');
    return _this.openTrack(path);
  });
  $('#tracks').on('click', '.save', function() {
    var id = $(this).data('id'),
      parent = $(this).parent('.controls'),
      bpm = parent.find('.bpm').val(),
      tags = parent.find('.tags').val();
    return _this.save(id, bpm, tags);
  });
}

SearchUI.prototype.search = function() {
  var _this = this;

  $.ajax({
    type: "POST",
    url: '/',
    data: {
      q: $('#query').val()
    },
    success: function(result) {
      $('#tracks').html('');

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

        $('#tracks').append($(rendered));
      });
    }
  });

  return false;
};

SearchUI.prototype.openTrack = function(path) {
  $.ajax({
    type: "POST",
    url: '/open',
    data: {
      path: path
    }
  });

  return false;
};

SearchUI.prototype.save = function(id, bpm, tags) {
  $.ajax({
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

$(document).ready(function() {
  new SearchUI();
});
