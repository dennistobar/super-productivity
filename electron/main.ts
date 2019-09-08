'use strict';
import {App, app, globalShortcut, ipcMain, powerMonitor, powerSaveBlocker} from 'electron';
import {info} from 'electron-log';
import {CONFIG} from './CONFIG';

import {initIndicator} from './indicator';

import {sendJiraRequest, setupRequestHeadersForImages} from './jira';
import {getGitLog} from './git-log';
import {errorHandler} from './error-handler';
import {initDebug} from './debug';
import {IPC} from './ipc-events.const';
import {backupData} from './backup';
import {JiraCfg} from '../src/app/features/issue/jira/jira';
import {KeyboardConfig} from '../src/app/features/config/global-config.model';
import lockscreen from './lockscreen';
import {showAwesomeBar} from './awesome-bar/awesome-bar';
import BrowserWindow = Electron.BrowserWindow;

const ICONS_FOLDER = __dirname + '/assets/icons/';
const IS_MAC = process.platform === 'darwin';
const IS_LINUX = process.platform === 'linux';
const DESKTOP_ENV = process.env.DESKTOP_SESSION;
const IS_GNOME = (DESKTOP_ENV === 'gnome' || DESKTOP_ENV === 'gnome-xorg');
const IS_DEV = process.env.NODE_ENV === 'DEV';
if (IS_DEV) {
  console.log('Starting in DEV Mode!!!');
}

// NOTE: needs to be executed before everything else
process.argv.forEach((val) => {
  if (val && val.includes('--user-data-dir=')) {
    const customUserDir = val.replace('--user-data-dir=', '').trim();
    console.log('Using custom directory for user data', customUserDir);
    app.setPath('userData', customUserDir);
  }
});

interface MyApp extends App {
  isQuiting?: boolean;
}

const appIN: MyApp = app;

// initDebug({showDevTools: IS_DEV}, IS_DEV);
initDebug({showDevTools: false}, IS_DEV);

// TODO maybe reimplement when fixed
// electronDl({openFolderWhenDone: true});

let mainWin: BrowserWindow;
const nestedWinParams = {isDarwinForceQuit: false};
// keep app active to keep time tracking running
powerSaveBlocker.start('prevent-app-suspension');

appIN.on('second-instance', () => {
  if (mainWin) {
    showApp();
    if (mainWin.isMinimized()) {
      mainWin.restore();
    }
    mainWin.focus();
  }
});

// make it a single instance by closing other instances but allow for dev mode
if (!appIN.requestSingleInstanceLock() && !IS_DEV) {
  quitAppNow();
}

// Allow invalid certificates for jira requests
appIN.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  console.log(error);
  event.preventDefault();
  callback(true);
});

// APP EVENT LISTENERS
// -------------------
appIN.on('ready', createMainWin);
appIN.on('ready', createIndicator);

appIN.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWin === null) {
    createMainWin();
  } else {
    showApp();
  }
});

let isLocked = false;

appIN.on('ready', () => {
  let suspendStart;
  const sendIdleMsgIfOverMin = (idleTime) => {
    // sometimes when starting a second instance we get here although we don't want to
    if (!mainWin) {
      info('special case occurred when trackTimeFn is called even though, this is a second instance of the app');
      return;
    }

    // don't update if the user is about to close
    if (!appIN.isQuiting && idleTime > CONFIG.MIN_IDLE_TIME) {
      mainWin.webContents.send(IPC.IDLE_TIME, idleTime);
    }
  };

  const checkIdle = () => sendIdleMsgIfOverMin(powerMonitor.getSystemIdleTime() * 1000);

  // init time tracking interval
  setInterval(checkIdle, CONFIG.IDLE_PING_INTERVAL);

  powerMonitor.on('suspend', () => {
    isLocked = true;
    suspendStart = Date.now();
  });

  powerMonitor.on('lock-screen', () => {
    isLocked = true;
    suspendStart = Date.now();
  });

  powerMonitor.on('resume', () => {
    isLocked = false;
    sendIdleMsgIfOverMin(Date.now() - suspendStart);
  });

  powerMonitor.on('unlock-screen', () => {
    isLocked = false;
    sendIdleMsgIfOverMin(Date.now() - suspendStart);
  });
});


appIN.on('before-quit', () => {
  // handle darwin
  if (IS_MAC) {
    nestedWinParams.isDarwinForceQuit = true;
  }
});

appIN.on('will-quit', () => {
  // un-register all shortcuts.
  globalShortcut.unregisterAll();
});

// AUTO-UPDATER
// ------------
// appIN.on('ready', () => {
//  // init auto-updates
//  log.info('INIT AUTO UPDATES');
//  // log.info(autoUpdater.getFeedURL());
//  autoUpdater.logger = log;
//  autoUpdater.logger.transports.file.level = 'info';
//  autoUpdater.checkForUpdatesAndNotify();
// });
//
// autoUpdater.on('update-downloaded', (ev, info) => {
//  console.log(ev);
//  // Wait 5 seconds, then quit and install
//  // In your application, you don't need to wait 5 seconds.
//  // You could call autoUpdater.quitAndInstall(); immediately
//  setTimeout(function() {
//    autoUpdater.quitAndInstall();
//  }, 5000)
// });

