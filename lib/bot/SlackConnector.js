"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _crypto = _interopRequireDefault(require("crypto"));

var _pProps = _interopRequireDefault(require("p-props"));

var _warning = _interopRequireDefault(require("warning"));

var _messagingApiSlack = require("messaging-api-slack");

var _SlackContext = _interopRequireDefault(require("../context/SlackContext"));

var _SlackEvent = _interopRequireDefault(require("../context/SlackEvent"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class SlackConnector {
  constructor({
    accessToken,
    client,
    mapTeamToAccessToken,
    verificationToken
  }) {
    _defineProperty(this, "_client", void 0);

    _defineProperty(this, "_mapTeamToAccessToken", void 0);

    _defineProperty(this, "_verificationToken", void 0);

    this._client = client || _messagingApiSlack.SlackOAuthClient.connect(accessToken);
    this._verificationToken = verificationToken || '';
    this._mapTeamToAccessToken = mapTeamToAccessToken;

    if (!this._verificationToken) {
      (0, _warning.default)(false, '`verificationToken` is not set. Will bypass Slack event verification.\nPass in `verificationToken` to perform Slack event verification.');
    }
  }

  _getRawEventFromRequest(body) {
    if (body.event) {
      return body.event;
    }

    if (body.payload && typeof body.payload === 'string') {
      return JSON.parse(body.payload);
    } // for RTM WebSocket messages


    return body;
  }

  _isBotEventRequest(body) {
    const rawEvent = this._getRawEventFromRequest(body);

    return !!(rawEvent.bot_id || rawEvent.subtype && rawEvent.subtype === 'bot_message');
  }

  get platform() {
    return 'slack';
  }

  get client() {
    return this._client;
  }

  getUniqueSessionKey(body) {
    // FIXME: define types for every slack events
    const rawEvent = this._getRawEventFromRequest(body); // For interactive_message format


    if (rawEvent.channel && typeof rawEvent.channel === 'object' && rawEvent.channel.id) {
      return rawEvent.channel.id;
    } // For pin_added format


    if (rawEvent.channel_id) {
      return rawEvent.channel_id;
    } // For reaction_added format


    if (rawEvent.item && typeof rawEvent.item === 'object' && typeof rawEvent.item.channel === 'string') {
      return rawEvent.item.channel;
    }

    return rawEvent.channel;
  }

  async updateSession(session, body) {
    if (this._isBotEventRequest(body)) {
      return;
    }

    let customAccessToken;

    if (this._mapTeamToAccessToken != null) {
      const mapTeamToAccessToken = this._mapTeamToAccessToken; // TODO

      const teamId = body['team_id']; // eslint-disable-line

      if (!teamId) {
        (0, _warning.default)(false, 'Could not find teamId from request body.');
      } else {
        customAccessToken = await mapTeamToAccessToken(teamId);
      }
    }

    const rawEvent = this._getRawEventFromRequest(body);

    let userFromBody;

    if (rawEvent.type === 'interactive_message') {
      userFromBody = rawEvent.user.id;
    } else {
      userFromBody = rawEvent.user;
    }

    if (typeof session.user === 'object' && session.user && session.user.id && session.user.id === userFromBody) {
      return;
    }

    const channelId = this.getUniqueSessionKey(body);
    const senderId = userFromBody;

    if (!senderId) {
      return;
    }

    const promises = {
      sender: this._client.getUserInfo(senderId, {
        token: customAccessToken
      })
    }; // TODO: check join or leave events?

    if (!session.channel || session.channel.members && Array.isArray(session.channel.members) && session.channel.members.indexOf(senderId) < 0) {
      promises.channel = this._client.getConversationInfo(channelId, {
        token: customAccessToken
      });
      promises.channelMembers = this._client.getAllConversationMembers(channelId, {
        token: customAccessToken
      });
    } // TODO: how to know if user leave team?
    // TODO: team info shared by all channels?


    if (!session.team || session.team.members && Array.isArray(session.team.members) && session.team.members.indexOf(senderId) < 0) {
      promises.allUsers = this._client.getAllUserList({
        token: customAccessToken
      });
    }

    const results = await (0, _pProps.default)(promises); // FIXME: refine user

    session.user = _objectSpread({
      id: senderId,
      _updatedAt: new Date().toISOString()
    }, results.sender);
    Object.freeze(session.user);
    Object.defineProperty(session, 'user', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: session.user
    });

    if (promises.channel) {
      session.channel = _objectSpread({}, results.channel, {
        members: results.channelMembers,
        _updatedAt: new Date().toISOString()
      });
      Object.freeze(session.channel);
      Object.defineProperty(session, 'channel', {
        configurable: false,
        enumerable: true,
        writable: false,
        value: session.channel
      });
    }

    if (promises.allUsers) {
      session.team = {
        members: results.allUsers,
        _updatedAt: new Date().toISOString()
      };
      Object.freeze(session.team);
      Object.defineProperty(session, 'team', {
        configurable: false,
        enumerable: true,
        writable: false,
        value: session.team
      });
    }
  }

  mapRequestToEvents(body) {
    const rawEvent = this._getRawEventFromRequest(body);

    if (this._isBotEventRequest(body)) {
      return []; // FIXME
    }

    return [new _SlackEvent.default(rawEvent)];
  }

  async createContext(params) {
    let customAccessToken;

    if (this._mapTeamToAccessToken) {
      const {
        user
      } = params.session;
      let teamId = null;

      if (user && user.team_id) {
        teamId = user.team_id; // eslint-disable-line
      }

      if (!teamId) {
        (0, _warning.default)(false, 'Could not find teamId from request body.');
      } else {
        customAccessToken = await this._mapTeamToAccessToken(teamId);
      }
    }

    return new _SlackContext.default(_objectSpread({}, params, {
      client: this._client,
      token: customAccessToken,
      accessToken: customAccessToken // TODO ?

    }));
  }

  verifySignature(tokenFromBody) {
    if (!this._verificationToken) {
      // TODO: deprecate this bypassing
      return true;
    }

    const bufferFromBot = Buffer.from(this._verificationToken);
    const bufferFromBody = Buffer.from(tokenFromBody); // return early here if buffer lengths are not equal since timingSafeEqual
    // will throw if buffer lengths are not equal

    if (bufferFromBot.length !== bufferFromBody.length) {
      return false;
    } // wait this PR to be merged
    // https://github.com/facebook/flow/pull/4974
    // $FlowExpectedError


    return _crypto.default.timingSafeEqual(bufferFromBot, bufferFromBody);
  }

}

exports.default = SlackConnector;