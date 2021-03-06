"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _readline = _interopRequireDefault(require("readline"));

var _Bot = _interopRequireDefault(require("./Bot"));

var _ConsoleConnector = _interopRequireDefault(require("./ConsoleConnector"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ConsoleBot extends _Bot.default {
  constructor({
    sessionStore,
    fallbackMethods,
    mockPlatform
  } = {}) {
    const connector = new _ConsoleConnector.default({
      fallbackMethods,
      mockPlatform
    });
    super({
      connector,
      sessionStore,
      sync: true
    });
  }

  createRuntime() {
    const requestHandler = this.createRequestHandler();

    const rl = _readline.default.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const handleLine = async (line = '') => {
      const lowerCaseLine = line.toLowerCase();

      if (lowerCaseLine === '/quit' || lowerCaseLine === '/exit') {
        rl.close();
        process.exit();
      }

      let rawEvent;

      if (/^\/payload /.test(line)) {
        const payload = line.split('/payload ')[1];
        rawEvent = {
          payload
        };
      } else {
        rawEvent = {
          message: {
            text: line
          }
        };
      }

      await Promise.resolve(requestHandler(rawEvent));
      process.stdout.write('You > ');
      rl.once('line', handleLine);
    };

    process.stdout.write('You > ');
    rl.once('line', handleLine);
  }

}

exports.default = ConsoleBot;