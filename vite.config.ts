import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, type Plugin } from "vite";
import icons from "unplugin-icons/vite";

import { exec } from "node:child_process";

function buildWebxdc(fileName: string, exclude: string[] = []): Plugin {
	return {
		name: "webxdc-build",
		async closeBundle() {
			await new Promise<void>((resolve) =>
				exec(
					`cd build && zip -9 --recurse-paths "${fileName}" --exclude ${exclude} -- *`,
					(error, stdout, stderr) => {
						if (error || stderr) console.error(error ?? stderr);
						console.log(stdout);
						resolve();
					},
				),
			);
		},
	};
}

export default defineConfig({
	plugins: [
		sveltekit(),
		icons({
			compiler: "svelte",
			webComponents: {
				autoDefine: true,
				iconPrefix: "md-icon",
				shadow: true,
			},
			defaultClass: "icon",
		}),
		buildWebxdc("calendar.xdc", ["webxdc.js", "webxdc.d.ts", '"./*.sh"', '"./*.xdc"']),
	],
	server: { open: "/index.html" },
});
