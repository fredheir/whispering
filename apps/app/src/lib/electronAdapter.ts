/**
 * Electron API adapter
 *
 * This module provides a compatibility layer for Electron APIs that were previously
 * using Tauri APIs. It allows the application to switch between backends with minimal
 * code changes.
 */

// Define types for the Electron API
declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, data?: any) => Promise<any>;
      send: (channel: string, data?: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
      openExternal: (url: string) => void;
    };
    electronAppInfo?: {
      isElectron: boolean;
      platform: string;
      arch: string;
      versions: {
        electron: string;
        chrome: string;
        node: string;
      };
    };
  }
}

// Check if we're running in an Electron environment
export const isElectron = (): boolean => {
  return window.electronAPI !== undefined;
};

// Get app version
export const getAppVersion = async (): Promise<string> => {
  if (isElectron()) {
    return await window.electronAPI!.invoke('app:getVersion');
  }
  return '0.0.0';
};

// Get app paths
export const getAppPath = async (name: string): Promise<string | null> => {
  if (isElectron()) {
    return await window.electronAPI!.invoke('app:getPath', name);
  }
  return null;
};

/**
 * File System operations
 */
export const fs = {
  readTextFile: async (filePath: string): Promise<string | null> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('fs:readFile', filePath);
    }
    throw new Error('Not implemented in this environment');
  },

  writeTextFile: async (filePath: string, data: string): Promise<boolean> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('fs:writeFile', { filePath, data });
    }
    throw new Error('Not implemented in this environment');
  },

  readDir: async (dirPath: string): Promise<string[] | null> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('fs:readDir', dirPath);
    }
    throw new Error('Not implemented in this environment');
  },

  exists: async (path: string): Promise<boolean> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('fs:exists', path);
    }
    throw new Error('Not implemented in this environment');
  },

  createDir: async (path: string): Promise<boolean> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('fs:mkdir', path);
    }
    throw new Error('Not implemented in this environment');
  }
};

/**
 * Clipboard operations
 */
export const clipboard = {
  readText: async (): Promise<string> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('clipboard:read');
    }
    throw new Error('Not implemented in this environment');
  },

  writeText: async (text: string): Promise<boolean> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('clipboard:write', text);
    }
    throw new Error('Not implemented in this environment');
  },

  readImage: async (): Promise<string | null> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('clipboard:readImage');
    }
    throw new Error('Not implemented in this environment');
  },

  writeImage: async (dataURL: string): Promise<boolean> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('clipboard:writeImage', dataURL);
    }
    throw new Error('Not implemented in this environment');
  }
};

/**
 * Dialog operations
 */
interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  properties?: string[];
}

interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

interface MessageDialogOptions {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
  title?: string;
  message: string;
  detail?: string;
  buttons?: string[];
  defaultId?: number;
  cancelId?: number;
}

export const dialog = {
  open: async (options: OpenDialogOptions = {}): Promise<string | null> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('dialog:openFile', options);
    }
    throw new Error('Not implemented in this environment');
  },

  save: async (options: SaveDialogOptions = {}): Promise<string | null> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('dialog:saveFile', options);
    }
    throw new Error('Not implemented in this environment');
  },

  message: async (options: MessageDialogOptions): Promise<{ response: number; checkboxChecked: boolean }> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('dialog:showMessage', options);
    }
    throw new Error('Not implemented in this environment');
  }
};

/**
 * Notification operations
 */
interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  silent?: boolean;
}

export const notification = {
  show: async (options: NotificationOptions): Promise<boolean> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('notification:show', options);
    } else {
      // Fall back to browser notifications if available
      if ('Notification' in window) {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon
        });
        return true;
      }
    }
    return false;
  }
};

/**
 * Window operations
 */
export const windowManager = {
  setTitle: async (title: string): Promise<boolean> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('window:setTitle', title);
    }
    return false;
  },

  setSize: async (width: number, height: number): Promise<boolean> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('window:setSize', { width, height });
    }
    return false;
  },

  getSize: async (): Promise<[number, number] | null> => {
    if (isElectron()) {
      return await window.electronAPI!.invoke('window:getSize');
    }
    return null;
  },

  minimize: (): void => {
    if (isElectron()) {
      window.electronAPI!.send('window:minimize');
    }
  },

  maximize: (): void => {
    if (isElectron()) {
      window.electronAPI!.send('window:maximize');
    }
  },

  close: (): void => {
    if (isElectron()) {
      window.electronAPI!.send('window:close');
    }
  }
};

/**
 * Shell operations
 */
export const shell = {
  openExternal: (url: string): void => {
    if (isElectron()) {
      window.electronAPI!.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
};

/**
 * Platform detection
 */
export const platform = {
  isWindows: (): boolean => {
    if (isElectron() && window.electronAppInfo) {
      return window.electronAppInfo.platform === 'win32';
    }
    return navigator.platform.includes('Win');
  },

  isMac: (): boolean => {
    if (isElectron() && window.electronAppInfo) {
      return window.electronAppInfo.platform === 'darwin';
    }
    return navigator.platform.includes('Mac');
  },

  isLinux: (): boolean => {
    if (isElectron() && window.electronAppInfo) {
      return window.electronAppInfo.platform === 'linux';
    }
    return navigator.platform.includes('Linux');
  }
};

export default {
  isElectron,
  getAppVersion,
  getAppPath,
  fs,
  clipboard,
  dialog,
  notification,
  windowManager,
  shell,
  platform
};