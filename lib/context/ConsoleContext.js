"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _delay = _interopRequireDefault(require("delay"));

var _ConsoleEvent = _interopRequireDefault(require("./ConsoleEvent"));

var _Context = _interopRequireDefault(require("./Context"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const methodBlackList = ['inspect', // console
'then', // promise
'handlerDidEnd'];

class ConsoleContext extends _Context.default {
  constructor({
    client,
    event,
    session,
    initialState,
    requestContext,
    fallbackMethods,
    mockPlatform
  }) {
    super({
      client,
      event,
      session,
      initialState,
      requestContext
    });

    _defineProperty(this, "_client", this._client);

    _defineProperty(this, "_event", this._event);

    _defineProperty(this, "_session", this._session);

    _defineProperty(this, "_fallbackMethods", false);

    _defineProperty(this, "_mockPlatform", 'console');

    this._mockPlatform = mockPlatform;
    this._fallbackMethods = fallbackMethods;

    if (fallbackMethods) {
      // $FlowExpectedError
      return new Proxy(this, {
        get(target, key) {
          // https://github.com/facebook/flow/issues/6181
          // https://github.com/facebook/flow/issues/6321
          // $FlowFixMe: Cannot get `target[key]` because an indexer property is missing in `ConsoleContext` [1].
          if (typeof target[key] !== 'undefined') {
            // $FlowFixMe: Cannot get `target[key]` because an indexer property is missing in `ConsoleContext` [1].
            return target[key];
          }

          if (methodBlackList.includes(key)) return; // $FlowIssue: Support `typeof x === "symbol"` - https://github.com/facebook/flow/issues/1015

          if (typeof key === 'symbol') return; // any symbol should not be method missing

          return async (...args) => {
            await target._methodMissing(key, args);
          };
        }

      });
    }
  }
  /**
   * The name of the platform.
   *
   */


  get platform() {
    return this._mockPlatform || 'console';
  }
  /**
   * Delay and show indicators for milliseconds.
   *
   */


  async typing(milliseconds) {
    if (milliseconds > 0) {
      await (0, _delay.default)(milliseconds);
    }
  }
  /**
   * Send text to the owner of then session.
   *
   */


  async sendText(text, ...args) {
    this._isHandled = true;

    if (args.length > 0 && this._fallbackMethods) {
      this._client.sendText(`${text}\nwith other args:\n${JSON.stringify(args, null, 2)}`);
    } else {
      this._client.sendText(text);
    }
  }

  async _methodMissing(method, args) {
    this._isHandled = true;

    this._client.sendText(`${method} with args:\n${JSON.stringify(args, null, 2)}`);
  }

}

exports.default = ConsoleContext;