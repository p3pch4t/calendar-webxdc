import ICAL from "ical.js";
import { Temporal } from "temporal-polyfill";

export function generateRandomID(): string {
	const bytes = crypto.getRandomValues(new Uint32Array(5));
	const strings = Array.from(bytes).map((x) => x.toString(16));
	return strings.join("-");
}

const localTimeZoneId = Temporal.Now.timeZoneId();
export const localTimeZone = Temporal.TimeZone.from(localTimeZoneId);

export const gmtOffset = localTimeZone.getOffsetStringFor!(Temporal.Now.instant()).replace(
	":00",
	"",
);

export interface Calendar {
	readonly id: string;
	name: string;
	description?: string;
	events: CalendarEvent[];
	hue: number;
}

export type CalendarChanges = Partial<Omit<Calendar, "id" | "events">>;

interface CalendarEventRecurrence {
	freq?: ICAL.FrequencyValues;
	until?: ICAL.TimeJsonData;
	byDay?: boolean[];
	exclude?: ICAL.TimeJsonData[];
}
export interface CalendarEvent {
	readonly id: string;

	title: string;
	description?: string;
	location?: string;

	start: ICAL.TimeJsonData;
	end: ICAL.TimeJsonData;
	recurrence?: CalendarEventRecurrence;
}

export type CalendarEventChanges = Partial<Omit<CalendarEvent, "id">>;

export function ICALJsonToZonedDateTime(
	time: ICAL.TimeJsonData,
	icalTimeZone: Temporal.TimeZoneLike = "UTC",
	toTimeZone: Temporal.TimeZoneLike = localTimeZone,
): Temporal.ZonedDateTime {
	const icalZonedDateTime = Temporal.ZonedDateTime.from({ ...time, timeZone: icalTimeZone });
	if (toTimeZone === icalTimeZone) return icalZonedDateTime;
	return icalZonedDateTime.withTimeZone(toTimeZone);
}

export function zonedDateTimeToICALJsonData(
	zonedDateTime: Temporal.ZonedDateTime,
	toTimeZone: Temporal.TimeZoneLike = "UTC",
): ICAL.TimeJsonData {
	const withTimeZone = zonedDateTime.withTimeZone(toTimeZone);
	return {
		year: withTimeZone.year,
		month: withTimeZone.month,
		day: withTimeZone.day,
		hour: withTimeZone.hour,
		minute: withTimeZone.minute,
		second: withTimeZone.second,
	};
}

export function zonedDateTimeToICALTime(
	zonedDateTime: Temporal.ZonedDateTime,
	toTimeZone: Temporal.TimeZoneLike = "UTC",
): ICAL.Time {
	return ICAL.Time.fromData(zonedDateTimeToICALJsonData(zonedDateTime, toTimeZone));
}

export function icalEventToCalendarEvent(
	event: ICAL.Event,
	exdates?: ICAL.Time[],
	recurData?: ICAL.RecurData,
): CalendarEvent {
	return {
		id: generateRandomID(),

		title: event.summary,
		description: event.description,
		location: event.location,

		start: event.startDate.toJSON(),
		end: event.endDate.toJSON(),
		recurrence: recurData
			? {
					freq: recurData?.freq,
					until: recurData?.until?.toJSON(),
					exclude: exdates?.map((time) => time.toJSON()),
				}
			: undefined,
	};
}

export function icalComponentToCalendar(component: ICAL.Component): Calendar {
	const name =
		component.getFirstPropertyValue("x-wr-calname") ?? component.getFirstPropertyValue("name");

	const description =
		component.getFirstPropertyValue("x-wr-caldesc") ?? component.getFirstPropertyValue("description");

	const events = component.getAllSubcomponents("vevent")?.map((component) => {
		const exdates = component.getFirstProperty("exdate")?.getValues();
		const rrule: ICAL.RecurData = component.getFirstPropertyValue("rrule");
		return icalEventToCalendarEvent(new ICAL.Event(component), exdates, rrule);
	});

	const hue = ~~(Math.random() * 360);

	return {
		id: generateRandomID(),
		name,
		hue,
		description,
		events,
	};
}

export function parseRecurrence(recurData?: CalendarEventRecurrence): ICAL.Recur | undefined {
	const options: ICAL.RecurData = {};

	if (recurData?.freq) {
		options.freq = recurData.freq;
	} else {
		return;
	}

	if (recurData.until) {
		options.until = new ICAL.Time(recurData.until);
	}

	if (recurData.byDay?.length) {
		const [mo, tu, we, th, fr, sa, su] = recurData.byDay;

		const byday = [];
		if (mo) byday.push("MO");
		if (tu) byday.push("TU");
		if (we) byday.push("WE");
		if (th) byday.push("TH");
		if (fr) byday.push("FR");
		if (sa) byday.push("SA");
		if (su) byday.push("SU");

		if (byday.length) options.byday = byday;
	}

	return new ICAL.Recur(options);
}

