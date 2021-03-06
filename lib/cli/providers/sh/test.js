"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _TestBot = _interopRequireDefault(require("../../../bot/TestBot"));

var _loadModule = _interopRequireDefault(require("../../shared/loadModule"));

var _log = require("../../shared/log");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const test = async ({
  argv
}) => {
  const inputFile = argv._[1];
  const outputFile = argv['out-file'] || argv.o;

  const inputFilePath = _path.default.resolve(inputFile);

  const tests = await _fsExtra.default.readJson(inputFilePath);
  const bot = new _TestBot.default(); // FIXME: how to find handler and initialState?
  // find from ./handler or ./src/handler

  const handler = (0, _loadModule.default)('handler') || (0, _loadModule.default)('src/handler');

  if (!handler) {
    (0, _log.error)('cannot find handler');
    return process.exit(1);
  }

  bot.onEvent(handler);
  (0, _log.print)('start running tests...');
  const result = await bot.runTests(tests);

  if (outputFile) {
    const outputFilePath = _path.default.resolve(outputFile);

    await _fsExtra.default.writeJson(outputFilePath, result);
  } else {
    // TODO: how to prettify output
    console.log(JSON.stringify(result, null, 2));
  }
};

var _default = test;
exports.default = _default;