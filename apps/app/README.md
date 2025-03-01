# Whispering - Electron App

This is the Electron version of the Whispering application, converted from Tauri.

## Features

- Desktop application for recording, transcribing, and transforming audio
- Built with Svelte/SvelteKit and Electron
- Cross-platform compatibility (Windows, macOS, Linux)
- Seamless Tauri-to-Electron compatibility layer

## Getting Started

### Development

To run the app in development mode:

```bash
# Install dependencies
pnpm install

# Install Electron dependencies
chmod +x install-electron-deps.sh
./install-electron-deps.sh

# Run in development mode
BUILD_TARGET=electron pnpm dev
```

This will start both the Vite development server and the Electron app, with the Electron app connecting to the Vite dev server.

### Production Build

To build the app for production:

```bash
# Build the web assets and package the Electron app
BUILD_TARGET=electron pnpm build:electron
```

This will create distributable packages in the `dist-electron` directory.

## Project Structure

- `main.cjs` - The Electron main process file
- `preload.cjs` - Secure bridge between Electron processes
- `src/` - The Svelte application code
  - `src/lib/electronAdapter.ts` - Electron API adapter
  - `src/lib/tauri-shim.ts` - Tauri API compatibility layer
- `build/` - The built Svelte application (after running `pnpm build`)
- `dist-electron/` - The packaged Electron applications (after running `pnpm build:electron`)

## Tauri to Electron Migration

This application was migrated from Tauri to Electron. The key components of this migration are:

1. **Compatibility Layer**: The `tauri-shim.ts` provides mock implementations of Tauri APIs to prevent import errors, while the `electronAdapter.ts` provides a unified API surface.

2. **IPC Communication**: Secure communication between the renderer process and main process is implemented via the preload script.

3. **Configuration**: The build process has been adapted to work with Electron through modifications to SvelteKit and Vite configurations.

## API Surface

The application exposes several modules through the `electronAdapter.ts`:

- `fs`: File system operations
- `clipboard`: Clipboard operations
- `dialog`: Dialog operations
- `notification`: Notification operations
- `windowManager`: Window management
- `shell`: External operations (opening URLs)
- `platform`: Platform detection

## Configuration

The Electron build configuration is defined in the `build` section of `package.json`. You can customize this to adjust how the app is packaged.

## Contributing

Please see the [MIGRATION.md](./MIGRATION.md) file for detailed information about the migration process and how to contribute to further Electron development.
