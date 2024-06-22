<script>
	import "@material/web/list/list-item";
</script>

<md-list-item class="navigation-list-item">
	<slot slot="headline" name="headline" />
	<slot slot="trailing-supporting-text" name="trailing-supporting-text" />
	<slot />
</md-list-item>

<style>
	.navigation-list-item {
		margin: 0;
		padding: 0;
		height: 48px;
		--md-list-item-top-space: 0;
		--md-list-item-bottom-space: 0;
		--md-list-item-left-space: 0;
		--md-list-item-trailing-space: 0;
	}
</style>
