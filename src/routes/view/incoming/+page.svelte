<script lang="ts">
	import { getContext } from "svelte";
	import { writable } from "svelte/store";
	import { goto } from "$app/navigation";

	import { Temporal, Intl } from "temporal-polyfill";

	import { createEventUpdater } from "$lib/views/event-range-updater";
	import { zonedDateTimeToICALTime, type ComputedCalendarEvent } from "$lib/calendars";

	import "@material/web/ripple/ripple";
	import "@material/web/focus/md-focus-ring";

	const currentView = getContext("currentView");
	$currentView = "incoming";

	const calendars = getContext("calendars");
	const computedCalendars = getContext("computedCalendars");

	const start = writable({
		temporal: Temporal.Now.zonedDateTimeISO(),
		ical: zonedDateTimeToICALTime(Temporal.Now.zonedDateTimeISO()),
	});
	const end = writable({
		temporal: Temporal.Now.zonedDateTimeISO().add({ weeks: 2 }),
		ical: zonedDateTimeToICALTime(Temporal.Now.zonedDateTimeISO().add({ weeks: 2 })),
	});

	type TimedEvent = [Temporal.ZonedDateTime, ComputedCalendarEvent];
	let today: TimedEvent[] = [];
	let tommorow: TimedEvent[] = [];
	let later: TimedEvent[] = [];

	const timedEventCompareFn = (a: TimedEvent, b: TimedEvent) =>
		Temporal.ZonedDateTime.compare(a[1].start, b[1].start);

	const endOfToday = Temporal.Now.zonedDateTimeISO().with({ hour: 23, minute: 59, second: 59 });
	const endOfTommorow = endOfToday.add({ days: 1 });

	createEventUpdater({
		stores: [calendars, computedCalendars, start, end],
		setEvent(time, event) {
			console.log(event.title, time.toString());

			if (Temporal.ZonedDateTime.compare(time, endOfToday) <= 0) {
				today.push([time, event]);
			} else if (Temporal.ZonedDateTime.compare(time, endOfTommorow) <= 0) {
				tommorow.push([time, event]);
			} else {
				later.push([time, event]);
			}
		},
		cleanup() {
			today = [];
			tommorow = [];
			later = [];
		},
		finish() {
			today.sort(timedEventCompareFn);
			tommorow.sort(timedEventCompareFn);
			later.sort(timedEventCompareFn);

			today = today;
			tommorow = tommorow;
			later = later;
		},
	});

	const todayTommorowFormatter = new Intl.DateTimeFormat(navigator.language, {
		hour: "numeric",
		minute: "numeric",
	});
	const laterFormatter = new Intl.DateTimeFormat(navigator.language, {
		weekday: "short",
		day: "numeric",
	});

	const formatZonedDateTime = (time: Temporal.ZonedDateTime, formatter: Intl.DateTimeFormat) =>
		formatter.format(time.toPlainDateTime());

	const userTime = getContext("userTime");
	function selectDay(time: Temporal.ZonedDateTime): void {
		$userTime = time;
		goto("/view/day");
	}
</script>

<div id="calendar-list">
	{#if today.length}
		<div class="today-events">
			<h1 class="title md-typescale-display-small">Today:</h1>
			{#each today as [time, event]}
				<span class="event" style:--color={event.color} on:click={() => selectDay(time)}>
					<md-ripple />
					<md-focus-ring />

					<span class="time">{formatZonedDateTime(time, todayTommorowFormatter)}</span>
					<span class="headline">{event.title}</span>
				</span>
			{/each}
		</div>
	{/if}

	{#if tommorow.length}
		<div class="tommorow-events">
			<h1 class="title md-typescale-display-small">Tommorow:</h1>
			{#each tommorow as [time, event]}
				<span class="event" style:--color={event.color} on:click={() => selectDay(time)}>
					<md-ripple />
					<md-focus-ring />

					<span class="time">{formatZonedDateTime(time, todayTommorowFormatter)}</span>
					<span class="headline">{event.title}</span>
				</span>
			{/each}
		</div>
	{/if}

	{#if tommorow.length}
		<div class="later-events">
			<h1 class="title md-typescale-display-small">Later:</h1>
			{#each later as [time, event]}
				<span class="event" style:--color={event.color} on:click={() => selectDay(time)}>
					<md-ripple />
					<md-focus-ring />

					<span class="time">{formatZonedDateTime(time, laterFormatter)}</span>
					<span class="headline">{event.title}</span>
				</span>
			{/each}
		</div>
	{/if}
</div>

<style>
	#calendar-list {
		display: flex;
		flex-direction: column;

		padding: 16px;
		gap: 16px;
		overflow-y: auto;

		& > .today-events,
		& > .tommorow-events,
		& > .later-events {
			display: flex;
			flex-direction: column;
			gap: 8px;
			width: 100%;

			& > .title {
				margin: 0;
			}

			& > .event {
				position: relative;
				display: flex;
				align-items: center;

				width: 100%;
				gap: 8px;
				padding: 4px;

				background-color: var(--color);
				color: var(--md-sys-color-on-surface);
				border-radius: 24px;

				cursor: pointer;
				-webkit-tap-highlight-color: transparent;

				& > .time {
					background-color: var(--md-sys-color-surface-container-highest);
					border-radius: 16px;
					padding: 4px 12px;
					text-align: center;
				}

				& > .headline {
					flex: 1;
					overflow: hidden;
					white-space: nowrap;
					text-overflow: ellipsis;
				}
			}
		}

		& > .later-events {
			& > .event > .time {
				min-width: 5em;
			}
		}
	}
</style>
