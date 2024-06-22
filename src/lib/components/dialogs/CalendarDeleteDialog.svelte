<script lang="ts">
	import { getContext } from "svelte";
	import { writable } from "svelte/store";

	import { type MdDialog } from "@material/web/dialog/dialog";
	import "@material/web/slider/slider";
	import "@material/web/textfield/outlined-text-field";
	import "@material/web/button/text-button";
	import "@material/web/button/filled-tonal-button";
	import DeleteIcon from "$lib/components/icons/DeleteIcon.svelte";

	import type { Calendar } from "$lib/calendars";

	const computedCalendars = getContext("computedCalendars");
	const calendarFunctions = getContext("calendarFunctions");

	let dialog: MdDialog;
	export function show() {
		dialog.show();
	}
	function close() {
		dialog.close();
	}

	const calendar = writable<Calendar>();
	$: computedCalendar = $computedCalendars.get($calendar);
	export function setCalendar(calendar: Calendar) {
		$calendar = calendar;
	}

	function deleteCalendar(): void {
		calendarFunctions.deleteCalendar($calendar);
		dialog.close();
	}
</script>

<md-dialog bind:this={dialog} id="calendar-delete-dialog">
	<DeleteIcon slot="icon" />
	<div class="headline" slot="headline">
		Permanently delete&nbsp;<span class="name" style:color={computedCalendar?.color}
			>{$calendar?.name}</span
		>?
	</div>
	<div slot="content">Deleting the calendar cannot be undone.</div>
	<div slot="actions">
		<md-text-button title="Close dialog" on:click={close}> Cancel </md-text-button>
		<md-filled-tonal-button title="Delete the calendar" on:click={deleteCalendar}>
			Delete
		</md-filled-tonal-button>
	</div>
</md-dialog>

<style>
	#calendar-delete-dialog {
		& > .headline {
			display: flex;
			flex-wrap: wrap;
			gap: 0;

			& > .name {
				overflow: hidden;
				white-space: nowrap;
				max-width: calc(100% - 1.5em);
				text-overflow: ellipsis;
			}
		}
	}
</style>
