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
  var im = require('imagick');
  var glob = require("glob");
  var path = require('path');
  var mkdirp = require('mkdirp');

  var childArgs = function(url, outputTmp, index) {
    return [
      '--fullsize',
      '--dir=' + outputTmp,
      '--filename=' + index,
      url
    ];
  };

  var Screenshot = function(url, options) {
    var self = this;

    this.options = options || {
      output: 'output_images/tmp/',
      temp: 'output_images/combined/'
    };

    this.options.backgroundColor = this.options.backgroundColor || '#ecf0f1';
    this.options.labelBackgroundColor = this.options.labelBackgroundColor || '#ffffff';
    this.options.labelTextColor = this.options.labelTextColor || '#232323';
    this.options.labelFont = this.options.labelFont || 'Helvetica-Bold';
    this.options.labelFontSize = this.options.labelFontSize || 18;

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
      this.urls = (typeof url === 'string') ? [url] : url;

      // Process urls
      async.each(this.urls, this.processUrl.bind(this), this.screenshotsComplete.bind(this));
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

    var urlIndex = this.urls.indexOf(url);

    var parser = spawn('webkit2png', childArgs(url, this.options.temp, urlIndex));
    parser.on('exit', function(code) {
      this.emit('progress');
      done();
    }.bind(this));
  };

  Screenshot.prototype.screenshotsComplete = function() {
    glob(this.options.temp + '/*-full.png', function(err, files) {
      if(err) {
        this.emit('error', err);
        return;
      }

      console.log('');
      console.log('Processing images');

      async.each(files, this.generateTile.bind(this), function(){
        this.composeImages(files);
      }.bind(this));
    }.bind(this));
  };

  Screenshot.prototype.generateTile = function(file, complete) {
    var self = this;

    var fileid = parseInt(file.match(/([\d]+)-full.png/g)[0], 10);
    var url = this.urls[fileid];
    var textfile = path.normalize(this.options.temp + '/' + fileid + '-label.png');

    console.log('Processing:', file);

    // Order matters here
    async.series([function(done){
      // Add a frame first
      
      console.log('Generating frame:', file);
      im.convert([file , '-matte', '-bordercolor', self.options.backgroundColor, '-border', '10x0', '-background', self.options.backgroundColor, file], function(err) {
        if(err) {
          console.log(err);
          self.emit('error', err);
          return;
        }

        done();
      });
    }, function(done) {
      // Create the text label. Note: easier to do it in a seperate image. You have more control over placement.

      console.log('Generating text:', file);

      im.convert(['-bordercolor', self.options.labelBackgroundColor, '-border', '10', '-background', self.options.labelBackgroundColor, '-fill', self.options.labelTextColor, '-font', self.options.labelFont, '-pointsize', self.options.labelFontSize, 'label:' + url, textfile], function(err, meta) {
        if(err) {
          console.log(err);
          self.emit('error', err);
          return;
        }

        done();
      });
    }, function(done) {
      //More spacing on label

      console.log('Adding spacing to label:', file);

      im.convert([textfile, '-bordercolor', self.options.backgroundColor, '-border', '10', '-background', self.options.backgroundColor, textfile], function(err, meta) {
        if(err) {
          console.log(err);
          self.emit('error', err);
          return;
        }

        done();
      });
    }, function(done) {
      //chopping label

      console.log('Chopping off bottom padding:', file);

      im.convert([textfile, '-crop', '+0-10', '+repage', textfile], function(err, meta) {
        if(err) {
          console.log(err);
          self.emit('error', err);
          return;
        }

        done();
      });
    }, function(done) {
      // Create a captioned image

      console.log('Generating captioned image:', file);

      im.convert(['-background', self.options.backgroundColor, '-append', textfile, file, file], function(err) {
        if(err) {
          console.log(err);
          self.emit('error', err);
          return;
        }

        done();
      });
    }], function(){
      console.log('Finished:', file);
      complete();
    });
  };

  Screenshot.prototype.composeImages = function(files) {
    var args = [];

    var date = new Date();

    args.push('+append');

    for(var i = 0, c = files.length; i < c; i++) {
      args.push(files[i]);
    }

    var outputFile = path.join(this.options.output, "" + date.getFullYear() + (date.getMonth()+1) + date.getDate() + ".png");

    args.push(outputFile);

    im.convert(args, function(err, meta){
      if (err) {
        this.emit('error', err);
        return;
      }

      this.emit('progress');

      this.emit('complete', outputFile);
    }.bind(this));
  };

  module.exports = Screenshot;
 })(module);