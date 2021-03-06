"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setWebhook = setWebhook;
exports.deleteWebhook = deleteWebhook;
exports.default = main;

var _promptConfirm = _interopRequireDefault(require("prompt-confirm"));

var _invariant = _interopRequireDefault(require("invariant"));

var _messagingApiViber = require("messaging-api-viber");

var _getConfig = _interopRequireDefault(require("../../shared/getConfig"));

var _getWebhookFromNgrok = _interopRequireDefault(require("../../shared/getWebhookFromNgrok"));

var _log = require("../../shared/log");

var _help = _interopRequireDefault(require("./help"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function setWebhook(webhook, ngrokPort = '4040', accessToken = undefined, eventTypes = []) {
  try {
    if (!accessToken) {
      const config = (0, _getConfig.default)('bottender.config.js', 'viber');
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiViber.ViberClient.connect(accessToken);

    if (!webhook) {
      (0, _log.warn)('We can not find the webhook callback url you provided.');
      const prompt = new _promptConfirm.default(`Are you using ngrok (get url from ngrok server on http://127.0.0.1:${ngrokPort})?`);
      const result = await prompt.run();

      if (result) {
        webhook = await (0, _getWebhookFromNgrok.default)(ngrokPort);
      }
    }

    (0, _invariant.default)(webhook, '`webhook` is required but not found. Use -w <webhook> to setup or make sure you are running ngrok server.');
    await client.setWebhook(webhook, eventTypes);
    (0, _log.print)('Successfully set Viber webhook callback URL');
  } catch (err) {
    (0, _log.error)('Failed to set Viber webhook');

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

async function deleteWebhook(ctx) {
  const {
    t,
    token: _token
  } = ctx.argv;
  let accessToken;

  try {
    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = (0, _getConfig.default)('bottender.config.js', 'viber');
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiViber.ViberClient.connect(accessToken);

    await client.removeWebhook();
    (0, _log.print)('Successfully delete Viber webhook');
  } catch (err) {
    (0, _log.error)('Failed to delete Viber webhook');

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
    case 'set':
      {
        const webhook = ctx.argv.w;
        const ngrokPort = ctx.argv['ngrok-port'];
        const accessToken = ctx.argv.t || ctx.argv.token;

        if (typeof ctx.argv.e === 'string') {
          const eventTypes = ctx.argv.e.split(',');
          await setWebhook(webhook, ngrokPort, accessToken, eventTypes);
        } else {
          await setWebhook(webhook, ngrokPort, accessToken);
        }

        break;
      }

    case 'delete':
    case 'del':
      await deleteWebhook(ctx);
      break;

    default:
      (0, _log.error)(`Please specify a valid subcommand: set, delete`);
      (0, _help.default)();
  }
}