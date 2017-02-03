'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _mongoObject = require('@clayne/mongo-object');

var _mongoObject2 = _interopRequireDefault(_mongoObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Clones a schema object, expanding shorthand as it does it.
 */
function expandShorthand(schema) {
  var schemaClone = {};

  _underscore2.default.each(schema, function (definition, key) {
    // CASE 1: Not shorthand. Just clone
    if (_mongoObject2.default.isBasicObject(definition)) {
      schemaClone[key] = (0, _extends3.default)({}, definition);
      return;
    }

    // CASE 2: The definition is an array of some type
    if (Array.isArray(definition)) {
      if (Array.isArray(definition[0])) {
        throw new Error('Array shorthand may only be used to one level of depth (' + key + ')');
      }
      var type = definition[0];
      schemaClone[key] = { type: Array };

      // Also add the item key definition
      var itemKey = key + '.$';
      if (schema[itemKey]) {
        throw new Error('Array shorthand used for ' + key + ' field but ' + key + '.$ key is already in the schema');
      }

      if (type instanceof RegExp) {
        schemaClone[itemKey] = { type: String, regEx: type };
      } else {
        schemaClone[itemKey] = { type: type };
      }
      return;
    }

    // CASE 3: The definition is a regular expression
    if (definition instanceof RegExp) {
      schemaClone[key] = {
        type: String,
        regEx: definition
      };
      return;
    }

    // CASE 4: The definition is something, a type
    schemaClone[key] = { type: definition };
  });

  return schemaClone;
}

exports.default = expandShorthand;