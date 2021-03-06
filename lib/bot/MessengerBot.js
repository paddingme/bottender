"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Bot = _interopRequireDefault(require("./Bot"));

var _MessengerConnector = _interopRequireDefault(require("./MessengerConnector"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class MessengerBot extends _Bot.default {
  constructor({
    accessToken,
    appId,
    appSecret,
    sessionStore,
    sync,
    mapPageToAccessToken,
    verifyToken,
    batchConfig
  }) {
    const connector = new _MessengerConnector.default({
      accessToken,
      appId,
      appSecret,
      mapPageToAccessToken,
      verifyToken,
      batchConfig
    });
    super({
      connector,
      sessionStore,
      sync
    });
  }

}

exports.default = MessengerBot;