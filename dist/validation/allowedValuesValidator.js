'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _includes = require('babel-runtime/core-js/array/includes');

var _includes2 = _interopRequireDefault(_includes);

var _SimpleSchema = require('../SimpleSchema');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function allowedValuesValidator() {
  if (!this.valueShouldBeChecked) return;

  var allowedValues = this.definition.allowedValues;
  if (!allowedValues) return;

  var isAllowed = (0, _includes2.default)(allowedValues, this.value);
  return isAllowed ? true : _SimpleSchema.SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED;
}

exports.default = allowedValuesValidator;