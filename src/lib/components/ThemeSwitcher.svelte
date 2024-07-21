<script context="module" lang="ts">
	import { writable } from "svelte/store";
	import { browser } from "$app/environment";

	let darkMode = writable(true);
	if (browser) {
		const savedDarkMode = localStorage.getItem("dark-mode");
		if (savedDarkMode) {
			darkMode.set(JSON.parse(savedDarkMode));
		} else {
			const prefersLightMode = window.matchMedia("(prefers-color-scheme: light)");
			if (prefersLightMode.matches) {
				darkMode.set(false);
			}
		}

		darkMode.subscribe((darkMode) => {
			document?.documentElement.classList.toggle("dark", darkMode);
			localStorage.setItem("dark-mode", String(darkMode));
		});
	}
</script>

<script lang="ts">
	import DarkModeIcon from "~icons/material-symbols/dark-mode-outline-rounded";
	import LightModeIcon from "~icons/material-symbols/light-mode-outline-rounded";

	function toggleTheme() {
		$darkMode = !$darkMode;
	}
</script>

<md-icon-button aria-label="Toggle theme" on:click={toggleTheme}>
	{#if $darkMode}
		<LightModeIcon />
	{:else}
		<DarkModeIcon />
	{/if}
</md-icon-button>
