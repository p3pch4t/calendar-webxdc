import type { TimeJsonData } from "ical.js";

export enum EventDeleteMode {
	NonRecurring,
	RecurringThis,
	RecurringSince,
	RecurringAll,
}

export interface DeleteCalendarEventOptions {
	mode: EventDeleteMode;
	time?: TimeJsonData;
}
