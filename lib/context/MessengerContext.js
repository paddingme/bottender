"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _invariant = _interopRequireDefault(require("invariant"));

var _delay = _interopRequireDefault(require("delay"));

var _warning = _interopRequireDefault(require("warning"));

var _messagingApiMessenger = require("messaging-api-messenger");

var _Context = _interopRequireDefault(require("./Context"));

var _MessengerEvent = _interopRequireDefault(require("./MessengerEvent"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class MessengerContext extends _Context.default {
  constructor({
    appId,
    client,
    event,
    session,
    initialState,
    requestContext,
    customAccessToken,
    batchQueue
  }) {
    super({
      client,
      event,
      session,
      initialState,
      requestContext
    });

    _defineProperty(this, "_appId", void 0);

    _defineProperty(this, "_client", this._client);

    _defineProperty(this, "_event", this._event);

    _defineProperty(this, "_session", this._session);

    _defineProperty(this, "_customAccessToken", void 0);

    _defineProperty(this, "_batchQueue", void 0);

    this._customAccessToken = customAccessToken;
    this._batchQueue = batchQueue;
    this._appId = appId;
  }
  /**
   * The name of the platform.
   *
   */


  get platform() {
    return 'messenger';
  }

  get accessToken() {
    return this._customAccessToken || this._client.accessToken;
  }

  _callClientMethod(method, args) {
    if (this._batchQueue) {
      return this._batchQueue.push(_messagingApiMessenger.MessengerBatch[method](...args));
    }

    return this._client[method](...args);
  }
  /**
   * Delay and show indicators for milliseconds.
   *
   */


  async typing(milliseconds) {
    if (milliseconds > 0) {
      await this.typingOn();
      await (0, _delay.default)(milliseconds);
      await this.typingOff();
    }
  }
  /**
   * Send text to the owner of then session.
   *
   */


  async sendText(text, options) {
    if (!this._session) {
      (0, _warning.default)(false, 'sendText: should not be called in context without session');
      return;
    }

    if (this._event.isEcho || this._event.isDelivery || this._event.isRead) {
      (0, _warning.default)(false, 'sendText: calling Send APIs in `message_reads`(event.isRead), `message_deliveries`(event.isDelivery) or `message_echoes`(event.isEcho) events may cause endless self-responding, so they are ignored by default.\nYou may like to turn off subscription of those events or handle them without Send APIs.');
      return;
    }

    this._isHandled = true;
    const messageType = options && options.tag ? 'MESSAGE_TAG' : 'RESPONSE';
    const args = [this._session.user.id, text, _objectSpread({
      messaging_type: messageType
    }, options, {
      access_token: this._customAccessToken
    })];
    return this._callClientMethod('sendText', args);
  }
  /**
   * Sender Actions
   *
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#sender-actions
   */

  /**
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#typingonuserid
   */


  async getUserProfile() {
    if (!this._session) {
      (0, _warning.default)(false, 'getUserProfile: should not be called in context without session');
      return null;
    }

    const args = [this._session.user.id, {
      access_token: this._customAccessToken
    }];
    return this._callClientMethod('getUserProfile', args);
  }
  /**
   * Sender Actions
   *
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#sender-actions
   */

  /**
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#sendsenderactionuserid-action
   */


  async sendSenderAction(action) {
    if (!this._session) {
      (0, _warning.default)(false, 'sendSenderAction: should not be called in context without session');
      return;
    }

    this._isHandled = true;
    const args = [this._session.user.id, action, {
      access_token: this._customAccessToken
    }];
    return this._callClientMethod('sendSenderAction', args);
  }
  /**
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#typingonuserid
   */


  async typingOn() {
    if (!this._session) {
      (0, _warning.default)(false, 'typingOn: should not be called in context without session');
      return;
    }

    this._isHandled = true;
    const args = [this._session.user.id, {
      access_token: this._customAccessToken
    }];
    return this._callClientMethod('typingOn', args);
  }
  /**
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#typingoffuserid
   */


  async typingOff() {
    if (!this._session) {
      (0, _warning.default)(false, 'typingOff: should not be called in context without session');
      return;
    }

    this._isHandled = true;
    const args = [this._session.user.id, {
      access_token: this._customAccessToken
    }];
    return this._callClientMethod('typingOff', args);
  }
  /**
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#markseenuserid
   */


  async markSeen() {
    if (!this._session) {
      (0, _warning.default)(false, 'markSeen: should not be called in context without session');
      return;
    }

    this._isHandled = true;
    const args = [this._session.user.id, {
      access_token: this._customAccessToken
    }];
    return this._callClientMethod('markSeen', args);
  }
  /**
   * Handover Protocol
   *
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#handover-protocol-api
   */

  /**
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#passthreadcontroluserid-targetappid-metadata---official-docs
   */


  async passThreadControl(targetAppId, metadata) {
    if (!this._session) {
      (0, _warning.default)(false, 'passThreadControl: should not be called in context without session');
      return;
    }

    this._isHandled = true;
    const args = [this._session.user.id, targetAppId, metadata, {
      access_token: this._customAccessToken
    }];
    return this._callClientMethod('passThreadControl', args);
  }
  /**
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#passthreadcontroltopageinboxuserid-metadata---official-docs
   */


  async passThreadControlToPageInbox(metadata) {
    if (!this._session) {
      (0, _warning.default)(false, 'passThreadControlToPageInbox: should not be called in context without session');
      return;
    }

    this._isHandled = true;
    const args = [this._session.user.id, metadata, {
      access_token: this._customAccessToken
    }];
    return this._callClientMethod('passThreadControlToPageInbox', args);
  }
  /**
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#takethreadcontroluserid-metadata---official-docs
   */


  async takeThreadControl(metadata) {
    if (!this._session) {
      (0, _warning.default)(false, 'takeThreadControl: should not be called in context without session');
      return;
    }

    this._isHandled = true;
    const args = [this._session.user.id, metadata, {
      access_token: this._customAccessToken
    }];
    return this._callClientMethod('takeThreadControl', args);
  }
  /**
   * https://github.com/Yoctol/messaging-apis/blob/master/packages/messaging-api-messenger/README.md#requestthreadcontroluserid-metadata---official-docs
   */


  async requestThreadControl(metadata) {
    if (!this._session) {
      (0, _warning.default)(false, 'requestThreadControl: should not be called in context without session');
      return;
    }

    this._isHandled = true;
    const args = [this._session.user.id, metadata, {
      access_token: this._customAccessToken
    }];
    return this._callClientMethod('requestThreadControl', args);
  }
  /**
   * https://github.com/Yoctol/messaging-apis/blob/master/packages/messaging-api-messenger/README.md#requestthreadcontroluserid-metadata---official-docs
   */


  async getThreadOwner() {
    if (!this._session) {
      (0, _warning.default)(false, 'getThreadOwner: should not be called in context without session');
      return;
    }

    const args = [this._session.user.id, {
      access_token: this._customAccessToken
    }];
    return this._callClientMethod('getThreadOwner', args);
  }

  async isThreadOwner() {
    (0, _invariant.default)(this._appId, 'isThreadOwner: must provide appId to use this feature');
    const {
      app_id: appId
    } = await this.getThreadOwner(); // $FlowIssue - do not support assert: https://github.com/facebook/flow/issues/34

    return `${appId}` === `${this._appId}`;
  }
  /**
   * Targeting Broadcast Messages
   *
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#targeting-broadcast-messages---official-docs
   */

  /**
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#associatelabeluserid-labelid
   */


  async associateLabel(labelId) {
    if (!this._session) {
      (0, _warning.default)(false, 'associateLabel: should not be called in context without session');
      return;
    }

    const args = [this._session.user.id, labelId, {
      access_token: this._customAccessToken
    }];
    return this._callClientMethod('associateLabel', args);
  }
  /**
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#dissociatelabeluserid-labelid
   */


  async dissociateLabel(labelId) {
    if (!this._session) {
      (0, _warning.default)(false, 'dissociateLabel: should not be called in context without session');
      return;
    }

    const args = [this._session.user.id, labelId, {
      access_token: this._customAccessToken
    }];
    return this._callClientMethod('dissociateLabel', args);
  }
  /**
   * https://github.com/Yoctol/messaging-apis/tree/master/packages/messaging-api-messenger#getassociatedlabelsuserid
   */


  async getAssociatedLabels() {
    if (!this._session) {
      (0, _warning.default)(false, 'getAssociatedLabels: should not be called in context without session');
      return;
    }

    const args = [this._session.user.id, {
      access_token: this._customAccessToken
    }];
    return this._callClientMethod('getAssociatedLabels', args);
  }

}

const sendMethods = [// type name, arguments length
['sendMessage', 3], ['sendAttachment', 3], ['sendImage', 3], ['sendAudio', 3], ['sendVideo', 3], ['sendFile', 3], ['sendTemplate', 3], ['sendGenericTemplate', 3], ['sendButtonTemplate', 4], ['sendListTemplate', 4], ['sendOpenGraphTemplate', 3], ['sendMediaTemplate', 3], ['sendReceiptTemplate', 3], ['sendAirlineBoardingPassTemplate', 3], ['sendAirlineCheckinTemplate', 3], ['sendAirlineItineraryTemplate', 3], ['sendAirlineUpdateTemplate', 3], // deprecated
['sendAirlineFlightUpdateTemplate', 3]];
sendMethods.forEach(([method, len]) => {
  Object.defineProperty(MessengerContext.prototype, method, {
    enumerable: false,
    configurable: true,
    writable: true,

    async value(...args) {
      if (!this._session) {
        (0, _warning.default)(false, `${method}: should not be called in context without session`);
        return;
      }

      if (this._event.isEcho || this._event.isDelivery || this._event.isRead) {
        (0, _warning.default)(false, `${method}: calling Send APIs in \`message_reads\`(event.isRead), \`message_deliveries\`(event.isDelivery) or \`message_echoes\`(event.isEcho) events may cause endless self-responding, so they are ignored by default.\nYou may like to turn off subscription of those events or handle them without Send APIs.`);
        return;
      }

      this._isHandled = true;
      const options = args[len - 2];
      const messageType = options && options.tag ? 'MESSAGE_TAG' : 'RESPONSE';
      args[len - 2] = _objectSpread({
        messaging_type: messageType
      }, options, {
        access_token: this._customAccessToken
      });
      return this._callClientMethod(method, [this._session.user.id, ...args]);
    }

  });
});
var _default = MessengerContext;
exports.default = _default;