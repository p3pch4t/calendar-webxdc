<script lang="ts">
	import { fly } from "svelte/transition";

	import "@material/web/list/list";
	import "@material/web/divider/divider";
	import NavigationDrawerButton from "./NavigationDrawerButton.svelte";
	import KeyboardArrowArrowDown from "~icons/material-symbols/keyboard-arrow-down-rounded";

	export let title: string;
	let expanded = false;

	function toggleList() {
		expanded = !expanded;
	}
</script>

<div class="navigation-expandable-list" class:expanded>
	<NavigationDrawerButton on:click={toggleList} selected={expanded}>
		<h2 class="section-header md-typescale-title-small">{title}</h2>
		<KeyboardArrowArrowDown slot="trailing-icon" class="expand-icon" />
	</NavigationDrawerButton>

	{#if expanded}
		<md-list
			class="navigation-list"
			transition:fly={{
				delay: 0,
				duration: 250,
				x: 0,
				y: -50,
			}}
		>
			<slot />
		</md-list>
	{/if}
</div>

<style>
	.navigation-expandable-list {
		display: contents;

		& > .navigation-drawer-button {
			--md-text-button-container-shape: 8px;

			& > .text > .expand-icon {
				transition: transform 150ms;
			}
		}

		&.expanded {
			& > .navigation-drawer-button {
				& > .text > .expand-icon {
					transform: rotate(180deg);
				}
			}
		}

		& > .navigation-list {
			--md-list-container-color: transparent;
			padding: 0;
			padding-right: 8px;
		}
	}
</style>
