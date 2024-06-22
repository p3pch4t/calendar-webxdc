<script lang="ts">
	import { getContext, onDestroy } from "svelte";
	import { writable } from "svelte/store";

	import { Temporal } from "temporal-polyfill";
	import ICAL from "ical.js";

	import "@material/web/slider/slider";
	import "@material/web/button/outlined-button";
	import "@material/web/button/text-button";
	import "@material/web/button/filled-tonal-button";
	import { type MdFilledTextField } from "@material/web/textfield/filled-text-field";
	import "@material/web/checkbox/checkbox";
	import { type MdDialog } from "@material/web/dialog/dialog";
	import EventIcon from "$lib/components/icons/EventIcon.svelte";

	import Menu from "$lib/components/Menu.svelte";
	import MenuItem from "$lib/components/MenuItem.svelte";
	import DatePicker from "$lib/components/DatePicker.svelte";
	import TimePicker from "$lib/components/TimePicker.svelte";

	import { longWeekdayNames, shortWeekdayNames } from "$lib/shared";

	import {
		zonedDateTimeToICALJsonData,
		ICALJsonToZonedDateTime,
		type Calendar,
		type CalendarEvent,
		type CalendarEventChanges,
		type ComputedCalendarEvent,
		localTimeZone,
	} from "$lib/calendars";
	import { bindValue } from "$lib/actions/bindValue";

	import { handleDateTimeSynchronization } from "./shared";

	const calendarFunctions = getContext("calendarFunctions");

	let dialog: MdDialog;
	let titleElement: MdFilledTextField;
	export function show(): void {
		dialog.show();
	}
	function close(): void {
		dialog.close();
	}

	const title = writable("");
	const description = writable("");
	const location = writable("");
	const startDate = writable(Temporal.Now.plainDateISO());
	const endDate = writable(Temporal.Now.plainDateISO());
	const startTime = writable(Temporal.Now.plainTimeISO());
	const endTime = writable(Temporal.Now.plainTimeISO());
	const allDay = writable(true);
	const recurrence = writable<ICAL.FrequencyValues | "NONE">();
	const recurByDay = writable(false);
	const recurrenceByDay = writable(Array(7).fill(false));

	onDestroy(handleDateTimeSynchronization(startTime, endTime, startDate, endDate));

	const calendar = writable<Calendar | undefined>();
	const event = writable<CalendarEvent | undefined>();

	export function setCalendarEvent(computedCalendarEvent?: ComputedCalendarEvent): void {
		if (!computedCalendarEvent) {
			$event = undefined;
			return;
		}

		const associatedCalendar = computedCalendarEvent.associatedCalendar.deref();
		const calendarEvent = computedCalendarEvent.associatedEvent.deref();

		if (!associatedCalendar || !calendarEvent) {
			console.warn("Failed to find reference to event: ", event);
			return;
		}

		$calendar = associatedCalendar;
		$event = calendarEvent;

		$title = $event.title;
		$description = $event.description ?? "";
		$location = $event.location ?? "";

		const zonedStart = ICALJsonToZonedDateTime(calendarEvent.start);
		const zonedEnd = ICALJsonToZonedDateTime(calendarEvent.end);

		$startTime = zonedStart.toPlainTime();
		$endTime = zonedEnd.toPlainTime();
		$startDate = zonedStart.toPlainDate();
		$endDate = zonedEnd.toPlainDate();

		$recurrence = calendarEvent.recurrence?.freq ?? "NONE";
		$recurByDay = !!calendarEvent.recurrence?.byDay?.length;
		$recurrenceByDay =
			($recurByDay && structuredClone(calendarEvent.recurrence?.byDay)) || Array(7).fill(false);

		$allDay =
			Temporal.PlainTime.compare(computedCalendarEvent.start.toPlainTime(), {
				hour: 0,
				minute: 0,
				second: 59,
			}) <= 0 &&
			Temporal.PlainTime.compare(computedCalendarEvent.end.toPlainTime(), {
				hour: 23,
				minute: 59,
				second: 1,
			}) >= 0;
	}

	function editEvent() {
		if (!$calendar || !$event) {
			console.warn("Tried to edit empty calendar event?");
			return;
		}

		if (!$title) {
			titleElement.error = true;
			titleElement.errorText = "Title cannot be empty!";
			return;
		} else {
			titleElement.error = false;
		}

		if ($allDay) {
			$startTime = $startTime.with({ hour: 0, minute: 0, second: 0 });
			$endTime = $endTime.with({ hour: 23, minute: 59, second: 59 });
		}

		const start = zonedDateTimeToICALJsonData(
			$startDate.toZonedDateTime({
				plainTime: $startTime,
				timeZone: localTimeZone,
			}),
		);

		const end = zonedDateTimeToICALJsonData(
			$endDate.toZonedDateTime({
				plainTime: $endTime,
				timeZone: localTimeZone,
			}),
		);

		const changes: CalendarEventChanges = {};

		if ($event.title !== $title) changes.title = $title;
		if ($event.description !== $description) changes.description = $description;
		if ($event.location !== $location) changes.location = $location;

		if (JSON.stringify($event.start) !== JSON.stringify(start)) changes.start = start;
		if (JSON.stringify($event.end) !== JSON.stringify(end)) changes.end = end;

		if ($recurrence === "NONE") {
			if ($event.recurrence) changes.recurrence = undefined;
		} else {
			if ($event.recurrence?.freq !== $recurrence) {
				changes.recurrence ??= {};
				changes.recurrence.freq = $recurrence;
			}

			if ($event.recurrence?.byDay) {
				changes.recurrence ??= {};

				if (!$recurByDay) {
					changes.recurrence.byDay = [];
				} else if ($recurrenceByDay.some((a, i) => a !== $event?.recurrence?.byDay?.[i])) {
					changes.recurrence.byDay = $recurrenceByDay;
				}
			} else if ($recurByDay && $recurrenceByDay.some((a) => !a)) {
				changes.recurrence ??= {};
				changes.recurrence.byDay = $recurrenceByDay;
			}
		}

		console.log($event.recurrence?.byDay, $recurrenceByDay, $recurByDay, changes);

		calendarFunctions.editCalendarEvent($calendar, $event, changes);
		close();
	}
