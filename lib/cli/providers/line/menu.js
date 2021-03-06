"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkLineMenu = checkLineMenu;
exports.getLineMenu = getLineMenu;
exports.setLineMenus = setLineMenus;
exports.deleteLineMenu = deleteLineMenu;
exports.default = main;
exports.help = void 0;

var _omit2 = _interopRequireDefault(require("lodash/omit"));

var _isEqual2 = _interopRequireDefault(require("lodash/isEqual"));

var _findIndex2 = _interopRequireDefault(require("lodash/findIndex"));

var _differenceWith2 = _interopRequireDefault(require("lodash/differenceWith"));

var _chalk = _interopRequireDefault(require("chalk"));

var _inquirer = _interopRequireDefault(require("inquirer"));

var _invariant = _interopRequireDefault(require("invariant"));

var _pMap = _interopRequireDefault(require("p-map"));

var _messagingApiLine = require("messaging-api-line");

var _getConfig = _interopRequireDefault(require("../../shared/getConfig"));

var _log = require("../../shared/log");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable consistent-return */
const generateDeleteQuestions = richMenus => [{
  name: 'deletedRichMenuNames',
  message: 'Which rich menu do you want to delete?',
  type: 'checkbox',
  choices: richMenus.map(richMenu => richMenu.name)
}];

const help = () => {
  console.log(`
    bottender line menu <action> [option]

    ${_chalk.default.dim('Actions:')}

      check         Check if LINE rich menus setting in bottender.config.js valids
      get           Get the LINE rich menus
      set           Set the LINE rich menu by diff
      del, delete   Delete the LINE rich menus
      help          Show this help

    ${_chalk.default.dim('Options:')}

      -t, --token   Specify LINE access token.
      -f, --force   With action del, force delete ${(0, _log.bold)('ALL')} LINE rich menus

    ${_chalk.default.dim('Examples:')}

    ${_chalk.default.dim('-')} Set the LINE rich menu

      ${_chalk.default.cyan('$ bottender line menu set')}

    ${_chalk.default.dim('-')} Force update the LINE rich menu

      ${_chalk.default.cyan('$ bottender line menu set --force')}
  `);
};

exports.help = help;

function checkLineMenu() {
  try {
    (0, _getConfig.default)('bottender.config.js', 'line');
    (0, _log.print)('LINE rich menu check done.');
  } catch (e) {
    (0, _log.error)(e.message);
    return process.exit(1);
  }
}

async function getLineMenu(ctx) {
  const {
    t,
    token: _token
  } = ctx.argv;
  let accessToken;

  try {
    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = (0, _getConfig.default)('bottender.config.js', 'line');
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiLine.LineClient.connect(accessToken);

    const richMenus = await client.getRichMenuList();

    if (richMenus) {
      (0, _log.print)('The rich menus are:');
      (0, _log.print)(`\n${JSON.stringify(richMenus, null, 2)}`);
    } else {
      (0, _log.error)(`Failed to find ${(0, _log.bold)('LINE rich menu')}.`);
    }
  } catch (err) {
    (0, _log.error)(`Failed to get ${(0, _log.bold)('LINE rich menu')}.`);

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

async function setLineMenus(ctx) {
  const {
    t,
    token: _token
  } = ctx.argv;
  let accessToken;

  try {
    const config = (0, _getConfig.default)('bottender.config.js', 'line');
    const {
      richMenus: localRichMenus
    } = config;

    if (t || _token) {
      accessToken = t || _token;
    } else {
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiLine.LineClient.connect(accessToken);

    const onlineRichMenus = await client.getRichMenuList();
    (0, _invariant.default)(onlineRichMenus, `Failed to get ${(0, _log.bold)('LINE rich menu')} response.`);
    const existedRichMenus = onlineRichMenus.map(richMenu => (0, _omit2.default)(richMenu, 'richMenuId'));
    const shouldDeleteRichMenus = (0, _differenceWith2.default)(existedRichMenus, localRichMenus, _isEqual2.default);
    const shouldAddRichMenus = (0, _differenceWith2.default)(localRichMenus, existedRichMenus, _isEqual2.default);

    if (shouldDeleteRichMenus.length === 0 && shouldAddRichMenus.length === 0) {
      (0, _log.print)('No change apply, because online rich menu is same as local settings.');
    } else {
      if (shouldDeleteRichMenus.length !== 0) {
        await (0, _pMap.default)(shouldDeleteRichMenus, async shouldDeleteRichMenu => {
          const {
            richMenuId
          } = onlineRichMenus[(0, _findIndex2.default)(onlineRichMenus, shouldDeleteRichMenu)];
          await client.deleteRichMenu(richMenuId);
        }, {
          concurrency: 5
        });
      }

      if (shouldAddRichMenus.length !== 0) {
        await (0, _pMap.default)(shouldAddRichMenus, client.createRichMenu, {
          concurrency: 5
        });
      }

      (0, _log.print)(`Successfully set ${(0, _log.bold)('LINE rich menu')}.`);
    }

    (0, _log.log)(`You can use ${(0, _log.bold)('bottender line menu get')} to see the full rich menu.`);
  } catch (err) {
    (0, _log.error)(`Failed to set ${(0, _log.bold)('LINE rich menu')}.`);

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

async function deleteLineMenu(ctx) {
  const {
    f,
    force: _force,
    t,
    token: _token
  } = ctx.argv;
  const force = f || _force;
  let accessToken;

  try {
    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = (0, _getConfig.default)('bottender.config.js', 'line');
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiLine.LineClient.connect(accessToken);

    const richMenus = await client.getRichMenuList();
    (0, _invariant.default)(richMenus, `Failed to get ${(0, _log.bold)('LINE rich menu')} response.`);

    if (force) {
      await (0, _pMap.default)(richMenus, async richMenu => {
        await client.deleteRichMenu(richMenu.richMenuId);
      }, {
        concurrency: 5
      });
      (0, _log.print)(`Successfully delete ${(0, _log.bold)('all')} LINE rich menu.`);
    } else {
      const questions = generateDeleteQuestions(richMenus);
      const {
        deletedRichMenuNames
      } = await _inquirer.default.prompt(questions);
      (0, _invariant.default)(deletedRichMenuNames.length !== 0, `At least ${(0, _log.bold)('one')} LINE rich menu should be selected.`);
      await (0, _pMap.default)(deletedRichMenuNames, async deletedRichMenuName => {
        const {
          richMenuId: deletedRichMenuId
        } = richMenus.find(richMenu => richMenu.name === deletedRichMenuName);
        await client.deleteRichMenu(deletedRichMenuId);
      }, {
        concurrency: 5
      });
      (0, _log.print)(`Successfully delete ${(0, _log.bold)(deletedRichMenuNames.join(', '))} in existing LINE rich menu.`);
    }
  } catch (err) {
    (0, _log.error)(`Failed to delete ${(0, _log.bold)('LINE rich menu')}.`);

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
    case 'check':
      checkLineMenu();
      break;

    case 'get':
      await getLineMenu(ctx);
      break;

    case 'set':
      await setLineMenus(ctx);
      break;

    case 'delete':
    case 'del':
      await deleteLineMenu(ctx);
      break;

    case 'help':
      help();
      break;

    default:
      (0, _log.error)('Please specify a valid subcommand: check, get, set, delete, help.');
      help();
  }
}