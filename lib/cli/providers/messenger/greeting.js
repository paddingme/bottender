"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getGreeting = getGreeting;
exports.deleteGreeting = deleteGreeting;
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
    bottender messenger greeting <command> [option]

    ${_chalk.default.dim('Commands:')}

      get               Get greeting setting.
      del, delete       Delete greeting setting.

    ${_chalk.default.dim('Options:')}

      -t, --token       Specify Messenger access token.

    ${_chalk.default.dim('Examples:')}

    ${_chalk.default.dim('-')} Get greeting setting

      ${_chalk.default.cyan('$ bottender messenger greeting get')}

    ${_chalk.default.dim('-')} Delete greeting setting with specific access token

      ${_chalk.default.cyan('$ bottender messenger greeting delete --token __FAKE_TOKEN__')}
  `);
};

async function getGreeting(ctx) {
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

    const greeting = await client.getGreeting();

    if (greeting && greeting[0] && greeting[0].text) {
      (0, _log.print)(`The greeting is: ${(0, _log.bold)(greeting[0].text)}`);
    } else {
      (0, _log.error)(`Failed to find ${(0, _log.bold)('greeting')} setting`);
    }
  } catch (err) {
    (0, _log.error)(`Failed to get ${(0, _log.bold)('greeting')} setting`);

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

async function deleteGreeting(ctx) {
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

    await client.deleteGreeting();
    (0, _log.print)(`Successfully delete ${(0, _log.bold)('greeting')} setting`);
  } catch (err) {
    (0, _log.error)(`Failed to delete ${(0, _log.bold)('greeting')} setting`);

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
      await getGreeting(ctx);
      break;

    case 'delete':
    case 'del':
      await deleteGreeting(ctx);
      break;

    default:
      (0, _log.error)(`Please specify a valid subcommand: get, delete`);
      help();
  }
}