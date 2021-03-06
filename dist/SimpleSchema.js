'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ValidationContext = exports.SimpleSchema = exports.schemaDefinitionOptions = undefined;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _deepExtend = require('deep-extend');

var _deepExtend2 = _interopRequireDefault(_deepExtend);

var _mongoObject = require('@clayne/mongo-object');

var _mongoObject2 = _interopRequireDefault(_mongoObject);

var _humanize = require('./humanize.js');

var _humanize2 = _interopRequireDefault(_humanize);

var _ValidationContext = require('./ValidationContext');

var _ValidationContext2 = _interopRequireDefault(_ValidationContext);

var _SimpleSchemaGroup = require('./SimpleSchemaGroup');

var _SimpleSchemaGroup2 = _interopRequireDefault(_SimpleSchemaGroup);

var _regExp = require('./regExp');

var _regExp2 = _interopRequireDefault(_regExp);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _messageBox = require('@clayne/message-box');

var _messageBox2 = _interopRequireDefault(_messageBox);

var _clean2 = require('./clean');

var _clean3 = _interopRequireDefault(_clean2);

var _expandShorthand = require('./expandShorthand');

var _expandShorthand2 = _interopRequireDefault(_expandShorthand);

var _utility = require('./utility');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Exported for tests
var schemaDefinitionOptions = exports.schemaDefinitionOptions = ['type', 'label', 'optional', 'required', 'autoValue', 'defaultValue'];

var oneOfProps = ['type', 'min', 'max', 'minCount', 'maxCount', 'allowedValues', 'exclusiveMin', 'exclusiveMax', 'regEx', 'custom', 'blackbox', 'trim'];

var propsThatCanBeFunction = ['label', 'optional'];

var oneOfPropsThatCanBeFunction = ['min', 'max', 'minCount', 'maxCount', 'allowedValues', 'exclusiveMin', 'exclusiveMax', 'regEx'];

var regExpMessages = [{ exp: _regExp2.default.Email, msg: 'must be a valid email address' }, { exp: _regExp2.default.EmailWithTLD, msg: 'must be a valid email address' }, { exp: _regExp2.default.Domain, msg: 'must be a valid domain' }, { exp: _regExp2.default.WeakDomain, msg: 'must be a valid domain' }, { exp: _regExp2.default.IP, msg: 'must be a valid IPv4 or IPv6 address' }, { exp: _regExp2.default.IPv4, msg: 'must be a valid IPv4 address' }, { exp: _regExp2.default.IPv6, msg: 'must be a valid IPv6 address' }, { exp: _regExp2.default.Url, msg: 'must be a valid URL' }, { exp: _regExp2.default.Id, msg: 'must be a valid alphanumeric ID' }, { exp: _regExp2.default.ZipCode, msg: 'must be a valid ZIP code' }, { exp: _regExp2.default.Phone, msg: 'must be a valid phone number' }];

var defaultMessages = {
  initialLanguage: 'en',
  messages: {
    en: {
      required: '{{label}} is required',
      minString: '{{label}} must be at least {{min}} characters',
      maxString: '{{label}} cannot exceed {{max}} characters',
      minNumber: '{{label}} must be at least {{min}}',
      maxNumber: '{{label}} cannot exceed {{max}}',
      minNumberExclusive: '{{label}} must be greater than {{min}}',
      maxNumberExclusive: '{{label}} must be less than {{max}}',
      minDate: '{{label}} must be on or after {{min}}',
      maxDate: '{{label}} cannot be after {{max}}',
      badDate: '{{label}} is not a valid date',
      minCount: 'You must specify at least {{minCount}} values',
      maxCount: 'You cannot specify more than {{maxCount}} values',
      noDecimal: '{{label}} must be an integer',
      notAllowed: '{{value}} is not an allowed value',
      expectedType: '{{label}} must be of type {{dataType}}',
      regEx: function regEx(_ref) {
        var label = _ref.label,
            regExp = _ref.regExp;

        // See if there's one where exp matches this expression
        var msgObj = void 0;
        if (regExp) {
          msgObj = _underscore2.default.find(regExpMessages, function (o) {
            return o.exp && o.exp.toString() === regExp;
          });
        }

        var regExpMessage = msgObj ? msgObj.msg : 'failed regular expression validation';

        return label + ' ' + regExpMessage;
      },

      keyNotInSchema: '{{name}} is not allowed by the schema'
    }
  }
};

