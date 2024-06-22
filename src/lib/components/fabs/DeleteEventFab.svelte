<script lang="ts">
	import type { Readable } from "svelte/store";

	import "@material/web/fab/fab";
	import DeleteIcon from "$lib/components/icons/DeleteIcon.svelte";

	import type { ComputedCalendarEvent } from "$lib/calendars";
	import CalendarEventDeleteDialog from "../dialogs/CalendarEventDeleteDialog.svelte";

	export let event: Readable<ComputedCalendarEvent | undefined>;

	let eventDeleteDialog: CalendarEventDeleteDialog;
	function showEventDeleteDialog() {
		eventDeleteDialog.setCalendarEvent($event);
		eventDeleteDialog.show();
	}
</script>

<CalendarEventDeleteDialog on:delete bind:this={eventDeleteDialog} />

<md-fab
	aria-label="Delete event"
	id="delete-event-fab"
	variant="tertiary"
	on:click={showEventDeleteDialog}
>
	<DeleteIcon slot="icon" />
</md-fab>
