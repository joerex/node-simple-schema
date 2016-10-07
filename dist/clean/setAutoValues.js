'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _includes = require('babel-runtime/core-js/array/includes');

var _includes2 = _interopRequireDefault(_includes);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _mongoObject = require('mongo-object');

var _mongoObject2 = _interopRequireDefault(_mongoObject);

var _utility = require('../utility.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @method setAutoValues
 * @private
 * @param {Array} autoValueFunctions - An array of objects with func, fieldName, and closestSubschemaFieldName props
 * @param {MongoObject} mongoObject
 * @param {Boolean} [isModifier=false] - Is it a modifier doc?
 * @param {Object} [extendedAutoValueContext] - Object that will be added to the context when calling each autoValue function
 * @returns {undefined}
 *
 * Updates doc with automatic values from autoValue functions or default
 * values from defaultValue. Modifies the referenced object in place.
 */
function setAutoValues(autoValueFunctions, mongoObject, isModifier, extendedAutoValueContext) {
  var doneKeys = [];

  function getFieldInfo(key) {
    var keyInfo = mongoObject.getInfoForKey(key) || {};
    return {
      isSet: keyInfo.value !== undefined,
      value: keyInfo.value,
      operator: keyInfo.operator || null
    };
  }

  function runAV(func, closestSubschemaFieldName) {
    var affectedKey = this.key;

    // If already called for this key, skip it
    if ((0, _includes2.default)(doneKeys, affectedKey)) return;

    var fieldParentName = (0, _utility.getParentOfKey)(affectedKey, true);

    var doUnset = false;
    var autoValue = func.call((0, _extends3.default)({
      isSet: this.value !== undefined,
      unset: function unset() {
        doUnset = true;
      },

      value: this.value,
      operator: this.operator,
      field: function field(fName) {
        return getFieldInfo(closestSubschemaFieldName + fName);
      },
      siblingField: function siblingField(fName) {
        return getFieldInfo(fieldParentName + fName);
      }
    }, extendedAutoValueContext || {}), mongoObject.getObject());

    // Update tracking of which keys we've run autovalue for
    doneKeys.push(affectedKey);

    if (doUnset) mongoObject.removeValueForPosition(this.position, !isModifier);

    if (autoValue === undefined) return;

    // If the user's auto value is of the pseudo-modifier format, parse it
    // into operator and value.
    if (isModifier) {
      var op = void 0;
      var newValue = void 0;
      if (autoValue && (typeof autoValue === 'undefined' ? 'undefined' : (0, _typeof3.default)(autoValue)) === 'object') {
        var avOperator = (0, _keys2.default)(autoValue).find(function (avProp) {
          return avProp.substring(0, 1) === '$';
        });
        if (avOperator) {
          op = avOperator;
          newValue = autoValue[avOperator];
        }
      }

      // Add $set for updates and upserts if necessary. Keep this
      // above the "if (op)" block below since we might change op
      // in this line.
      if (!op && this.position.slice(0, 1) !== '$') {
        op = '$set';
        newValue = autoValue;
      }

      if (op) {
        // Update/change value
        mongoObject.removeValueForPosition(this.position);
        mongoObject.setValueForPosition(op + '[' + affectedKey + ']', newValue);
        return;
      }
    }

    // We want to traverse object paths (foo.bar) only if:
    // 1. The document is not a mongo modifier
    // or
    // 2. The current position is not nested directly under a modifier like $push
    //
    // If we are directly under the modifier we want to use a nested path setter
    // ex: $push: {
    //  'foo.bar.baz': 3
    // }
    //
    // but if we are actually setting a nested object we want to use an object setter
    // ex: $push: {
    //   foo: {
    //     bar: {
    //       baz: 3
    //     }
    //   }
    // }
    //
    // The reason is that setting $push: {
    //   foo: {
    //     'bar.baz': 3
    //   }
    // }
    //
    // is illegal because mongo cannot have "." in its keys
    var traverseObject = !isModifier || /\]\[/.test(this.position);

    // Update/change value
    mongoObject.setValueForPosition(this.position, autoValue, traverseObject);
  }

  _underscore2.default.each(autoValueFunctions, function (_ref) {
    var func = _ref.func;
    var fieldName = _ref.fieldName;
    var closestSubschemaFieldName = _ref.closestSubschemaFieldName;

    // autoValue should run for the exact key only, for each array item if under array
    // should run whenever
    // 1 it is set
    // 2 it will be set by an ancestor field being set
    // 3 it is not set and is not within an array
    // 4 it is not set and is within an array, run for each array item that is set
    // 5 if doing $set[a.$] or $set[a.$.b]

    var test = fieldName;
    var positions = [];
    var lastDot = void 0;
    var lastDollar = fieldName.lastIndexOf('$');
    var isOrIsWithinArray = lastDollar !== -1;

    // We always need to start by checking the array itself in case
    // it has items that have objects that need autoValue run. If not, we
    // will later check for the exact field name.
    if (isOrIsWithinArray) test = fieldName.slice(0, lastDollar + 1);

    while (positions.length === 0 && test.length > 0) {
      positions = mongoObject.getPositionsInfoForGenericKey(test);
      if (positions.length > 0) {
        if (fieldName !== test) {
          if (fieldName.indexOf('.$.') > -1) {
            (function () {
              var lastPart = '';
              if (fieldName.indexOf(test + '.') === 0) {
                lastPart = fieldName.replace(test + '.', '');
              }
              positions = _underscore2.default.map(positions, function (position) {
                position.key = position.key + '.' + lastPart;
                position.position = position.position + '[' + lastPart + ']';
                position.value = mongoObject.getValueForPosition(position.position, !isModifier);
                return position;
              });
            })();
          } else {
            positions = [];
            break;
          }
        }
      } else {
        lastDot = test.lastIndexOf('.');
        if (lastDot > -1) {
          test = test.slice(0, lastDot);
        } else {
          test = '';
        }
      }
    }

    if (positions.length === 0) {
      if (isOrIsWithinArray) {
        positions = mongoObject.getPositionsInfoForGenericKey(fieldName);
      } else {
        // Not set directly or indirectly
        positions.push({
          key: fieldName,
          value: undefined,
          operator: isModifier ? '$set' : null,
          position: isModifier ? '$set[' + fieldName + ']' : _mongoObject2.default._keyToPosition(fieldName)
        });
      }
    }

    // Run the autoValue function once for each place in the object that
    // has a value or that potentially should.
    _underscore2.default.each(positions, function (position) {
      runAV.call(position, func, closestSubschemaFieldName);
    });
  });
}

exports.default = setAutoValues;