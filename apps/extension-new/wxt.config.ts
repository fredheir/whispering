import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
	manifest: {
		name: 'Whispering',
		version: '6.4.3',
		description:
			"Seamlessly integrate speech-to-text transcriptions on ChatGPT and anywhere on the web. Powered by OpenAI's Whisper API.",
		author: {
			email: 'whispering@bradenwong.com',
		},
		permissions: [
			'storage',
			'activeTab',
			'scripting',
			'tabs',
			'clipboardWrite',
			'notifications',
			'https://api.openai.com/',
		],
		host_permissions: [
			'https://api.openai.com/',
			'https://*.openai.com/',
			'http://localhost:5173/*',
			'http://localhost:4173/*',
			'https://*/',
		],
		content_scripts: [
			{
				matches: ['https://chatgpt.com/*', 'https://*.openai.com/*'],
			},
		],
		commands: {
			toggleRecording: {
				suggested_key: {
					default: 'Ctrl+Shift+X',
					mac: 'Command+Shift+X',
				},
				description: 'Toggle recording',
			},
		},
		externally_connectable: {
			matches: [
				'http://localhost:5173/*',
				'https://whispering.bradenwong.com/*',
			],
		},
	},
	srcDir: 'src',
	extensionApi: 'chrome',
	modules: ['@wxt-dev/module-svelte'],
});
