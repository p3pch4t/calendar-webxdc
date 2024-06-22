<script lang="ts">
	import { EventDeleteMode } from "$lib/webxdc/shared";

	import { onMount, setContext } from "svelte";
	import { derived, writable } from "svelte/store";

	import { Temporal } from "temporal-polyfill";

	import "@material/web/fab/fab";
	import "@material/web/button/filled-button";
	import "@material/web/iconbutton/icon-button";
	import "@material/web/checkbox/checkbox";
	import { styles as typescaleStyles } from "@material/web/typography/md-typescale-styles";

	import "$lib/components/ThemeSwitcher.svelte";
	import { computeCalendar } from "$lib/calendars";

	const userTime = setContext("userTime", writable(Temporal.Now.zonedDateTimeISO()));

	setContext("selectedCalendar", writable());
	setContext("selectedEvent", writable());

	const calendars = setContext("calendars", writable([]));
	const map = new WeakMap();
	setContext(
		"computedCalendars",
		derived(calendars, (calendars) => {
			for (const calendar of calendars) {
				map.set(calendar, computeCalendar(calendar, map.get(calendar)));
			}
			return map;
		}),
	);

	onMount(() => {
		window.webxdc.setUpdateListener((update) => {
			const { payload } = update;

			switch (payload.kind) {
				case "addCalendar":
					$calendars.push(payload.calendar);
					break;
				case "editCalendar": {
					const { calendarId, changes } = payload;

					const calendar = $calendars.find((calendar) => calendar.id === calendarId);
					if (!calendar) return;

					Object.assign(calendar, changes);
					break;
				}
				case "deleteCalendar": {
					const { calendarId } = payload;

					const calendarIndex = $calendars.findIndex((calendar) => calendar.id === calendarId);
					if (calendarIndex === -1) return;

					$calendars.splice(calendarIndex, 1);
					break;
				}

				case "addCalendarEvent": {
					const { calendarId } = payload;

					const calendar = $calendars.find((calendar) => calendar.id === calendarId);
					if (!calendar) return;

					calendar.events.push(payload.event);
					break;
				}
				case "editCalendarEvent": {
					const { calendarId, eventId, changes } = payload;

					const calendar = $calendars.find((calendar) => calendar.id === calendarId);
					if (!calendar) return;

					const event = calendar.events.find((event) => event.id === eventId);
					if (!event) return;

					const recurrence = event.recurrence;
					if (recurrence && changes.recurrence) {
						// Preserve previous recurrence properties from event
						Object.assign(recurrence, changes.recurrence);
						Object.assign(event, changes);
						Object.assign(event, { recurrence });
					} else {
						Object.assign(event, changes);
					}
					break;
				}
				case "deleteCalendarEvent": {
					const { calendarId, eventId, mode, time } = payload;

					const calendar = $calendars.find((calendar) => calendar.id === calendarId);
					if (!calendar) return;

					const eventIndex = calendar.events.findIndex((event) => event.id === eventId);
					if (eventIndex === -1) return;

					switch (mode) {
						case EventDeleteMode.NonRecurring:
						case EventDeleteMode.RecurringAll:
							calendar.events.splice(eventIndex, 1);
							break;
						case EventDeleteMode.RecurringThis: {
							if (!time) {
								console.error(
									"Tried to delete event with EventDeleteMode.RecurringSince but no `time` has been set",
								);
								break;
							}

							const event = calendar.events[eventIndex];
							if (!event.recurrence) {
								console.error("Tried to delete non-recurring event with EventDeleteMode.RecurringThis");
								break;
							}

							event.recurrence.exclude ??= [];
							event.recurrence.exclude.push({
								...time,
								isDate: true,
							});
							break;
						}
						case EventDeleteMode.RecurringSince: {
							if (!time) {
								console.error(
									"Tried to delete event with EventDeleteMode.RecurringSince but no `time` has been set",
								);
								break;
							}

							const event = calendar.events[eventIndex];
							if (!event.recurrence) {
								console.error("Tried to delete non-recurring event with EventDeleteMode.RecurringSince");
								break;
							}

							event.recurrence.until = time;
							break;
						}
					}

					break;
				}
			}

			$calendars = $calendars;
		});
	});

	setContext("calendarFunctions", {
		addCalendar(calendar) {
			const payload: WebxdcPayload = {
				kind: "addCalendar",
				timestamp: Date.now(),
				calendar,
			};
			window.webxdc.sendUpdate({ payload }, `Added calendar "${calendar.name}"`);
		},
		editCalendar(calendar, changes) {
			const payload: WebxdcPayload = {
				kind: "editCalendar",
				timestamp: Date.now(),
				calendarId: calendar.id,
				changes,
			};
			window.webxdc.sendUpdate({ payload }, `Edited calendar "${calendar.name}"`);
		},
		deleteCalendar(calendar) {
			const payload: WebxdcPayload = {
				kind: "deleteCalendar",
				timestamp: Date.now(),
				calendarId: calendar.id,
			};
			window.webxdc.sendUpdate({ payload }, `Deleted calendar "${calendar.name}"`);
		},

		addCalendarEvent(calendar, event) {
			const payload: WebxdcPayload = {
				kind: "addCalendarEvent",
				timestamp: Date.now(),
				calendarId: calendar.id,
				event,
			};
			window.webxdc.sendUpdate(
				{ payload },
				`Added event "${event.title}" to calendar "${calendar.name}"`,
			);
		},
		editCalendarEvent(calendar, event, changes) {
			const payload: WebxdcPayload = {
				kind: "editCalendarEvent",
				timestamp: Date.now(),
				calendarId: calendar.id,
				eventId: event.id,
				changes,
			};

			window.webxdc.sendUpdate(
				{ payload },
				`Edit event "${event.title}" in calendar "${calendar.name}"`,
			);
		},
		deleteCalendarEvent(calendar, event, options) {
			const payload: WebxdcPayload = {
				kind: "deleteCalendarEvent",
				timestamp: Date.now(),
				calendarId: calendar.id,
				eventId: event.id,
				...options,
			};

			window.webxdc.sendUpdate(
				{ payload },
				`Deleted event "${event.title}" from calendar "${calendar.name}"`,
			);
		},
	});

	onMount(() => {
		if (typescaleStyles?.styleSheet) {
			document.adoptedStyleSheets.push(typescaleStyles.styleSheet);
		}

		const cachedUserTime = localStorage.getItem("userTime");
		if (cachedUserTime) {
			$userTime = Temporal.ZonedDateTime.from(cachedUserTime);
		}
		userTime.subscribe((value) => {
			localStorage.setItem("userTime", value.toJSON());
		});

		const cachedCalendars = localStorage.getItem("calendars");
		if (cachedCalendars) {
			$calendars = JSON.parse(cachedCalendars);
		}

		calendars.subscribe((value) => {
			localStorage.setItem("calendars", JSON.stringify(value));
		});
	});
</script>

<main id="main">
	<slot />
</main>

<style global>
	#main {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}
</style>
