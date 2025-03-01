import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

const isElectron = process.env.BUILD_TARGET === 'electron';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		outDir: 'build',
		emptyOutDir: true,
		target: isElectron ? 'chrome110' : 'modules',
	},
	server: {
		port: 5173,
		strictPort: true,
		watch: {
			usePolling: true
		},
	},
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib'),
			'@tauri-apps/api/core': path.resolve(__dirname, './src/lib/tauri-shim.ts'),
			'@tauri-apps/api/app': path.resolve(__dirname, './src/lib/tauri-shim.ts'),
			'@tauri-apps/api/window': path.resolve(__dirname, './src/lib/tauri-shim.ts'),
			'@tauri-apps/api/menu': path.resolve(__dirname, './src/lib/tauri-shim.ts'),
			'@tauri-apps/api/path': path.resolve(__dirname, './src/lib/tauri-shim.ts'),
			'@tauri-apps/api/tray': path.resolve(__dirname, './src/lib/tauri-shim.ts'),
			'@tauri-apps/plugin-os': path.resolve(__dirname, './src/lib/tauri-shim.ts'),
			'@tauri-apps/plugin-global-shortcut': path.resolve(__dirname, './src/lib/tauri-shim.ts'),
			'@tauri-apps/plugin-process': path.resolve(__dirname, './src/lib/tauri-shim.ts'),
			'@tauri-apps/plugin-http': path.resolve(__dirname, './src/lib/tauri-shim.ts'),
			'@tauri-apps/plugin-dialog': path.resolve(__dirname, './src/lib/tauri-shim.ts'),
			'@tauri-apps/plugin-notification': path.resolve(__dirname, './src/lib/tauri-shim.ts'),
			'@tauri-apps/plugin-clipboard-manager': path.resolve(__dirname, './src/lib/tauri-shim.ts'),
			'@tauri-apps/plugin-fs': path.resolve(__dirname, './src/lib/tauri-shim.ts')
		}
	},
	optimizeDeps: {
		exclude: isElectron ? [] : ['electron']
	}
});
