/**
 * Shim for Tauri APIs to make the migration to Electron smoother
 * This file exports mock implementations of Tauri APIs to prevent import errors
 */

import { isElectron, fs, clipboard, dialog, notification } from './electronAdapter';

// Define missing types for global window object
declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, data?: any) => Promise<any>;
      send: (channel: string, data?: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
}

// Safely access the electronAPI on window
const getElectronAPI = () => {
  return (globalThis as any).window?.electronAPI;
};

// Core API
export const core = {
  invoke: async (cmd: string, args?: any) => {
    console.warn(`Tauri API invoke called with command: ${cmd}. This is not implemented in Electron.`);
    // If we're in Electron, try to handle some common cases
    if (isElectron()) {
      const electronAPI = getElectronAPI();
      if (electronAPI) {
        if (cmd === 'read_file') {
          return electronAPI.invoke('fs:readFile', args.path);
        } else if (cmd === 'write_file') {
          return electronAPI.invoke('fs:writeFile', { filePath: args.path, data: args.contents });
        } else if (cmd.includes('clipboard')) {
          return electronAPI.invoke('clipboard:' + (cmd.includes('read') ? 'read' : 'write'),
            cmd.includes('read') ? undefined : args.text);
        }
      }
    }
    return null;
  }
};

// Export invoke directly
export const invoke = core.invoke;

// App API
export const app = {
  getVersion: async () => {
    // Could be implemented by getting version from package.json
    return "6.4.3";
  },
  getName: async () => {
    return "Whispering";
  },
  getTauriVersion: async () => {
    return "Electron";
  }
};

// Window Size class for Tauri
export class LogicalSize {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}

// Window API
export const window = {
  appWindow: {
    setTitle: (title: string) => {
      // Could be implemented using Electron's Window API
      console.warn(`Window setTitle not implemented in Electron shim`);
    },
    onFocusChanged: (callback: (focused: boolean) => void) => {
      console.warn(`Window onFocusChanged not implemented in Electron shim`);
      return { dispose: () => {} };
    },
    setSize: async (size: LogicalSize) => {
      console.warn(`Window setSize not implemented in Electron shim`);
    }
  }
};

// Window getCurrentWindow
export const getCurrentWindow = () => {
  return window.appWindow;
};

// Menu API
export const menu = {
  // Mock implementations
};

// Menu classes
export class Menu {
  items: any[] = [];

  constructor(items: any[] = []) {
    this.items = items;
  }

  async show() {
    console.warn("Menu.show not implemented in Electron shim");
  }
}

export class MenuItem {
  label: string;

  constructor(options: any) {
    this.label = options.label || '';
  }
}

export class CheckMenuItem extends MenuItem {
  checked: boolean;

  constructor(options: any) {
    super(options);
    this.checked = options.checked || false;
  }
}

// Path API
export const path = {
  appConfigDir: async () => {
    return '/config';
  },
  resolve: async (path: string) => {
    return path;
  },
  join: async (...parts: string[]) => {
    return parts.join('/');
  }
};

export const resolveResource = async (resource: string) => {
  if (isElectron()) {
    // In Electron, resources are in the app's root directory
    return `${globalThis.location.origin}/${resource}`;
  }
  return `/resources/${resource}`;
};

// Tray API
export const tray = {
  // Mock implementations
};

export class TrayIcon {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  async destroy() {
    console.warn("TrayIcon.destroy not implemented in Electron shim");
  }

  async setTitle(title: string) {
    console.warn("TrayIcon.setTitle not implemented in Electron shim");
  }

  async setMenu(menu: any) {
    console.warn("TrayIcon.setMenu not implemented in Electron shim");
  }
}

// Process API
export const exit = (code = 0) => {
  console.warn(`Process exit(${code}) called, not implemented in Electron shim`);
};

// Clipboard API
export const writeText = async (text: string) => {
  if (isElectron()) {
    return await clipboard.writeText(text);
  }
  console.warn("Clipboard writeText not implemented in Electron shim");
  return false;
};

// OS API
export const type = async () => {
  // Could detect OS in Electron
  return navigator.platform.toLowerCase().includes('win')
    ? 'Windows'
    : navigator.platform.toLowerCase().includes('mac')
      ? 'macOS'
      : 'Linux';
};

// Dialog API
export const save = async (options: any) => {
  if (isElectron()) {
    return await dialog.open({
      ...options,
      properties: ['saveFile']
    });
  }
  console.warn("Dialog save not implemented in Electron shim");
  return null;
};

// FS API
export const writeFile = async (path: string, contents: any) => {
  if (isElectron()) {
    return await fs.writeTextFile(path, contents);
  }
  console.warn("FS writeFile not implemented in Electron shim");
  return false;
};

// HTTP API
export const fetch = async (url: string, options?: any) => {
  // Use the global fetch API
  return await globalThis.fetch(url, options);
};

// Notification API
export const active = () => {
  console.warn("Notification.active not implemented in Electron shim");
  return [];
};

export const isPermissionGranted = async () => {
  if ('Notification' in window) {
    return Notification.permission === 'granted';
  }
  return false;
};

export const removeActive = async (id: string) => {
  console.warn("Notification.removeActive not implemented in Electron shim");
};

export const requestPermission = async () => {
  if ('Notification' in window) {
    return await Notification.requestPermission();
  }
  return 'denied';
};

export const sendNotification = async (options: any) => {
  if (isElectron()) {
    return await notification.show({
      title: options.title,
      body: options.body
    });
  } else if ('Notification' in window) {
    new Notification(options.title, { body: options.body });
    return true;
  }
  return false;
};

// Export modules to match Tauri's package structure
export default {
  app,
  core,
  window,
  menu,
  path,
  tray,
  invoke,
  getCurrentWindow,
  Menu,
  MenuItem,
  CheckMenuItem,
  TrayIcon,
  exit,
  writeText,
  type,
  save,
  writeFile,
  fetch,
  active,
  isPermissionGranted,
  removeActive,
  requestPermission,
  sendNotification,
  resolveResource,
  LogicalSize
};