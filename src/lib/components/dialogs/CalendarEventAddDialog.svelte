<script lang="ts">
	import { getContext, onDestroy } from "svelte";
	import { writable } from "svelte/store";

	import { Temporal } from "temporal-polyfill";
	import ICAL from "ical.js";

	import "@material/web/slider/slider";
	import "@material/web/button/text-button";
	import "@material/web/button/filled-tonal-button";
	import { type MdFilledTextField } from "@material/web/textfield/filled-text-field";
	import "@material/web/checkbox/checkbox";
	import { type MdDialog } from "@material/web/dialog/dialog";
	import EventIcon from "~icons/material-symbols/event-rounded";

	import DatePicker from "$lib/components/DatePicker.svelte";
	import TimePicker from "$lib/components/TimePicker.svelte";

	import {
		generateRandomID,
		localTimeZone,
		zonedDateTimeToICALJsonData,
		type Calendar,
		type CalendarEvent,
	} from "$lib/calendars";
	import { bindValue } from "$lib/actions/bindValue";
	import Menu from "../Menu.svelte";
	import MenuItem from "../MenuItem.svelte";

	import { handleDateTimeSynchronization } from "./shared";

	const calendarFunctions = getContext("calendarFunctions");
	const calendars = getContext("calendars");

	let calendarMenu: Menu<Calendar>;
	let titleTextField: MdFilledTextField;
	let dialog: MdDialog;
	export function show(): void {
		dialog.show();
	}
	function close(): void {
		dialog.close();
	}

	const calendar = writable<Calendar>();

	const title = writable("");
	const description = writable("");
	const location = writable("");
	const startDate = writable(Temporal.Now.plainDateISO());
	const endDate = writable(Temporal.Now.plainDateISO());
	const startTime = writable(Temporal.Now.plainTimeISO());
	const endTime = writable(Temporal.Now.plainTimeISO());
	const allDay = writable(false);
	const recurrence = writable<ICAL.FrequencyValues | "NONE">("NONE");

	onDestroy(handleDateTimeSynchronization(startTime, endTime, startDate, endDate));

	function createEvent() {
		if (!$calendar) {
			calendarMenu.error = true;
			calendarMenu.errorText = "You need to choose a calendar";
			return;
		} else {
			calendarMenu.error = false;
		}

		if (!$title) {
			titleTextField.error = true;
			titleTextField.errorText = "Title cannot be empty";
			return;
		} else {
			titleTextField.error = false;
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

		const event: CalendarEvent = {
			id: generateRandomID(),
			title: $title,
			description: $description,
			location: $location,

			start,
			end,
		};

		if ($recurrence !== "NONE") {
			event.recurrence = { freq: $recurrence };
		}

		calendarFunctions.addCalendarEvent($calendar, event);

		// reset form
		$title = "";
		$description = "";
		$location = "";
		$startDate = Temporal.Now.plainDateISO();
		$endDate = Temporal.Now.plainDateISO();
		$startTime = Temporal.Now.plainTimeISO();
		$endTime = Temporal.Now.plainTimeISO();
		$allDay = false;
		$recurrence = "NONE";

		close();
	}
</script>

<md-dialog bind:this={dialog} id="add-calendar-event-dialog">
	<EventIcon slot="icon" />
	<div class="headline" slot="headline">Create event</div>
	<div class="content" slot="content" id="add-calendar-event-form">
		<Menu bind:this={calendarMenu} label="Calendar" class="calendar" value={calendar}>
			{#each $calendars as calendar (calendar.id)}
				<MenuItem headline={calendar.name} value={calendar} />
			{/each}
		</Menu>

		<Menu label="Recurrence" class="recurrence" value={recurrence}>
			<MenuItem selected headline="Do not repeat" value="NONE" />
			<MenuItem headline="Daily" value="DAILY" />
			<MenuItem headline="Weekly" value="WEEKLY" />
			<MenuItem headline="Monthly" value="MONTHLY" />
			<MenuItem headline="Yearly" value="YEARLY" />
		</Menu>

		<md-filled-text-field
			bind:this={titleTextField}
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
		<md-filled-tonal-button title="Create event" on:click={createEvent}>
			Create
		</md-filled-tonal-button>
	</div>
</md-dialog>

<style>
	#add-calendar-event-dialog {
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
