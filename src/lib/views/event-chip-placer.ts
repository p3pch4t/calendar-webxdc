import type { EventChipPlacer } from "$lib/components/EventChip.svelte";
import { Temporal } from "temporal-polyfill";
import type { BoundaryTime } from "./event-range-updater";

export function createAllDayEventChipPlacer(
	rangeStart: BoundaryTime,
	view: "day" | "week",
): EventChipPlacer<Temporal.ZonedDateTime> {
	return (node, event, context) => {
		const siblings = node.parentElement?.children;
		if (!siblings) {
			console.warn("Couldn't find siblings for all-day event chip");
			return;
		}
		let elementPosition = 0;
		for (const sibling of siblings) {
			if (sibling === node) break;
			++elementPosition;
		}

		const start = context ?? event.start;

		const startsInCurrentRange = Temporal.ZonedDateTime.compare(start, rangeStart.temporal) >= 0;

		let dayDuration = event.duration.minutes / 60 / 24;
		if (!startsInCurrentRange) {
			const untilRange = start.until(rangeStart.temporal).round({
				largestUnit: "minute",
				smallestUnit: "minute",
				roundingMode: "halfExpand",
			});
			dayDuration -= untilRange.minutes / 60 / 24;
		}

		const dayRatio = view === "week" ? dayDuration / 7 : dayDuration;

		const height = (1 / siblings.length) * 100;
		const top = height * elementPosition;

		let leftRadius = "8px";
		let rightRadius = "8px";

		let left = 0;
		if (!startsInCurrentRange) {
			leftRadius = "0";
		} else if (view === "week") {
			left = ((start.dayOfWeek - 1) / 7) * 100;
		}

		let width = dayRatio * 100;
		if (width > 100) {
			// Goes besides current range
			width = 100 - left;
			rightRadius = "0";
		}

		const topAdjustment = elementPosition;
		const containerHeight = siblings.length * 18;

		node.style.top = `calc(${top}% + ${topAdjustment}px)`;
		node.style.left = `${left}%`;
		node.style.width = `${width}%`;
		node.style.height = `calc(${height}% - 1px)`;

		node.style.borderTopLeftRadius = leftRadius;
		node.style.borderBottomLeftRadius = leftRadius;
		node.style.borderTopRightRadius = rightRadius;
		node.style.borderBottomRightRadius = rightRadius;

		node.parentElement.style.height = `${containerHeight}px`;
	};
}

export interface HourElements {
	hourCellElement?: Element;
	hourRowElement?: Element;
	hourContainerElement?: Element;
}

export function createEventChipPlacer(
	hourElements: HourElements,
	view: "day" | "week",
): EventChipPlacer<Temporal.ZonedDateTime> {
	return (node, event, context) => {
		const { hourRowElement, hourContainerElement, hourCellElement } = hourElements;

		if (!hourRowElement || !hourContainerElement || !hourCellElement) {
			console.warn("Couldn't find hourRowElement, hourContainerElement or hourCellElement");
			return;
		}

		const siblings = node.parentElement?.children;
		if (!siblings) {
			console.warn("Couldn't find siblings for event chip");
			return;
		}
		let elementPosition = 0;
		for (const sibling of siblings) {
			if (sibling === node) break;
			++elementPosition;
		}

		const rowHeight = hourRowElement.getBoundingClientRect().height;
		const containerWidth = hourContainerElement.getBoundingClientRect().width;
		const hourCellWidth = hourCellElement.getBoundingClientRect().width;

		const minuteHeight = rowHeight / 60;

		const { minutes } = event.duration;

		const height = Math.max(16, minuteHeight * minutes - 2);
		let width = (1 / siblings.length) * containerWidth;

		const start = context ?? event.start;

		const top = minuteHeight * (start.hour * 60 + start.minute);

		let left = width * elementPosition;
		let widthAdjustment = 0;
		if (view === "day" && width > 50) {
			const heightRatio = height / (rowHeight * 24);
			widthAdjustment = (1 - heightRatio) * 20;
		}
		width -= widthAdjustment;

		let leftAdjustment = hourCellWidth + widthAdjustment / 2;
		if (view === "week") {
			leftAdjustment += (start.dayOfWeek - 1) * containerWidth;
		}
		left += leftAdjustment;

		node.style.top = `${top}px`;
		node.style.left = `${left}px`;
		node.style.width = `${width}px`;
		node.style.height = `${height}px`;
	};
}
