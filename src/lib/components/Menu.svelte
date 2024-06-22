<svelte:options accessors={true} />

<script context="module" lang="ts">
	export const getMenuKey = Symbol("MENU");
</script>

<script lang="ts">
	type T = $$Generic;

	import { writable } from "svelte/store";
	import { slide } from "svelte/transition";
	import { setContext, tick, onDestroy } from "svelte";

	import "@material/web/textfield/filled-text-field";
	import ArrowDropDownIcon from "./icons/ArrowDropDownIcon.svelte";

	export let _class = "";
	export { _class as class };
	export let label = "";
	export let error = false;
	export let errorText = "";
	export let value = writable<T>();

	let selectedHeadline = "";

	export function getValue(): [T, string] {
		return [$value, selectedHeadline];
	}
	export function setValue(newValue: T, newHeadline: string): void {
		$value = newValue;
		selectedHeadline = newHeadline;
	}
	export function clear(): void {
		$value = undefined as T;
		selectedHeadline = "";
	}

	let expanded = false;
	export function expandItems() {
		expanded = true;
	}
	export function hideItems() {
		expanded = false;
	}

	let width: number = 0;

	// Show children elements to the component
	// So they can set default value if any of them is selected
	onDestroy(
		value.subscribe(async () => {
			expandItems();
			await tick();
			hideItems();
		}),
	);

	setContext(getMenuKey, { getValue, setValue, hideItems });
</script>

<div class="menu {_class}" bind:clientWidth={width} class:expanded>
	<md-filled-text-field
		{error}
		error-text={errorText}
		on:click={expandItems}
		{label}
		readonly
		class="menu-selected-item"
		value={selectedHeadline}
	>
		<ArrowDropDownIcon slot="trailing-icon" />
	</md-filled-text-field>

	{#if expanded}
		<div class="menu-items-backdrop" on:click|self={hideItems} />
		<div transition:slide={{ duration: 200 }} style:width="{width}px" class="menu-items">
			<slot />
		</div>
	{/if}
</div>

<style>
	.menu {
		position: relative;

		user-select: none;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;

		&.expanded {
			& > .menu-selected-item {
				& > [slot="trailing-icon"] {
					transform: rotate(180deg);
				}
			}
		}

		& > .menu-selected-item {
			width: 100%;

			/** Cursor fix, since we can't just specify it */
			&::after {
				content: "";
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
			}

			& > [slot="trailing-icon"] {
				transition: transform 150ms var(--md-transition-timing-function);
			}
		}

		& > .menu-items-backdrop {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			cursor: auto;
			z-index: 5;
		}

		& > .menu-items {
			/* 
			Position has to be fixed, because we want it to be overlayed no matter the container height/overflow settings
			Because of this, we have to set width to .menu's width manually, as fixed does not care about parent's dimensions
			*/
			position: fixed;
			height: max-content;
			z-index: 6;

			display: flex;
			flex-direction: column;

			background-color: var(--md-sys-color-surface-container);
			color: var(--md-sys-color-on-surface);

			padding-block: 8px;
			border-radius: 4px;
		}
	}
</style>
