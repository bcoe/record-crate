#!/usr/bin/env node

var yargs = require('yargs')
  .options('m', {
    alias: 'music-folder',
    default: '/Users/benjamincoe/Dropbox/muzik/'
  }),
  chalk = require('chalk'),
  commands = {
    'index': {
      description: 'index:\t index your music-folder.',
      command: function(args) {
        (new Indexer({
          musicFolder: args['music-folder']
        })).index(function() {
          console.log(chalk.green("finished indexing '" + args['music-folder'] + "', run record-crate serve."));
        });
      }
    },
    'start': {
      description: 'start:\t start the record-crate server.',
      command: function(args) {
        new Server();
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
