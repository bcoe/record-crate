# Record-Crate

index, organize, and search your music collection, DJ sick sets.

![record-crate](https://github.com/bcoe/record-crate/raw/master/assets/images/record-crate.png "record-crate")

## How it works

record-crate crawls your music-folder, extracts the id3v2 tags from your
music files, and creates an ElasticSearch index of your music.

record-crate's web-interface lets you search, and add additional tags to
your music collection.

## Setting Up

1. install ElasticSearch `brew install elasticsearch`.
2. index your music folder `record-crate index --music-folder=/foo/bar/music`
3. start the webserver: `record-crate start`

## Contributing

* I'm not a designer, would love to get some help making things look better.
* I was specifically trying to solve a problem I have, finding music based
  on bpm. Would love to hear what features other people are looking for.