</script>

<md-dialog bind:this={dialog} id="edit-calendar-event-dialog">
	<EventIcon slot="icon" />
	<div class="headline" slot="headline">Edit event</div>
	<div class="content" slot="content" id="edit-calendar-event-form">
		<Menu label="Recurrence" class="recurrence" value={recurrence}>
			<MenuItem headline="Do not repeat" value="NONE" />
			<MenuItem headline="Daily" value="DAILY" />
			<MenuItem headline="Weekly" value="WEEKLY" />
			<MenuItem headline="Monthly" value="MONTHLY" />
			<MenuItem headline="Yearly" value="YEARLY" />
		</Menu>

		{#if $recurrence !== "NONE"}
			<label class="recur-by-day">
				<md-checkbox
					class="recur-by-day"
					aria-label="Recur by day"
					use:bindValue={{
						store: recurByDay,
						property: "checked",
					}}
				/>
				Recur by day
			</label>

			{#if $recurByDay}
				<div class="recurrence-days">
					{#each { length: 7 } as _, i}
						<md-outlined-button
							class="weekday-button"
							title="Recur on {longWeekdayNames[i]}"
							class:toggled={$recurrenceByDay[i]}
							on:click={() => ($recurrenceByDay[i] = !$recurrenceByDay[i])}
						>
							{shortWeekdayNames[i]}
						</md-outlined-button>
					{/each}
				</div>
			{/if}
		{/if}

		<md-filled-text-field
			bind:this={titleElement}
			class="title"
			label="Title"
			use:bindValue={title}
		/>
		<md-filled-text-field
			type="textarea"
			class="description"
			label="Description"
			use:bindValue={description}
		/>
		<md-filled-text-field class="location" label="Location" use:bindValue={location} />

		<div class="time-range-container">
			<div class="time-range">
				<div class="start-time">
					<span class="md-typescale-title-small">Start time:</span>
					<DatePicker value={startDate} label="Start" />
					{#if !$allDay}
						<TimePicker value={startTime} />
					{/if}
				</div>
				<div class="end-time">
					<span class="md-typescale-title-small">End time:</span>
					<DatePicker value={endDate} label="End" />
					{#if !$allDay}
						<TimePicker value={endTime} />
					{/if}
				</div>
			</div>

			<label class="all-day">
				<md-checkbox
					class="all-day"
					aria-label="All day"
					use:bindValue={{
						store: allDay,
						property: "checked",
					}}
				/>
				All day
			</label>
		</div>
	</div>
	<div class="actions" slot="actions">
		<md-text-button title="Close dialog" on:click={close}> Cancel </md-text-button>
		<md-filled-tonal-button title="Edit event" on:click={editEvent}> Edit </md-filled-tonal-button>
	</div>
</md-dialog>

<style>
	#edit-calendar-event-dialog {
		& > .headline {
			display: flex;
			flex-wrap: wrap;
		}

		& > .content {
			display: flex;
			flex-direction: column;
			gap: 8px;

			& > .calendar {
				width: 100%;
			}

			& > .recur-by-day {
				align-self: center;
				padding-block: 8px;
			}

			& > .recurrence-days {
				width: 100%;
				display: flex;
				align-items: center;
				justify-content: center;

				& > .weekday-button {
					padding: 4px 0;
					min-height: 0;
					width: 100%;

					--md-outlined-button-container-shape: 0;
					&:first-child {
						--md-outlined-button-container-shape-start-start: 99999px;
						--md-outlined-button-container-shape-end-start: 99999px;
					}
					&:last-child {
						--md-outlined-button-container-shape-end-end: 99999px;
						--md-outlined-button-container-shape-start-end: 99999px;
					}

					&.toggled {
						background-color: var(--md-sys-color-primary);

						--md-outlined-button-label-text-color: var(--md-sys-color-on-primary);
						--md-outlined-button-hover-label-text-color: var(--md-sys-color-on-primary);
						--md-outlined-button-focus-label-text-color: var(--md-sys-color-on-primary);
						--md-outlined-button-pressed-label-text-color: var(--md-sys-color-on-primary);
					}
				}
			}

			& > .title {
				width: 100%;
			}

			& > .description {
				resize: none;
			}

			& > .time-range-container {
				display: flex;
				flex-direction: column;

				& > .all-day {
					align-self: center;
					padding-block: 8px;
				}

				& > .time-range {
					display: flex;
					gap: 16px;
				}
			}

			& > .recurrence {
				width: 100%;
			}
		}
	}
</style>
