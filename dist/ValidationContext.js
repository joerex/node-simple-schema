'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _mongoObject = require('@clayne/mongo-object');

var _mongoObject2 = _interopRequireDefault(_mongoObject);

var _doValidation = require('./doValidation.js');

var _doValidation2 = _interopRequireDefault(_doValidation);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ValidationContext = function () {
  function ValidationContext(ss) {
    (0, _classCallCheck3.default)(this, ValidationContext);

    this._simpleSchema = ss;
    this._schema = ss.mergedSchema();
    this._schemaKeys = (0, _keys2.default)(this._schema);
    this._validationErrors = [];

    // Set up validation dependencies
    this._deps = {};
    var tracker = ss._constructorOptions.tracker;

    if (tracker) {
      this._depsAny = new tracker.Dependency();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(this._schemaKeys), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var key = _step.value;

          this._deps[key] = new tracker.Dependency();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }

  (0, _createClass3.default)(ValidationContext, [{
    key: '_markKeyChanged',
    value: function _markKeyChanged(key) {
      var genericKey = _mongoObject2.default.makeKeyGeneric(key);
      if (this._deps.hasOwnProperty(genericKey)) this._deps[genericKey].depend();
    }
  }, {
    key: '_markKeysChanged',
    value: function _markKeysChanged(keys) {
      if (!keys || !Array.isArray(keys) || !keys.length) return;

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = (0, _getIterator3.default)(keys), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var key = _step2.value;

          this._markKeyChanged(key);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      this._depsAny && this._depsAny.changed();
    }
  }, {
    key: 'setValidationErrors',
    value: function setValidationErrors(errors) {
      var previousValidationErrors = _underscore2.default.pluck(this._validationErrors, 'name');
      var newValidationErrors = _underscore2.default.pluck(errors, 'name');

      this._validationErrors = errors;

      // Mark all previous plus all new as changed
      var changedKeys = previousValidationErrors.concat(newValidationErrors);
      this._markKeysChanged(changedKeys);
    }
  }, {
    key: 'addValidationErrors',
    value: function addValidationErrors(errors) {
      var newValidationErrors = _underscore2.default.pluck(errors, 'name');

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = (0, _getIterator3.default)(errors), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var error = _step3.value;

          this._validationErrors.push(error);
        }

        // Mark all new as changed
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      this._markKeysChanged(newValidationErrors);
    }

    // Reset the validationErrors array

  }, {
    key: 'reset',
    value: function reset() {
      this.setValidationErrors([]);
    }
  }, {
    key: 'getErrorForKey',
    value: function getErrorForKey(key) {
      var genericKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _mongoObject2.default.makeKeyGeneric(key);

      var errors = this._validationErrors;
      return _underscore2.default.findWhere(errors, { name: key }) || _underscore2.default.findWhere(errors, { name: genericKey });
    }
  }, {
    key: '_keyIsInvalid',
    value: function _keyIsInvalid(key, genericKey) {
      return !!this.getErrorForKey(key, genericKey);
    }

    // Like the internal one, but with deps

  }, {
    key: 'keyIsInvalid',
    value: function keyIsInvalid(key) {
      var genericKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _mongoObject2.default.makeKeyGeneric(key);

      if (this._deps.hasOwnProperty(genericKey)) this._deps[genericKey].depend();

      return this._keyIsInvalid(key, genericKey);
    }
  }, {
    key: 'keyErrorMessage',
    value: function keyErrorMessage(key) {
      var genericKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _mongoObject2.default.makeKeyGeneric(key);

      if (this._deps.hasOwnProperty(genericKey)) this._deps[genericKey].depend();

      var errorObj = this.getErrorForKey(key, genericKey);
      if (!errorObj) return '';

      return this._simpleSchema.messageForError(errorObj);
    }

    /**
     * Validates the object against the simple schema and sets a reactive array of error objects
     */

  }, {
    key: 'validate',
    value: function validate(obj) {
      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref$extendedCustomCo = _ref.extendedCustomContext,
          extendedCustomContext = _ref$extendedCustomCo === undefined ? {} : _ref$extendedCustomCo,
          _ref$ignore = _ref.ignore,
          ignoreTypes = _ref$ignore === undefined ? [] : _ref$ignore,
          keysToValidate = _ref.keys,
          _ref$modifier = _ref.modifier,
          isModifier = _ref$modifier === undefined ? false : _ref$modifier,
          mongoObject = _ref.mongoObject,
          _ref$upsert = _ref.upsert,
          isUpsert = _ref$upsert === undefined ? false : _ref$upsert;

      var validationErrors = (0, _doValidation2.default)({
        extendedCustomContext: extendedCustomContext,
        ignoreTypes: ignoreTypes,
        isModifier: isModifier,
        isUpsert: isUpsert,
        keysToValidate: keysToValidate,
        mongoObject: mongoObject,
        obj: obj,
        schema: this._simpleSchema
      });

      if (keysToValidate) {
        // We have only revalidated the listed keys, so if there
        // are any other existing errors that are NOT in the keys list,
        // we should keep these errors.
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          var _loop = function _loop() {
            var error = _step4.value;

            var wasValidated = _underscore2.default.any(keysToValidate, function (key) {
              return key === error.name || error.name.startsWith(key + '.');
            });
            if (!wasValidated) validationErrors.push(error);
          };

          for (var _iterator4 = (0, _getIterator3.default)(this._validationErrors), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            _loop();
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      }

      this.setValidationErrors(validationErrors);

      // Return true if it was valid; otherwise, return false
      return !validationErrors.length;
    }
  }, {
    key: 'isValid',
    value: function isValid() {
      this._depsAny && this._depsAny.depend();
      return this._validationErrors.length === 0;
    }
  }, {
    key: 'validationErrors',
    value: function validationErrors() {
      this._depsAny && this._depsAny.depend();
      return this._validationErrors;
    }
  }, {
    key: 'clean',
    value: function clean() {
      var _simpleSchema;

      return (_simpleSchema = this._simpleSchema).clean.apply(_simpleSchema, arguments);
    }
  }]);
  return ValidationContext;
}();

exports.default = ValidationContext;