var SimpleSchema = function () {
  function SimpleSchema() {
    var schema = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    (0, _classCallCheck3.default)(this, SimpleSchema);
    this.pick = getPickOrOmit('pick');
    this.omit = getPickOrOmit('omit');

    // Stash the options object
    this._constructorOptions = (0, _extends3.default)({}, options);
    if (this._constructorOptions.humanizeAutoLabels !== false) this._constructorOptions.humanizeAutoLabels = true;

    // Custom validators for this instance
    this._validators = [];
    this._docValidators = [];

    // Named validation contexts
    this._validationContexts = {};

    // Clone, expanding shorthand, and store the schema object in this._schema
    this._schema = {};
    this.extend(schema);

    // Define default validation error messages
    this.messageBox = new _messageBox2.default(defaultMessages);

    // Schema-level defaults for cleaning
    this._cleanOptions = (0, _extends3.default)({
      filter: true,
      autoConvert: true,
      removeEmptyStrings: true,
      trimStrings: true,
      getAutoValues: true,
      removeNullsFromArrays: false,
      extendAutoValueContext: {}
    }, options.clean);

    this.version = SimpleSchema.version;
  }

  (0, _createClass3.default)(SimpleSchema, [{
    key: 'findFirstAncestorSimpleSchema',
    value: function findFirstAncestorSimpleSchema(key, func) {
      var _this = this;

      var genericKey = _mongoObject2.default.makeKeyGeneric(key);

      var foundSchema = false;
      (0, _utility.forEachKeyAncestor)(genericKey, function (ancestor) {
        if (foundSchema) return; // skip remaining once we've found it
        var def = _this._schema[ancestor];
        if (!def) return;
        def.type.definitions.forEach(function (typeDef) {
          if (typeDef.type instanceof SimpleSchema) {
            func(typeDef.type, ancestor, genericKey.slice(ancestor.length + 1));
            foundSchema = true;
          }
        });
      });

      return foundSchema;
    }

    /**
     * @param {String} [key] One specific or generic key for which to get the schema.
     * @returns {Object} The entire schema object or just the definition for one key.
     *
     * Note that this returns the raw, unevaluated definition object. Use `getDefinition`
     * if you want the evaluated definition, where any properties that are functions
     * have been run to produce a result.
     */

  }, {
    key: 'schema',
    value: function schema(key) {
      if (!key) return this._schema;

      var genericKey = _mongoObject2.default.makeKeyGeneric(key);
      var keySchema = this._schema[genericKey];

      // If not defined in this schema, see if it's defined in a subschema
      if (!keySchema) {
        this.findFirstAncestorSimpleSchema(key, function (simpleSchema, ancestor, subSchemaKey) {
          keySchema = simpleSchema.schema(subSchemaKey);
        });
      }

      return keySchema;
    }

    /**
     * @returns {Object} The entire schema object with subschemas merged. This is the
     * equivalent of what schema() returned in SimpleSchema < 2.0
     *
     * Note that this returns the raw, unevaluated definition object. Use `getDefinition`
     * if you want the evaluated definition, where any properties that are functions
     * have been run to produce a result.
     */

  }, {
    key: 'mergedSchema',
    value: function mergedSchema() {
      var mergedSchema = {};

      _underscore2.default.each(this._schema, function (keySchema, key) {
        mergedSchema[key] = keySchema;

        keySchema.type.definitions.forEach(function (typeDef) {
          if (!(typeDef.type instanceof SimpleSchema)) return;
          _underscore2.default.each(typeDef.type.mergedSchema(), function (subKeySchema, subKey) {
            mergedSchema[key + '.' + subKey] = subKeySchema;
          });
        });
      });

      return mergedSchema;
    }

    /**
     * Returns the evaluated definition for one key in the schema
     *
     * @param {String} key Generic or specific schema key
     * @param {Array(String)} [propList] Array of schema properties you need; performance optimization
     * @param {Object} [functionContext] The context to use when evaluating schema options that are functions
     * @returns {Object} The schema definition for the requested key
     */

  }, {
    key: 'getDefinition',
    value: function getDefinition(key, propList, functionContext) {
      var _this2 = this;

      var defs = this.schema(key);
      if (!defs) return;
      defs = Array.isArray(propList) ? _underscore2.default.pick(defs, propList) : _underscore2.default.clone(defs);

      // Clone any, for any options that support specifying a function, evaluate the functions.
      var result = {};
      _underscore2.default.each(defs, function (val, prop) {
        if (propsThatCanBeFunction.indexOf(prop) > -1 && typeof val === 'function') {
          result[prop] = val.call(functionContext || {});
          // Inflect label if undefined
          if (prop === 'label' && typeof result[prop] !== 'string') result[prop] = inflectedLabel(key, _this2._constructorOptions.humanizeAutoLabels);
        } else {
          result[prop] = val;
        }
      });

      // Resolve all the types and convert to a normal array to make it easier
      // to use.
      if (defs.type) {
        result.type = defs.type.definitions.map(function (typeDef) {
          var newTypeDef = {};
          _underscore2.default.each(typeDef, function (val, prop) {
            if (oneOfPropsThatCanBeFunction.indexOf(prop) > -1 && typeof val === 'function') {
              newTypeDef[prop] = val.call(functionContext || {});
            } else {
              newTypeDef[prop] = val;
            }
          });
          return newTypeDef;
        });
      }

      return result;
    }

    // Returns an array of all the autovalue functions, including those in subschemas all the
    // way down the schema tree

  }, {
    key: 'autoValueFunctions',
    value: function autoValueFunctions() {
      var result = [];

      function addFuncs(autoValues, closestSubschemaFieldName) {
        _underscore2.default.each(autoValues, function (func, fieldName) {
          result.push({
            func: func,
            fieldName: fieldName,
            closestSubschemaFieldName: closestSubschemaFieldName
          });
        });
      }

      addFuncs(this._autoValues, '');

      _underscore2.default.each(this._schema, function (keySchema, key) {
        keySchema.type.definitions.forEach(function (typeDef) {
          if (!(typeDef.type instanceof SimpleSchema)) return;
          result = result.concat(typeDef.type.autoValueFunctions().map(function (_ref2) {
            var func = _ref2.func,
                fieldName = _ref2.fieldName,
                closestSubschemaFieldName = _ref2.closestSubschemaFieldName;

            return {
              func: func,
              fieldName: key + '.' + fieldName,
              closestSubschemaFieldName: closestSubschemaFieldName.length ? key + '.' + closestSubschemaFieldName : key
            };
          }));
        });
      });

      return result;
    }

    // Returns an array of all the blackbox keys, including those in subschemas

  }, {
    key: 'blackboxKeys',
    value: function blackboxKeys() {
      var blackboxKeys = this._blackboxKeys;
      _underscore2.default.each(this._schema, function (keySchema, key) {
        keySchema.type.definitions.forEach(function (typeDef) {
          if (!(typeDef.type instanceof SimpleSchema)) return;
          typeDef.type._blackboxKeys.forEach(function (blackboxKey) {
            blackboxKeys.push(key + '.' + blackboxKey);
          });
        });
      });
      return _underscore2.default.uniq(blackboxKeys);
    }

    // Check if the key is a nested dot-syntax key inside of a blackbox object

  }, {
    key: 'keyIsInBlackBox',
    value: function keyIsInBlackBox(key) {
      var _this3 = this;

      var isInBlackBox = false;
      (0, _utility.forEachKeyAncestor)(_mongoObject2.default.makeKeyGeneric(key), function (ancestor, remainder) {
        if (_this3._blackboxKeys.indexOf(ancestor) > -1) {
          isInBlackBox = true;
        } else {
          var testKeySchema = _this3.schema(ancestor);
          if (testKeySchema) {
            testKeySchema.type.definitions.forEach(function (typeDef) {
              if (!(typeDef.type instanceof SimpleSchema)) return;
              if (typeDef.type.keyIsInBlackBox(remainder)) isInBlackBox = true;
            });
          }
        }
      });
      return isInBlackBox;
    }

    // Returns true if key is explicitly allowed by the schema or implied
    // by other explicitly allowed keys.
    // The key string should have $ in place of any numeric array positions.

  }, {
    key: 'allowsKey',
    value: function allowsKey(key) {
      var _this4 = this;

      // Loop through all keys in the schema
      return _underscore2.default.any(this._schemaKeys, function (loopKey) {
        // If the schema key is the test key, it's allowed.
        if (loopKey === key) return true;

        var fieldSchema = _this4.schema(loopKey);
        var compare1 = key.slice(0, loopKey.length + 2);
        var compare2 = compare1.slice(0, -1);

        // Blackbox and subschema checks are needed only if key starts with
        // loopKey + a dot
        if (compare2 !== loopKey + '.') return false;

        // Black box handling
        if (fieldSchema.blackbox === true) {
          // If the test key is the black box key + ".$", then the test
          // key is NOT allowed because black box keys are by definition
          // only for objects, and not for arrays.
          return compare1 !== loopKey + '.$';
        }

        // Subschemas
        var allowed = false;
        var subKey = key.slice(loopKey.length + 1);
        fieldSchema.type.definitions.forEach(function (typeDef) {
          if (!(typeDef.type instanceof SimpleSchema)) return;
          if (typeDef.type.allowsKey(subKey)) allowed = true;
        });
        return allowed;
      });
    }

    /**
     * Returns all the child keys for the object identified by the generic prefix,
     * or all the top level keys if no prefix is supplied.
     *
     * @param {String} [keyPrefix] The Object-type generic key for which to get child keys. Omit for
     *   top-level Object-type keys
     * @returns {[[Type]]} [[Description]]
     */

  }, {
    key: 'objectKeys',
    value: function objectKeys(keyPrefix) {
      return keyPrefix ? this._objectKeys[keyPrefix + '.'] || [] : this._firstLevelSchemaKeys;
    }

    /**
     * Extends this schema with another schema, key by key.
     *
     * @param {SimpleSchema|Object} schema
     * @returns undefined
     */

  }, {
    key: 'extend',
    value: function extend() {
      var _this5 = this;

      var schema = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var schemaObj = void 0;
      if (schema instanceof SimpleSchema) {
        schemaObj = schema._schema;
        // Merge the validators
        this._validators = this._validators.concat(schema._validators);
        this._docValidators = this._docValidators.concat(schema._docValidators);
      } else {
        schemaObj = (0, _expandShorthand2.default)(schema);
      }

      // Extend this._schema with additional fields and definitions from schema
      this._schema = mergeSchemas([this._schema, schemaObj]);

      checkSchemaOverlap(this._schema);

      // Set/Reset all of these
      this._schemaKeys = [];
      this._autoValues = {};
      this._blackboxKeys = [];
      this._firstLevelSchemaKeys = [];
      this._depsLabels = {};
      this._objectKeys = {};

      var updateAllFields = function updateAllFields(curSchema) {
        var schemaParentKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

        _underscore2.default.each(curSchema, function (definition, fieldName) {
          fieldName = schemaParentKey ? schemaParentKey + '.' + fieldName : fieldName;

          // Store child keys keyed by parent
          if (fieldName.indexOf('.') > -1 && fieldName.slice(-2) !== '.$') {
            var parentKey = fieldName.slice(0, fieldName.lastIndexOf('.'));
            var parentKeyWithDot = parentKey + '.';
            _this5._objectKeys[parentKeyWithDot] = _this5._objectKeys[parentKeyWithDot] || [];
            _this5._objectKeys[parentKeyWithDot].push(fieldName.slice(fieldName.lastIndexOf('.') + 1));
          }

          // We only want to cache object keys for sub schemas.
          // All other properties are fetched on demand
          if (schemaParentKey) return;

          _this5._schema[fieldName] = definition = checkAndScrubDefinition(fieldName, definition, _this5._constructorOptions, _this5._schema);

          // Keep list of all keys for speedier checking
          _this5._schemaKeys.push(fieldName);

          // Keep list of all top level keys
          if (fieldName.indexOf('.') === -1) _this5._firstLevelSchemaKeys.push(fieldName);

          // Initialize label reactive dependency (Meteor only)
          if (_this5._constructorOptions.tracker) {
            _this5._depsLabels[fieldName] = new _this5._constructorOptions.tracker.Dependency();
          }

          // Keep list of all blackbox keys for passing to MongoObject constructor
          if (definition.blackbox) _this5._blackboxKeys.push(fieldName);

          // Keep list of autoValue functions by key
          if (definition.autoValue) _this5._autoValues[fieldName] = definition.autoValue;

          // If the current field is a nested SimpleSchema,
          // iterate over the child fields and cache their properties as well
          _underscore2.default.each(definition.type.definitions, function (_ref3) {
            var type = _ref3.type;

            if (type instanceof SimpleSchema) {
              updateAllFields(type._schema, fieldName);
            }
          });
        });
      };

      // Update all of the information cached on the instance
      updateAllFields(this._schema);
    }
  }, {
    key: 'newContext',
    value: function newContext() {
      return new _ValidationContext2.default(this);
    }
  }, {
    key: 'namedContext',
    value: function namedContext(name) {
      if (typeof name !== 'string') name = 'default';
      if (!this._validationContexts[name]) {
        this._validationContexts[name] = new SimpleSchema.ValidationContext(this);
      }
      return this._validationContexts[name];
    }
  }, {
    key: 'addValidator',
    value: function addValidator(func) {
      this._validators.push(func);
    }
  }, {
    key: 'addDocValidator',
    value: function addDocValidator(func) {
      this._docValidators.push(func);
    }

    /**
     * @param obj {Object|Object[]} Object or array of objects to validate.
     * @param [options] {Object} Same options object that ValidationContext#validate takes
     *
     * Throws an Error with name `ClientError` and `details` property containing the errors.
     */

  }, {
    key: 'validate',
    value: function validate(obj, options) {
      var _this6 = this;

      // For Meteor apps, `check` option can be passed to silence audit-argument-checks
      if (typeof this._constructorOptions.check === 'function') {
        // Call check but ignore the error
        try {
          this._constructorOptions.check(obj);
        } catch (e) {/* ignore error */}
      }

      // obj can be an array, in which case we validate each object in it and
      // throw as soon as one has an error
      var objects = Array.isArray(obj) ? obj : [obj];
      objects.forEach(function (oneObj) {
        var validationContext = _this6.newContext();
        var isValid = validationContext.validate(oneObj, options);

        if (isValid) return;

        var errors = validationContext.validationErrors();

        // In order for the message at the top of the stack trace to be useful,
        // we set it to the first validation error message.
        var message = _this6.messageForError(errors[0]);

        var error = new Error(message);
        error.name = error.errorType = 'ClientError';
        error.details = errors;
        error.error = 'validation-error';

        // The primary use for the validationErrorTransform is for the Meteor package
        // to convert the vanilla Error into a Meteor.Error until DDP is able to pass
        // vanilla errors back to the client.
        if (typeof SimpleSchema.validationErrorTransform === 'function') {
          throw SimpleSchema.validationErrorTransform(error);
        } else {
          throw error;
        }
      });
    }
  }, {
    key: 'validator',
    value: function validator() {
      var _this7 = this;

      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return function (obj) {
        var optionsClone = (0, _extends3.default)({}, options);
        if (options.clean === true) {
          // Do this here and pass into both functions for better performance
          optionsClone.mongoObject = new _mongoObject2.default(obj, _this7.blackboxKeys());
          _this7.clean(obj, optionsClone);
        }
        _this7.validate(obj, optionsClone);
      };
    }
  }, {
    key: 'clean',
    value: function clean() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _clean3.default.apply(undefined, [this].concat(args));
    }

    /**
     * Change schema labels on the fly, causing mySchema.label computation
     * to rerun. Useful when the user changes the language.
     *
     * @param {Object} labels A dictionary of all the new label values, by schema key.
     */

  }, {
    key: 'labels',
    value: function labels(_labels) {
      var _this8 = this;

      _underscore2.default.each(_labels, function (label, key) {
        if (typeof label !== 'string' && typeof label !== 'function') return;
        if (!_this8._schema.hasOwnProperty(key)) return;

        _this8._schema[key].label = label;
        _this8._depsLabels[key] && _this8._depsLabels[key].changed();
      });
    }

    /**
     * Gets a field's label or all field labels reactively.
     *
     * @param {String} [key] The schema key, specific or generic.
     *   Omit this argument to get a dictionary of all labels.
     * @returns {String} The label
     */

  }, {
    key: 'label',
    value: function label(key) {
      var _this9 = this;

      // Get all labels
      if (key === null || key === undefined) {
        var _ret = function () {
          var result = {};
          _underscore2.default.each(_this9._schemaKeys, function (schemaKey) {
            result[schemaKey] = _this9.label(schemaKey);
          });
          return {
            v: result
          };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
      }

      // Get label for one field
      var def = this.getDefinition(key, ['label']);
      if (!def) return null;

      var genericKey = _mongoObject2.default.makeKeyGeneric(key);
      this._depsLabels[genericKey] && this._depsLabels[genericKey].depend();
      return def.label;
    }

    // Returns a string message for the given error type and key. Passes through
    // to @clayne/message-box pkg.

  }, {
    key: 'messageForError',
    value: function messageForError(errorInfo) {
      var name = errorInfo.name;


      return this.messageBox.message(errorInfo, {
        context: {
          key: name, // backward compatibility

          // The call to this.label() establishes a reactive dependency, too
          label: this.label(name)
        }
      });
    }

    /**
     * @method SimpleSchema#pick
     * @param {[fields]} The list of fields to pick to instantiate the subschema
     * @returns {SimpleSchema} The subschema
     */


    /**
     * @method SimpleSchema#omit
     * @param {[fields]} The list of fields to omit to instantiate the subschema
     * @returns {SimpleSchema} The subschema
     */

  }], [{
    key: 'extendOptions',


    // If you need to allow properties other than those listed above, call this from your app or package
    value: function extendOptions(options) {
      // For backwards compatibility we still take an object here, but we only care about the names
      if (!Array.isArray(options)) options = (0, _keys2.default)(options);
      options.forEach(function (option) {
        schemaDefinitionOptions.push(option);
      });
    }
  }, {
    key: 'defineValidationErrorTransform',
    value: function defineValidationErrorTransform(transform) {
      if (typeof transform !== 'function') {
        throw new Error('SimpleSchema.defineValidationErrorTransform must be passed a function that accepts an Error and returns an Error');
      }
      SimpleSchema.validationErrorTransform = transform;
    }
  }, {
    key: 'validate',
    value: function validate(obj, schema, options) {
      // Allow passing just the schema object
      if (!(schema instanceof SimpleSchema)) {
        schema = new SimpleSchema(schema);
      }

      return schema.validate(obj, options);
    }
  }, {
    key: 'oneOf',
    value: function oneOf() {
      for (var _len2 = arguments.length, definitions = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        definitions[_key2] = arguments[_key2];
      }

      return new (Function.prototype.bind.apply(_SimpleSchemaGroup2.default, [null].concat(definitions)))();
    }

    // Global custom validators

  }, {
    key: 'addValidator',
    value: function addValidator(func) {
      SimpleSchema._validators.push(func);
    }
  }, {
    key: 'addDocValidator',
    value: function addDocValidator(func) {
      SimpleSchema._docValidators.push(func);
    }

    // Backwards compatibility

  }]);
  return SimpleSchema;
}();

