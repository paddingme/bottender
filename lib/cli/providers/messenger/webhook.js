"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setWebhook = setWebhook;
exports.default = main;

var _promptConfirm = _interopRequireDefault(require("prompt-confirm"));

var _chalk = _interopRequireDefault(require("chalk"));

var _invariant = _interopRequireDefault(require("invariant"));

var _messagingApiMessenger = require("messaging-api-messenger");

var _getConfig = _interopRequireDefault(require("../../shared/getConfig"));

var _getWebhookFromNgrok = _interopRequireDefault(require("../../shared/getWebhookFromNgrok"));

var _log = require("../../shared/log");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const help = () => {
  console.log(`
    bottender messenger webhook <command> [option]

    ${_chalk.default.dim('Commands:')}

      set                   Set Messenger webhook.

    ${_chalk.default.dim('Options:')}

      -w                    Webhook callback URL
      -v                    Verify token
      --ngrok-port          Ngrok port(default: 4040)
      -t, --token           Specify Messenger access token

    ${_chalk.default.dim('Examples:')}

    ${_chalk.default.dim('-')} Set Messenger webhook url

      ${_chalk.default.cyan('$ bottender messenger webhook set -w http://example.com')}

    ${_chalk.default.dim('-')} Set verify token

      ${_chalk.default.cyan('$ bottender messenger webhook set -v abc123')}

    ${_chalk.default.dim('-')} Use specific ngrok port and access token

      ${_chalk.default.cyan('$ bottender messenger webhook set --ngrok-port 4041 -token __FAKE_TOKEN__')}
  `);
};

async function setWebhook(accessToken, webhook, verifyToken, ngrokPort = '4040') {
  try {
    const config = (0, _getConfig.default)('bottender.config.js', 'messenger');

    if (accessToken === undefined) {
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiMessenger.MessengerClient.connect(accessToken);

    const defaultFields = ['messages', 'messaging_postbacks', 'messaging_optins', 'messaging_referrals', 'messaging_handovers', 'messaging_policy_enforcement'];

    if (!webhook) {
      (0, _log.warn)('We can not find the webhook callback url you provided.');
      const prompt = new _promptConfirm.default(`Are you using ngrok (get url from ngrok server on http://127.0.0.1:${ngrokPort})?`);
      const result = await prompt.run();

      if (result) {
        webhook = await (0, _getWebhookFromNgrok.default)(ngrokPort);
      }
    }

    verifyToken = verifyToken || config.verifyToken;
    (0, _invariant.default)(config.appId, '`appId` is not found in config file');
    (0, _invariant.default)(config.appSecret, '`appSecret` is not found in config file');
    (0, _invariant.default)(verifyToken, '`verifyToken` is required but not found. using -v <verifyToken> to setup or list `verifyToken` key it in config file.');
    (0, _invariant.default)(webhook, '`webhook` is required but not found. Use -w <webhook> to setup or make sure you are running ngrok server.');

    if (!config.fields) {
      (0, _log.print)(`\`fields\` is not found in config file, we will use ${(0, _log.bold)(defaultFields.join(', '))} to setup.`);
      (0, _log.print)('See more on: https://developers.facebook.com/docs/graph-api/reference/app/subscriptions');
    }

    const fields = config.fields || defaultFields;
    const {
      success
    } = await client.createSubscription({
      app_id: config.appId,
      object: 'page',
      callback_url: webhook,
      verify_token: verifyToken,
      fields,
      access_token: `${config.appId}|${config.appSecret}`
    });
    (0, _invariant.default)(success, 'Setting for webhook is failed');
    (0, _log.print)('Successfully set Messenger webhook callback URL');
    (0, _log.print)(`Check callback URL on: https://developers.facebook.com/apps/${config.appId}/webhooks/`);
    (0, _log.print)(`Check selected events on: https://developers.facebook.com/apps/${config.appId}/messenger/`);
  } catch (err) {
    (0, _log.error)('Failed to set Messenger webhook');

    if (err.response) {
      (0, _log.error)(`status: ${(0, _log.bold)(err.response.status)}`);

      if (err.response.data) {
        (0, _log.error)(`data: ${(0, _log.bold)(JSON.stringify(err.response.data, null, 2))}`);
      }
    } else {
      (0, _log.warn)(err.message);
    }

    return process.exit(1);
  }
}

async function main(ctx) {
  const subcommand = ctx.argv._[2];

  switch (subcommand) {
    case 'set':
      {
        const accessToken = ctx.argv.t || ctx.argv.token;
        const webhook = ctx.argv.w;
        const verifyToken = ctx.argv.v;
        const ngrokPort = ctx.argv['ngrok-port'];
        await setWebhook(accessToken, webhook, verifyToken, ngrokPort);
        break;
      }

    case 'help':
      help();
      break;

    default:
      (0, _log.error)(`Please specify a valid subcommand: set`);
      help();
  }
}