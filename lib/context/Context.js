"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _cloneDeep = _interopRequireDefault(require("lodash/cloneDeep"));

var _debug = _interopRequireDefault(require("debug"));

var _warning = _interopRequireDefault(require("warning"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const debugContext = (0, _debug.default)('bottender:context');

class Context {
  constructor({
    client,
    event,
    session,
    initialState,
    requestContext
  }) {
    _defineProperty(this, "_isHandled", false);

    _defineProperty(this, "_isSessionWritten", false);

    _defineProperty(this, "_client", void 0);

    _defineProperty(this, "_event", void 0);

    _defineProperty(this, "_session", void 0);

    _defineProperty(this, "_initialState", void 0);

    _defineProperty(this, "_requestContext", void 0);

    _defineProperty(this, "response", void 0);

    this._client = client;
    this._event = event;
    this._session = session;
    this._initialState = initialState || {};
    this._requestContext = requestContext;
    debugContext('Context created with rawEvent:');
    debugContext(JSON.stringify(this._event.rawEvent, null, 2));

    if (this._session && !this._session._state) {
      const sess = this._session;
      sess._state = (0, _cloneDeep.default)(this._initialState);
    }

    this.response = {
      status: 200,
      headers: {},
      body: null
    };
  }
  /**
   * The client instance.
   *
   */


  get client() {
    return this._client;
  }
  /**
   * The event instance.
   *
   */


  get event() {
    return this._event;
  }
  /**
   * The context of request.
   *
   */


  get requestContext() {
    return this._requestContext;
  }
  /**
   * The session state of the context.
   *
   */


  get session() {
    return this._session;
  }

  get isHandled() {
    return this._isHandled;
  }

  get isSessionWritten() {
    return this._isSessionWritten;
  }

  set isSessionWritten(bool) {
    this._isSessionWritten = bool;
  }
  /**
   * The state in the conversation context.
   *
   */


  get state() {
    if (this._session) {
      return this._session._state;
    }

    (0, _warning.default)(false, 'state: is not accessible in context without session. Falling back to an empty object.');
    return {};
  }
  /**
   * Shallow merge changes to the state.
   *
   */


  setState(state) {
    if (this._session) {
      const sess = this._session;
      (0, _warning.default)(!this._isSessionWritten, 'Calling `context.setState` after session has been written. Some changes to state will not be saved.\nDid you forget to await any async function?');
      sess._state = _objectSpread({}, sess._state, state);
    } else {
      (0, _warning.default)(false, 'setState: should not be called in context without session');
    }
  }
  /**
   * Reset the state to the initial state.
   *
   */


  resetState() {
    if (this._session) {
      const sess = this._session;
      (0, _warning.default)(!this._isSessionWritten, 'Calling `context.resetState` after session has been written. Some changes to state will not be saved.\nDid you forget to await any async function?');
      sess._state = (0, _cloneDeep.default)(this._initialState);
    } else {
      (0, _warning.default)(false, 'resetState: should not be called in context without session');
    }
  }

}

exports.default = Context;