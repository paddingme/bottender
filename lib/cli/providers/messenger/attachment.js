"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadAttachment = uploadAttachment;
exports.default = main;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _chalk = _interopRequireDefault(require("chalk"));

var _fileType = _interopRequireDefault(require("file-type"));

var _hasha = _interopRequireDefault(require("hasha"));

var _inquirer = _interopRequireDefault(require("inquirer"));

var _invariant = _interopRequireDefault(require("invariant"));

var _jsonfile = _interopRequireDefault(require("jsonfile"));

var _readChunk = _interopRequireDefault(require("read-chunk"));

var _recursiveReaddir = _interopRequireDefault(require("recursive-readdir"));

var _messagingApiMessenger = require("messaging-api-messenger");

var _getConfig = _interopRequireDefault(require("../../shared/getConfig"));

var _log = require("../../shared/log");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const help = () => {
  console.log(`
    bottender messenger attachment <command> [option]

    ${_chalk.default.dim('Commands:')}

      upload        Upload all the files in assets folder.
                    Bottender will also create a bottender-lock.json file.

    ${_chalk.default.dim('Options:')}

      -f, --force   Upload all assets and regenerate bottender-lock.json.
      -y, --yes     Skip prompt confirmation for uploading assets.
      -t, --token   Specify Messenger access token.

    ${_chalk.default.dim('Examples:')}

    ${_chalk.default.dim('-')} Upload the assets to messenger

      ${_chalk.default.cyan('$ bottender messenger attachment upload')}

    ${_chalk.default.dim('-')} Force upload all assets

      ${_chalk.default.cyan('$ bottender messenger attachment upload --force')}
  `);
};

const getFileType = file => {
  const imageType = ['jpg', 'png', 'jpeg', 'gif'];
  const videoType = ['avi', 'mp4', 'm4v'];
  const audioType = ['mp3', 'mid', 'm4a', 'wav'];
  const LENGTH_OF_FILE_MAGIC_NUMBERS = 4100;

  const buffer = _readChunk.default.sync(file, 0, LENGTH_OF_FILE_MAGIC_NUMBERS);

  let type = 'file';
  const typeResult = (0, _fileType.default)(buffer);

  if (typeResult) {
    const {
      ext
    } = typeResult;

    if (imageType.includes(ext)) {
      type = 'image';
    } else if (videoType.includes(ext)) {
      type = 'video';
    } else if (audioType.includes(ext)) {
      type = 'audio';
    }
  }

  return type;
};

const logUploadInfo = uploadInfo => {
  (0, _log.log)('==================== Upload status ===================');
  (0, _log.log)(`Total successfully uploaded ${uploadInfo.success.length} ${uploadInfo.success.length <= 1 ? 'file' : 'files'}, failed ${uploadInfo.error.length} ${uploadInfo.error.length <= 1 ? 'file' : 'files'}, unchanged ${uploadInfo.unchanged.length} ${uploadInfo.unchanged.length <= 1 ? 'file' : 'files'}.`);
  uploadInfo.error.forEach(errorFilename => {
    (0, _log.error)(`Failed file: ${errorFilename}`);
  });
};

async function uploadAttachment(ctx) {
  const {
    f,
    force: _force,
    y,
    yes: _yes,
    t,
    token: _token
  } = ctx.argv;
  const force = f || _force;
  const yes = y || _yes;
  let accessToken;

  try {
    (0, _log.warn)(`${(0, _log.bold)('Attachments upload')} is under heavy development. API may change between any versions.`);

    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = (0, _getConfig.default)('bottender.config.js', 'messenger');
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiMessenger.MessengerClient.connect(accessToken);

    const files = await (0, _recursiveReaddir.default)('assets', ['.*']);
    (0, _invariant.default)(files.length > 0, 'No files found in `assets` folder.');
    files.forEach(_log.print);
    let confirm = true;

    if (!yes) {
      const promptResult = await _inquirer.default.prompt([{
        type: 'confirm',
        message: force ? 'Are you sure you want to force upload all assets?' : 'Is it correct for uploading?',
        name: 'confirm'
      }]);
      confirm = promptResult.confirm;
    }

    if (!confirm) {
      (0, _log.print)('bye');
      return process.exit(0);
    }

    const pathOfMappingFile = _path.default.resolve('bottender-lock.json'); // TODO: output path?


    if (!_fs.default.existsSync(pathOfMappingFile)) {
      _jsonfile.default.writeFileSync(pathOfMappingFile, {});

      (0, _log.print)(`Initialize ${(0, _log.bold)('bottender-lock.json')} for you`);
    }

    const uploadInfo = {
      success: [],
      error: [],
      unchanged: []
    };
    (0, _log.print)(`Trying to upload ${files.length} files...`);

    for (let i = 0; i < files.length; i++) {
      const _uploadedFiles = _jsonfile.default.readFileSync(pathOfMappingFile);

      const uploadedFiles = _uploadedFiles.messenger || {};
      const name = files[i];

      const basename = _path.default.basename(name);

      const fileMeta = uploadedFiles[basename];

      const checksum = _hasha.default.fromFileSync(name);

      let pageId;

      if (force || !fileMeta || checksum !== fileMeta.checksum) {
        try {
          if (!pageId) {
            // eslint-disable-next-line no-await-in-loop
            const pageInfo = await client.getPageInfo();
            pageId = pageInfo.id;
          } // eslint-disable-next-line no-await-in-loop


          const data = await client.uploadAttachment(getFileType(name), _fs.default.createReadStream(name), {
            is_reusable: true
          });

          _jsonfile.default.writeFileSync(pathOfMappingFile, _objectSpread({}, _uploadedFiles, {
            messenger: _objectSpread({}, uploadedFiles, {
              [basename]: _objectSpread({}, data, {
                pageId,
                uploaded_at: Date.now(),
                checksum
              })
            })
          }), {
            spaces: 2
          });

          (0, _log.print)(`Successfully uploaded: ${name}`);
          uploadInfo.success.push(name);
        } catch (e) {
          (0, _log.error)(`Error when uploading file: ${name}`);
          (0, _log.error)(`  ${e}`);
          uploadInfo.error.push(name);
        }
      } else {
        uploadInfo.unchanged.push(name);
      }
    }

    logUploadInfo(uploadInfo);
  } catch (err) {
    (0, _log.error)(err.message);
    return process.exit(1);
  }
}

async function main(ctx) {
  const subcommand = ctx.argv._[2];

  switch (subcommand) {
    case 'upload':
      await uploadAttachment(ctx);
      break;

    case 'help':
      help();
      break;

    default:
      (0, _log.error)(`Please specify a valid subcommand: upload`);
      help();
  }
}