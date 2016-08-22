'use strict';

/**
 * @ngdoc directive
 * @name tiTagItem
 * @module ngTagsInput
 *
 * @description
 * Represents a tag item. Used internally by the tagsInput directive.
 */
angular.module('ngTagsInput').directive('tiTagItem', ["tiUtil", function (tiUtil) {
  return {
    restrict: 'E',
    require: '^tagsInput',
    template: '<ng-include src="$$template"></ng-include>',
    scope: {
      data: '='
    },
    link: function (scope, element, attrs, tagsInputCtrl) {
      var tagsInput = tagsInputCtrl.registerTagItem(),
        options = tagsInput.getOptions();

      scope.$$template = options.template;
      scope.$$removeTagSymbol = options.removeTagSymbol;

      scope.$getDisplayText = function () {

        var value = options.rawString ? scope.data : scope.data[options.displayProperty];

        return tiUtil.safeToString(value);
      };
      scope.$removeTag = function () {
        tagsInput.removeTag(scope.$index);
      };

      scope.$watch('$parent.$index', function (value) {
        scope.$index = value;
      });
    }
  };
}]);
