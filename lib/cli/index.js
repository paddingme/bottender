"use strict";

var _camelCase = _interopRequireDefault(require("camel-case"));

var _get = _interopRequireDefault(require("lodash/get"));

var _minimist = _interopRequireDefault(require("minimist"));

var _updateNotifier = _interopRequireDefault(require("update-notifier"));

var _package = _interopRequireDefault(require("../../package.json"));

var _providers = _interopRequireDefault(require("./providers"));

var _log = require("./shared/log");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const main = async argv => {
  let providerName;
  let subcommand;
  (0, _updateNotifier.default)({
    pkg: _package.default
  }).notify({
    defer: false
  });

  switch (argv._[0]) {
    case 'messenger':
    case 'telegram':
    case 'line':
    case 'viber':
      providerName = argv._[0];
      subcommand = argv._[1];
      break;

    default:
      providerName = 'sh';
      subcommand = argv._[0];
  }

  if (argv.v || argv.version || argv._[0] === 'version') {
    console.log(_package.default.version);
    process.exit(0);
  }

  const provider = _providers.default[providerName];

  if (argv.h || argv.help) {
    provider.help();
    process.exit(0);
  } // the context object to supply to the providers or the commands


  const ctx = {
    config: null,
    // FIXME
    argv
  };

  try {
    const method = (0, _get.default)(provider, (0, _camelCase.default)(subcommand));

    if (method) {
      await provider[(0, _camelCase.default)(subcommand)](ctx);
    } else {
      const subcommands = Array.from(provider.subcommands).join(', ');
      (0, _log.error)(`Please specify a valid subcommand: ${subcommands}`);
      provider.help();
    }
  } catch (err) {
    console.error((0, _log.error)(`An unexpected error occurred in provider ${subcommand}: ${err.stack}`));
  }
};

const handleUnexpected = err => {
  console.error((0, _log.error)(`An unexpected error occurred!\n  ${err.stack} ${err.stack}`));
  process.exit(1);
};

const handleRejection = err => {
  if (err) {
    if (err instanceof Error) {
      handleUnexpected(err);
    } else {
      console.error((0, _log.error)(`An unexpected rejection occurred\n  ${err}`));
    }
  } else {
    console.error((0, _log.error)('An unexpected empty rejection occurred'));
  }

  process.exit(1);
};

process.on('unhandledRejection', handleRejection);
process.on('uncaughtException', handleUnexpected);
main((0, _minimist.default)(process.argv.slice(2))).catch(handleUnexpected);