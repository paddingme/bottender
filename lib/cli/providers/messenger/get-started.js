"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getGetStarted = getGetStarted;
exports.deleteGetStarted = deleteGetStarted;
exports.default = main;

var _chalk = _interopRequireDefault(require("chalk"));

var _invariant = _interopRequireDefault(require("invariant"));

var _messagingApiMessenger = require("messaging-api-messenger");

var _getConfig = _interopRequireDefault(require("../../shared/getConfig"));

var _log = require("../../shared/log");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable consistent-return */
const help = () => {
  console.log(`
    bottender messenger get-started <command> [option]

    ${_chalk.default.dim('Commands:')}

      get               Get get_started setting.
      del, delete       Delete get_started setting.

    ${_chalk.default.dim('Options:')}

      -t, --token       Specify Messenger access token.

    ${_chalk.default.dim('Examples:')}

    ${_chalk.default.dim('-')} Get get_started setting

      ${_chalk.default.cyan('$ bottender messenger get-started get')}

    ${_chalk.default.dim('-')} Delete get_started setting with specific access token

      ${_chalk.default.cyan('$ bottender messenger get-started delete --token __FAKE_TOKEN__')}
  `);
};

async function getGetStarted(ctx) {
  const {
    t,
    token: _token
  } = ctx.argv;
  let accessToken;

  try {
    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = (0, _getConfig.default)('bottender.config.js', 'messenger');
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiMessenger.MessengerClient.connect(accessToken);

    const getStarted = await client.getGetStarted();

    if (getStarted && getStarted.payload) {
      (0, _log.print)(`Get started payload is: ${(0, _log.bold)(getStarted.payload)}`);
    } else {
      (0, _log.error)(`Failed to find ${(0, _log.bold)('get_started')} setting`);
    }
  } catch (err) {
    (0, _log.error)(`Failed to get ${(0, _log.bold)('get_started')} setting`);

    if (err.response) {
      (0, _log.error)(`status: ${(0, _log.bold)(err.response.status)}`);

      if (err.response.data) {
        (0, _log.error)(`data: ${(0, _log.bold)(JSON.stringify(err.response.data, null, 2))}`);
      }
    } else {
      (0, _log.error)(err.message);
    }

    return process.exit(1);
  }
}

async function deleteGetStarted(ctx) {
  const {
    t,
    token: _token
  } = ctx.argv;
  let accessToken;

  try {
    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = (0, _getConfig.default)('bottender.config.js', 'messenger');
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiMessenger.MessengerClient.connect(accessToken);

    await client.deleteGetStarted();
    (0, _log.print)(`Successfully delete ${(0, _log.bold)('get_started')} setting`);
  } catch (err) {
    (0, _log.error)(`Failed to delete ${(0, _log.bold)('get_started')} setting`);

    if (err.response) {
      (0, _log.error)(`status: ${(0, _log.bold)(err.response.status)}`);

      if (err.response.data) {
        (0, _log.error)(`data: ${(0, _log.bold)(JSON.stringify(err.response.data, null, 2))}`);
      }
    } else {
      (0, _log.error)(err.message);
    }

    return process.exit(1);
  }
}

async function main(ctx) {
  const subcommand = ctx.argv._[2];

  switch (subcommand) {
    case 'get':
      await getGetStarted(ctx);
      break;

    case 'delete':
    case 'del':
      await deleteGetStarted(ctx);
      break;

    default:
      (0, _log.error)(`Please specify a valid subcommand: get, delete`);
      help();
  }
}