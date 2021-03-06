"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _client = require("@slack/client");

var _Bot = _interopRequireDefault(require("./Bot"));

var _SlackConnector = _interopRequireDefault(require("./SlackConnector"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class SlackBot extends _Bot.default {
  constructor({
    accessToken,
    sessionStore,
    sync,
    mapTeamToAccessToken,
    verificationToken
  }) {
    const connector = new _SlackConnector.default({
      accessToken,
      verificationToken,
      mapTeamToAccessToken
    });
    super({
      connector,
      sessionStore,
      sync
    });

    _defineProperty(this, "_accessToken", void 0);

    this._accessToken = accessToken;
  }

  createRtmRuntime() {
    const rtm = new _client.RTMClient(this._accessToken);
    const handler = this.createRequestHandler();
    rtm.on('message', handler);
    rtm.start();
  }

}

exports.default = SlackBot;