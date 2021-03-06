"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPersistentMenu = getPersistentMenu;
exports.deletePersistentMenu = deletePersistentMenu;
exports.default = main;

var _cliTable = _interopRequireDefault(require("cli-table3"));

var _chalk = _interopRequireDefault(require("chalk"));

var _invariant = _interopRequireDefault(require("invariant"));

var _messagingApiMessenger = require("messaging-api-messenger");

var _getConfig = _interopRequireDefault(require("../../shared/getConfig"));

var _log = require("../../shared/log");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable consistent-return */
const help = () => {
  console.log(`
    bottender messenger persistent-menu <command> [option]

    ${_chalk.default.dim('Commands:')}

      get               Get persistent-menu setting.
      del, delete       Delete persistent-menu setting.

    ${_chalk.default.dim('Options:')}

      -t, --token       Specify Messenger access token.

    ${_chalk.default.dim('Examples:')}

    ${_chalk.default.dim('-')} Get persistent-menu setting

      ${_chalk.default.cyan('$ bottender messenger persistent-menu get')}

    ${_chalk.default.dim('-')} Delete persistent-menu setting with specific access token

      ${_chalk.default.cyan('$ bottender messenger persistent-menu delete --token __FAKE_TOKEN__')}
  `);
};

async function getPersistentMenu(ctx) {
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

    const persistentMenu = await client.getPersistentMenu();

    if (persistentMenu && persistentMenu[0]) {
      const menu = persistentMenu[0];
      (0, _log.print)(`input disabled: ${menu.composer_input_disabled}`);
      (0, _log.print)('actions:');
      const table = new _cliTable.default({
        head: ['type', 'title', 'payload'],
        colWidths: [30, 30, 30]
      });
      menu.call_to_actions.forEach(item => {
        table.push([item.type, item.title, item.payload]);
      });
      console.log(table.toString()); // eslint-disable-line no-console
    } else {
      (0, _log.error)(`Failed to find ${(0, _log.bold)('persistent_menu')} setting`);
    }
  } catch (err) {
    (0, _log.error)(`Faile to get ${(0, _log.bold)('persistent_menu')} setting`);

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

async function deletePersistentMenu(ctx) {
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

    await client.deletePersistentMenu();
    (0, _log.print)(`Successfully delete ${(0, _log.bold)('persistent_menu')} setting`);
  } catch (err) {
    (0, _log.error)(`Failed to delete ${(0, _log.bold)('persistent_menu')} setting`);

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
      await getPersistentMenu(ctx);
      break;

    case 'delete':
    case 'del':
      await deletePersistentMenu(ctx);
      break;

    default:
      (0, _log.error)(`Please specify a valid subcommand: get, delete`);
      help();
  }
}