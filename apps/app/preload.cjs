// Preload script for Electron
// This script runs in the context of the renderer process but has access to Node.js APIs
const { contextBridge, ipcRenderer, shell } = require('electron');

/**
 * Exposes protected methods to the renderer process
 * This creates a secure bridge between the renderer process and the main process
 * without exposing the entire ipcRenderer API
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Send a message to the main process
  send: (channel, data) => {
    // Whitelist channels
    const validChannels = [
      'toMain',
      'app:minimize',
      'app:maximize',
      'app:close',
      'window:reload'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Receive a message from the main process
  receive: (channel, func) => {
    const validChannels = [
      'fromMain',
      'app:update-available',
      'app:download-progress',
      'app:update-downloaded'
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },

  // Invoke a method in the main process and receive a response
  invoke: async (channel, data) => {
    const validChannels = [
      // File system operations
      'fs:readFile',
      'fs:writeFile',
      'fs:readDir',
      'fs:exists',
      'fs:mkdir',

      // Dialog operations
      'dialog:openFile',
      'dialog:saveFile',
      'dialog:showMessage',

      // Clipboard operations
      'clipboard:read',
      'clipboard:write',
      'clipboard:readImage',
      'clipboard:writeImage',

      // Notification operations
      'notification:show',

      // App info operations
      'app:getVersion',
      'app:getPath',

      // Window operations
      'window:setTitle',
      'window:setSize',
      'window:getSize',
      'window:minimize',
      'window:maximize',
      'window:restore',
      'window:close'
    ];

    if (validChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, data);
    }

    console.warn(`Invalid IPC channel: ${channel}`);
    return null;
  },

  // Open external URLs in default browser
  openExternal: (url) => {
    if (typeof url === 'string') {
      shell.openExternal(url);
    }
  }
});

// Expose app information
contextBridge.exposeInMainWorld('electronAppInfo', {
  isElectron: true,
  platform: process.platform,
  arch: process.arch,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
});