/*
 * PRIVATE
 */

SimpleSchema.version = 2;
SimpleSchema.RegEx = _regExp2.default;
SimpleSchema._validators = [];
SimpleSchema._docValidators = [];
SimpleSchema.ErrorTypes = {
  REQUIRED: 'required',
  MIN_STRING: 'minString',
  MAX_STRING: 'maxString',
  MIN_NUMBER: 'minNumber',
  MAX_NUMBER: 'maxNumber',
  MIN_NUMBER_EXCLUSIVE: 'minNumberExclusive',
  MAX_NUMBER_EXCLUSIVE: 'maxNumberExclusive',
  MIN_DATE: 'minDate',
  MAX_DATE: 'maxDate',
  BAD_DATE: 'badDate',
  MIN_COUNT: 'minCount',
  MAX_COUNT: 'maxCount',
  MUST_BE_INTEGER: 'noDecimal',
  VALUE_NOT_ALLOWED: 'notAllowed',
  EXPECTED_TYPE: 'expectedType',
  FAILED_REGULAR_EXPRESSION: 'regEx',
  KEY_NOT_IN_SCHEMA: 'keyNotInSchema'
};
SimpleSchema.Integer = 'SimpleSchema.Integer';
SimpleSchema._makeGeneric = _mongoObject2.default.makeKeyGeneric;
SimpleSchema.ValidationContext = _ValidationContext2.default;

