"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWhitelistedDomains = getWhitelistedDomains;
exports.deleteWhitelistedDomains = deleteWhitelistedDomains;
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
    bottender messenger whitelisted-domains <command> [option]

    ${_chalk.default.dim('Commands:')}

      get               Get whitelisted-domains setting.
      del, delete       Delete whitelisted-domains setting.

    ${_chalk.default.dim('Options:')}

      -t, --token       Specify Messenger access token.

    ${_chalk.default.dim('Examples:')}

    ${_chalk.default.dim('-')} Get whitelisted-domains setting

      ${_chalk.default.cyan('$ bottender messenger whitelisted-domains get')}

    ${_chalk.default.dim('-')} Delete persistent-menu setting with specific access token

      ${_chalk.default.cyan('$ bottender messenger persistent-menu delete --token __FAKE_TOKEN__')}
  `);
};

async function getWhitelistedDomains(ctx) {
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

    const whitelistedDomains = await client.getWhitelistedDomains();

    if (whitelistedDomains) {
      for (let i = 0; i < whitelistedDomains.length; i++) {
        (0, _log.print)(`The whitelisted domains is: ${(0, _log.bold)(whitelistedDomains[i])}`);
      }
    } else {
      (0, _log.error)(`Failed to find ${(0, _log.bold)('whitelisted-domains')} setting`);
    }
  } catch (err) {
    (0, _log.error)(`Failed to get ${(0, _log.bold)('whitelisted-domains')} setting`);

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

async function deleteWhitelistedDomains(ctx) {
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

    await client.deleteWhitelistedDomains();
    (0, _log.print)(`Successfully delete ${(0, _log.bold)('whitelisted-domains')} setting`);
  } catch (err) {
    (0, _log.error)(`Failed to delete ${(0, _log.bold)('whitelisted-domains')} setting`);

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
      await getWhitelistedDomains(ctx);
      break;

    case 'delete':
    case 'del':
      await deleteWhitelistedDomains(ctx);
      break;

    default:
      (0, _log.error)(`Please specify a valid subcommand: get, delete`);
      help();
  }
}