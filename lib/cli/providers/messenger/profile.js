"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkMessengerProfile = checkMessengerProfile;
exports.getMessengerProfile = getMessengerProfile;
exports.setMessengerProfile = setMessengerProfile;
exports.deleteMessengerProfile = deleteMessengerProfile;
exports.default = main;
exports.trimDomain = exports.help = void 0;

var _pick2 = _interopRequireDefault(require("lodash/pick"));

var _omit2 = _interopRequireDefault(require("lodash/omit"));

var _chalk = _interopRequireDefault(require("chalk"));

var _invariant = _interopRequireDefault(require("invariant"));

var _messagingApiMessenger = require("messaging-api-messenger");

var _deepObjectDiff = require("deep-object-diff");

var _getConfig = _interopRequireDefault(require("../../shared/getConfig"));

var _log = require("../../shared/log");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable consistent-return */
const FIELDS = ['account_linking_url', 'persistent_menu', 'get_started', 'greeting', 'whitelisted_domains', 'payment_settings', 'target_audience', 'home_url'];

const help = () => {
  console.log(`
    bottender messenger profile <action> [option]

    ${_chalk.default.dim('Actions:')}

      check         Check if messenger profile setting in bottender.config.js valids
      get           Get the messenger profile
      set           Set the messenger profile by diff
      del, delete   Delete all the messenger profile fields
      help          Show this help

    ${_chalk.default.dim('Options:')}

      --force       Force update the messenger profile by config
      -t, --token   Specify Messenger access token.

    ${_chalk.default.dim('Examples:')}

    ${_chalk.default.dim('-')} Set the messenger profile

      ${_chalk.default.cyan('$ bottender messenger profile set')}

    ${_chalk.default.dim('-')} Force update the messenger profile

      ${_chalk.default.cyan('$ bottender messenger profile set --force')}
  `);
};

exports.help = help;

const trimDomain = profile => {
  const clone = Object.assign({}, profile);

  if (clone.whitelisted_domains) {
    clone.whitelisted_domains = clone.whitelisted_domains.map(domain => domain.replace(/\/$/, ''));
  }

  return clone;
};

exports.trimDomain = trimDomain;

function checkMessengerProfile() {
  try {
    (0, _getConfig.default)('bottender.config.js', 'messenger');
    (0, _log.print)('Messenger profile check done.');
  } catch (e) {
    (0, _log.error)(e.message);
    return process.exit(1);
  }
}

async function getMessengerProfile(ctx) {
  const {
    t,
    token: _token
  } = ctx.argv;
  let accessToken;

  try {
    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = (0, _getConfig.default)('bottender.config.js', 'messenger');
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiMessenger.MessengerClient.connect(accessToken);

    const profile = await client.getMessengerProfile(FIELDS);

    if (profile) {
      (0, _log.print)('The profile is:');
      (0, _log.print)(`\n${JSON.stringify(profile, null, 2)}`);
    } else {
      (0, _log.error)(`Failed to find ${(0, _log.bold)('messenger_profile')} setting`);
    }
  } catch (err) {
    (0, _log.error)(`Failed to get ${(0, _log.bold)('messenger_profile')} settings`);

    if (err.response) {
      (0, _log.error)(`status: ${(0, _log.bold)(err.response.status)}`);

      if (err.response.data) {
        (0, _log.error)(`data: ${(0, _log.bold)(JSON.stringify(err.response.data, null, 2))}`);
      }
    } else {
      (0, _log.error)(err.message);
    }

    return process.exit(1);
  }
}

