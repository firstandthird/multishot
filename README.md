# multishot

> A lib for generating multiple screenshots

## Getting Started

### Dependencies

Currently only works on osx.

```shell
brew install webkit2png
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
  -o     Output directory                                        [default: "/Users/troywhiteley"]
  -t     Temp directory. Note: This directory will be truncated. [default: "/tmp/multishot/"]
  -u     List of urls to use.
  -f     File containing list of urls (One url per line).
  -d     Device Profile. Pass with no option to see available presets.
  -w     Sets viewport width.
  -h     Sets viewport height.
  -a     Sets user agent.
  --tpl  Template file.
```

### Usage Examples

```
multishot -f example/urls.txt -o ~/Desktop
```

```
multishot -u http://google.com -o ~/Desktop
```

#### Text file input

The text file must contain one url per line. Blank lines are permitted for formatting. You may optionally group urls by 
putting a group name on its own line. Note: group names cannot contain http.

See example/urls.txt for an example

## The API

### Usage

```js
var Screenshot = require('multishot').Screenshot;

var urls = [
    {
      group: 'Circles',
      url: 'http://leanin.org/circles/'
    },
    {
      group: 'Circles',
      url: 'http://leanin.org/circle-login/'
    },
    {
      group: 'Circles',
      url: 'http://leanin.org/circle-faqs/'
    },
    'http://leanin.org',
    {
      url: 'http://leanin.org/team/'
    },
    {
      group: 'News+Inspiration',
      url: 'http://leanin.org/news-inspiration/'
    },
  ];

var options = {
  temp: '/tmp/multishot/',
  output: '/tmp/multishot/',
  style: {
    bodyBackground: 'pink',
    custom: '.url { text-decoration: underline; }'
  }
};

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

`progress`  
Triggered every time an image is rendered and once on complete.

`complete`  
Triggered once the file image has been generated. Returns the path to composed image.

`error`  
Returns an exception.


### Options

`output`  
A path to render the final composed image. Will be created if it doesn't exist.

`temp`  
Temp path where screenshots will be taken. Will be created and truncated each run so be careful when setting. Default: /tmp/multishot/

`template`  
A handlebars HTML file to use as the combined template. See custom template section for more information.

## Custom Templates

Multishot uses a handlebars template to generate the combined image. While the default template is nice, you may want to customize it:

Example:
```javascript
var shot = new Screenshot(urls, {
  template: '/Users/WalterWhite/templates/multishot.html'
});
```

The bare minimum your template should have is:

```html
<!DOCTYPE html>
<html>
<head>
  <base href="{{base}}">
</head> 
<body>
  {{#each grouped}}
  <div class="group">
    <h2>{{@key}}</h2>
    {{#each this}}
    <div class="screenshot-container">
      <div class="url">{{this.url}}</div>
      <img src="{{this.group}}/{{this.index}}-full.png" class="screenshot">
    </div>
    {{/each}}
   </div>
  {{/each}}
</body>
</html>
```

Templates are passed the following variables:

`base`  
Base path to load images

`grouped`  
Object containing all grouped images. See example HTML above for usage.

`styles`  
Various different values that a template can use to customize the css. See Styles section for available values.

## Custom Styles

These are the default styles:

| Variable            | Value              |
| ------------------- | ------------------ |
| background          | #fff               |
| bodyFontFamily      | "Lato", sans-serif |
| bodyFontWeight      | 400                |
| bodyFontColor       | #7f8c8d            |
| bodyFontSize        | 12px               |
| bodyLineHeight      | 17px               |
| groupMargin         | 40px 0             |
| screenshotImgBorder | 4px solid #d35400  |
| h2FontSize          | 24px               |
| h2FontColor         | #2C3E50            |
| h2FontWeight        | 700                |
| h2Margin            | 2px 0              |
| urlFontStyle        | italic             |

You can override or add new variables by passing them as properties to the `styles` option value.

If you want to pass in a full block of css:

```javascript
var options = {
  styles: {
    custom: '.someSelector{ background: white }'
  }
};
```

The `custom` property can contain any css as long as its valid. If you need any more control you should look into writing a unique template to match your needs.
