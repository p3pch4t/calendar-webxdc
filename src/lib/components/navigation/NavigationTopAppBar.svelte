<nav id="top-app-bar">
	<section class="leading-items-container">
		<slot name="leading-items" />
	</section>
	<section class="headline-container">
		<h1 class="headline md-typescale-title-large">
			<slot name="headline" />
		</h1>
	</section>
	<section class="trailing-items-container">
		<slot name="trailing-items" />
	</section>
</nav>

<style>
	#top-app-bar {
		position: relative;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;

		gap: 8px;
		padding: 8px;

		color: var(--md-sys-color-on-surface);
		background-color: var(--md-sys-color-surface);
		transition: var(--md-default-transition);

		& > .leading-items-container,
		& > .trailing-items-container {
			display: flex;
			justify-content: center;
			align-items: center;
		}

		& > .headline-container {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);

			width: max-content;

			& > .headline {
				display: flex;
				align-items: center;
				justify-content: center;
				text-align: center;
				margin: 0;
			}
		}
	}
</style>
