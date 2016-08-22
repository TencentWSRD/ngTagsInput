module.exports = (function(argument) {
  'use strict';

  var tagsInput = angular.module('ngTagsInput', []);

  require('./auto-complete.js');
  require('./auto-complete-match.js');
  require('./autosize.js');
  require('./bind-attrs.js');
  require('./configuration.js');
  require('./tag-item.js');
  require('./tags-input.js');
  require('./transclude-append.js');
  require('./util.js');

  require('../templates/auto-complete.html');
  require('../templates/auto-complete-match.html')
  require('../templates/tag-item.html')
  require('../templates/tags-input.html')
})();
