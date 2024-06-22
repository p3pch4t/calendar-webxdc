import { derived, type Readable } from "svelte/store";
import ICAL from "ical.js";
import { Temporal } from "temporal-polyfill";
import {
	type ComputedCalendar,
	type ComputedCalendarEvent,
	ICALJsonToZonedDateTime,
	localTimeZone,
	zonedDateTimeToICALTime,
	type Calendar,
} from "$lib/calendars";
import { onDestroy } from "svelte";

export interface MonthDay {
	month: number;
	day: number;
	year?: number;
}

export interface BoundaryTime {
	ical: ICAL.Time;
	temporal: Temporal.ZonedDateTime;
}

export interface BoundaryTimesOutput {
	rangeStart: Readable<BoundaryTime>;
	rangeEnd: Readable<BoundaryTime>;
}

export function createBoundaryTimes(
	days: Readable<MonthDay[]>,
	userTime: Readable<Temporal.ZonedDateTime>,
): BoundaryTimesOutput {
	const _rangeStart = {} as BoundaryTime;
	const rangeStart = derived([days, userTime], ([days, userTime]) => {
		const { day, month, year = userTime.year } = days[0];
		_rangeStart.ical = ICAL.Time.fromData({ year, month, day });
		_rangeStart.temporal = ICALJsonToZonedDateTime(_rangeStart.ical.toJSON(), localTimeZone);
		return _rangeStart;
	});

	const _rangeEnd = {} as BoundaryTime;
	const rangeEnd = derived([days, userTime], ([days, userTime]) => {
		const { day, month, year = userTime.year } = days.at(-1)!;
		_rangeEnd.ical = ICAL.Time.fromData({ year, month, day, hour: 23, minute: 59, second: 59 });
		_rangeEnd.temporal = ICALJsonToZonedDateTime(_rangeEnd.ical.toJSON(), localTimeZone);
		return _rangeEnd;
	});

	return { rangeStart, rangeEnd };
}

interface CreateEventUpdaterOptions {
	stores: [
		calendars: Readable<Calendar[]>,
		computedCalendars: Readable<WeakMap<Calendar, ComputedCalendar>>,
		rangeStart: Readable<BoundaryTime>,
		rangeEnd: Readable<BoundaryTime>,
	];
	cleanup(): void;
	finish(): void;
	setEvent: (time: Temporal.ZonedDateTime, event: ComputedCalendarEvent) => void;
}

export function createEventUpdater({
	stores,
	cleanup,
	finish,
	setEvent,
}: CreateEventUpdaterOptions): void {
	let i = 0;
	onDestroy(
		derived(stores, ([calendars, computedCalendars, rangeStart, rangeEnd]) => {
			cleanup();

			for (const calendar of calendars) {
				const computedCalendar = computedCalendars.get(calendar);
				if (!computedCalendar?.visible) continue;

				for (const event of computedCalendar.events) {
					if (event.recurrence) {
						const { iterator, exclude } = event.recurrence;

						const recurrenceStart = zonedDateTimeToICALTime(event.start, localTimeZone);
						const iter = iterator(recurrenceStart);

						let next: ICAL.Time;
						outer: while ((next = iter.next())) {
							if (next.compare(rangeEnd.ical) > 0) {
								// Event is yet to happen
								if (next.compare(rangeStart.ical) < 0) continue;
								// Event already passed
								break;
							}

							if (exclude?.length) {
								for (const excluded of exclude) {
									if (icalEquals(excluded.isDate, excluded, next)) {
										continue outer;
									}
								}
							}

							// We create our own object because ical.js reuses its objects
							const time = Temporal.ZonedDateTime.from({
								minute: next.minute,
								day: next.day,
								hour: next.hour,
								month: next.month,
								year: next.year,
								timeZone: localTimeZone,
							});

							const timeEnd = time.add(event.duration);

							// Event has finished/new event reccurene already takes its time
							if (Temporal.ZonedDateTime.compare(timeEnd, rangeStart.temporal) <= 0) {
								continue;
							}

							setEvent(time, event);
						}

						continue;
					}

					// Event already happened (event_start < range_start && event_end < range_start)
					if (
						Temporal.ZonedDateTime.compare(event.start, rangeStart.temporal) < 0 &&
						Temporal.ZonedDateTime.compare(event.end, rangeStart.temporal) < 0
					) {
						continue;
					}

					// Event is yet to happen (event_start > range_end && event_end > range_end)
					if (
						Temporal.ZonedDateTime.compare(event.start, rangeEnd.temporal) > 0 &&
						Temporal.ZonedDateTime.compare(event.end, rangeEnd.temporal) > 0
					) {
						continue;
					}

					setEvent(event.start, event);
				}
			}

			return ++i;
		}).subscribe(finish),
	);
}

function icalEquals(date: boolean, a: ICAL.Time, b: ICAL.Time): boolean {
	if (date) {
		return a.year === b.year && a.month === b.month && a.day === b.day;
	} else {
		return a.compare(b) === 0;
	}
}
