"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWebhook = getWebhook;
exports.setWebhook = setWebhook;
exports.deleteWebhook = deleteWebhook;
exports.default = main;

var _promptConfirm = _interopRequireDefault(require("prompt-confirm"));

var _invariant = _interopRequireDefault(require("invariant"));

var _messagingApiTelegram = require("messaging-api-telegram");

var _getConfig = _interopRequireDefault(require("../../shared/getConfig"));

var _getWebhookFromNgrok = _interopRequireDefault(require("../../shared/getWebhookFromNgrok"));

var _log = require("../../shared/log");

var _help = _interopRequireDefault(require("./help"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function getWebhook(ctx) {
  const {
    t,
    token: _token
  } = ctx.argv;
  let accessToken;

  try {
    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = (0, _getConfig.default)('bottender.config.js', 'telegram');
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiTelegram.TelegramClient.connect(accessToken);

    const result = await client.getWebhookInfo();
    Object.keys(result).forEach(key => (0, _log.print)(`${key}: ${result[key]}`));
  } catch (err) {
    (0, _log.error)('Failed to get Telegram webhook');

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

async function setWebhook(ctx) {
  const {
    t,
    token: _token
  } = ctx.argv;
  const ngrokPort = ctx.argv['ngrok-port'] || '4040';
  let {
    w: webhook
  } = ctx.argv;
  let accessToken;

  try {
    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = (0, _getConfig.default)('bottender.config.js', 'telegram');
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiTelegram.TelegramClient.connect(accessToken);

    if (!webhook) {
      (0, _log.warn)('We can not find the webhook callback url you provided.');
      const prompt = new _promptConfirm.default(`Are you using ngrok (get url from ngrok server on http://127.0.0.1:${ngrokPort})?`);
      const result = await prompt.run();

      if (result) {
        webhook = await (0, _getWebhookFromNgrok.default)(ngrokPort);
      }
    }

    (0, _invariant.default)(webhook, '`webhook` is required but not found. Use -w <webhook> to setup or make sure you are running ngrok server.');
    await client.setWebhook(webhook);
    (0, _log.print)('Successfully set Telegram webhook callback URL');
  } catch (err) {
    (0, _log.error)('Failed to set Telegram webhook');

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
      const config = (0, _getConfig.default)('bottender.config.js', 'telegram');
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiTelegram.TelegramClient.connect(accessToken);

    await client.deleteWebhook();
    (0, _log.print)('Successfully delete Telegram webhook');
  } catch (err) {
    (0, _log.error)('Failed to delete Telegram webhook');

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
      await getWebhook(ctx);
      break;

    case 'set':
      {
        await setWebhook(ctx);
        break;
      }

    case 'delete':
    case 'del':
      await deleteWebhook(ctx);
      break;

    default:
      (0, _log.error)(`Please specify a valid subcommand: get, set, delete`);
      (0, _help.default)();
  }
}