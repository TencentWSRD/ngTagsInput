'use strict';

/**
 * @ngdoc directive
 * @name tiAutocompleteMatch
 * @module ngTagsInput
 *
 * @description
 * Represents an autocomplete match. Used internally by the autoComplete directive.
 */
angular.module('ngTagsInput').directive('tiAutocompleteMatch', ["$sce", "tiUtil", function ($sce, tiUtil) {
  return {
    restrict: 'EA',
    require: '^autoComplete',
    template: '<ng-include src="$$template"></ng-include>',
    scope: {
      data: '='
    },
    link: function (scope, element, attrs, autoCompleteCtrl) {
      var autoComplete = autoCompleteCtrl.registerAutocompleteMatch(),
        options = autoComplete.getOptions();

      scope.$$template = options.template;
      scope.$index = scope.$parent.$index;

      scope.$highlight = function (text) {
        if (options.highlightMatchedText) {
          text = tiUtil.safeHighlight(text, autoComplete.getQuery());
        }
        return $sce.trustAsHtml(text);
      };
      scope.$getDisplayText = function () {

        if (options.rawString) {
          return tiUtil.safeToString(scope.data);
        }
        else {
          return tiUtil.safeToString(scope.data[options.displayProperty || options.tagsInput.displayProperty]);
        }
      };
    }
  };
}]);