export function calendarToIcalComponent(calendar: Calendar): ICAL.Component {
	const vcalendar = new ICAL.Component("vcalendar");

	vcalendar.addPropertyWithValue("x-wr-timezone", "UTC");
	vcalendar.addPropertyWithValue("tzid", "UTC");

	vcalendar.addPropertyWithValue("x-wr-calname", calendar.name);
	vcalendar.addPropertyWithValue("name", calendar.name);

	if (calendar.description) {
		vcalendar.addPropertyWithValue("x-wr-caldesc", calendar.description);
		vcalendar.addPropertyWithValue("description", calendar.description);
	}

	for (const event of calendar.events) {
		const vevent = new ICAL.Component("vevent");
		vevent.addPropertyWithValue("summary", event.title);
		vevent.addPropertyWithValue("dtstart", ICAL.Time.fromData(event.start));
		vevent.addPropertyWithValue("dtend", ICAL.Time.fromData(event.end));
		if (event.description) {
			vevent.addPropertyWithValue("description", event.description);
		}
		if (event.recurrence?.freq) {
			if (event.recurrence.exclude) {
				const exdate = new ICAL.Property("exdate");
				exdate.setValues(event.recurrence.exclude.map((time) => new ICAL.Time(time)));
				vevent.addProperty(exdate);
			}

			vevent.addPropertyWithValue("rrule", parseRecurrence(event.recurrence)!);
		}
		if (event.location) {
			vevent.addPropertyWithValue("location", event.location);
		}

		vcalendar.addSubcomponent(vevent);
	}

	return vcalendar;
}

interface ComputedRecurrence {
	iterator: (startTime?: ICAL.Time) => ICAL.RecurIterator;
	exclude?: ICAL.Time[];
}

export interface ComputedCalendar extends Omit<Calendar, "events"> {
	visible: boolean;
	events: ComputedCalendarEvent[];
	get color(): string;
}

export interface ComputedCalendarEvent extends Omit<CalendarEvent, "recurrence"> {
	start: Temporal.ZonedDateTime;
	end: Temporal.ZonedDateTime;
	duration: Temporal.Duration;
	recurrence?: ComputedRecurrence;
	hue: number;
	get color(): string;

	associatedCalendar: WeakRef<Calendar>;
	associatedEvent: WeakRef<CalendarEvent>;
}

function computeRecurrence(recurData?: CalendarEventRecurrence): ComputedRecurrence | undefined {
	const recur = parseRecurrence(recurData);
	if (!recur) return;

	// We don't want to store whole Recur
	// So we take just the function
	// Because it uses this, we have to bind it
	// so it doesn't loose context
	return {
		iterator: recur.iterator.bind(recur),
		exclude: recurData!.exclude?.map((time) => new ICAL.Time(time)),
	};
}

function computeCalendarEvent(
	calendar: Calendar,
	event: CalendarEvent,
	currentlyComputed?: ComputedCalendarEvent,
): ComputedCalendarEvent {
	// Since ical.js requires additional packages to do timezone conversion
	// We just utilize Temporal, which has this functionality built-in to do so
	const start = Temporal.ZonedDateTime.from({ ...event.start, timeZone: "UTC" }).withTimeZone(
		localTimeZone,
	);
	const end = Temporal.ZonedDateTime.from({ ...event.end, timeZone: "UTC" }).withTimeZone(
		localTimeZone,
	);

	const duration = end.since(start, {
		smallestUnit: "minute",
		largestUnit: "minute",
		roundingMode: "halfExpand",
	});

	if (currentlyComputed) {
		currentlyComputed.title = event.title;
		currentlyComputed.description = event.description;
		currentlyComputed.location = event.location;
		currentlyComputed.start = start;
		currentlyComputed.end = end;
		currentlyComputed.duration = duration;
		currentlyComputed.recurrence = computeRecurrence(event.recurrence);
		currentlyComputed.hue = calendar.hue;

		return currentlyComputed;
	}

	return {
		id: event.id,

		title: event.title,
		description: event.description,
		location: event.location,

		start,
		end,
		duration,
		recurrence: computeRecurrence(event.recurrence),

		hue: calendar.hue,
		get color() {
			return `hsl(${this.hue}deg, 50%, 50%)`;
		},

		associatedCalendar: new WeakRef(calendar),
		associatedEvent: new WeakRef(event),
	};
}

export function computeCalendar(
	calendar: Calendar,
	currentlyComputed?: ComputedCalendar,
): ComputedCalendar {
	if (currentlyComputed) {
		currentlyComputed.name;
		currentlyComputed.description = calendar.description;
		currentlyComputed.hue = calendar.hue;
		currentlyComputed.events = calendar.events.map((event) => {
			// We'll see if this is fast enough
			const currentlyComputedEvent = currentlyComputed.events.find((e) => e.id === event.id);
			return computeCalendarEvent(calendar, event, currentlyComputedEvent);
		});
		return currentlyComputed;
	}

	return {
		id: calendar.id,

		name: calendar.name,
		description: calendar.description,

		visible: true,
		events: calendar.events.map((event) => computeCalendarEvent(calendar, event)),

		hue: calendar.hue,
		get color() {
			return `hsl(${this.hue}deg, 50%, 50%)`;
		},
	};
}
