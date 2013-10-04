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
  var glob = require("glob");
  var path = require('path');
  var mkdirp = require('mkdirp');
  var handlebars = require('handlebars');

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
      temp: '/tmp/multishot',
    };

    this.options.template = this.options.template || path.resolve(__dirname, '../template/template.html');
    this.options.styles = this.options.styles || {};

    // Setup default styles
    this.setDefaultStyle('background', '#fff');
    this.setDefaultStyle('bodyFontFamily', '"Lato", sans-serif');
    this.setDefaultStyle('bodyFontWeight', '400');
    this.setDefaultStyle('bodyFontColor', '#7f8c8d');
    this.setDefaultStyle('bodyFontSize', '12px');
    this.setDefaultStyle('bodyLineHeight', '17px');
    this.setDefaultStyle('groupMargin', '40px 0');
    this.setDefaultStyle('screenshotImgBorder', '4px solid #d35400');
    this.setDefaultStyle('h2FontSize', '24px');
    this.setDefaultStyle('h2FontColor', '#2C3E50');
    this.setDefaultStyle('h2FontWeight', '700');
    this.setDefaultStyle('h2Margin', '2px 0');
    this.setDefaultStyle('urlFontStyle', 'italic');

    this.groups = ['Default'];
    this.grouped = {};

    this.template = fs.readFileSync(this.options.template, 'utf8');

    async.parallel([
      function(done) {
        mkdirp(self.options.output, done);
      },
      function(done) {
        mkdirp(self.options.temp, done);
      },
      function(done) {
        glob(self.options.temp + '/**/*.png', function(err, files) {
          if(err) {
            self.emit('error');
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
    
    var data = {
      base: this.options.output,
      grouped: this.grouped,
      styles: this.options.styles
    };

    var template = handlebars.compile(this.template);
    var html = template(data);
    var templateFile = path.normalize(this.options.temp + '/template.html');

    var date = new Date();
    var outputFile = "" + date.getFullYear() + (date.getMonth()+1) + date.getDate();

    fs.writeFileSync(templateFile, html, 'utf8');

    var parser = spawn('webkit2png', childArgs(templateFile, this.options.output, outputFile));
    parser.on('exit', function(code) {
      self.emit('complete', path.normalize(self.options.output + '/' + outputFile + '-full.png'));
    });
  };

  Screenshot.prototype.setDefaultStyle = function(style, value) {
    value = value || null;
    this.options.styles[style] = this.options.styles[style] || value;
  };

  module.exports = Screenshot;
 })(module);