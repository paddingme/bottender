"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _is_before = _interopRequireDefault(require("date-fns/is_before"));

var _sub_minutes = _interopRequireDefault(require("date-fns/sub_minutes"));

var _mongodb = require("mongodb");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const MINUTES_IN_ONE_YEAR = 365 * 24 * 60;

class MongoSessionStore {
  // The number of minutes to store the data in the session.
  constructor(url, options = {}, expiresIn) {
    _defineProperty(this, "_url", void 0);

    _defineProperty(this, "_collectionName", void 0);

    _defineProperty(this, "_expiresIn", void 0);

    _defineProperty(this, "_connection", void 0);

    this._url = url;
    this._collectionName = options.collectionName || 'sessions';
    this._expiresIn = expiresIn || MINUTES_IN_ONE_YEAR;
  }

  async init() {
    this._connection = await _mongodb.MongoClient.connect(this._url); // $FlowFixMe

    return this;
  }

  async read(key) {
    const filter = {
      id: key
    };

    try {
      const session = await this._sessions.findOne(filter);

      if (session && this._expired(session)) {
        return null;
      }

      return session;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async write(key, sess) {
    const filter = {
      id: key
    };
    sess.lastActivity = Date.now();

    try {
      await this._sessions.updateOne(filter, sess, {
        upsert: true
      });
    } catch (e) {
      console.error(e);
    }
  }

  async destroy(key) {
    const filter = {
      id: key
    };

    try {
      await this._sessions.remove(filter);
    } catch (e) {
      console.error(e);
    }
  }

  _expired(sess) {
    return sess.lastActivity !== undefined && (0, _is_before.default)(sess.lastActivity, (0, _sub_minutes.default)(Date.now(), this._expiresIn));
  }

  get _sessions() {
    if (this._connection == null) {
      throw new Error('MongoSessionStore: must call `init` before any operation.');
    }

    return this._connection.collection(this._collectionName);
  }

}

exports.default = MongoSessionStore;