"use strict";

var _path = _interopRequireDefault(require("path"));

var _joi = _interopRequireDefault(require("joi"));

var _get = _interopRequireDefault(require("lodash/get"));

var _importFresh = _interopRequireDefault(require("import-fresh"));

var _invariant = _interopRequireDefault(require("invariant"));

var _minimist = _interopRequireDefault(require("minimist"));

var _schema = _interopRequireDefault(require("./schema"));

var _log = require("./log");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getConfig = (configPath, platform) => {
  const argv = (0, _minimist.default)(process.argv);
  const config = (0, _importFresh.default)(_path.default.resolve(configPath));

  if (!argv['skip-validate']) {
    const validateResult = _joi.default.validate(config, _schema.default, {
      allowUnknown: true
    });

    if (validateResult.error) {
      const {
        message,
        type
      } = validateResult.error.details[0];
      const errorPath = validateResult.error.details[0].path.join('.');
      throw new Error(`The config format is not valid.\nmessage: ${message}\npath: ${(0, _log.bold)(errorPath)}\ntype: ${type}`);
    }
  }

  const result = (0, _get.default)(config, platform, undefined);
  (0, _invariant.default)(result, `Could not find \`${platform}\` key, please check your config file is in the correct format.`);
  return result;
};

module.exports = getConfig;