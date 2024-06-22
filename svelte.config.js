import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// We use static adapter, so it's just a simple SPA
		adapter: adapter({
			fallback: "404.html",
		}),
		paths: {
			relative: true,
		},
	},
};

export default config;
