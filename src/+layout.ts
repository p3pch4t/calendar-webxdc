// Typing for {get,set}Context
import type { Temporal } from "temporal-polyfill";
import type { Readable, Writable } from "svelte/store";
import type { ViewState } from "$lib/views/shared";
import type {
	Calendar,
	CalendarChanges,
	CalendarEvent,
	CalendarEventChanges,
	ComputedCalendar,
} from "$lib/calendars";
import type { DeleteCalendarEventOptions } from "$lib/webxdc/shared";

declare module "svelte" {
	interface Context {
		currentView: Writable<ViewState>;
		userTime: Writable<Temporal.ZonedDateTime>;

		calendarFunctions: {
			addCalendar(calendar: Calendar): void;
			editCalendar(calendar: Calendar, changes: CalendarChanges): void;
			deleteCalendar(calendar: Calendar): void;

			addCalendarEvent(calendar: Calendar, event: CalendarEvent): void;
			editCalendarEvent(calendar: Calendar, event: CalendarEvent, changes: CalendarEventChanges): void;
			deleteCalendarEvent(
				calendar: Calendar,
				event: CalendarEvent,
				options: DeleteCalendarEventOptions,
			): void;
		};
		calendars: Writable<Calendar[]>;
		computedCalendars: Readable<WeakMap<Calendar, ComputedCalendar>>;

		selectedCalendar: Writable<Calendar>;
		selectedEvent: Writable<CalendarEvent>;
	}

	export function getContext<T extends keyof Context>(key: T): Context[T];
	export function setContext<T extends keyof Context>(key: T, context: Context[T]): Context[T];
}

// Typing for webxdc
import type { Webxdc } from "../static/webxdc";

interface BasicPayload {
	timestamp: number;
}

interface AddCalendarPayload extends BasicPayload {
	kind: "addCalendar";
	calendar: Calendar;
}

interface EditCalendarPayload extends BasicPayload {
	kind: "editCalendar";
	calendarId: string;
	changes: CalendarChanges;
}

interface DeleteCalendarPayload extends BasicPayload {
	kind: "deleteCalendar";
	calendarId: string;
}

interface AddCalendarEventPayload extends BasicPayload {
	kind: "addCalendarEvent";
	calendarId: string;
	event: CalendarEvent;
}

interface EditCalendarEventPayload extends BasicPayload {
	kind: "editCalendarEvent";
	calendarId: string;
	eventId: string;
	changes: CalendarEventChanges;
}

interface DeleteCalendarEventPayload extends BasicPayload, DeleteCalendarEventOptions {
	kind: "deleteCalendarEvent";
	calendarId: string;
	eventId: string;
}

type AnyPayload =
	| AddCalendarPayload
	| EditCalendarPayload
	| DeleteCalendarPayload
	| AddCalendarEventPayload
	| EditCalendarEventPayload
	| DeleteCalendarEventPayload;

declare global {
	type WebxdcPayload = AnyPayload;

	interface Window {
		webxdc: Webxdc<AnyPayload>;
	}
}
