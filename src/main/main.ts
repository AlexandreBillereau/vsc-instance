/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import process from 'process';
import VSCodeOpener from './vs-code-opener';
import { InstanceManager } from './features/editor-instances/managers/instance-manager';
import { EditorInstanceConfig } from './features/editor-instances/types';
import { InstanceInfo } from './features/editor-instances/managers/instance-info';
import { MarketplaceService } from './features/editor-instances/services/marketplace-service';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.handle('open-editor', () => {
  // Copier le PATH du système
  // Sur Windows
  VSCodeOpener.create().open();
});

// Créer une instance du manager
const instanceManager = new InstanceManager();

// Initialiser le manager au démarrage
instanceManager.initialize().catch(error => {
  console.error('Erreur lors de l\'initialisation du manager:', error);
});

// Exposer les méthodes via IPC
ipcMain.handle('list-editor-instances', () => {
  return instanceManager.listInstances();
});

ipcMain.handle('create-editor-instance', (event, config: EditorInstanceConfig) => {
  return instanceManager.createInstance(config);
});

ipcMain.handle('open-editor-instance', (event, instanceId: string) => {
  return instanceManager.openInstance(instanceId);
});

ipcMain.handle('delete-editor-instance', (event, instanceId: string) => {
  return instanceManager.deleteInstance(instanceId);
});

// Nouveau handler pour récupérer les extensions
ipcMain.handle('get-instance-extensions', async (event, instanceId: string) => {
  const instance = instanceManager.listInstances().find(i => i.id === instanceId);
  if (!instance) {
    throw new Error(`Instance ${instanceId} not found`);
  }

  const instanceInfo = new InstanceInfo(instance.extensionsDir);
  const extensions = await instanceInfo.getInstalledExtensions();
  
  // Récupérer les détails pour chaque extension
  const extensionsWithDetails = await Promise.all(
    extensions.map(ext => instanceInfo.getExtensionDetails(ext))
  );

  return extensionsWithDetails;
});

ipcMain.handle('open-folder', async (_event, path: string) => {
  try {
    await shell.openPath(path);
  } catch (error) {
    console.error('Error opening folder:', error);
    throw error;
  }
});

// Ajouter ce nouveau handler
ipcMain.handle('search-extensions', async (_event, query: string) => {
  return MarketplaceService.searchExtensions(query);
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
