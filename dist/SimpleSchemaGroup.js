'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _mongoObject = require('mongo-object');

var _mongoObject2 = _interopRequireDefault(_mongoObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SimpleSchemaGroup = function SimpleSchemaGroup() {
  (0, _classCallCheck3.default)(this, SimpleSchemaGroup);

  for (var _len = arguments.length, definitions = Array(_len), _key = 0; _key < _len; _key++) {
    definitions[_key] = arguments[_key];
  }

  this.definitions = definitions.map(function (definition) {
    if (_mongoObject2.default.isBasicObject(definition)) return definition;

    if (definition instanceof RegExp) {
      return {
        type: String,
        regEx: definition
      };
    }

    return {
      type: definition
    };
  });
};

exports.default = SimpleSchemaGroup;