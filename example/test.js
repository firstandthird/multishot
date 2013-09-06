(function(){
  "use strict";

  var Screenshot = require('../').Screenshot;

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

  new Screenshot(urls);
})();