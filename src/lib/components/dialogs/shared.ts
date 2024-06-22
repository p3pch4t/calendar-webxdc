import { get, type Writable } from "svelte/store";
import { Temporal } from "temporal-polyfill";

/**
 * Ensures that startDate <= endDate
 * and that startTime <= endTime when startDate == endDate
 */
export function handleDateTimeSynchronization(
	startTime: Writable<Temporal.PlainTime>,
	endTime: Writable<Temporal.PlainTime>,
	startDate: Writable<Temporal.PlainDate>,
	endDate: Writable<Temporal.PlainDate>,
): () => void {
	const a = endDate.subscribe((endDate) => {
		switch (Temporal.PlainDate.compare(endDate, get(startDate))) {
			case -1:
				startDate.set(endDate);
			// fallthrough
			case 0: {
				const $startTime = get(startTime);
				const $endTime = get(endTime);
				if (Temporal.PlainTime.compare($endTime, $startTime) < 0) {
					startTime.set(get(endTime));
				}
				break;
			}
			case 1:
				break;
		}
	});
	const b = startDate.subscribe((startDate) => {
		switch (Temporal.PlainDate.compare(get(endDate), startDate)) {
			case -1:
				endDate.set(startDate);
			// fallthrough
			case 0: {
				const $startTime = get(startTime);
				const $endTime = get(endTime);
				if (Temporal.PlainTime.compare($endTime, $startTime) < 0) {
					endTime.set($startTime);
				}
				break;
			}
			case 1:
				break;
		}
	});
	const c = endTime.subscribe((endTime) => {
		if (Temporal.PlainDate.compare(get(endDate), get(startDate)) != 0) return;
		if (Temporal.PlainTime.compare(endTime, get(startTime)) < 0) {
			startTime.set(endTime);
		}
	});
	const d = startTime.subscribe((startTime) => {
		if (Temporal.PlainDate.compare(get(endDate), get(startDate)) != 0) return;
		if (Temporal.PlainTime.compare(get(endTime), startTime) < 0) {
			endTime.set(startTime);
		}
	});

	return () => {
		a();
		b();
		c();
		d();
	};
}
