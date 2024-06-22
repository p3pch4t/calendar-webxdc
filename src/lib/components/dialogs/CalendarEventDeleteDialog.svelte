<script lang="ts">
	import type ICAL from "ical.js";
	import { createEventDispatcher, getContext } from "svelte";
	import { writable } from "svelte/store";

	import { type MdDialog } from "@material/web/dialog/dialog";
	import "@material/web/slider/slider";
	import "@material/web/textfield/outlined-text-field";
	import "@material/web/button/text-button";
	import "@material/web/button/filled-tonal-button";
	import DeleteIcon from "$lib/components/icons/DeleteIcon.svelte";

	import { zonedDateTimeToICALJsonData, type ComputedCalendarEvent } from "$lib/calendars";
	import { EventDeleteMode, type DeleteCalendarEventOptions } from "$lib/webxdc/shared";

	const calendarFunctions = getContext("calendarFunctions");
	const userTime = getContext("userTime");

	const dispatch = createEventDispatcher();

	let dialog: MdDialog;
	export function show() {
		dialog.show();
	}
	function close() {
		dialog.close();
	}

	const event = writable<ComputedCalendarEvent | undefined>();
	export function setCalendarEvent(event: ComputedCalendarEvent | undefined) {
		$event = event;
	}

	function deleteEvent(mode: EventDeleteMode): void {
		if (!$event) return;

		const associatedCalendar = $event?.associatedCalendar.deref();
		const associatedEvent = $event?.associatedEvent.deref();
		if (!associatedCalendar || !associatedEvent) {
			console.warn(`Couldn't find associated calendar or event for ${$event.title} (${$event.id})`);
			return;
		}

		dispatch("delete");

		const deleteOptions: DeleteCalendarEventOptions = { mode };
		if (mode === EventDeleteMode.RecurringSince || mode === EventDeleteMode.RecurringThis) {
			deleteOptions.time = zonedDateTimeToICALJsonData($userTime);
		}
		calendarFunctions.deleteCalendarEvent(associatedCalendar, associatedEvent, deleteOptions);

		dialog.close();
	}
</script>

<md-dialog bind:this={dialog} id="calendar-event-delete-dialog">
	<DeleteIcon slot="icon" />
	<div class="headline" slot="headline">
		Permanently delete&nbsp;<span class="event-title" style:color={$event?.color}
			>{$event?.title ?? "Untitled"}</span
		>?
	</div>
	<div slot="content">Deleting event cannot be undone.</div>
	<div class="actions" class:with-recurrence={$event?.recurrence} slot="actions">
		{#if $event?.recurrence}
			<h2 class="delete-label md-typescale-headline-medium">Delete</h2>
			<md-filled-tonal-button
				title="Delete only this event"
				on:click={() => deleteEvent(EventDeleteMode.RecurringThis)}
			>
				This event
			</md-filled-tonal-button>
			<md-filled-tonal-button
				title="Delete this event and ones coming after it"
				on:click={() => deleteEvent(EventDeleteMode.RecurringSince)}
			>
				This and future events
			</md-filled-tonal-button>
			<md-filled-tonal-button
				title="Delete every recurring event"
				on:click={() => deleteEvent(EventDeleteMode.RecurringAll)}
			>
				Every event
			</md-filled-tonal-button>

			<md-text-button title="Close dialog" on:click={close}> Cancel </md-text-button>
		{:else}
			<md-text-button title="Close dialog" on:click={close}> Cancel </md-text-button>
			<md-filled-tonal-button
				title="Delete event"
				on:click={() => deleteEvent(EventDeleteMode.NonRecurring)}
			>
				Delete
			</md-filled-tonal-button>
		{/if}
	</div>
</md-dialog>

<style>
	#calendar-event-delete-dialog {
		& > .headline {
			display: flex;
			flex-wrap: wrap;
			gap: 0;

			& > .event-title {
				overflow: hidden;
				white-space: nowrap;
				max-width: calc(100% - 1.5em);
				text-overflow: ellipsis;
			}
		}

		& > .actions.with-recurrence {
			display: flex;
			flex-direction: column;

			& > .delete-label {
				text-align: center;
				color: var(--md-sys-color-on-surface);
				margin: 0;
			}
		}
	}
</style>
