const { app, BrowserWindow, ipcMain, dialog, clipboard, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // In production, load the built app
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'build/index.html'));
  } else {
    // In development, load from the dev server
    const startUrl = url.format({
      protocol: 'http:',
      host: 'localhost:5173',
      pathname: '/',
      slashes: true
    });

    mainWindow.loadURL(startUrl);

    // Open DevTools in development
    mainWindow.webContents.openDevTools();

    // Handle failed loading attempts
    mainWindow.webContents.on('did-fail-load', () => {
      console.log('Failed to load URL, retrying...');
      setTimeout(() => {
        mainWindow.loadURL(startUrl);
      }, 1000);
    });
  }

  // Handle window closing
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // Set up IPC handlers
  setupIPC();

  app.on('activate', function () {
    // On macOS re-create a window when the dock icon is clicked and no other windows are open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Set up IPC communication
function setupIPC() {
  // Dialog operations
  ipcMain.handle('dialog:openFile', async (event, options) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(options);
    if (canceled) return null;
    return filePaths[0];
  });

  ipcMain.handle('dialog:saveFile', async (event, options) => {
    const { canceled, filePath } = await dialog.showSaveDialog(options);
    if (canceled) return null;
    return filePath;
  });

  ipcMain.handle('dialog:showMessage', async (event, options) => {
    return await dialog.showMessageBox(options);
  });

  // Clipboard operations
  ipcMain.handle('clipboard:read', () => {
    return clipboard.readText();
  });

  ipcMain.handle('clipboard:write', (event, text) => {
    clipboard.writeText(text);
    return true;
  });

  ipcMain.handle('clipboard:readImage', () => {
    const image = clipboard.readImage();
    return image.isEmpty() ? null : image.toDataURL();
  });

  ipcMain.handle('clipboard:writeImage', (event, dataURL) => {
    try {
      const image = nativeImage.createFromDataURL(dataURL);
      clipboard.writeImage(image);
      return true;
    } catch (error) {
      console.error('Error writing image to clipboard:', error);
      return false;
    }
  });

  // Notification operations
  ipcMain.handle('notification:show', (event, options) => {
    try {
      const notification = new Notification(options);
      notification.show();
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  });

  // App operations
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:getPath', (event, name) => {
    try {
      return app.getPath(name);
    } catch (error) {
      console.error(`Error getting path ${name}:`, error);
      return null;
    }
  });

  // Window operations
  ipcMain.handle('window:setTitle', (event, title) => {
    if (mainWindow) {
      mainWindow.setTitle(title);
      return true;
    }
    return false;
  });

  ipcMain.handle('window:setSize', (event, { width, height }) => {
    if (mainWindow) {
      mainWindow.setSize(width, height);
      return true;
    }
    return false;
  });

  ipcMain.handle('window:getSize', () => {
    if (mainWindow) {
      return mainWindow.getSize();
    }
    return null;
  });

  ipcMain.on('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  // File system operations
  ipcMain.handle('fs:readFile', async (event, filePath) => {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  });

  ipcMain.handle('fs:writeFile', async (event, { filePath, data }) => {
    try {
      fs.writeFileSync(filePath, data);
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  });

  ipcMain.handle('fs:readDir', async (event, dirPath) => {
    try {
      return fs.readdirSync(dirPath);
    } catch (error) {
      console.error('Error reading directory:', error);
      return null;
    }
  });

  ipcMain.handle('fs:exists', (event, path) => {
    try {
      return fs.existsSync(path);
    } catch (error) {
      console.error('Error checking if file exists:', error);
      return false;
    }
  });

  ipcMain.handle('fs:mkdir', (event, path) => {
    try {
      fs.mkdirSync(path, { recursive: true });
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      return false;
    }
  });
}