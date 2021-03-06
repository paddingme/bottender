"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _debug = _interopRequireDefault(require("debug"));

var _invariant = _interopRequireDefault(require("invariant"));

var _pMap = _interopRequireDefault(require("p-map"));

var _CacheBasedSessionStore = _interopRequireDefault(require("../session/CacheBasedSessionStore"));

var _MemoryCacheStore = _interopRequireDefault(require("../cache/MemoryCacheStore"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const debugRequest = (0, _debug.default)('bottender:request');
const debugResponse = (0, _debug.default)('bottender:response');
const debugSessionRead = (0, _debug.default)('bottender:session:read');
const debugSessionWrite = (0, _debug.default)('bottender:session:write');
const MINUTES_IN_ONE_YEAR = 365 * 24 * 60;

function createMemorySessionStore() {
  const cache = new _MemoryCacheStore.default(500);
  return new _CacheBasedSessionStore.default(cache, MINUTES_IN_ONE_YEAR);
}

class Bot {
  constructor({
    connector,
    sessionStore = createMemorySessionStore(),
    sync = false
  }) {
    _defineProperty(this, "_sessions", void 0);

    _defineProperty(this, "_initialized", void 0);

    _defineProperty(this, "_connector", void 0);

    _defineProperty(this, "_handler", void 0);

    _defineProperty(this, "_initialState", {});

    _defineProperty(this, "_plugins", []);

    _defineProperty(this, "_sync", void 0);

    this._sessions = sessionStore;
    this._initialized = false;
    this._connector = connector;
    this._handler = null;
    this._sync = sync;
  }

  get connector() {
    return this._connector;
  }

  get sessions() {
    return this._sessions;
  }

  get handler() {
    return this._handler;
  }

  onEvent(handler) {
    (0, _invariant.default)(handler, 'onEvent: Can not pass `undefined`, `null` or any falsy value as handler');
    this._handler = handler.build ? handler.build() : handler;
    return this;
  }

  setInitialState(initialState) {
    this._initialState = initialState;
    return this;
  }

  use(fn) {
    this._plugins.push(fn);

    return this;
  }

  createRequestHandler() {
    if (this._handler == null) {
      throw new Error('Bot: Missing event handler function. You should assign it using onEvent(...)');
    }

    return async (body, requestContext) => {
      if (!body) {
        throw new Error('Bot.createRequestHandler: Missing argument.');
      }

      debugRequest('Incoming request body:');
      debugRequest(JSON.stringify(body, null, 2));

      if (!this._initialized) {
        await this._sessions.init();
        this._initialized = true;
      }

      const {
        platform
      } = this._connector;

      const sessionKey = this._connector.getUniqueSessionKey(body); // Create or retrieve session if possible


      let sessionId;
      let session;

      if (sessionKey) {
        sessionId = `${platform}:${sessionKey}`; // $FlowFixMe

        session = await this._sessions.read(sessionId);
        session = session || Object.create(null);
        debugSessionRead(`Read session: ${sessionId}`);
        debugSessionRead(JSON.stringify(session, null, 2));
        Object.defineProperty(session, 'id', {
          configurable: false,
          enumerable: true,
          writable: false,
          value: session.id || sessionId
        });
        if (!session.platform) session.platform = platform;
        Object.defineProperty(session, 'platform', {
          configurable: false,
          enumerable: true,
          writable: false,
          value: session.platform
        });
        await this._connector.updateSession(session, body);
      }

      const events = this._connector.mapRequestToEvents(body);

      const contexts = await (0, _pMap.default)(events, event => this._connector.createContext({
        event,
        session: session,
        initialState: this._initialState,
        requestContext
      }), {
        concurrency: 5
      }); // Call all of extension functions before passing to handler.

      contexts.forEach(context => {
        this._plugins.forEach(ext => {
          ext(context);
        });
      });

      if (this._handler == null) {
        throw new Error('Bot: Missing event handler function. You should assign it using onEvent(...)');
      }

      const handler = this._handler;
      const promises = Promise.all(contexts.map(context => Promise.resolve().then(() => handler(context)).then(() => {
        if (context.handlerDidEnd) {
          return context.handlerDidEnd();
        }
      })));

      if (this._sync) {
        try {
          await promises;

          if (sessionId && session) {
            // $FlowFixMe: suppressing this error until we can refactor
            session.lastActivity = Date.now();
            contexts.forEach(context => {
              context.isSessionWritten = true;
            });
            debugSessionWrite(`Write session: ${sessionId}`);
            debugSessionWrite(JSON.stringify(session, null, 2));
            await this._sessions.write(sessionId, session);
          }
        } catch (err) {
          console.error(err);
        } // TODO: Any chances to merge multiple responses from context?


        const response = contexts[0].response;

        if (response && typeof response === 'object') {
          debugResponse('Outgoing response:');
          debugResponse(JSON.stringify(response, null, 2));
        }

        return response;
      }

      promises.then(() => {
        if (sessionId && session) {
          // $FlowFixMe: suppressing this error until we can refactor
          session.lastActivity = Date.now();
          contexts.forEach(context => {
            context.isSessionWritten = true;
          });
          debugSessionWrite(`Write session: ${sessionId}`);
          debugSessionWrite(JSON.stringify(session, null, 2));
          return this._sessions.write(sessionId, session);
        }
      }).catch(console.error);
    };
  }

}

exports.default = Bot;