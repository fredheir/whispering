# Migration Guide: Tauri to Electron

This document outlines the steps taken to migrate the Whispering application from Tauri to Electron.

## Changes Made

1. Removed Tauri dependencies and configurations
2. Added Electron and electron-builder dependencies
3. Created Electron main process file (`main.js`)
4. Added preload script for secure IPC communication (`preload.js`)
5. Created Electron API adapter (`src/lib/electronAdapter.ts`) for compatibility
6. Updated package.json configuration for Electron
7. Updated build process

## Using the Electron Adapter

The Electron adapter (`src/lib/electronAdapter.ts`) provides a compatibility layer that allows the app to use a similar API for desktop integration features. To use it:

```typescript
import { fs, clipboard, dialog, notification, isElectron } from '$lib/electronAdapter';

// Check if running in Electron
if (isElectron()) {
  console.log('Running in Electron');
}

// File operations
const readFile = async () => {
  try {
    const content = await fs.readTextFile('/path/to/file');
    console.log(content);
  } catch (error) {
    console.error('Error reading file:', error);
  }
};

// Clipboard operations
const copyToClipboard = async (text) => {
  try {
    await clipboard.writeText(text);
    console.log('Copied to clipboard');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
  }
};

// Dialog operations
const openFileDialog = async () => {
  try {
    const filePath = await dialog.open({
      title: 'Select a file',
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'wav'] }
      ]
    });

    if (filePath) {
      console.log('Selected file:', filePath);
    }
  } catch (error) {
    console.error('Error opening file dialog:', error);
  }
};

// Notifications
const showNotification = async () => {
  await notification.show({
    title: 'Hello',
    body: 'This is a notification'
  });
};
```

## Steps to Replace Tauri Code

1. Replace imports:
   ```typescript
   // Old Tauri imports
   import { fs } from '@tauri-apps/api';

   // New Electron imports
   import { fs } from '$lib/electronAdapter';
   ```

2. Update function calls (most should work with minimal changes)

3. For features not yet supported in the adapter, add them to the adapter following the existing pattern.

## Building and Running

- Development: `pnpm dev`
- Production: `pnpm build:electron`

## Known Issues

1. Node.js version compatibility: This project requires Node.js v18.18.0 or later due to dependency constraints.
2. Permissions: Electron has a different security model than Tauri. Ensure you're handling permissions appropriately.
3. Platform-specific code: Some platform-specific Tauri code may need to be adapted for Electron.

## Next Steps

1. Test the application thoroughly in Electron
2. Implement additional APIs in the adapter as needed
3. Optimize build and packaging process
4. Review security practices for Electron-specific concerns