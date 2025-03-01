# Whispering - Electron App

This is the Electron version of the Whispering application, converted from Tauri.

## Development

To run the app in development mode:

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev
```

This will start both the Vite development server and the Electron app. The Electron app will connect to the Vite dev server.

## Building for Production

To build the app for production:

```bash
# Build the web assets and package the Electron app
pnpm build:electron
```

This will create distributable packages in the `dist-electron` directory.

## Project Structure

- `main.js` - The Electron main process file
- `src/` - The Svelte application code
- `build/` - The built Svelte application (after running `pnpm build`)
- `dist-electron/` - The packaged Electron applications (after running `pnpm build:electron`)

## Configuration

The Electron build configuration is defined in the `build` section of `package.json`. You can customize this to adjust how the app is packaged.

## Migrated From Tauri

This application was migrated from Tauri to Electron. The following changes were made:

1. Removed Tauri dependencies and configurations
2. Added Electron and electron-builder
3. Created the main.js file for Electron
4. Updated package.json with Electron scripts and configurations
5. Adjusted the Svelte and Vite configurations for Electron compatibility