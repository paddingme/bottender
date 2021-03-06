"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _crypto = _interopRequireDefault(require("crypto"));

var _is_after = _interopRequireDefault(require("date-fns/is_after"));

var _is_valid = _interopRequireDefault(require("date-fns/is_valid"));

var _warning = _interopRequireDefault(require("warning"));

var _messengerBatch = require("messenger-batch");

var _messagingApiMessenger = require("messaging-api-messenger");

var _MessengerContext = _interopRequireDefault(require("../context/MessengerContext"));

var _MessengerEvent = _interopRequireDefault(require("../context/MessengerEvent"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class MessengerConnector {
  constructor({
    accessToken,
    appId,
    appSecret,
    client,
    mapPageToAccessToken,
    verifyToken,
    batchConfig
  }) {
    _defineProperty(this, "_client", void 0);

    _defineProperty(this, "_appId", void 0);

    _defineProperty(this, "_appSecret", void 0);

    _defineProperty(this, "_mapPageToAccessToken", void 0);

    _defineProperty(this, "_verifyToken", void 0);

    _defineProperty(this, "_batchConfig", void 0);

    _defineProperty(this, "_batchQueue", void 0);

    this._client = client || _messagingApiMessenger.MessengerClient.connect({
      accessToken: accessToken || '',
      appSecret
    });
    this._appId = appId || '';
    this._appSecret = appSecret || '';
    this._mapPageToAccessToken = mapPageToAccessToken;
    this._verifyToken = verifyToken;
    this._batchConfig = batchConfig || null;

    if (this._batchConfig) {
      this._batchQueue = new _messengerBatch.MessengerBatchQueue(this._client, this._batchConfig);
    }

    if (!this._appSecret) {
      (0, _warning.default)(false, '`appSecret` is not set. Will bypass Messenger signature validation.\nPass in `appSecret` to perform Messenger signature validation.');
    }
  }

  _getRawEventsFromRequest(body) {
    if (body.entry) {
      const {
        entry
      } = body;
      return entry.map(ent => {
        if (ent.messaging) {
          return ent.messaging[0];
        }

        if (ent.standby) {
          return ent.standby[0];
        } // for Webhook Test button request and other page events


        if (ent.changes) {
          return ent.changes[0];
        } // $FlowExpectedError


        return null;
      }).filter(event => event != null);
    }

    return [body];
  }

  _getPageIdFromRawEvent(rawEvent) {
    if (rawEvent.message && rawEvent.message.is_echo && rawEvent.sender) {
      return rawEvent.sender.id;
    }

    if (rawEvent.recipient) {
      return rawEvent.recipient.id;
    }
  }

  _isStandby(body) {
    if (!body.entry) return false;
    const entry = body.entry[0];
    return !!entry.standby;
  }

  _profilePicExpired(user) {
    try {
      // Facebook CDN returns expiration time in the key `oe` in url params
      // https://stackoverflow.com/questions/27595679/how-to-efficiently-retrieve-expiration-date-for-facebook-photo-url-and-renew-it/27596727#27596727
      const oe = user.profile_pic.split('oe=')[1];
      const timestamp = +`0x${oe}` * 1000;
      const expireTime = new Date(timestamp);
      return !((0, _is_valid.default)(expireTime) && (0, _is_after.default)(expireTime, new Date()));
    } catch (e) {
      return true;
    }
  }

  get platform() {
    return 'messenger';
  }

  get client() {
    return this._client;
  }

  get verifyToken() {
    return this._verifyToken;
  }

  getUniqueSessionKey(body) {
    const rawEvent = this._getRawEventsFromRequest(body)[0];

    if (rawEvent && rawEvent.message && rawEvent.message.is_echo && rawEvent.recipient) {
      return rawEvent.recipient.id;
    }

    if (rawEvent && rawEvent.sender) {
      return rawEvent.sender.id;
    }

    return null;
  }

  async updateSession(session, body) {
    if (!session.user || this._profilePicExpired(session.user)) {
      const senderId = this.getUniqueSessionKey(body);
      let customAccessToken;

      if (this._mapPageToAccessToken != null) {
        const mapPageToAccessToken = this._mapPageToAccessToken;

        const rawEvent = this._getRawEventsFromRequest(body)[0];

        const pageId = this._getPageIdFromRawEvent(rawEvent);

        if (!pageId) {
          (0, _warning.default)(false, 'Could not find pageId from request body.');
        } else {
          customAccessToken = await mapPageToAccessToken(pageId);
        }
      } // FIXME: refine user


      let user = {};

      try {
        user = await this._client.getUserProfile(senderId, {
          access_token: customAccessToken
        });
      } catch (e) {
        (0, _warning.default)(false, 'getUserProfile() failed, `session.user` will only have `id`');
        console.error(e);
      }

      session.user = _objectSpread({
        _updatedAt: new Date().toISOString()
      }, user, {
        id: senderId
      });
    } // TODO: remove later


    if (!session.user._updatedAt) {
      session.user._updatedAt = new Date().toISOString();
    }

    Object.freeze(session.user);
    Object.defineProperty(session, 'user', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: session.user
    });
  }

  mapRequestToEvents(body) {
    const rawEvents = this._getRawEventsFromRequest(body);

    const isStandby = this._isStandby(body);

    return rawEvents.map(rawEvent => new _MessengerEvent.default(rawEvent, {
      isStandby,
      pageId: this._getPageIdFromRawEvent(rawEvent)
    }));
  }

  async createContext(params) {
    let customAccessToken;

    if (this._mapPageToAccessToken) {
      const {
        rawEvent
      } = params.event;
      let pageId = null;

      if (rawEvent.message && rawEvent.message.is_echo && rawEvent.sender) {
        pageId = rawEvent.sender.id;
      } else if (rawEvent.recipient) {
        pageId = rawEvent.recipient.id;
      }

      if (!pageId) {
        (0, _warning.default)(false, 'Could not find pageId from request body.');
      } else {
        customAccessToken = await this._mapPageToAccessToken(pageId);
      }
    }

    return new _MessengerContext.default(_objectSpread({}, params, {
      client: this._client,
      customAccessToken,
      batchQueue: this._batchQueue,
      appId: this._appId
    }));
  } // https://developers.facebook.com/docs/messenger-platform/webhook#security


  verifySignature(rawBody, signature) {
    if (!this._appSecret) {
      // TODO: deprecate this bypassing
      return true;
    }

    if (typeof signature !== 'string') return false;
    const sha1 = signature.split('sha1=')[1];
    if (!sha1) return false;
    const bufferFromSignature = Buffer.from(sha1, 'hex');

    const hashBufferFromBody = _crypto.default.createHmac('sha1', this._appSecret).update(rawBody, 'utf8').digest(); // return early here if buffer lengths are not equal since timingSafeEqual
    // will throw if buffer lengths are not equal


    if (bufferFromSignature.length !== hashBufferFromBody.length) {
      return false;
    } // wait this PR to be merged
    // https://github.com/facebook/flow/pull/4974
    // $FlowExpectedError


    return _crypto.default.timingSafeEqual(bufferFromSignature, hashBufferFromBody);
  }

}

exports.default = MessengerConnector;