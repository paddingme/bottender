"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _get = _interopRequireDefault(require("lodash/get"));

var _jsonfile = _interopRequireDefault(require("jsonfile"));

var _pkgDir = _interopRequireDefault(require("pkg-dir"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getAttachment = filename => {
  const rootPath = _pkgDir.default.sync();

  const pathOfLockFile = _path.default.resolve(rootPath, 'bottender-lock.json');

  const lockfile = _jsonfile.default.readFileSync(pathOfLockFile);

  return {
    id: (0, _get.default)(lockfile, ['messenger', filename, 'attachment_id'])
  };
};

var _default = getAttachment;
exports.default = _default;