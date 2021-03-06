"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _ConsoleContext = _interopRequireDefault(require("../context/ConsoleContext"));

var _ConsoleEvent = _interopRequireDefault(require("../context/ConsoleEvent"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class ConsoleConnector {
  constructor({
    client,
    fallbackMethods,
    mockPlatform
  } = {}) {
    _defineProperty(this, "_client", void 0);

    _defineProperty(this, "_fallbackMethods", void 0);

    _defineProperty(this, "_platform", void 0);

    this._client = client || {
      sendText: text => {
        process.stdout.write(`Bot > ${text}\n`);
      }
    };
    this._fallbackMethods = fallbackMethods || false;
    this._platform = mockPlatform || 'console';
  }

  get platform() {
    return this._platform;
  }

  get client() {
    return this._client;
  }

  getUniqueSessionKey() {
    return '1';
  }

  async updateSession(session) {
    if (!session.user) {
      session.user = {
        id: '1',
        name: 'you',
        _updatedAt: new Date().toISOString()
      };
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
    return [new _ConsoleEvent.default(body)];
  }

  createContext(params) {
    return new _ConsoleContext.default(_objectSpread({}, params, {
      client: this._client,
      fallbackMethods: this._fallbackMethods,
      mockPlatform: this._platform
    }));
  }

}

exports.default = ConsoleConnector;