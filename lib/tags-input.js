'use strict';

var constant = require('./constants.js');
var Clipboard = require('clipboard');
/**
 * @ngdoc directive
 * @name tagsInput
 * @module ngTagsInput
 *
 * @description
 * Renders an input box with tag editing support.
 *
 * @param {string} ngModel Assignable Angular expression to data-bind to.
 * @param {string=} [template=NA] URL or id of a custom template for rendering each tag.
 * @param {string=} [displayProperty=text] Property to be rendered as the tag label.
 * @param {string=} [keyProperty=text] Property to be used as a unique identifier for the tag.
 * @param {string=} [type=text] Type of the input element. Only 'text', 'email' and 'url' are supported values.
 * @param {string=} [text=NA] Assignable Angular expression for data-binding to the element's text.
 * @param {number=} tabindex Tab order of the control.
 * @param {string=} [placeholder=Add a tag] Placeholder text for the control.
 * @param {number=} [minLength=3] Minimum length for a new tag.
 * @param {number=} [maxLength=MAX_SAFE_INTEGER] Maximum length allowed for a new tag.
 * @param {number=} [minTags=0] Sets minTags validation error key if the number of tags added is less than minTags.
 * @param {number=} [maxTags=MAX_SAFE_INTEGER] Sets maxTags validation error key if the number of tags added is greater
 *    than maxTags.
 * @param {boolean=} [allowLeftoverText=false] Sets leftoverText validation error key if there is any leftover text in
 *    the input element when the directive loses focus.
 * @param {string=} [removeTagSymbol=×] (Obsolete) Symbol character for the remove tag button.
 * @param {boolean=} [addOnEnter=true] Flag indicating that a new tag will be added on pressing the ENTER key.
 * @param {boolean=} [addOnSpace=false] Flag indicating that a new tag will be added on pressing the SPACE key.
 * @param {boolean=} [addOnComma=true] Flag indicating that a new tag will be added on pressing the COMMA key.
 * @param {boolean=} [addOnBlur=true] Flag indicating that a new tag will be added when the input field loses focus.
 * @param {boolean=} [addOnPaste=false] Flag indicating that the text pasted into the input field will be split into
 *   tags.
 * @param {string=} [pasteSplitPattern=,] Regular expression used to split the pasted text into tags.
 * @param {boolean=} [replaceSpacesWithDashes=true] Flag indicating that spaces will be replaced with dashes.
 * @param {string=} [allowedTagsPattern=.+] Regular expression that determines whether a new tag is valid.
 * @param {boolean=} [enableEditingLastTag=false] Flag indicating that the last tag will be moved back into the new tag
 *    input box instead of being removed when the backspace key is pressed and the input box is empty.
 * @param {boolean=} [addFromAutocompleteOnly=false] Flag indicating that only tags coming from the autocomplete list
 *    will be allowed. When this flag is true, addOnEnter, addOnComma, addOnSpace and addOnBlur values are ignored.
 * @param {boolean=} [spellcheck=true] Flag indicating whether the browser's spellcheck is enabled for the input field
 *   or not.
 * @param {expression=} [onTagAdding=NA] Expression to evaluate that will be invoked before adding a new tag. The new
 *    tag is available as $tag. This method must return either true or false. If false, the tag will not be added.
 * @param {expression=} [onTagAdded=NA] Expression to evaluate upon adding a new tag. The new tag is available as $tag.
 * @param {expression=} [onInvalidTag=NA] Expression to evaluate when a tag is invalid. The invalid tag is available as
 *   $tag.
 * @param {expression=} [onTagRemoving=NA] Expression to evaluate that will be invoked before removing a tag. The tag
 *    is available as $tag. This method must return either true or false. If false, the tag will not be removed.
 * @param {expression=} [onTagRemoved=NA] Expression to evaluate upon removing an existing tag. The removed tag is
 *    available as $tag.
 * @param {expression=} [onTagClicked=NA] Expression to evaluate upon clicking an existing tag. The clicked tag is
 *   available as $tag.
 * @param {boolean=} [rawString=true] 表示数据实体是否为单纯字符串，默认为true，如在人名控件中所使用，对于其他数据结构，需要设置为false
 * @param {Number=}  [showTagsLimit=0] 是否控制展示tags的上限, 默认为0, 表示不作限制
 */
