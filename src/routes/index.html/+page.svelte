<!--
	Notice how this route is named index.html on top of the main route +page.svelte in /routes?
	This is due to webxdc forcing you to have "index.html" as a main route.
	
	Even though index.html was a valid file in build, it couldn't actually resolve
	xyz.site/index.html as a valid route, which resulted in 404 🤦🏼.
-->

<script lang="ts">
	import { goto } from "$app/navigation";
	goto("/view/day");
</script>
