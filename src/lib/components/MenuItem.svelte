<script lang="ts">
	type T = $$Generic;
	import { getContext } from "svelte";
	import { browser } from "$app/environment";

	import "@material/web/textfield/outlined-text-field";
	import "@material/web/button/text-button";

	import Menu, { getMenuKey } from "$lib/components/Menu.svelte";

	const menu: Pick<Menu<T>, "getValue" | "setValue" | "hideItems"> = getContext(getMenuKey);

	export let value: T;
	export let selected = false;
	export let headline: string;

	if (browser) {
		const [menuValue, menuHeadline] = menu.getValue();
		if (!menuHeadline && (selected || menuValue === value)) {
			selectItem();
		}
	}

	function selectItem() {
		selected = true;
		menu.setValue(value, headline);
		menu.hideItems();
	}
</script>

<md-text-button class="menu-item" class:selected on:click={selectItem}>
	<span class="menu-item-headline md-typescale-body-large">{headline}</span>
</md-text-button>

<style>
	.menu-item {
		width: inherit;
		--md-text-button-container-shape: 0;

		&.selected {
			transition: var(--md-default-transition);
			background-color: var(--md-sys-color-primary);

			& > .menu-item-headline {
				color: var(--md-sys-color-on-primary);
			}
		}

		& > .menu-item-headline {
			position: absolute;
			left: 12px;
			top: 50%;
			transform: translateY(-50%);
			max-width: calc(100% - 24px);

			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
	}
</style>
