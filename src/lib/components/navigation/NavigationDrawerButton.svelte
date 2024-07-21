<script lang="ts">
	import "@material/web/button/filled-tonal-button";
	import "@material/web/button/text-button";

	export let selected = false;
</script>

<md-text-button class:selected class="navigation-drawer-button" on:click {...$$restProps}>
	<span class="text md-typescale-label-large" class:md-typescale-label-large-prominent={selected}>
		<slot name="icon" />
		<slot />
		<slot name="trailing-icon" />
	</span>
</md-text-button>

<style>
	.navigation-drawer-button {
		position: relative;

		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		height: 56px;

		transition: var(--md-default-transition);

		--md-text-button-label-text-color: var(--md-sys-color-on-surface-variant);

		&.selected {
			background-color: var(--md-sys-color-primary);
			--md-text-button-label-text-color: var(--md-sys-color-on-primary);
			--md-text-button-focus-label-text-color: var(--md-sys-color-on-primary);
			--md-text-button-hover-label-text-color: var(--md-sys-color-on-primary);
			--md-text-button-pressed-label-text-color: var(--md-sys-color-on-primary);

			& > .text {
				& > [slot="icon"] {
					stroke-width: 1.5px;
				}
			}
		}

		& > .text {
			position: absolute;
			left: 24px;
			inset-block: 50%;
			width: 100%;

			display: flex;
			justify-content: left;
			align-items: center;

			& > [slot="icon"] {
				transition: stroke-width 150ms ease-in;
				margin-right: 4px;
				stroke: currentColor;
			}

			& > [slot="trailing-icon"] {
				margin-left: auto;
				margin-right: 48px;
			}
		}

		&:hover {
			& > .text {
				& > [slot="icon"] {
					stroke-width: 1.5px;
				}
			}
		}
	}
</style>