angular.module('ngTagsInput').directive('tagsInput', [
  "$timeout", "$document", "$window", "tagsInputConfig", "tiUtil", "$q", function($timeout, $document, $window, tagsInputConfig, tiUtil, $q) {
    function TagList(options, events, onTagAdding, onTagRemoving) {
      var self = {},
        getTagText, setTagText, tagIsValid;

      getTagText = function(tag) {
        return options.rawString ? tiUtil.safeToString(tag) : tag[options.displayProperty];
      };

      setTagText = function(tag, text) {
        if (options.rawString) {
          tag = text;
        }
        else {
          tag[options.displayProperty] = text;
        }
      };

      if (typeof onTagAdding !== 'function') {
        onTagAdding = function() {
          return $q.resolve();
        };
      }

      tagIsValid = function(tag) {
        var tagText = getTagText(tag);

        var deferred = $q.defer();
        if (!(tagText &&
          tagText.length >= options.minLength &&
          tagText.length <= options.maxLength &&
          options.allowedTagsPattern.test(tagText) && !tiUtil.findInObjectArray(self.items, tag, options))) {
          deferred.reject();
        }
        else {
          onTagAdding({
            $tag: tag,
            $tagList: self.items
          })
            .then(function() {
              deferred.resolve();
            }, function() {
              deferred.reject();
            });
        }

        return deferred.promise;
      };

      self.items = [];

      self.addText = function(text) {

        if (options.rawString) {
          return self.add(text);
        }
        else {
          var tag = {};
          setTagText(tag, text);
          return self.add(tag);
        }
      };

      self.add = function(data) {

        var text;

        if (options.rawString) {
          text = data;
        }
        else {
          text = getTagText(data);
        }

        if (options.replaceSpacesWithDashes) {
          text = tiUtil.replaceSpacesWithDashes(text);
        }

        if (options.rawString) setTagText(data, text);

        tagIsValid(data)
          .then(function() {
            self.items.push(data);
            events.trigger('tag-added', {
              $tag: data,
              $tagList: self.items
            });
          }, function() {
            events.trigger('invalid-tag', {
              $tag: data,
              $tagList: self.items
            });
          });

        return data;
      };

      self.remove = function(index) {
        var tag = self.items[index];

        if (onTagRemoving({
            $tag: tag,
            $tagList: self.items
          })) {
          self.items.splice(index, 1);
          self.clearSelection();
          events.trigger('tag-removed', {
            $tag: tag,
            $tagList: self.items
          });
          return tag;
        }
      };

      self.select = function(index) {
        if (index < 0) {
          index = self.items.length - 1;
        }
        else if (index >= self.items.length) {
          index = 0;
        }

        self.index = index;
        self.selected = self.items[index];
      };

      self.selectPrior = function() {
        self.select(--self.index);
      };

      self.selectNext = function() {
        self.select(++self.index);
      };

      self.removeSelected = function() {
        return self.remove(self.index);
      };

      self.clearSelection = function() {
        self.selected = null;
        self.index = -1;
      };

      self.clearSelection();

      return self;
    }

    function validateType(type) {
      return SUPPORTED_INPUT_TYPES.indexOf(type) !== -1;
    }

    return {
      restrict: 'E',
      require: 'ngModel',
      scope: {
        tags: '=ngModel',
        text: '=?',
        onTagAdding: '&',
        onTagAdded: '&',
        onInvalidTag: '&',
        onTagRemoving: '&',
        onTagRemoved: '&',
        onTagClicked: '&',
        onTagChange: '&',
        showAdditionBtn: '=',
        showTagsLimit: '=?'
      },
      replace: false,
      transclude: true,
      templateUrl: 'ng-tags-input-ci-dev/templates/tags-input.html',
      controller: [
        "$scope", "$attrs", "$element", function($scope, $attrs, $element) {
          $scope.additionBtnOption = {
            copy: {
              text: "",
              class: "",
              open: false
            },
            reset: {
              text: "",
              class: "",
              open: false
            }
          };
          $scope.events = tiUtil.simplePubSub();
          tagsInputConfig.load('tagsInput', $scope, $attrs, {
            template: [String, 'ng-tags-input-ci-dev/templates/tag-item.html'],
            type: [String, 'text', validateType],
            placeholder: [String, 'Add a tag'],
            tabindex: [Number, null],
            removeTagSymbol: [String, String.fromCharCode(215)],
            replaceSpacesWithDashes: [Boolean, true],
            minLength: [Number, 2],
            maxLength: [Number, constant.MAX_SAFE_INTEGER],
            addOnEnter: [Boolean, true],
            addOnSpace: [Boolean, false],
            addOnComma: [Boolean, true],
            addOnBlur: [Boolean, true],
            addOnPaste: [Boolean, false],
            escapeTextPattern: [RegExp, /[^\w\d\-]/g],
            pasteSplitPattern: [RegExp, /,/],
            allowedTagsPattern: [RegExp, /.+/],
            enableEditingLastTag: [Boolean, false],
            minTags: [Number, 0],
            maxTags: [Number, constant.MAX_SAFE_INTEGER],
            displayProperty: [String, 'text'],
            keyProperty: [String, ''],
            allowLeftoverText: [Boolean, true],
            addFromAutocompleteOnly: [Boolean, false],
            spellcheck: [Boolean, true],
            rawString: [Boolean, true],
            showTagsLimit: [Number, 0]
          });

          $scope.tagList = new TagList($scope.options, $scope.events,
            tiUtil.handleUndefinedPromise($scope.onTagAdding),
            tiUtil.handleUndefinedResult($scope.onTagRemoving, true));

          this.registerAutocomplete = function() {
            var input = $element.find('input');

            return {
              addTag: function(tag) {
                return $scope.tagList.add(tag);
              },
              focusInput: function() {
                input[0].focus();
              },
              getTags: function() {
                return $scope.tagList.items;
              },
              getCurrentTagText: function() {
                return $scope.newTag.text();
              },
              getOptions: function() {
                return $scope.options;
              },
              on: function(name, handler) {
                $scope.events.on(name, handler);
                return this;
              }
            };
          };

          this.registerTagItem = function() {
            return {
              getOptions: function() {
                return $scope.options;
              },
              removeTag: function(index) {
                if ($scope.disabled) {
                  return;
                }
                $scope.tagList.remove(index);
              }
            };
          };
        }
      ],
      link: function(scope, element, attrs, ngModelCtrl) {
        var hotkeys = [constant.KEYS.enter, constant.KEYS.comma, constant.KEYS.space, constant.KEYS.backspace, constant.KEYS.delete, constant.KEYS.left, constant.KEYS.right],
          tagList = scope.tagList,
          events = scope.events,
          options = scope.options,
          input = element.find('input'),
          validationOptions = ['minTags', 'maxTags', 'allowLeftoverText'],
          setElementValidity;

        scope.hookId = scope.$id;

        var clipboard = new Clipboard('#ngTagsInputCopyHook_' + scope.hookId, {
          text: function() {
            var copyStatusText = {
                succeed: '复制成功！',
                empty: '内容为空！'
              },
              result = "",
              statusText = "";

            scope.additionBtnOption.copy.open = true;

            if (scope.tags) {
              result = scope.tags;
              statusText = copyStatusText.succeed;
              scope.additionBtnOption.copy.class = 'success';
            }
            else {
              scope.additionBtnOption.copy.class = 'danger';
              statusText = copyStatusText.empty;
            }

            scope.additionBtnOption.copy.text = statusText;
            $timeout(function() {
              scope.additionBtnOption.copy.open = false;
            }, 1800);

            return result;
          }
        });

        scope.$on('$destroy', function() {
          clipboard.destroy();
          $document.off('click', scope.eventHandlers.input.hitOutside);
        });

        element.removeAttr('tabindex');

        setElementValidity = function() {
          ngModelCtrl.$setValidity('maxTags', tagList.items.length <= options.maxTags);
          ngModelCtrl.$setValidity('minTags', tagList.items.length >= options.minTags);
          ngModelCtrl.$setValidity('leftoverText',
            scope.hasFocus || options.allowLeftoverText ? true : !scope.newTag.text());
        };

        ngModelCtrl.$isEmpty = function(value) {
          return !value || !value.length;
        };

        scope.newTag = {
          // 这里是整个input的入口，input上的ng-model为newTag.text，每当变化是触发input-change事件
          // 在tags-input中监听了一些诸如删除，粘贴等操作
          // 而在auto-complete中监听了关于展示suggestTionList相关的事件
          text: function(value) {
            if (angular.isDefined(value)) {
              scope.text = value;
              events.trigger('input-change', value);
            }
            else {
              return scope.text || '';
            }
          },
          invalid: null
        };

        scope.track = function(tag) {
          return tag[options.keyProperty || options.displayProperty];
        };

        scope.showOverflowTags = function() {
          scope.tagsOverflowHidden = false;
          // tagList.items = scope.totalTags;
        };

        scope.hideOverflowTags = function() {
          scope.tagsOverflowHidden = true;
          // tagList.items = scope.totalTags.slice(-scope.showTagsLimit);
        };

        var originTagsLength;

        // tags == ngModel , 监测model变化，将model转为scope.tags数组
        scope.$watch('tags', function(value) {
          if (value) {
            var tags = tiUtil.makeObjectArray(value, options);
            if (!scope.showTagsLimit || tags.length < scope.showTagsLimit || (scope.tagsOverflow && !scope.tagsOverflowHidden)) {
              // tagList.items = tags;
              // scope.tags = options.rawString ? tagList.items.join(';') : tagList.items;
            } else {
              if (typeof originTagsLength === 'undefined') originTagsLength = tags.length;
              scope.lengthDiff = tags.length - originTagsLength;
              // lastTagsLength = tags.length;
              // var firstGroup = tags.slice(0, scope.showTagsLimit / 2);
              // var lastGroup = tags.slice(-((scope.showTagsLimit / 2) + lengthDiff));
              // tagList.items = firstGroup.concat(lastGroup);
              // tagList.items = tags.slice(-scope.showTagsLimit);
              // tagList.items = tags;
              scope.tagsOverflow = true;
              scope.tagsOverflowHidden = true;
              // scope.tags = options.rawString ? tags.join(';') : tags;
              // scope.totalTags = tags;
            }
            tagList.items = tags;
            scope.tags = options.rawString ? tagList.items.join(';') : tagList.items;
          }
          else {
            tagList.items = [];
          }
        });

        scope.$watch('tags.length', function() {
          setElementValidity();

          // ngModelController won't trigger validators when the model changes (because it's an array),
          // so we need to do it ourselves. Unfortunately this won't trigger any registered formatter.
          ngModelCtrl.$validate();
        });

        attrs.$observe('disabled', function(value) {
          scope.disabled = value;
        });

        var hitResetTimes = 0;

        scope.eventHandlers = {
          input: {
            hitOutside: function(e) {
              if (e.target.id !== 'ngTagsInputResetHook_' + scope.hookId && hitResetTimes === 1) {
                hitResetTimes = 0;
                scope.$apply(function() {
                  scope.additionBtnOption.reset.open = false;
                });
              }
            },
            reset: function($event) {
              var resetStatusText = {
                succeed: '重置成功！',
                confirming: '再次点击以确认重置'
              };

              hitResetTimes++;
              if (hitResetTimes == 1) {
                scope.additionBtnOption.reset.text = resetStatusText.confirming;
                scope.additionBtnOption.reset.open = true;
                scope.additionBtnOption.reset.class = 'warning';
              }
              else {
                scope.additionBtnOption.reset.class = 'success';
                scope.additionBtnOption.reset.text = resetStatusText.succeed;
                hitResetTimes = 0;
                scope.tags = "";
                $timeout(function() {
                  scope.additionBtnOption.reset.open = false;
                  scope.tagsOverflow = false;
                  scope.tagsOverflowHidden = false;
                }, 1800);
              }
            },
            keydown: function($event) {
              // vinsonxiao添加，按下esc移除焦点
              if ($event.which == 27) {
                input.blur();
              }
              events.trigger('input-keydown', $event);
            },
            focus: function() {
              if (scope.hasFocus) {
                return;
              }

              scope.hasFocus = true;
              events.trigger('input-focus');
            },
            blur: function() {
              $timeout(function() {
                var activeElement = $document.prop('activeElement'),
                  lostFocusToBrowserWindow = activeElement === input[0],
                  lostFocusToChildElement = element[0].contains(activeElement);

                // vionsonxiao添加，input失去焦点时移除selected的tag元素
                scope.tagList.selected = null;
                scope.tagList.index = -1;
                if (lostFocusToBrowserWindow || !lostFocusToChildElement) {
                  scope.hasFocus = false;
                  events.trigger('input-blur');
                }
              });
            },
            paste: function($event) {
              $event.getTextData = function() {
                var clipboardData = $event.clipboardData || ($event.originalEvent && $event.originalEvent.clipboardData);
                return clipboardData ? clipboardData.getData('text/plain') : $window.clipboardData.getData('Text');
              };
              events.trigger('input-paste', $event);
            }
          },
          host: {
            click: function(e) {
              if (scope.disabled) {
                return;
              }
              var $target = $(e.target);
              $target = $target.hasClass('.tag-item') ? $target : $target.closest('.tag-item');
              if (!$target.length) {
                input[0].focus();
              }
            }
          },
          tag: {
            click: function(tag) {
              events.trigger('tag-clicked', {
                $tag: tag
              });
            }
          }
        };

        $document.on('click', scope.eventHandlers.input.hitOutside);

        events
          .on('tag-added', scope.onTagAdded)
          .on('invalid-tag', scope.onInvalidTag)
          .on('tag-removed', scope.onTagRemoved)
          .on('tag-clicked', scope.onTagClicked)
          .on('tag-added', function() {
            scope.newTag.text('');
          })
          .on('tag-added tag-removed', function(argus) {
            scope.tags = tagList.items;

            // Ideally we should be able call $setViewValue here and let it in turn call $setDirty and $validate
            // automatically, but since the model is an array, $setViewValue does nothing and it's up to us to do it.
            // Unfortunately this won't trigger any registered $parser and there's no safe way to do it.
            ngModelCtrl.$setDirty();
            scope.onTagChange && scope.onTagChange.call(this, argus);
          })
          .on('invalid-tag', function() {
            scope.newTag.invalid = true;
            scope.newTag.text("");
            // ngModelCtrl.$setValidity('invalidTag', false);
          })
          .on('option-change', function(e) {
            if (validationOptions.indexOf(e.name) !== -1) {
              setElementValidity();
            }
          })
          .on('input-change', function() {
            tagList.clearSelection();
            scope.newTag.invalid = null;
            ngModelCtrl.$setValidity('invalidTag', true);
          })
          .on('input-focus', function() {
            element.triggerHandler('focus');
            ngModelCtrl.$setValidity('leftoverText', true);
          })
          .on('input-blur', function() {
            if (options.addOnBlur && !options.addFromAutocompleteOnly) {
              tagList.addText(scope.newTag.text());
            }
            element.triggerHandler('blur');
            setElementValidity();
          })
          .on('input-keydown', function(event) {
            var key = event.keyCode,
              addKeys = {},
              shouldAdd, shouldRemove, shouldSelect, shouldEditLastTag;

            if (tiUtil.isModifierOn(event) || hotkeys.indexOf(key) === -1) {
              return;
            }

            addKeys[constant.KEYS.enter] = options.addOnEnter;
            addKeys[constant.KEYS.comma] = options.addOnComma;
            addKeys[constant.KEYS.space] = options.addOnSpace;

            shouldAdd = !options.addFromAutocompleteOnly && addKeys[key];
            shouldRemove = (key === constant.KEYS.backspace || key === constant.KEYS.delete) && tagList.selected;
            shouldEditLastTag = key === constant.KEYS.backspace && scope.newTag.text().length === 0 && options.enableEditingLastTag;
            shouldSelect = (key === constant.KEYS.backspace || key === constant.KEYS.left || key === constant.KEYS.right) && scope.newTag.text().length === 0 && !options.enableEditingLastTag;

            if (shouldAdd) {
              $timeout(function() {
                tagList.addText(scope.newTag.text());
              });
            }
            else if (shouldEditLastTag) {
              var tag;

              tagList.selectPrior();
              tag = tagList.removeSelected();

              if (tag) {
                scope.newTag.text(tag[options.displayProperty]);
              }
            }
            else if (shouldRemove) {
              tagList.removeSelected();
            }
            else if (shouldSelect) {
              if (key === constant.KEYS.left || key === constant.KEYS.backspace) {
                tagList.selectPrior();
              }
              else if (key === constant.KEYS.right) {
                tagList.selectNext();
              }
            }

            if (shouldAdd || shouldSelect || shouldRemove || shouldEditLastTag) {
              event.preventDefault();
            }
          })
          .on('input-paste', function(event) {

            if (options.addOnPaste) {
              var data = event.getTextData();
              var tags = $.unique(data.split(options.pasteSplitPattern).filter(function(row) {
                return !!row;
              }));
              // if (tags.length > 1) {
              tags.forEach(function(tag) {
                if (tag) tagList.addText(tag);
              });
              event.preventDefault();
              // }
            }
          });
      }
    };
  }
]);