// FRONTEND EVENTS
// ---------------
ipcMain.on(IPC.SHUTDOWN_NOW, quitAppNow);

ipcMain.on(IPC.SHUTDOWN, quitApp);

ipcMain.on(IPC.EXEC, exec);

ipcMain.on(IPC.BACKUP, backupData);

ipcMain.on(IPC.LOCK_SCREEN, () => {
  if (isLocked) {
    return;
  }

  try {
    lockscreen();
  } catch (e) {
    errorHandler(e);
  }
});

ipcMain.on(IPC.SET_PROGRESS_BAR, (ev, {progress, mode}) => {
  if (mainWin) {
    mainWin.setProgressBar(Math.min(Math.max(progress, 0), 1), {mode});
  }
});


ipcMain.on(IPC.REGISTER_GLOBAL_SHORTCUTS_EVENT, (ev, cfg) => {
  registerShowAppShortCuts(cfg);
});

ipcMain.on(IPC.JIRA_SETUP_IMG_HEADERS, (ev, jiraCfg: JiraCfg) => {
  setupRequestHeadersForImages(jiraCfg);
});

ipcMain.on(IPC.JIRA_MAKE_REQUEST_EVENT, (ev, request) => {
  sendJiraRequest(request);
});

ipcMain.on(IPC.GIT_LOG, (ev, cwd) => {
  getGitLog(cwd);
});

ipcMain.on(IPC.SHOW_OR_FOCUS, () => {
  showOrFocus(mainWin);
});

// HELPER FUNCTIONS
// ----------------
function createIndicator() {
  initIndicator({
    app,
    showApp,
    quitApp,
    IS_MAC,
    IS_LINUX,
    IS_GNOME,
    ICONS_FOLDER,
  });
}

function createMainWin() {
  // mainWin = createWindow({
  //   app,
  //   IS_DEV,
  //   ICONS_FOLDER,
  //   IS_MAC,
  //   quitApp,
  //   nestedWinParams,
  //   // TODO fix
  //   // indicatorMod,
  // });
  // initGoogleAuth();
  setTimeout(() => showAwesomeBar(), 300);
}

function registerShowAppShortCuts(cfg: KeyboardConfig) {
  return;
  // unregister all previous
  globalShortcut.unregisterAll();
  const GLOBAL_KEY_CFG_KEYS: (keyof KeyboardConfig)[] = [
    'globalShowHide',
    'globalToggleTaskStart',
    'globalAddNote',
    'globalAddTask',
  ];

  if (cfg) {
    Object.keys(cfg)
      .filter((key: (keyof KeyboardConfig)) => GLOBAL_KEY_CFG_KEYS.includes(key))
      .forEach((key) => {
        let actionFn: () => void;
        const shortcut = cfg[key];

        switch (key) {
          case 'globalShowHide':
            actionFn = () => {
              if (mainWin.isFocused()) {
                mainWin.hide();
              } else {
                showOrFocus(mainWin);
              }
            };
            break;

          case 'globalToggleTaskStart':
            actionFn = () => {
              mainWin.webContents.send(IPC.TASK_TOGGLE_START);
            };
            break;

          case 'globalAddNote':
            actionFn = () => {
              showOrFocus(mainWin);
              mainWin.webContents.send(IPC.ADD_NOTE);
            };
            break;

          case 'globalAddTask':
            actionFn = () => {
              showOrFocus(mainWin);
              // NOTE: delay slightly to make sure app is ready
              mainWin.webContents.send(IPC.ADD_TASK);
            };
            break;
        }

        if (shortcut && shortcut.length > 0) {
          const ret = globalShortcut.register(shortcut, actionFn) as unknown;
          if (!ret) {
            errorHandler('Global Shortcut registration failed: ' + shortcut, shortcut);
          }
        }
      });
  }
}

function showApp() {
  showOrFocus(mainWin);
}

function quitApp() {
  mainWin.webContents.send(IPC.ON_BEFORE_QUIT);
}

function quitAppNow() {
  // tslint:disable-next-line
  appIN.isQuiting = true;
  appIN.quit();
}

function showOrFocus(passedWin) {
  // default to main win
  const win = passedWin || mainWin;

  // sometimes when starting a second instance we get here although we don't want to
  if (!win) {
    // info('special case occurred when showOrFocus is called even though, this is a second instance of the app');
    return;
  }

  if (win.isVisible()) {
    win.focus();
  } else {
    win.show();
  }

  // focus window afterwards always
  setTimeout(() => {
    win.focus();
  }, 60);
}

function exec(ev, command) {
  console.log('running command ' + command);
  const execIN = require('child_process').exec;
  execIN(command, (error) => {
    if (error) {
      errorHandler(error);
    }
  });
}

