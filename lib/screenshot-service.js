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
  var fs = require('fs');
  var async = require('async');
  var im = require('imagemagick');
  var glob = require("glob");
  var path = require('path');
  var mkdirp = require('mkdirp');

  var childArgs = function(url, outputTmp) {
    return [
      '--fullsize',
      '--datestamp',
      '--dir=' + outputTmp,
      url
    ];
  };

  var Screenshot = function(url, options) {
    var self = this;

    this.options = options || {
      output: 'output_images/tmp/',
      temp: 'output_images/combined/'
    };

    async.parallel([
      function(done) {
        mkdirp(self.options.output, done);
      },
      function(done) {
        mkdirp(self.options.temp, done);
      },
      function(done) {
        glob(self.options.temp + '/*.png', function(err, files) {
          if(err) {
            self.emit('err');
            done();
            return;
          }

          async.each(files, function(file, finish) {
            fs.unlink(file, finish);
          }, function(err) {
            if(err) {
              self.emit('error', err);
            }
            done();
          });
        });
      }
    ],
    function(){
      var urls = (typeof url === 'string') ? [url] : url;

      // Process urls
      async.each(urls, this.processUrl.bind(this), this.processComplete.bind(this));
    }.bind(this));
  };

  Screenshot.prototype = Object.create(require('events').EventEmitter.prototype);

  Screenshot.prototype.processUrl = function(url, done) {
    // Check if item is empty (either empty param or blank line)
    if(!url) {
      this.emit('progress');
      done();
      return;
    }

    var parser = spawn('webkit2png', childArgs(url, this.options.temp));
    parser.on('exit', function(code) {
      this.emit('progress');
      done();
    }.bind(this));
  };

  Screenshot.prototype.processComplete = function() {
    glob(this.options.temp + '/*.png', function(err, files) {
      if(err) {
        this.emit('error', err);
        return;
      }

      var args = [];

      var date = new Date();

      args.push('+append');

      for(var i = 0, c = files.length; i < c; i++) {
        args.push(files[i]);
      }

      var outputFile = path.join(this.options.output, "" + date.getFullYear() + (date.getMonth()+1) + date.getDate() + ".png");

      args.push(outputFile);

      im.convert(args, function(err, stdout){
        if (err) {
          this.emit('error', err);
          return;
        }

        this.emit('progress');

        this.emit('complete', outputFile);
      }.bind(this));
    }.bind(this));
  };

  module.exports = Screenshot;
 })(module);