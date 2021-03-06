"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _url = _interopRequireDefault(require("url"));

var _urlencodedBodyParser = _interopRequireDefault(require("urlencoded-body-parser"));

var _shortid = _interopRequireDefault(require("shortid"));

var _micro = require("micro");

var _verifyLineSignature = _interopRequireDefault(require("./verifyLineSignature"));

var _verifyMessengerSignature = _interopRequireDefault(require("./verifyMessengerSignature"));

var _verifyMessengerWebhook = _interopRequireDefault(require("./verifyMessengerWebhook"));

var _verifySlackSignature = _interopRequireDefault(require("./verifySlackSignature"));

var _verifySlackWebhook = _interopRequireDefault(require("./verifySlackWebhook"));

var _verifyViberSignature = _interopRequireDefault(require("./verifyViberSignature"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function createRequestHandler(bot, config = {}) {
  const requestHandler = bot.createRequestHandler();
  return async (req, res) => {
    if (req.method === 'GET' && bot.connector.platform === 'messenger') {
      (0, _verifyMessengerWebhook.default)({
        verifyToken: config.verifyToken || bot.connector.verifyToken || _shortid.default.generate()
      })(req, res);
    } else if (req.method === 'POST') {
      let body;

      if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
        body = await (0, _urlencodedBodyParser.default)(req);
      } else {
        body = await (0, _micro.json)(req);
      }

      if (bot.connector.platform === 'slack' && body.type === 'url_verification') {
        await (0, _verifySlackWebhook.default)()(req, res);
      } else {
        if (bot.connector.platform === 'messenger') {
          const valid = await (0, _verifyMessengerSignature.default)(bot)(req, res);

          if (!valid) {
            return;
          }
        } else if (bot.connector.platform === 'line') {
          const valid = await (0, _verifyLineSignature.default)(bot)(req, res);

          if (!valid) {
            return;
          }
        } else if (bot.connector.platform === 'slack') {
          const valid = await (0, _verifySlackSignature.default)(bot)(req, res);

          if (!valid) {
            return;
          }
        } else if (bot.connector.platform === 'viber') {
          const valid = await (0, _verifyViberSignature.default)(bot)(req, res);

          if (!valid) {
            return;
          }
        }

        const {
          query
        } = _url.default.parse(req.url, true);

        const response = await requestHandler(_objectSpread({}, query, body), {
          req,
          res
        });

        if (response) {
          Object.keys(response.headers).forEach(key => {
            res.setHeader(key, response.headers[key]);
          });
          (0, _micro.send)(res, response.status || 200, response.body || '');
        } else {
          (0, _micro.send)(res, 200);
        }
      }
    } else {
      (0, _micro.send)(res, 405);
    }
  };
}

var _default = createRequestHandler;
exports.default = _default;