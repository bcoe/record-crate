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
  commands = {
    'index': {
      description: 'index:\t index your music-folder.\n',
      command: function(args) {
        (new Indexer({
          musicFolder: args['music-folder'],
          esUrl: args['es-url']
        })).index(function() {
          console.log(chalk.green("finished indexing '" + args['music-folder'] + "', run record-crate start."));
        });
      }
    },
    'start': {
      description: 'start:\t start the record-crate server.',
      command: function(args) {
         new Server({
          esUrl: args['es-url'],
          app: args['app'],
          port: args['port']
        }).start();
      }
    }
  },
  Indexer = require('../lib/indexer'),
  Server = require('../lib/server'),
  usageString = "record-crate: index you music folder, DJ sick sets.\n\n";

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
