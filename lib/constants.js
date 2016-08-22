var KEYS = {
  backspace: 8,
  tab: 9,
  enter: 13,
  escape: 27,
  space: 32,
  up: 38,
  down: 40,
  left: 37,
  right: 39,
  delete: 46,
  // comma: 188
  // 将逗号分隔换为`;`号
  comma: 186
};

var MAX_SAFE_INTEGER = 9007199254740991;
var SUPPORTED_INPUT_TYPES = ['text', 'email', 'url'];

module.exports = {
  KEYS: KEYS,
  MAX_SAFE_INTEGER: MAX_SAFE_INTEGER,
  SUPPORTED_INPUT_TYPES: SUPPORTED_INPUT_TYPES
}
