#!/usr/bin/env node

var yargs = require('yargs')
  .options('m', {
    alias: 'music-folder',
    default: '/music',
    description: 'folder to recursively crawl for music'
  })
  .options('a', {
    alias: 'app',
    default: '/Applications/Ableton Live 9 Standard.app/',
    description: 'application to open tracks in'
  })
  .options('p', {
    alias: 'port',
    default: '5000',
    description: 'port to run record-crate server on'
  })
  .options('e', {
    alias: 'es-url',
    default: 'localhost:9200',
    description: 'ElasticSearch url to save music-collection to'
  }),
  chalk = require('chalk'),
  grunt = require('grunt'),
  path = require('path'),
  commands = {
    'index': {
      description: 'index:            index your music-folder.\n',
      command: function(args) {
        (new Indexer({
          musicFolder: args['music-folder'],
          esUrl: args['es-url']
        })).index(function() {
          console.log(chalk.green("finished indexing '" + args['music-folder'] + "', run record-crate start."));
          process.exit();
        });
      }
    },
    'start': {
      description: 'start:            start the record-crate server.\n',
      command: function(args) {
        // start the front-end server used
        // for serving polymer app.
        grunt.file.setBase(path.resolve(__dirname, '../'));
        grunt.tasks(['serve']);

        // start the backend search/indexing
        // server.
        new Server({
          esUrl: args['es-url'],
          app: args['app'],
          port: args['port']
        }).start();
      }
    },
    'install': {
      description: 'install:          install os-service-wrapper.\n',
      command: function(args) {
        ndm.install();
      }
    },
    'uninstall': {
      description: 'uninstall:        remove os-service-wrapper.\n',
      command: function(args) {
        ndm.remove();
      }
    },
    'start-service': {
      description: 'start-service:    start the os-service-wrapper.\n',
      command: function(args) {
        ndm.start();
      }
    },
    'stop-service': {
      description: 'stop-service:     stop the os-service-wrapper.\n',
      command: function(args) {
        ndm.stop();
      }
    },
    'restart-service': {
      description: 'restart-service:  restart the os-service-wrapper.\n',
      command: function(args) {
        ndm.restart();
      }
    }
  },
  Indexer = require('../lib/indexer'),
  Server = require('../lib/server'),
  usageString = "record-crate: index you music folder, DJ sick sets.\n\n",
  ndm = require('ndm')('record-crate');

// generate usage string.
Object.keys(commands).forEach(function(command) {
  usageString += commands[command].description;
});

yargs.usage(usageString);

// display help if command is not recognized.
if (yargs.argv.help || !commands[yargs.argv._[0]]) {
  console.log(yargs.help());
} else {
  commands[yargs.argv._[0]].command(yargs.argv);
}
