<script lang="ts">
	import { fade } from "svelte/transition";
	import { getContext } from "svelte";
	import { derived } from "svelte/store";
	import { replaceState } from "$app/navigation";

	import { Intl } from "temporal-polyfill";
	import { marked } from "marked";
	import DOMPurify from "dompurify";

	import "@material/web/iconbutton/icon-button";

	import NavigationTopAppBar from "$lib/components/navigation/NavigationTopAppBar.svelte";
	import DeleteEventFab from "$lib/components/fabs/DeleteEventFab.svelte";
	import EditEventFab from "$lib/components/fabs/EditEventFab.svelte";

	import EventIcon from "~icons/material-symbols/event-rounded";
	import LocationIcon from "~icons/material-symbols/location-on-outline-rounded";
	import DescriptionIcon from "~icons/material-symbols/description-outline-rounded";
	import ScheduleIcon from "~icons/material-symbols/schedule-outline-rounded";
	import RecurrenceIcon from "~icons/material-symbols/event-repeat-rounded";
	import ChevronLeftIcon from "~icons/material-symbols/chevron-left-rounded";

	import type { Calendar, CalendarEvent } from "$lib/calendars";

	export let event: CalendarEvent | undefined;
	export let calendar: Calendar | undefined;

	const calendars = getContext("calendars");
	const computedCalendars = getContext("computedCalendars");

	const computedEvent = derived(computedCalendars, (computedCalendars) => {
		return computedCalendars.get(calendar!)?.events?.find((e) => e.id === event?.id);
	});

	const rangeFormatter = new Intl.DateTimeFormat(navigator.language, {
		weekday: "short",
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
	});

	const formattedRange = derived(computedEvent, (computedEvent) => {
		if (!computedEvent) return "";
		const start = computedEvent.start.toPlainDateTime();
		const end = computedEvent.end.toPlainDateTime();
		return rangeFormatter.formatRange(start, end);
	});

	function capitalize(text: string): string {
		return text[0].toUpperCase() + text.slice(1).toLowerCase();
	}

	function close() {
		replaceState("", {});
	}

	async function parseMarkdown(markdown: string): Promise<string> {
		return DOMPurify.sanitize(
			await marked.parse(markdown, {
				async: true,
			}),
		);
	}
</script>

<section id="event-view" transition:fade={{ duration: 200 }}>
	<NavigationTopAppBar>
		<md-icon-button on:click={close} slot="leading-items">
			<ChevronLeftIcon />
		</md-icon-button>
		<svelte:fragment slot="headline">Event</svelte:fragment>
	</NavigationTopAppBar>
	{#key $calendars}
		<div class="content">
			<h1 style:color={$computedEvent?.color} class="title md-typescale-display-small">
				<EventIcon class="event-icon" />
				<span class="title-content">{event?.title ?? "Untitled"}</span>
			</h1>

			<span class="time">
				<ScheduleIcon />
				<span class="duration">{$formattedRange}</span>
			</span>

			{#if event?.recurrence?.freq}
				<span class="recurrence">
					<RecurrenceIcon />
					{capitalize(event.recurrence.freq)}
				</span>
			{/if}

			<span class="location">
				<LocationIcon />
				{#if event?.location}
					<span class="location-content">
						{event?.location}
					</span>
				{:else}
					<span class="not-set">This even has no location</span>
				{/if}
			</span>

			<p class="description">
				<DescriptionIcon />
				{#if event?.description}
					<span class="description-content">
						{#await parseMarkdown(event?.description)}
							Parsing markdown...
						{:then markdown}
							{@html markdown}
						{/await}
					</span>
				{:else}
					<span class="not-set">This event has no description</span>
				{/if}
			</p>

			<div id="event-fabs">
				<DeleteEventFab event={computedEvent} on:delete={close} />
				<EditEventFab event={computedEvent} />
			</div>
		</div>
	{/key}
</section>

<style>
	#event-view {
		display: flex;
		flex-direction: column;

		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;

		z-index: 10;

		background-color: var(--md-sys-color-surface);

		& > .content {
			display: flex;
			flex-direction: column;
			gap: 16px;
			padding: 16px;

			& > .title {
				display: flex;
				align-items: center;
				max-width: calc(100% - 1em);
				font-size: 2em;

				margin: 0;

				& > .title-content {
					overflow: hidden;
					white-space: nowrap;
					text-overflow: ellipsis;
				}

				& > .event-icon {
					min-width: 1em;
					min-height: 1em;
					margin-right: 8px;
				}
			}

			& > .time,
			& > .location,
			& > .recurrence,
			& > .description {
				display: flex;
				align-items: center;
				gap: 8px;
			}

			& > .description {
				margin: 0;
				align-items: start;

				& > .description-content {
					& > h1,
					h2,
					h3,
					h4,
					h5,
					h6,
					p {
						margin-top: 0;
					}
				}
			}
		}
	}

	.not-set {
		color: color-mix(in srgb, var(--md-sys-color-on-surface) 60%, var(--md-sys-color-surface));
	}

	#event-fabs {
		position: fixed;
		bottom: 12px;
		right: 12px;
		gap: 8px;

		display: flex;

		z-index: 4;
	}
</style>
