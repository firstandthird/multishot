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
      output: '/tmp/multishot',
      temp: '/tmp/multishot'
    };

    this.options.backgroundColor = this.options.backgroundColor || '#ecf0f1';
    this.options.labelBackgroundColor = this.options.labelBackgroundColor || '#ffffff';
    this.options.labelTextColor = this.options.labelTextColor || '#232323';
    this.options.labelFont = this.options.labelFont || 'Helvetica-Bold';
    this.options.labelFontSize = this.options.labelFontSize || 18;

    this.groups = ['Default'];
    this.grouped = {};

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

      this.validateGroups();

      // Process urls
      async.each(this.urls, this.processUrl.bind(this), this.screenshotsComplete.bind(this));
    }.bind(this));
  };

  Screenshot.prototype = Object.create(require('events').EventEmitter.prototype);

  Screenshot.prototype.validateGroups = function() {
    var i, c, url;

    for(i = 0, c = this.urls.length; i < c; i++) {
      url = this.urls[i];
      if((!!url) && (url.constructor === Object)) {
        if(!url.url) {
          // Falls back to nothing. Will be skipped.
          url.url = '';
        }

        if(!url.group) {
          url.group = 'Default';
        }
      } else {
        url = {
          group: 'Default',
          url: url
        };
      }

      url.index = i;

      this.urls[i] = url;

      if(this.groups.indexOf(url.group) === -1) {
        this.groups.push(url.group);
      }

      if(!this.grouped[url.group]) {
        this.grouped[url.group] = [];
      }

      this.grouped[url.group].push(url);
    }
  };

  Screenshot.prototype.processUrl = function(url, done) {
    // Check if item is empty (either empty param or blank line)
    if(!url) {
      this.emit('progress');
      done();
      return;
    }

    var parser = spawn('webkit2png', childArgs(url.url, path.normalize(this.options.temp + '/' + url.group + '/'), url.index));
    parser.on('exit', function(code) {
      this.emit('progress');
      done();
    }.bind(this));
  };

  Screenshot.prototype.screenshotsComplete = function() {
    var self = this;

    async.each(this.groups, function(item, done) {
      async.each(self.grouped[item], self.generateTile.bind(self), function() {
        this.composeImages(item, done);
      }.bind(self));
    }, function(){
      self.groupCombined();
    });
  };

  Screenshot.prototype.generateTile = function(url, complete) {
    var self = this;
    var textfile = path.normalize(this.options.temp + '/' + url.group + '/' + url.index + '-label.png');
    var file = path.normalize(this.options.temp + '/' + url.group + '/' + url.index + '-full.png');

    // Order matters!
    async.series([function(done){
      // Add a frame first
      console.log('Generating frame for:', url.url);
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
      console.log('Generating label:', url.url);
      im.convert(['-bordercolor', self.options.labelBackgroundColor, '-border', '10', '-background', self.options.labelBackgroundColor, '-fill', self.options.labelTextColor, '-font', self.options.labelFont, '-pointsize', self.options.labelFontSize, 'label:' + url.url, textfile], function(err, meta) {
        if(err) {
          console.log(err);
          self.emit('error', err);
          return;
        }

        done();
      });
    }, function(done) {
      //More spacing on label
      console.log('Adding spacing to label:', url.url);
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
      console.log('Chopping off bottom padding:', url.url);
      im.convert([textfile, '-crop', '+0-10', '+repage', textfile], function(err, meta) {
        if(err) {
          console.log(err);
          self.emit('error', err);
          return;
        }

        done();
      });
    }, function(done) {
      // Place label on screenshot
      console.log('Placing label:', url.url);
      im.convert(['-background', self.options.backgroundColor, '-append', textfile, file, file], function(err) {
        if(err) {
          console.log(err);
          self.emit('error', err);
          return;
        }

        done();
      });
    }], function(){
      console.log('Finished labeling screenshot:', url.url);
      complete();
    });
  };

  Screenshot.prototype.composeImages = function(group, complete) {
    var date = new Date();
    var urls = this.grouped[group];
    var i, c;

    var args = [];
    args.push('+append');

    for(i = 0, c = urls.length; i < c; i++) {
      args.push(path.normalize(this.options.temp + '/' + urls[0].group + '/' + urls[i].index + '-full.png'));
    }

    var outputFile = path.normalize(this.options.output + '/' + urls[0].group + '/' + date.getFullYear() + (date.getMonth()+1) + date.getDate() + "-combined.png");

    args.push(outputFile);

    im.convert(args, function(err, meta){
      if (err) {
        console.log(err);
        this.emit('error', err);
        return;
      }

      this.emit('progress');
      complete();
    }.bind(this));
  };

  Screenshot.prototype.groupCombined = function() {
    var self = this;

    glob(path.normalize(this.options.output + '/') + '**/*-combined.png', function(err, files) {
      var i, c;
      var date = new Date();
      var args = ["-append"];
      var outputFile = path.normalize(self.options.output + '/' + date.getFullYear() + (date.getMonth()+1) + date.getDate() + "-grouped.png");

      if(err) {
        console.error('Error:', err);
        self.emit('error', err);
        return;
      }

      console.log('Grouping combined images...');

      for(i = 0, c = files.length; i < c; i++) {
        args.push(files[i]);
      }

      args.push(outputFile);

      im.convert(args, function(err, meta){
        if (err) {
          this.emit('error', err);
          return;
        }

        this.emit('progress');

        this.emit('complete', outputFile);
      }.bind(self));
    });
  };

  module.exports = Screenshot;
 })(module);