async function setMessengerProfile(ctx) {
  const {
    force,
    t,
    token: _token
  } = ctx.argv;
  let accessToken;

  try {
    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = (0, _getConfig.default)('bottender.config.js', 'messenger');
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const {
      profile: _profile
    } = (0, _getConfig.default)('bottender.config.js', 'messenger');

    const client = _messagingApiMessenger.MessengerClient.connect(accessToken);

    if (force) {
      await client.deleteMessengerProfile(FIELDS);
      (0, _log.print)(`Successfully delete all ${(0, _log.bold)('messenger_profile')} settings due to ${(0, _log.bold)('--force')} option`);

      if (_profile.whitelisted_domains) {
        await client.setMessengerProfile((0, _pick2.default)(_profile, 'whitelisted_domains'));
        await client.setMessengerProfile((0, _omit2.default)(_profile, 'whitelisted_domains'));
      } else {
        await client.setMessengerProfile(_profile);
      }

      (0, _log.print)(`Successfully set ${(0, _log.bold)('messenger_profile')} settings`);
    } else {
      const [_existedProfile] = await client.getMessengerProfile(FIELDS);
      const profile = trimDomain(_profile);
      const existedProfile = trimDomain(_existedProfile);
      const diffResult = (0, _deepObjectDiff.diff)(existedProfile, profile);

      if (Object.keys(diffResult).length !== 0) {
        const shouldDeleteFields = Object.keys((0, _deepObjectDiff.deletedDiff)(existedProfile, profile));
        const shouldSetFields = [...Object.keys((0, _deepObjectDiff.addedDiff)(existedProfile, profile)), ...Object.keys((0, _deepObjectDiff.updatedDiff)(existedProfile, profile))];

        if (shouldDeleteFields.length > 0) {
          await client.deleteMessengerProfile(shouldDeleteFields);
          const deleteFileds = shouldDeleteFields.join(', ');
          (0, _log.print)(`Successfully delete ${(0, _log.bold)(deleteFileds)} settings`);
        }

        if (shouldSetFields.length > 0) {
          const shouldSetProfile = (0, _pick2.default)(profile, shouldSetFields);

          if (shouldSetFields.includes('whitelisted_domains')) {
            await client.setMessengerProfile((0, _pick2.default)(shouldSetProfile, 'whitelisted_domains'));
            await client.setMessengerProfile((0, _omit2.default)(shouldSetProfile, 'whitelisted_domains'));
          } else {
            await client.setMessengerProfile(shouldSetProfile);
          }

          const setFields = Object.keys(shouldSetProfile).join(', ');
          (0, _log.print)(`Successfully set ${(0, _log.bold)(setFields)} settings`);
        }
      } else {
        (0, _log.print)(`No change apply because the profile settings is the same.`);
      }
    }

    (0, _log.log)(`You can use ${(0, _log.bold)('bottender messenger profile get')} to see the full profile setting.`);
  } catch (err) {
    (0, _log.error)(`Failed to set ${(0, _log.bold)('messenger_profile')} settings`);

    if (err.response) {
      (0, _log.error)(`status: ${(0, _log.bold)(err.response.status)}`);

      if (err.response.data) {
        (0, _log.error)(`data: ${(0, _log.bold)(JSON.stringify(err.response.data, null, 2))}`);
      }
    } else {
      (0, _log.error)(err.message);
    }

    return process.exit(1);
  }
}

async function deleteMessengerProfile(ctx) {
  const {
    t,
    token: _token
  } = ctx.argv;
  let accessToken;

  try {
    if (t || _token) {
      accessToken = t || _token;
    } else {
      const config = (0, _getConfig.default)('bottender.config.js', 'messenger');
      (0, _invariant.default)(config.accessToken, 'accessToken is not found in config file');
      accessToken = config.accessToken;
    }

    const client = _messagingApiMessenger.MessengerClient.connect(accessToken);

    await client.deleteMessengerProfile(FIELDS);
    (0, _log.print)(`Successfully delete ${(0, _log.bold)('messenger_profile')} settings`);
  } catch (err) {
    (0, _log.error)(`Failed to delete ${(0, _log.bold)('messenger_profile')} settings`);

    if (err.response) {
      (0, _log.error)(`status: ${(0, _log.bold)(err.response.status)}`);

      if (err.response.data) {
        (0, _log.error)(`data: ${(0, _log.bold)(JSON.stringify(err.response.data, null, 2))}`);
      }
    } else {
      (0, _log.error)(err.message);
    }

    return process.exit(1);
  }
}

async function main(ctx) {
  const subcommand = ctx.argv._[2];

  switch (subcommand) {
    case 'check':
      checkMessengerProfile();
      break;

    case 'get':
      await getMessengerProfile(ctx);
      break;

    case 'set':
      await setMessengerProfile(ctx);
      break;

    case 'delete':
    case 'del':
      await deleteMessengerProfile(ctx);
      break;

    case 'help':
      help();
      break;

    default:
      (0, _log.error)(`Please specify a valid subcommand: check, get, set, delete, help`);
      help();
  }
}