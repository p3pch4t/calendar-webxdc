<script lang="ts">
	import { getContext, afterUpdate } from "svelte";
	import { derived } from "svelte/store";
	import { slide } from "svelte/transition";
	import { goto, pushState } from "$app/navigation";
	import { page } from "$app/stores";

	import { Temporal } from "temporal-polyfill";

	import "@material/web/chips/suggestion-chip";

	import { gmtOffset, type ComputedCalendarEvent } from "$lib/calendars";
	import { narrowWeekdayNames } from "$lib/shared";
	import {
		createBoundaryTimes,
		createEventUpdater,
		type MonthDay,
	} from "$lib/views/event-range-updater";
	import {
		createAllDayEventChipPlacer,
		createEventChipPlacer,
		type HourElements,
	} from "$lib/views/event-chip-placer";

	import EventChip from "$lib/components/EventChip.svelte";
	import CalendarEventPreview from "$lib/components/CalendarEventPreview.svelte";

	const currentView = getContext("currentView");
	$currentView = "week";

	function selectDay(day: number, month: number): void {
		$userTime = $userTime.with({ day, month });
		goto("/view/day");
	}

	const userTime = getContext("userTime");
	const todayTime = Temporal.Now.zonedDateTimeISO();

	const weekdayGrid: MonthDay[] = Array.from({ length: 7 }, (_, i) => ({ day: 0, month: 0 }));
	const weekdays = derived(userTime, (userTime) => {
		const weekOffset = userTime.day - userTime.dayOfWeek;
		const previousMonth = userTime.subtract({ months: 1 });
		for (let i = 0; i < weekdayGrid.length; ++i) {
			const monthDay = weekdayGrid[i];
			const day = i + weekOffset + 1;
			if (day < 1) {
				monthDay.day = previousMonth.daysInMonth + day;
				monthDay.month = previousMonth.month;
			} else if (day > userTime.daysInMonth) {
				monthDay.day = day - userTime.daysInMonth;
				monthDay.month = userTime.month + 1;
			} else {
				monthDay.day = day;
				monthDay.month = userTime.month;
			}
		}
		return weekdayGrid;
	});

	const calendars = getContext("calendars");
	const computedCalendars = getContext("computedCalendars");

	// hour (0-23) => month day (spread) => events
	let allDayEvents: [ComputedCalendarEvent, Temporal.ZonedDateTime][] = [];
	let weekdayEvents: Map<number, [ComputedCalendarEvent, Temporal.ZonedDateTime][]>[] = Array(24);
	const { rangeStart, rangeEnd } = createBoundaryTimes(weekdays, userTime);
	createEventUpdater({
		stores: [calendars, computedCalendars, rangeStart, rangeEnd],
		cleanup() {
			allDayEvents = [];
			for (const eventMap of weekdayEvents) {
				eventMap?.clear();
			}
		},
		setEvent: (time, event) => {
			if (event.duration.minutes >= 24 * 60) {
				allDayEvents.push([event, time]);
				return;
			}

			const { day, hour } = time;

			const monthDays = (weekdayEvents[hour] ??= new Map());
			const events = monthDays.get(day);

			if (events) {
				events.push([event, time]);
			} else {
				monthDays.set(day, [[event, time]]);
			}
		},
		finish() {
			weekdayEvents = weekdayEvents;
			allDayEvents = allDayEvents;
		},
	});

	let hoursElement: HTMLDivElement;
	const hourElements: HourElements = {};
	afterUpdate(() => {
		const hourRowElement = hoursElement?.children[0];
		hourElements.hourRowElement = hourRowElement;
		hourElements.hourCellElement = hourRowElement?.children[0];
		hourElements.hourContainerElement = hourRowElement?.children[1];
	});
	const eventChipPlacer = createEventChipPlacer(hourElements, "week");
	const allDayEventChipPlacer = createAllDayEventChipPlacer($rangeStart, "week");

	let selectedEvent: ComputedCalendarEvent;
	function selectEvent(event: ComputedCalendarEvent): void {
		selectedEvent = event;
		pushState("", { showEventPreview: true });
	}
</script>

