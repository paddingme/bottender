"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _child_process = require("child_process");

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _inquirer = _interopRequireDefault(require("inquirer"));

var _crossSpawn = _interopRequireDefault(require("cross-spawn"));

var _stringifyObject = _interopRequireDefault(require("stringify-object"));

var _validateNpmPackageName = _interopRequireDefault(require("validate-npm-package-name"));

var _log = require("../../../shared/log");

var _generateIndexFile = _interopRequireDefault(require("./generateIndexFile"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const questions = [{
  name: 'name',
  message: "What's your project name?",
  type: 'input'
}, {
  name: 'platform',
  message: 'What platform of bot do you want to create?',
  type: 'list',
  choices: ['console', 'messenger', 'line', 'slack', 'telegram', 'viber']
}, {
  name: 'session',
  message: 'Where do you want to store session?',
  type: 'list',
  choices: ['memory', 'file', 'redis', 'mongo']
}, {
  when: answer => answer.platform !== 'console',
  name: 'server',
  message: 'What kind of server do you want to use?',
  type: 'list',
  choices: ['express', 'koa', 'micro', 'restify']
}];

const generateBotConfig = platform => {
  const accessToken = '__PUT_YOUR_ACCESS_TOKEN_HERE__';

  switch (platform) {
    case 'slack':
      return {
        slack: {
          accessToken
        }
      };

    case 'line':
      return {
        line: {
          accessToken,
          channelSecret: '__PUT_YOUR_CHANNEL_SECRET_HERE__'
        }
      };

    case 'telegram':
      return {
        telegram: {
          accessToken
        }
      };

    case 'viber':
      return {
        viber: {
          accessToken
        }
      };

    case 'messenger':
    default:
      return {
        messenger: {
          accessToken,
          verifyToken: '__PUT_YOUR_VERITY_TOKEN_HERE__',
          appId: '__PUT_YOUR_APP_ID_HERE__',
          appSecret: '__PUT_YOUR_APP_SECRET_HERE__'
        }
      };
  }
};

const shouldUseYarn = () => {
  try {
    (0, _child_process.execSync)('yarnpkg --version', {
      stdio: 'ignore'
    });
    return true;
  } catch (e) {
    return false;
  }
};

const isSafeToCreateProjectIn = (root, name) => {
  const validFiles = ['.DS_Store', 'Thumbs.db', '.git', '.gitignore', '.idea', 'README.md', 'LICENSE', 'web.iml', '.hg', '.hgignore', '.hgcheck'];
  (0, _log.print)('');

  const conflicts = _fsExtra.default.readdirSync(root).filter(file => !validFiles.includes(file));

  if (conflicts.length < 1) {
    return true;
  }

  (0, _log.print)(`The directory ${name} contains files that could conflict:`);
  (0, _log.print)(''); // eslint-disable-next-line no-restricted-syntax

  for (const file of conflicts) {
    (0, _log.print)(`  ${file}`);
  }

  (0, _log.print)('');
  (0, _log.print)('Either try using a new directory name, or remove the files listed above.');
  return false;
};

const printValidationResults = results => {
  if (typeof results !== 'undefined') {
    results.forEach(Error => {
      (0, _log.error)(`  *  ${Error}`);
    });
  }
};

const checkBotName = botName => {
  const validationResult = (0, _validateNpmPackageName.default)(botName);

  if (!validationResult.validForNewPackages) {
    (0, _log.error)(`Could not create a project called "${botName}" because of npm naming restrictions:`);
    printValidationResults(validationResult.errors);
    printValidationResults(validationResult.warnings);
    return false;
  }

  return true;
};

const install = (useYarn, allDependencies) => new Promise((resolve, reject) => {
  let command;
  let args = [];

  if (useYarn) {
    command = 'yarnpkg';
    args = args.concat(['add', '--exact', '--silent'], allDependencies.dependencies);

    _crossSpawn.default.sync(command, args, {
      stdio: 'inherit'
    });

    args = [];
    args = args.concat(['add', '--dev', '--silent'], allDependencies.devDependencies);
  } else {
    command = 'npm';
    args = args.concat(['install', '--save', '--save-exact', '--loglevel', 'error'], allDependencies.dependencies);

    _crossSpawn.default.sync(command, args, {
      stdio: 'inherit'
    });

    args = [];
    args = args.concat(['install', '--dev', '--save-exact', '--loglevel', 'error'], allDependencies.devDependencies);
  }

  const child = (0, _crossSpawn.default)(command, args, {
    stdio: 'inherit'
  });
  child.on('close', code => {
    if (code !== 0) {
      const err = new Error('install failed');
      err.command = `${command} ${args.join(' ')}`;
      reject(err);
      return;
    }

    resolve();
  });
});

const run = async (root, botName, answer, useYarn) => {
  try {
    const allDependencies = {
      dependencies: ['bottender'],
      devDependencies: ['nodemon']
    };
    (0, _log.print)('Installing packages... This might take a couple of minutes.');
    (0, _log.print)('');
    await install(useYarn, allDependencies);
    const indexFile = (0, _generateIndexFile.default)(answer);

    _fsExtra.default.writeFileSync(_path.default.join(root, 'index.js'), indexFile);

    if (answer.platform !== 'console') {
      const botConfig = generateBotConfig(answer.platform);

      _fsExtra.default.writeFileSync(_path.default.join(root, 'bottender.config.js'), `module.exports = ${(0, _stringifyObject.default)(botConfig, {
        indent: '  '
      })};`);
    }

    const gitignore = _fsExtra.default.readFileSync(_path.default.resolve(__dirname, './template/gitignore'));

    _fsExtra.default.writeFileSync(_path.default.join(root, '.gitignore'), gitignore);

    const readme = _fsExtra.default.readFileSync(_path.default.resolve(__dirname, './template/README.md'));

    _fsExtra.default.writeFileSync(_path.default.join(root, 'README.md'), readme);
  } catch (reason) {
    (0, _log.print)('');
    (0, _log.print)('Aborting installation.');

    if (reason.command) {
      (0, _log.error)(`  ${reason.command} has failed.`);
    } else {
      (0, _log.error)('Unexpected error. Please report it as a bug:');
      (0, _log.print)(reason);
    }

    (0, _log.print)('');
    const knownGeneratedFiles = ['package.json', 'npm-debug.log', 'yarn-error.log', 'yarn-debug.log', 'node_modules'];

    const currentFiles = _fsExtra.default.readdirSync(_path.default.join(root));

    currentFiles.forEach(file => {
      knownGeneratedFiles.forEach(fileToMatch => {
        if (fileToMatch.match(/.log/g) && file.indexOf(fileToMatch) === 0 || file === fileToMatch) {
          (0, _log.print)(`Deleting generated file... ${file}`);

          _fsExtra.default.removeSync(_path.default.join(root, file));
        }
      });
    });

    const remainingFiles = _fsExtra.default.readdirSync(_path.default.join(root));

    if (!remainingFiles.length) {
      (0, _log.print)(`Deleting ${botName} / from ${_path.default.resolve(root, '..')}`);
      process.chdir(_path.default.resolve(root, '..'));

      _fsExtra.default.removeSync(_path.default.join(root));
    }

    (0, _log.print)('Done.');
    return process.exit(1);
  }
};

const createBot = async (answer, root, useYarn) => {
  const {
    name,
    platform
  } = answer;

  const botName = _path.default.basename(root);

  if (!checkBotName(botName)) {
    return process.exit(1);
  }

  _fsExtra.default.ensureDirSync(name);

  if (!isSafeToCreateProjectIn(root, name)) {
    return process.exit(1);
  }

  (0, _log.print)(`Creating a new ${platform} bot at ${root}.`);
  (0, _log.print)('');
  const packageJson = {
    name: botName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'nodemon index.js',
      start: 'node index.js'
    }
  };

  _fsExtra.default.writeFileSync(_path.default.join(root, 'package.json'), JSON.stringify(packageJson, null, 2));

  process.chdir(root);
  await run(root, botName, answer, useYarn);
};

const init = async () => {
  try {
    const answer = await _inquirer.default.prompt(questions);
    const {
      name
    } = answer;

    if (typeof name === 'undefined' || name === '') {
      (0, _log.print)('');
      (0, _log.error)('Please specify the project name');
      (0, _log.print)('For example:');
      (0, _log.print)("  ? What's your project name? my-bot");
      (0, _log.print)('');
      (0, _log.print)("Run 'bottender --help' to see all options.");
      return process.exit(1);
    }

    const useYarn = shouldUseYarn();

    const root = _path.default.resolve(name);

    await createBot(answer, root, useYarn);
    const command = useYarn ? 'yarn' : 'npm';
    (0, _log.print)('Success!');
    (0, _log.print)(`Created ${name} at ${root}`);
    (0, _log.print)(`Please make sure you have edited ${(0, _log.bold)('bottender.config.js')} before running the bot.`);
    (0, _log.print)('');
    (0, _log.print)('Inside that directory, you can run several commands:');
    (0, _log.print)('');
    (0, _log.print)(`  ${command} start`);
    (0, _log.print)('    Starts the production server.');
    (0, _log.print)('');
    (0, _log.print)(`  ${command} dev`);
    (0, _log.print)('    Starts the development server.');
    (0, _log.print)('');
    (0, _log.print)('We suggest that you begin by typing:');
    (0, _log.print)('');
    (0, _log.print)(`  cd ${name}`);
    (0, _log.print)(`  ${command} dev`);
    (0, _log.print)('');
    (0, _log.print)('Happy hacking!');
  } catch (err) {
    (0, _log.error)('init error with');

    if (err.response) {
      (0, _log.error)(`status: ${err.response.status}`);
    } else {
      (0, _log.error)(`message: ${err.message}`);
    }

    return process.exit(1);
  }
};

var _default = init;
exports.default = _default;