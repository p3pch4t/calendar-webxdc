<script lang="ts">
	import { getContext, beforeUpdate, afterUpdate, tick, onDestroy } from "svelte";
	import { derived } from "svelte/store";
	import { goto } from "$app/navigation";

	import { Temporal } from "temporal-polyfill";

	import "@material/web/ripple/ripple";
	import "@material/web/focus/md-focus-ring";

	import { narrowWeekdayNames } from "$lib/shared";
	import type { ComputedCalendarEvent } from "$lib/calendars";
	import {
		createBoundaryTimes,
		createEventUpdater,
		type MonthDay,
	} from "$lib/views/event-range-updater";

	import EventChip, {
		type EventChipPlacer,
		setEventChipReseter,
		resetEventChipReseter,
	} from "$lib/components/EventChip.svelte";

	const currentView = getContext("currentView");
	$currentView = "month";

	const userTime = getContext("userTime");
	const todayTime = Temporal.Now.zonedDateTimeISO();

	$: browsingSamePeriod = $userTime.month === todayTime.month && $userTime.year === todayTime.year;

	const dayGrid: MonthDay[] = Array.from({ length: 7 * 6 }, (_) => ({ day: 0, month: 0 }));
	const days = derived(userTime, (userTime) => {
		const firstDay = userTime.with({ day: 1 });
		const monthDayOffset = Math.max(firstDay.dayOfWeek - 1, 0);

		let j = 0;

		// previous month:
		{
			const previousMonthTime = userTime.subtract({ months: 1 });
			const { month, year, daysInMonth } = previousMonthTime;
			const firstVisibleDay = daysInMonth - monthDayOffset + 1;
			for (let i = firstVisibleDay; i <= daysInMonth; ++i, ++j) {
				dayGrid[j].day = i;
				dayGrid[j].month = month;
				dayGrid[j].year = year;
			}
		}

		// current month:
		{
			const { month, daysInMonth } = userTime;
			for (let i = 1; i <= daysInMonth; ++i, ++j) {
				dayGrid[j].day = i;
				dayGrid[j].month = month;
			}
		}

		// next month:
		{
			const { month, year } = userTime.add({ months: 1 });
			for (let i = 1; j < dayGrid.length; ++i, ++j) {
				dayGrid[j].day = i;
				dayGrid[j].month = month;
				dayGrid[j].year = year;
			}
		}

		return dayGrid;
	});

	function selectDay(day: number, month: number): void {
		$userTime = $userTime.with({ day, month });
		goto("/view/day");
	}

	const calendars = getContext("calendars");
	const computedCalendars = getContext("computedCalendars");

	// month (spread) => day (spread) => events
	let allDayEvents: [ComputedCalendarEvent, Temporal.ZonedDateTime][] = [];
	let monthEvents: Map<number, Map<number, ComputedCalendarEvent[]>> = new Map();
	const { rangeStart, rangeEnd } = createBoundaryTimes(days, userTime);
	createEventUpdater({
		stores: [calendars, computedCalendars, rangeStart, rangeEnd],
		cleanup() {
			allDayEvents = [];
			monthEvents.clear();
		},
		setEvent(time, event) {
			if (event.duration.minutes >= 24 * 60) {
				allDayEvents.push([event, time]);
				return;
			}

			const { day, month } = time;

			let dayEvents = monthEvents.get(month);
			if (!dayEvents) {
				dayEvents = new Map();
				monthEvents.set(month, dayEvents);
			}

			const events = dayEvents.get(day);
			if (events) {
				events.push(event);
			} else {
				dayEvents.set(day, [event]);
			}
		},
		finish() {
			monthEvents = monthEvents;
			allDayEvents = allDayEvents;
		},
	});

	const dayEventElementMargin = 18;
	const dayEventsElements: HTMLElement[] = [];
	let phantomEventChip: HTMLElement;
	let phantomElements = new Set<HTMLElement>();
	const allDayEventChipReseter = () => {
		for (const element of dayEventsElements)
			if (element) element.style.top = `${dayEventElementMargin}px`;

		for (const element of phantomElements) element.remove();
		phantomElements.clear();
	};
	beforeUpdate(allDayEventChipReseter);
	setEventChipReseter(allDayEventChipReseter);
	onDestroy(resetEventChipReseter);

	// This queue is needed so we render events sorted
	// by the earliest start and by longest duration
	// so it renders in a nicer way
	const eventPlaceQueue: ComputedCalendarEvent[] = [];
	const allDayEventChipPlacer: EventChipPlacer<Temporal.ZonedDateTime> = async (
		node,
		event,
		context,
	) => {
		let place = eventPlaceQueue.length;
		eventPlaceQueue.push(event);
		await tick(); // wait for all elements to be pushed into the queue
		if (place === 0) {
			// Sort it only when its the first element to not redo unnecessary work
			eventPlaceQueue.sort(
				(a, b) =>
					Temporal.ZonedDateTime.compare(a.start, b.start) || b.duration.minutes - a.duration.minutes,
			);
		}
		while (eventPlaceQueue[0] !== event) await tick();
		eventPlaceQueue.shift();

		const siblings = node?.parentElement?.children;
		if (!siblings) {
			console.warn("Couldn't find siblings for month all day event chips");
			return;
		}

		let durationDays = event.duration.minutes / 60 / 24;

		let index = dayGrid.findIndex((md) => md.month === context!.month && md.day === context!.day);
		let startsBeforeThisRange = false;
		if (index === -1) {
			// Event starts before rangeStart
			// So we offset it, so it starts in current range
			const offset =
				$rangeStart.temporal.since(event.start, {
					largestUnit: "minute",
					smallestUnit: "minute",
					roundingMode: "halfExpand",
				}).minutes /
				60 /
				24;

			durationDays -= offset;

			startsBeforeThisRange = true;
			index = 0;
		}

		const spacer = dayEventsElements[index];
		const rect = spacer.getBoundingClientRect();
		let width = rect.width + 1;
		const height = node.clientHeight;
		let top = rect.top;
		const left = rect.left;
		let leftRadius = "0";
		let rightRadius = "0";

		if (!startsBeforeThisRange) {
			leftRadius = "8px";
		}

		// Event should wrap, because it takes longer than available days in its week row
		if (durationDays > 7 - event.start.dayOfWeek) {
			const weekDurationDays = startsBeforeThisRange ? 7 : 8 - event.start.dayOfWeek;
			width *= weekDurationDays;
			let remainingDuration = durationDays - weekDurationDays;

			// This means that we have:
			// - Element which is {weekDurationDays} long, it is a real EventChip
			// - {remainingDuration}/7 phantom EventChips, which are wrapped on later lines

			// If the real element takes some time
			// Then we have to adjust the amount of space it takes
			if (weekDurationDays) {
				for (let i = 0; i < weekDurationDays; ++i) {
					const spacer = dayEventsElements[index + i];
					if (!spacer) break;
					const spacerTop = +spacer.style.top.slice(0, -2);
					spacer.style.top = `${spacerTop + height + 2}px`;
				}
			}

			// Now we create the wrapped phantom elements representing our event
			for (
				let i = startsBeforeThisRange ? 1 : 0;
				remainingDuration > 0;
				remainingDuration -= 7, i += 1
			) {
				const startIndex = Math.ceil(index / 7) * 7 + i * 7;
				const dayEventElement = dayEventsElements[startIndex];
				if (!dayEventElement) {
					break;
				}

				if (!phantomEventChip) {
					phantomEventChip = document.createElement("div");
					phantomEventChip.style.position = "fixed";
					phantomEventChip.style.borderRadius = "0";
					phantomEventChip.classList.add("all-day", "phantom-event-chip", "md-typescale-label-medium");
				}

				const phantomEvent = phantomEventChip.cloneNode(false) as HTMLElement;
				phantomEvent.style.setProperty("--color", node.style.getPropertyValue("--color"));
				phantomEvent.textContent = event.title;

				// Get position before adjusting dayEventElements heights
				const thisRowDuration = Math.min(remainingDuration, 7);
				let { top, left, width } = dayEventElement.getBoundingClientRect();
				width = width * thisRowDuration;

				// Adjust every dayEventElement's `top` in this row
				// So that it fits allDayEvents nicely
				for (let i = 0; i < thisRowDuration; ++i) {
					const dayEventElement = dayEventsElements[startIndex + i];
					const currentTop = +dayEventElement.style.top.slice(0, -2);
					dayEventElement.style.top = `${currentTop + height + 3}px`;
				}

				phantomEvent.style.top = `${top}px`;
				phantomEvent.style.left = `${left}px`;
				// Round corners of event when its ending
				// And make width a bit smaller so the roundness is more pronounced
				if (remainingDuration < 7) {
					phantomEvent.style.borderTopRightRadius = "8px";
					phantomEvent.style.borderBottomRightRadius = "8px";
					width -= 6;
				}

				phantomEvent.style.width = `${width}px`;

				node.parentElement.appendChild(phantomEvent);
				phantomElements.add(phantomEvent);
			}
		} else {
			width *= durationDays;
			for (let i = 0; i < durationDays; ++i) {
				const spacer = dayEventsElements[index + i];
				const spacerTop = +spacer.style.top.slice(0, -2);
				spacer.style.top = `${spacerTop + height + 3}px`;
			}

			rightRadius = "8px";
		}

		node.style.position = "fixed";
		node.style.top = `${top}px`;
		node.style.left = `${left}px`;
		node.style.width = `${width}px`;
		node.style.borderTopLeftRadius = leftRadius;
		node.style.borderBottomLeftRadius = leftRadius;
		node.style.borderTopRightRadius = rightRadius;
		node.style.borderBottomRightRadius = rightRadius;
	};
