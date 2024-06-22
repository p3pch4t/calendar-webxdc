<script lang="ts">
	import type { Readable } from "svelte/store";

	import "@material/web/fab/fab";
	import EditIcon from "$lib/components/icons/EditIcon.svelte";

	import type { ComputedCalendarEvent } from "$lib/calendars";
	import CalendarEventEditDialog from "../dialogs/CalendarEventEditDialog.svelte";

	export let event: Readable<ComputedCalendarEvent | undefined>;

	let eventEditDialog: CalendarEventEditDialog;
	function showEventEditDialog() {
		eventEditDialog.setCalendarEvent($event);
		eventEditDialog.show();
	}
</script>

<CalendarEventEditDialog bind:this={eventEditDialog} />

<md-fab
	aria-label="Edit event"
	id="edit-event-fab"
	variant="primary"
	on:click={showEventEditDialog}
>
	<EditIcon slot="icon" />
</md-fab>
