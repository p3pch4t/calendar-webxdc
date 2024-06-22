<script lang="ts">
	import { getContext, afterUpdate } from "svelte";
	import { derived } from "svelte/store";
	import { pushState } from "$app/navigation";
	import { page } from "$app/stores";

	import { gmtOffset, type ComputedCalendarEvent } from "$lib/calendars";
	import {
		createBoundaryTimes,
		createEventUpdater,
		type MonthDay,
	} from "$lib/views/event-range-updater";
	import type { Temporal } from "temporal-polyfill";

	import EventChip from "$lib/components/EventChip.svelte";
	import {
		createAllDayEventChipPlacer,
		createEventChipPlacer,
		type HourElements,
	} from "$lib/views/event-chip-placer";
	import { slide } from "svelte/transition";
	import CalendarEventPreview from "$lib/components/CalendarEventPreview.svelte";

	const currentView = getContext("currentView");
	$currentView = "day";

	const userTime = getContext("userTime");

	const dayArr: MonthDay[] = [{ day: 0, month: 0 }];
	const day = derived(userTime, (userTime) => {
		const day = dayArr[0];
		day.day = userTime.day;
		day.month = userTime.month;
		return dayArr;
	});

	const calendars = getContext("calendars");
	const computedCalendars = getContext("computedCalendars");

	let allDayEvents: [ComputedCalendarEvent, Temporal.ZonedDateTime][] = [];
	// hour (0-23) => events
	let hourEvents: Set<ComputedCalendarEvent>[] = Array.from({ length: 24 }, () => new Set());
	const { rangeStart, rangeEnd } = createBoundaryTimes(day, userTime);
	createEventUpdater({
		stores: [calendars, computedCalendars, rangeStart, rangeEnd],
		cleanup() {
			allDayEvents = [];
			for (let i = 0; i < 24; ++i) {
				hourEvents[i].clear();
			}
		},
		setEvent: (time, event) => {
			if (event.duration.minutes >= 24 * 60) {
				allDayEvents.push([event, time]);
				return;
			}
			hourEvents[time.hour].add(event);
		},
		finish() {
			hourEvents = hourEvents;
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
	const eventChipPlacer = createEventChipPlacer(hourElements, "day");
	const allDayEventChipPlacer = createAllDayEventChipPlacer($rangeStart, "day");

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

<section id="calendar-day-grid">
	{#if allDayEvents.length}
		<div transition:slide={{ duration: 100 }} class="all-day-events">
			<span class="gmt-cell md-typescale-title-small"> GMT{gmtOffset} </span>
			<div class="all-day-events-container">
				{#each allDayEvents as [event, time]}
					<EventChip
						on:click={() => selectEvent(event)}
						{event}
						context={time}
						placer={allDayEventChipPlacer}
					/>
				{/each}
			</div>
		</div>
	{/if}

	<div class="hours" bind:this={hoursElement}>
		{#each { length: 24 } as _, hour (hour)}
			<div class="hour-row">
				<span class="hour-cell md-typescale-title-small">
					{`${hour}`.padStart(2, "0")}:00
				</span>

				<span class="hour-event-container">
					{#each hourEvents[hour] as event (event.id)}
						<EventChip on:click={() => selectEvent(event)} {event} outlined placer={eventChipPlacer} />
					{/each}
				</span>
			</div>
		{/each}
	</div>
</section>

<style>
	#calendar-day-grid {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow-x: hidden;

		--week-grid-template: 50px auto;

		& > .all-day-events {
			display: flex;
			flex-direction: row;
			flex-wrap: nowrap;
			gap: 4px;
			align-items: center;
			height: min-content;
			padding-bottom: 3px;
			margin-bottom: 5px;

			& > .gmt-cell {
				text-align: center;
				font-size: 80%;
				min-width: 50px;
				width: max-content;
			}

			& > .all-day-events-container {
				position: relative;
				width: 100%;
				transition: var(--md-default-transition);

				& > .event-chip {
					position: absolute;
					top: 20%;
					left: 20%;
					width: 0;
					height: 0;
				}
			}

			border-bottom: 1px solid var(--md-sys-color-outline-variant);
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

				border-bottom: 1px solid var(--md-sys-color-outline-variant);
				&:last-child {
					border-bottom: none;
				}

				& > .hour-cell {
					display: flex;
					justify-content: center;
					align-items: center;
				}

				& > .hour-event-container {
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
