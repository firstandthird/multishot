/**
 * screenshot-service
 *
 * Captures screenshots for the specified urls.
 *
 * Usage:
 *  var url = 'http://example.com';
 *  var screenshot = new Screenshot(url);
 *
 *  var urls = ['http://example.com', 'http://example.com/about'];
 *  var screenshots = new Screenshot(urls);
 */

 (function(module){
  'use strict';

  var spawn = require('child_process').spawn;
  var async = require('async');
  var im = require('imagemagick');
  var glob = require("glob");
  var path = require('path');

  var outputTmp = 'output_images/tmp/';
  var outputCombined = 'output_images/combined/';

  var childArgs = function(url) {
    return [
      '--fullsize',
      '--datestamp',
      '--dir=' + outputTmp,
      url
    ];
  };

  var Screenshot = function(url) {
    var urls = (typeof url === 'string') ? [url] : url;

    // Process urls
    async.eachSeries(urls, this.processUrl.bind(this), this.processComplete.bind(this));
  };

  Screenshot.prototype = Object.create(require('events').EventEmitter.prototype);

  Screenshot.prototype.processUrl = function(url, done) {
    // Check if item is empty (either empty param or blank line)
    if(!url) {
      done();
      return;
    }

    var parser = spawn('webkit2png', childArgs(url));
    parser.on('exit', function(code) {
      done();
    });
  };

  Screenshot.prototype.processComplete = function() {
    glob(outputTmp + '/*.png', function(err, files){
      if(err) {
        console.error('Something bad happened!', err);
        return;
      }

      var args = [];

      var date = new Date();

      args.push('+append');

      for(var i = 0, c = files.length; i < c; i++) {
        args.push(files[i]);
      }

      args.push(path.join(outputCombined, "" + date.getFullYear() + (date.getMonth()+1) + date.getDate() + ".png"));

      im.convert(args, function(err, stdout){
        if (err) throw err;
        console.log('All done');
      });
    });
  };

  module.exports = Screenshot;
 })(module);