# multishot

> A lib for generating multiple screenshots

## Getting Started

### Dependencies

```shell
brew install pkg-config
brew install imagemagick
brew install webkit2png
brew install ghostscript
npm install -g node-gyp
```

### Install

```shell
npm install multishot --save-dev
```

```shell
npm install multishot -g
```

## The CLI

### Overview

```
Usage: multishot [opts]

Options:
  -o  Output directory                                         [required]
  -t  Temp directory. Note: This directory will be truncated.  [default: "/tmp/multishot/"]
  -u  List of urls to use
  -f  File containing list of urls (One url per line).
```

### Usage Examples

```
multishot -f example/urls.txt -o ~/Desktop
```

```
multishot -u http://google.com -o ~/Desktop
```

## The API

### Usage

```js
var Screenshot = require('multishot').Screenshot;

var shot = new Screenshot(urls, options);

shot.on('progress', function() {
  // Update progress bar if you have one
});

shot.on('complete', function(file) {
  // do something on complete
});

shot.on('error', function(err) {
  // Something bad happened
});
```


### Events

#### progress
Triggered every time an image is rendered and once on complete.

#### complete
Triggered once the file image has been generated. Returns the path to composed image.

#### error
Returns an exception.


### Options

#### output
A path to render the final composed image. Will be created if it doesn't exist.

#### temp
Temp path where screenshots will be taken. Will be created and truncated each run so be careful when setting. Default: /tmp/multishot/