const monthNameFormatter = new Intl.DateTimeFormat(navigator.language, {
	month: "short",
});

export const monthNames = Array.from({ length: 12 }, (_, i) => {
	const date = new Date(2000, i);
	return monthNameFormatter.format(date);
});

const narrowWeekdayNameFormatter = new Intl.DateTimeFormat(navigator.language, {
	weekday: "narrow",
});
export const narrowWeekdayNames = Array.from({ length: 7 }, (_, i) => {
	const date = new Date(2000, 1, i);
	return narrowWeekdayNameFormatter.format(date);
});

const longWeekdayNameFormatter = new Intl.DateTimeFormat(navigator.language, {
	weekday: "long",
});

export const longWeekdayNames = Array.from({ length: 7 }, (_, i) => {
	const date = new Date(2000, 1, i);
	return longWeekdayNameFormatter.format(date);
});

const shortWeekdayNameFormatter = new Intl.DateTimeFormat(navigator.language, {
	weekday: "short",
});
export const shortWeekdayNames = Array.from({ length: 7 }, (_, i) => {
	const date = new Date(2000, 1, i);
	return shortWeekdayNameFormatter.format(date);
});
