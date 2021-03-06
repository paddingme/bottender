"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jfs = _interopRequireDefault(require("jfs"));

var _is_before = _interopRequireDefault(require("date-fns/is_before"));

var _sub_minutes = _interopRequireDefault(require("date-fns/sub_minutes"));

var _thenify = _interopRequireDefault(require("thenify"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const MINUTES_IN_ONE_YEAR = 365 * 24 * 60;

class FileSessionStore {
  // The number of minutes to store the data in the session.
  constructor(dirname, expiresIn) {
    _defineProperty(this, "_jfs", void 0);

    _defineProperty(this, "_expiresIn", void 0);

    this._expiresIn = expiresIn || MINUTES_IN_ONE_YEAR;
    const jfs = new _jfs.default(dirname || '.sessions');
    jfs.get = (0, _thenify.default)(jfs.get);
    jfs.save = (0, _thenify.default)(jfs.save);
    jfs.delete = (0, _thenify.default)(jfs.delete);
    this._jfs = jfs;
  }

  async init() {
    return this;
  }

  async read(key) {
    const session = await this._jfs.get(key).catch(() => null);

    if (session && this._expired(session)) {
      return null;
    }

    return session;
  }

  async write(key, sess) {
    sess.lastActivity = Date.now();
    await this._jfs.save(key, sess);
  }

  async destroy(key) {
    return this._jfs.delete(key);
  }

  getJFS() {
    return this._jfs;
  }

  _expired(sess) {
    return sess.lastActivity !== undefined && (0, _is_before.default)(sess.lastActivity, (0, _sub_minutes.default)(Date.now(), this._expiresIn));
  }

}

exports.default = FileSessionStore;