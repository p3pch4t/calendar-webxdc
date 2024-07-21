declare global {
	declare module "~icons/*" {
		import { SvelteComponent } from "svelte";
		import type { SvelteHTMLElements } from "svelte/elements";

		export default class extends SvelteComponent<SvelteHTMLElements["svg"]> {}
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		interface PageState {
			showEventPreview?: boolean;
		}
		// interface Platform {}
	}
}

export {};
