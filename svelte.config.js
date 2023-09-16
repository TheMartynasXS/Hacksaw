import adapter from '@ptkdev/sveltekit-electron-adapter';
import adapterNode from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapterNode(),
		alias: {
			'components': './src/components',
			'src': './src',
		}
	}
};

export default config;
