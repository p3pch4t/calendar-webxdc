<script>
	import "@material/web/list/list";
</script>

<md-list class="navigation-list">
	<slot />
</md-list>

<style>
	.navigation-list {
		--md-list-container-color: transparent;
		margin: 0;
		padding: 0;
	}
</style>
