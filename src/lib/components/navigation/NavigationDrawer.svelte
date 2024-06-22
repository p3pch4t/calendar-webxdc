<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import { cubicOut } from "svelte/easing";
	import { onMount } from "svelte";

	export let headline: string;

	let open = false;
	export function show(): void {
		open = true;
	}
	export function hide(): void {
		open = false;
	}

	onMount(() => {
		const hasTouch = navigator.maxTouchPoints > 0;

		let touchEventListener: (e: TouchEvent) => void;
		let i: NodeJS.Timeout;
		let lastTouch: number;
		if (hasTouch) {
			touchEventListener = (event: TouchEvent) => {
				if (event.touches.length > 1) return;

				const [touch] = event.touches;

				if (!lastTouch) {
					lastTouch = touch.pageX;
					return;
				}

				const diff = touch.pageX - lastTouch;

				const MIN_DIFF = document.body.clientWidth / 4;
				if (diff < -MIN_DIFF && open) {
					hide();
				} else if (diff > MIN_DIFF && !open) {
					show();
				}

				clearTimeout(i);
				i = setTimeout(() => {
					lastTouch = 0;
				}, 200);
			};

			document.addEventListener("touchmove", touchEventListener);
		}

		if (hasTouch)
			return () => {
				document.removeEventListener("touchmove", touchEventListener);
			};
	});
</script>

{#if open}
	<div id="navigation-drawer-container">
		<div id="navigation-modal-bg" transition:fade={{ duration: 300 }} on:click={hide} />

		<div>
			<slot name="associated" />
		</div>

		<nav
			id="navigation-drawer"
			transition:fly={{
				x: "-100%",
				opacity: 50,
				duration: 300,
				easing: cubicOut,
			}}
		>
			<h1 class="headline md-typescale-title-medium">{headline}</h1>

			<slot />
		</nav>
	</div>
{/if}

<style>
	#navigation-drawer-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;

		z-index: 10;

		& > #navigation-modal-bg {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: #00000060;
		}

		& > #navigation-drawer {
			position: fixed;
			top: 0;
			left: 0;
			height: 100%;
			width: 80%;
			max-width: 350px;

			overflow-x: hidden;
			overflow-y: auto;

			display: flex;
			flex-direction: column;

			padding: 12px;
			border-radius: 0 16px 16px 0;

			background-color: var(--md-sys-color-surface-container-low);
			color: var(--md-sys-color-on-surface-variant);

			& > .headline,
			& > .section-header {
				margin: 0;
				padding: 0 8px 8px 16px;
			}

			& > .headline {
				padding-bottom: 32px;
			}

			& > hr {
				height: 1px;
				padding-top: 8px;
				margin-bottom: 16px;
				width: calc(100% - 32px);
				border: none;
				border-bottom: 1px solid var(--md-sys-color-outline-variant);
			}
		}
	}
</style>