SimpleSchema.setDefaultMessages = function (messages) {
  (0, _deepExtend2.default)(defaultMessages, messages);
};

function mergeSchemas(schemas) {
  var mergedSchema = {};
  _underscore2.default.each(schemas, function (schema) {
    // Loop through and extend each individual field
    // definition. That way you can extend and overwrite
    // base field definitions.
    _underscore2.default.each(schema, function (def, field) {
      mergedSchema[field] = mergedSchema[field] || {};
      if (!(mergedSchema[field] instanceof _SimpleSchemaGroup2.default)) {
        if (def instanceof _SimpleSchemaGroup2.default) {
          mergedSchema[field] = def;
        } else {
          (0, _assign2.default)(mergedSchema[field], def);
        }
      }
    });
  });
  return mergedSchema;
}

// Throws an error if any fields are `type` SimpleSchema but then also
// have subfields defined outside of that.
function checkSchemaOverlap(schema) {
  _underscore2.default.each(schema, function (val, key) {
    _underscore2.default.each(val.type.definitions, function (def) {
      if (!(def.type instanceof SimpleSchema)) return;
      _underscore2.default.each(def.type._schema, function (subVal, subKey) {
        var newKey = key + '.' + subKey;
        if (schema.hasOwnProperty(newKey)) {
          throw new Error('The type for "' + key + '" is set to a SimpleSchema instance that defines "' + key + '.' + subKey + '", but the parent SimpleSchema instance also tries to define "' + key + '.' + subKey + '"');
        }
      });
    });
  });
}

