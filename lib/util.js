'use strict';

/***
 * @ngdoc service
 * @name tiUtil
 * @module ngTagsInput
 *
 * @description
 * Helper methods used internally by the directive. Should not be called directly from user code.
 */
angular.module('ngTagsInput').factory('tiUtil', [
  "$timeout", "$q", function ($timeout, $q) {
    var self = {};

    self.debounce = function (fn, delay) {
      var timeoutId;
      return function () {
        var args = arguments;
        $timeout.cancel(timeoutId);
        timeoutId = $timeout(function () {
          fn.apply(null, args);
        }, delay);
      };
    };

    /**
     * 传入字符串（“;”分隔），或是数组，返回数组
     * @param  {[String/Array]} array
     * @param  {String}         key     rawString==false时需要
     * @return {[Array]}                tags需要用到的数组
     */
    self.makeObjectArray = function (array, options) {

      if (options.rawString) {
        return angular.isArray(array) ? array :
               typeof array === 'string' ? array.split(";").filter(function (row) {
                 return !!row
               }) : [];
      }
      else {
        if (!angular.isArray(array) || array.length === 0 || angular.isObject(array[0])) {
          return array;
        }

        var key = options.tagsInput.keyProperty || options.tagsInput.displayProperty;

        var newArray = [];
        array.forEach(function (item) {
          var obj = {};
          obj[key] = item;
          newArray.push(obj);
        });
        return newArray;
      }
    };
    /**
     * 从字符串数组中寻找匹配的字符串，否则返回null
     *
     * @param  {[Array]}          array    原数组
     * @param  {[String/Object]}  obj      需要找的人名字符串/传入的数据（根据传入的rawString字段决定）
     * @param  {Object}           options  配置
     * @param  {[Function]}       comparer (可选) 自定义的比较函数
     * @return {[String]}                  找到的人名字符串，找不到的话返回null
     */
    self.findInObjectArray = function (array, obj, options, comparer) {
      var item = null,
        key = options.keyProperty || options.displayProperty;

      comparer = comparer || self.defaultComparer;

      // 只要有一个返回true就返回true并中止遍历
      array.some(function (element) {
        if (options.rawString) {
          if (comparer(element, obj)) {
            item = element;
            return true;
          }
        }
        else {
          if (comparer(element[key], obj[key])) {
            item = element;
            return true;
          }
        }

      });

      return item;
    };

    /**
     * 比较两个字符串是否相等
     * @param  {[String]}   a 第一个字符串
     * @param  {[String]}   b 第二个
     * @return {[Boolean]}    是否相等
     */
    self.defaultComparer = function (a, b) {
      // I'm aware of the internationalization issues regarding toLowerCase()
      // but I couldn't come up with a better solution right now
      return self.safeToString(a).toLowerCase() === self.safeToString(b).toLowerCase();
    };

    self.safeHighlight = function (str, value) {
      if (!value) {
        return str;
      }

      function escapeRegexChars(str) {
        return str.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
      }

      str = self.encodeHTML(str);
      value = self.encodeHTML(value);

      var expression = new RegExp('&[^;]+;|' + escapeRegexChars(value), 'gi');
      return str.replace(expression, function (match) {
        return match.toLowerCase() === value.toLowerCase() ? '<em>' + match + '</em>' : match;
      });
    };

    self.safeToString = function (value) {
      return angular.isUndefined(value) || value == null ? '' : value.toString().trim();
    };

    self.encodeHTML = function (value) {
      return self.safeToString(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    self.handleUndefinedResult = function (fn, valueIfUndefined) {
      return function () {
        var result = fn.apply(null, arguments);
        // 如果callback返回undefined，则返回传入的valueIfUndefined，否则返回result
        return angular.isUndefined(result) ? valueIfUndefined : result;
      };
    };

    self.handleUndefinedPromise = function (fn) {
      return function () {
        // result才是真正在scope上的函数
        var result = fn.apply(null, arguments);
        if (result && typeof result.then === 'function') {
          return result;
        }
        else {
          return $q.resolve();
        }
      };
    }

    self.replaceSpacesWithDashes = function (str) {
      return self.safeToString(str).replace(/\s/g, '-');
    };

    self.isModifierOn = function (event) {
      return event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
    };

    /**
     * 简单的事件机制
     */
    self.simplePubSub = function () {
      var events = {};
      return {
        on: function (names, handler) {
          names.split(' ').forEach(function (name) {
            if (!events[name]) {
              events[name] = [];
            }
            events[name].push(handler);
          });
          return this;
        },
        trigger: function (name, args) {
          var handlers = events[name] || [];
          // 只要任意一个callback返回false，立即结束遍历
          handlers.every(function (handler) {
            return self.handleUndefinedResult(handler, true)(args);
          });
          return this;
        }
      };
    };

    return self;
  }
]);
