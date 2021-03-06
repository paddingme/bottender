"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _line = _interopRequireDefault(require("./line"));

var _messenger = _interopRequireDefault(require("./messenger"));

var _sh = _interopRequireDefault(require("./sh"));

var _telegram = _interopRequireDefault(require("./telegram"));

var _viber = _interopRequireDefault(require("./viber"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = {
  sh: _sh.default,
  messenger: _messenger.default,
  telegram: _telegram.default,
  line: _line.default,
  viber: _viber.default
};
exports.default = _default;