/**
 * @param {String} fieldName The full generic schema key
 * @param {Boolean} shouldHumanize Humanize it
 * @returns {String} A label based on the key
 */
function inflectedLabel(fieldName, shouldHumanize) {
  var pieces = fieldName.split('.');
  var label = void 0;
  do {
    label = pieces.pop();
  } while (label === '$' && pieces.length);
  return shouldHumanize ? (0, _humanize2.default)(label) : label;
}

function getDefaultAutoValueFunction(defaultValue) {
  return function defaultAutoValueFunction() {
    if (this.isSet) return;
    if (this.operator === null) return defaultValue;
    // We don't know whether it's an upsert, but if it's not, this seems to be ignored,
    // so this is a safe way to make sure the default value is added on upsert insert.
    return { $setOnInsert: defaultValue };
  };
}

function checkAndScrubDefinition(fieldName, definition, options, fullSchemaObj) {
  var internalDefinition = (0, _extends3.default)({}, definition);

  // Internally, all definition types are stored as groups for simplicity of access
  if (!(internalDefinition.type instanceof _SimpleSchemaGroup2.default)) {
    internalDefinition.type = new _SimpleSchemaGroup2.default(_underscore2.default.pick(internalDefinition, oneOfProps));
  }

  // Limit to only the non-oneOf props
  internalDefinition = _underscore2.default.omit(internalDefinition, _underscore2.default.without(oneOfProps, 'type'));

  // Validate the field definition
  _underscore2.default.each(internalDefinition, function (val, key) {
    if (schemaDefinitionOptions.indexOf(key) === -1) {
      throw new Error('Invalid definition for ' + fieldName + ' field: "' + key + '" is not a supported property');
    }
  });

  // Make sure the `type`s are OK
  internalDefinition.type.definitions.forEach(function (_ref4) {
    var blackbox = _ref4.blackbox,
        type = _ref4.type;

    if (!type) throw new Error('Invalid definition for ' + fieldName + ' field: "type" option is required');

    if (Array.isArray(type)) {
      throw new Error('Invalid definition for ' + fieldName + ' field: "type" may not be an array. Change it to Array.');
    }

    if (type instanceof SimpleSchema) {
      _underscore2.default.each(type._schema, function (subVal, subKey) {
        var newKey = fieldName + '.' + subKey;
        if (fullSchemaObj.hasOwnProperty(newKey)) {
          throw new Error('The type for "' + fieldName + '" is set to a SimpleSchema instance that defines "' + newKey + '", but the parent SimpleSchema instance also tries to define "' + newKey + '"');
        }
      });
    }

    // If any of the valid types are blackbox, mark blackbox on the overall definition
    if (blackbox === true) internalDefinition.blackbox = true;
  });

  // defaultValue -> autoValue
  // We support defaultValue shortcut by converting it immediately into an
  // autoValue.
  if ('defaultValue' in internalDefinition) {
    if ('autoValue' in internalDefinition) {
      console.warn('SimpleSchema: Found both autoValue and defaultValue options for "' + fieldName + '". Ignoring defaultValue.');
    } else {
      if (fieldName.endsWith('.$')) {
        throw new Error('An array item field (one that ends with ".$") cannot have defaultValue.');
      }
      internalDefinition.autoValue = getDefaultAutoValueFunction(internalDefinition.defaultValue);
      delete internalDefinition.defaultValue;
    }
  }

  // REQUIREDNESS
  if (fieldName.endsWith('.$')) {
    internalDefinition.optional = true;
  } else {
    if (!internalDefinition.hasOwnProperty('optional')) {
      if (internalDefinition.hasOwnProperty('required')) {
        if (typeof internalDefinition.required === 'function') {
          internalDefinition.optional = function optional() {
            for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
              args[_key3] = arguments[_key3];
            }

            return !internalDefinition.required.apply(this, args);
          };
        } else {
          internalDefinition.optional = !internalDefinition.required;
        }
      } else {
        internalDefinition.optional = options.requiredByDefault === false;
      }
    }
  }

  delete internalDefinition.required;

  // LABELS
  if (!internalDefinition.hasOwnProperty('label')) {
    if (options.defaultLabel) {
      internalDefinition.label = options.defaultLabel;
    } else if (SimpleSchema.defaultLabel) {
      internalDefinition.label = SimpleSchema.defaultLabel;
    } else {
      internalDefinition.label = inflectedLabel(fieldName, options.humanizeAutoLabels);
    }
  }

  return internalDefinition;
}

function getPickOrOmit(type) {
  return function pickOrOmit() {
    for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    // If they are picking/omitting an object or array field, we need to also include everything under it
    var newSchema = {};
    _underscore2.default.each(this._schema, function (value, key) {
      // Pick/omit it if it IS in the array of keys they want OR if it
      // STARTS WITH something that is in the array plus a period
      var includeIt = _underscore2.default.any(args, function (wantedField) {
        return key === wantedField || key.indexOf(wantedField + '.') === 0;
      });

      if (includeIt && type === 'pick' || !includeIt && type === 'omit') {
        newSchema[key] = value;
      }
    });

    return new SimpleSchema(newSchema);
  };
}

exports.SimpleSchema = SimpleSchema;
exports.ValidationContext = _ValidationContext2.default;