</script>

<section id="calendar-month-grid">
	<div class="days-of-the-week">
		{#each narrowWeekdayNames as weekday}
			<h1 class="weekday md-typescale-title-large">{weekday}</h1>
		{/each}
	</div>

	{#if allDayEvents.length}
		<div class="all-day-events">
			{#each allDayEvents as [event, time]}
				<EventChip {event} context={time} placer={allDayEventChipPlacer} />
			{/each}
		</div>
	{/if}

	<div class="days">
		{#each $days as { day, month }, i}
			{@const events = monthEvents.get(month)?.get(day)}
			{@const current = month === $userTime.month}
			{@const selected = current && $userTime.day === day}
			{@const today = current && browsingSamePeriod && todayTime.day === day}

			<button
				class="day-button"
				class:not-current-month={!current}
				class:today={!selected && today}
				class:selected
				on:click={() => selectDay(day, month)}
			>
				<md-focus-ring />
				<md-ripple />

				<h1 class="day-headline md-typescale-title-small">{day}</h1>

				<div class="day-events" bind:this={dayEventsElements[i]}>
					{#if events}
						{#each events as event (event.id)}
							<EventChip {event} />
						{/each}
					{/if}
				</div>
			</button>
		{/each}
	</div>
</section>

<style>
	#calendar-month-grid {
		--event-chip-font-size: 1.15vh;

		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		overflow-x: hidden;
		z-index: 0;

		& > .all-day-events {
			pointer-events: none;
			position: fixed;
			z-index: 2;
		}

		& > .days,
		& > .days-of-the-week {
			display: grid;
			grid-template-columns: repeat(7, calc(100% / 7));
		}

		--cell-border-style: 1px solid var(--md-sys-color-outline-variant);

		& > .days-of-the-week {
			& > .weekday {
				display: flex;
				justify-content: center;
				align-items: center;

				margin: 0;
				border-right: var(--cell-border-style);
			}
		}

		& > .days {
			height: 100%;
			grid-template-rows: repeat(6, calc(100% / 6));
		}
	}

	.day-button {
		position: relative;

		display: flex;
		flex-direction: column;
		justify-content: start;
		align-items: center;
		overflow: hidden;

		cursor: pointer;
		padding: 0;

		&:focus-within {
			z-index: 1;
		}

		transition: background-color var(--md-transition-timing-function) var(--md-transition-duration);

		border: none;
		outline: none;
		--md-focus-ring-shape: 0px;

		border-bottom: var(--cell-border-style);
		border-right: var(--cell-border-style);

		background-color: var(--md-sys-color-surface);
		color: var(--md-sys-color-on-surface);

		&.not-current-month {
			/** 12% opacity surface-variant */
			background-color: color-mix(
				in srgb,
				var(--md-sys-color-surface-variant) 25%,
				var(--md-sys-color-surface)
			);
		}

		&.today {
			color: var(--md-sys-color-primary);
			outline: 1px solid var(--md-sys-color-primary);
			outline-offset: -1px;

			&:hover {
				/** 8% opacity primary */
				background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
			}

			&:focus,
			&:active {
				/** 12% opacity primary */
				background-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
			}
		}

		&.selected {
			background-color: var(--md-sys-color-primary);
			color: var(--md-sys-color-on-primary);

			&:hover,
			&:focus,
			&:active {
				color: var(--md-sys-color-on-primary);
			}
		}

		& > .day-headline {
			margin: 0;
		}

		& > .day-events {
			position: absolute;
			top: 18px;
			pointer-events: none;

			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			align-items: start;
			justify-content: center;
			gap: 3px;

			width: 100%;

			& > .event-chip {
				padding: 0;
				padding-inline: 3px;

				& > .label {
					font-size: var(--event-chip-font-size);
					line-height: 1.4;
					text-wrap: nowrap;
				}
			}
		}
	}

	:global(.event-chip.all-day) {
		padding: 0;
		padding-inline: 4px;

		& > .label {
			font-size: var(--event-chip-font-size);
			line-height: 1.2;
			text-wrap: nowrap;
		}
	}

	:global(.phantom-event-chip) {
		padding: 0;
		padding-inline: 4px;

		font-size: var(--event-chip-font-size);
		line-height: 1.2;
	}
</style>
