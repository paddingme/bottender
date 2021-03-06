"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _express = _interopRequireDefault(require("express"));

var _registerRoutes = _interopRequireDefault(require("./registerRoutes"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createServer(bot, config = {}) {
  const server = (0, _express.default)();
  server.use(_bodyParser.default.urlencoded({
    extended: false
  }));
  server.use(_bodyParser.default.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    }
  }));
  (0, _registerRoutes.default)(server, bot, config);
  return server;
}

var _default = createServer;
exports.default = _default;