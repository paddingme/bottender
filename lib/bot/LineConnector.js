"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _crypto = _interopRequireDefault(require("crypto"));

var _warning = _interopRequireDefault(require("warning"));

var _messagingApiLine = require("messaging-api-line");

var _LineContext = _interopRequireDefault(require("../context/LineContext"));

var _LineEvent = _interopRequireDefault(require("../context/LineEvent"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class LineConnector {
  constructor({
    accessToken,
    channelSecret,
    client,
    shouldBatch,
    sendMethod
  }) {
    _defineProperty(this, "_client", void 0);

    _defineProperty(this, "_channelSecret", void 0);

    _defineProperty(this, "_shouldBatch", void 0);

    _defineProperty(this, "_sendMethod", void 0);

    this._client = client || _messagingApiLine.LineClient.connect(accessToken);
    this._channelSecret = channelSecret || '';
    this._shouldBatch = shouldBatch || false;
    (0, _warning.default)(!sendMethod || sendMethod === 'reply' || sendMethod === 'push', 'sendMethod should be one of `reply` or `push`');
    this._sendMethod = sendMethod || 'push';
  }

  _isWebhookVerifyEvent(event) {
    return event.replyToken === '00000000000000000000000000000000' || event.replyToken === 'ffffffffffffffffffffffffffffffff';
  }

  _isWebhookVerifyRequest(body) {
    return body.events.every(this._isWebhookVerifyEvent);
  }

  get platform() {
    return 'line';
  }

  get client() {
    return this._client;
  }

  getUniqueSessionKey(body) {
    if (this._isWebhookVerifyRequest(body)) {
      return '';
    }

    const {
      source
    } = body.events[0];

    if (source.type === 'user') {
      return source.userId;
    }

    if (source.type === 'group') {
      return source.groupId;
    }

    if (source.type === 'room') {
      return source.roomId;
    }

    throw new TypeError('LineConnector: sender type should be one of user, group, room.');
  }

  async updateSession(session, body) {
    if (this._isWebhookVerifyRequest(body)) {
      return;
    }

    const {
      source
    } = body.events[0];

    if (!session.type) {
      session.type = source.type;
    }

    if (source.type === 'group') {
      let user = null;

      if (source.userId) {
        user = _objectSpread({
          id: source.userId,
          _updatedAt: new Date().toISOString()
        }, (await this._client.getGroupMemberProfile(source.groupId, source.userId)));
      }

      session.user = user;
      let memberIds = [];

      try {
        memberIds = await this._client.getAllGroupMemberIds(source.groupId);
      } catch (e) {// FIXME: handle no memberIds
        // only LINE@ Approved accounts or official accounts can use this API
        // https://developers.line.me/en/docs/messaging-api/reference/#get-group-member-user-ids
      }

      session.group = {
        id: source.groupId,
        members: memberIds.map(id => ({
          id
        })),
        _updatedAt: new Date().toISOString()
      };
    } else if (source.type === 'room') {
      let user = null;

      if (source.userId) {
        user = _objectSpread({
          id: source.userId,
          _updatedAt: new Date().toISOString()
        }, (await this._client.getRoomMemberProfile(source.roomId, source.userId)));
      }

      session.user = user;
      let memberIds = [];

      try {
        memberIds = await this._client.getAllRoomMemberIds(source.roomId);
      } catch (e) {// FIXME: handle no memberIds
        // only LINE@ Approved accounts or official accounts can use this API
        // https://developers.line.me/en/docs/messaging-api/reference/#get-room-member-user-ids
      }

      session.room = {
        id: source.roomId,
        members: memberIds.map(id => ({
          id
        })),
        _updatedAt: new Date().toISOString()
      };
    } else if (source.type === 'user') {
      if (!session.user) {
        const user = await this._client.getUserProfile(source.userId);
        session.user = _objectSpread({
          id: source.userId,
          _updatedAt: new Date().toISOString()
        }, user);
      }
    }

    if (session.group) {
      // TODO: remove later
      if (!session.group._updatedAt) {
        session.group._updatedAt = new Date().toISOString();
      }

      Object.freeze(session.group);
    }

    Object.defineProperty(session, 'group', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: session.group
    });

    if (session.room) {
      // TODO: remove later
      if (!session.room._updatedAt) {
        session.room._updatedAt = new Date().toISOString();
      }

      Object.freeze(session.room);
    }

    Object.defineProperty(session, 'room', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: session.room
    });

    if (session.user) {
      // TODO: remove later
      if (!session.user._updatedAt) {
        session.user._updatedAt = new Date().toISOString();
      }

      Object.freeze(session.user);
    }

    Object.defineProperty(session, 'user', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: session.user
    });
  }

  mapRequestToEvents(body) {
    return body.events.filter(e => !this._isWebhookVerifyEvent(e)).map(e => new _LineEvent.default(e));
  }

  createContext(params) {
    return new _LineContext.default(_objectSpread({}, params, {
      client: this._client,
      shouldBatch: this._shouldBatch,
      sendMethod: this._sendMethod
    }));
  }

  verifySignature(rawBody, signature) {
    const hashBufferFromBody = _crypto.default.createHmac('sha256', this._channelSecret).update(rawBody, 'utf8').digest();

    const bufferFromSignature = Buffer.from(signature, 'base64'); // return early here if buffer lengths are not equal since timingSafeEqual
    // will throw if buffer lengths are not equal

    if (bufferFromSignature.length !== hashBufferFromBody.length) {
      return false;
    } // wait this PR to be merged
    // https://github.com/facebook/flow/pull/4974
    // $FlowExpectedError


    return _crypto.default.timingSafeEqual(bufferFromSignature, hashBufferFromBody);
  }

}

exports.default = LineConnector;