# Record-Crate

index, organize, and search your music collection, DJ sick sets.

![record-crate](https://github.com/bcoe/record-crate/raw/master/app/images/record-crate.png "record-crate")

## How it works

record-crate crawls your music-folder, extracts the id3v2 tags from your
music files, and creates an ElasticSearch index of your music.

record-crate's web-interface lets you search, and add additional tags to
your music collection.

Currently, the record-crate server running by default on port 5000, serves as an API for the frontend (which runs via grunt by default on port 9000).

## Setting Up

1. install ElasticSearch:
  * on OSX,  `brew install elasticsearch`.
  * on Ubuntu, https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-on-an-ubuntu-vps
2. install record-crate `npm install record-crate -g`.
  * if it asks for `sudo`, read this post: http://howtonode.org/introduction-to-npm
3. start the webserver: `record-crate start`.

**Or,**

_You can also install record-crate as an os-service-wrapper:_

1. install ElasticSearch `brew install elasticsearch`.
2. install record-crate `npm install record-crate -g`.
3. install the service `record-crate install`.
4. start the service `record-crate start-service`.

_this has the advantage of storing your configuration settings for you._

## Building Record-Crate

To contribute to record-crate:

1. clone [the git repo](https://github.com/bcoe/record-crate).
2. run `npm install`.
3. run `npm build`, to rebuild assets.

**Patches welcome!**

## Contributing

* I'm not a designer, would love to get some help making things look better.
* I was specifically trying to solve a problem I have, finding music based
  on bpm. Would love to hear what features other people are looking for.