{#if $page.state.showEventPreview}
	{@const calendar = selectedEvent.associatedCalendar.deref()}
	{@const event = selectedEvent.associatedEvent.deref()}
	<CalendarEventPreview {event} {calendar} />
{/if}

<section id="calendar-week-grid">
	<div class="days-of-the-week">
		<!-- empty cell to make place for the hours -->
		<span class="empty-cell" />

		{#each $weekdays as { day, month }, i}
			{@const notCurrentMonth = month !== $userTime.month}
			{@const today = day === todayTime.day}
			<h1
				class="weekday md-typescale-title-small"
				class:not-current-month={notCurrentMonth}
				class:today
				title={today ? "Today" : undefined}
			>
				<span class="week-name">{narrowWeekdayNames[i]}</span>
				<md-text-button
					aria-label="Go to view of day {day}"
					class="weekday-cell"
					on:click={selectDay(day, month)}
				>
					{day}
				</md-text-button>
			</h1>
		{/each}
	</div>

	{#if allDayEvents.length}
		<div transition:slide={{ duration: 100 }} class="all-day">
			<span class="gmt-cell md-typescale-title-small"> GMT{gmtOffset} </span>
			<div class="all-day-events-container">
				{#each allDayEvents as [event, time]}
					<EventChip
						{event}
						on:click={() => selectEvent(event)}
						context={time}
						outlined
						placer={allDayEventChipPlacer}
					/>
				{/each}
			</div>
		</div>
	{/if}

	<div class="hours" bind:this={hoursElement}>
		{#each { length: 24 } as _, hour}
			<div class="hour-row">
				<span class="hour-cell md-typescale-title-small">
					{`${hour}`.padStart(2, "0")}:00
				</span>

				{#each $weekdays as { day }}
					{@const events = weekdayEvents[hour]?.get(day)}
					<span class="hour-events-container">
						{#if events}
							{#each events as [event, time]}
								<EventChip
									context={time}
									on:click={() => selectEvent(event)}
									{event}
									outlined
									placer={eventChipPlacer}
								/>
							{/each}
						{/if}
					</span>
				{/each}
			</div>
		{/each}
	</div>
</section>

<style>
	#calendar-week-grid {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow-x: hidden;

		--cell-border-style: 1px solid var(--md-sys-color-outline-variant);
		--week-grid-template: 50px repeat(7, calc((100% - 50px) / 7));

		& > .days-of-the-week {
			display: grid;
			grid-template-columns: var(--week-grid-template);

			& > .empty-cell {
				border-right: var(--cell-border-style);
				border-bottom: var(--cell-border-style);
				border-radius: 0 0 12px;
			}

			& > .weekday {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;

				cursor: default;
				margin: 0;
				padding-bottom: 6px;
				height: min-content;
				border-right: var(--cell-border-style);

				&.today {
					& > .weekday-cell {
						background-color: var(--md-sys-color-primary);
						--md-text-button-label-text-color: var(--md-sys-color-on-primary);
						--md-text-button-hover-label-text-color: var(--md-sys-color-on-primary);
						--md-text-button-focus-label-text-color: var(--md-sys-color-on-primary);
						--md-text-button-pressed-label-text-color: var(--md-sys-color-on-primary);
					}
				}

				& > .weekday-cell {
					--md-text-button-label-text-color: var(--md-sys-color-on-surface);

					/** force it to be a circle */
					--circle-size: 28px;
					min-width: var(--circle-size);
					max-width: var(--circle-size);
					min-height: var(--circle-size);
					max-height: var(--circle-size);
					aspect-ratio: 1 / 1;

					padding: 0px;
					border-radius: 99999px;
				}
			}
		}

		& > .all-day {
			display: flex;
			flex-direction: row;
			flex-wrap: nowrap;
			justify-content: center;
			align-items: center;
			gap: 4px;
			padding-block: 3px;

			& > .gmt-cell {
				text-align: center;
				font-size: 80%;
				min-width: 50px;
				width: max-content;
				display: block;
			}

			& > .all-day-events-container {
				position: relative;
				width: 100%;
				height: 50px;
				transition: var(--md-default-transition);

				& > .event-chip {
					position: absolute;
					top: 20%;
					left: 20%;
					width: 0;
					height: 0;
				}
			}

			border-bottom: var(--cell-border-style);
		}

		& > .hours {
			position: relative;
			display: flex;
			flex-direction: column;
			height: 100%;

			& > .hour-row {
				display: grid;
				grid-template-columns: var(--week-grid-template);

				height: 100%;

				& > .hour-cell {
					display: flex;
					justify-content: center;
					align-items: center;

					border-bottom: var(--cell-border-style);
				}

				& > .hour-events-container {
					padding-inline: 1px;
					display: flex;
					gap: 2px;
					flex-wrap: wrap;
					justify-content: center;
					align-items: center;

					border-right: var(--cell-border-style);
					border-bottom: var(--cell-border-style);

					& > .event-chip {
						position: absolute;
						top: 20%;
						left: 20%;
						width: 0;
						height: 0;
					}
				}
			}
		}
	}
</style>
