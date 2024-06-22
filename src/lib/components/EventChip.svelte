<script context="module" lang="ts">
	import { browser } from "$app/environment";

	export type EventChipPlacer<Context> = (
		node: HTMLElement,
		event: ComputedCalendarEvent,
		context?: Context,
	) => void;

	type Reseter = () => void;
	let eventChipReseter: Reseter | undefined;
	export function setEventChipReseter(reseter: Reseter) {
		eventChipReseter = reseter;
	}
	export function resetEventChipReseter() {
		eventChipReseter = undefined;
	}

	const eventChipsPlacers = new Set<() => void>();

	if (browser) {
		const observer = new ResizeObserver(() => {
			eventChipReseter?.();
			for (const place of eventChipsPlacers) place();
		});

		observer.observe(document.body);
	}
</script>

<script lang="ts">
	type T = $$Generic;

	import { afterUpdate, onDestroy, tick } from "svelte";
	import "@material/web/ripple/ripple";
	import "@material/web/focus/md-focus-ring";
	import type { ComputedCalendarEvent } from "$lib/calendars";

	export let event: ComputedCalendarEvent;
	export let placer: EventChipPlacer<T> | undefined = undefined;
	export let context: T | undefined = undefined;
	export let outlined = false;

	let eventChip: HTMLButtonElement;
	if (placer) {
		const place = () => placer(eventChip, event, context);

		afterUpdate(async () => {
			// Wait for elements in placers to update
			await tick();
			place();
		});

		eventChipsPlacers.add(place);
		onDestroy(() => {
			eventChipsPlacers.delete(place);
		});
	}
</script>

<button
	bind:this={eventChip}
	class="event-chip"
	class:all-day={event.duration.minutes >= 24 * 60}
	class:outlined
	style:--color={event.color}
	on:click
>
	<md-focus-ring />
	<md-ripple />
	<span class="label md-typescale-label-medium">
		{event.title ?? "Untitled"}
	</span>
</button>

<style>
	.event-chip,
	:global(.phantom-event-chip) {
		position: relative;
		display: flex;
		outline: none;

		overflow: hidden;
		&:focus-visible {
			overflow: visible;
		}

		--bg-color: color-mix(in srgb, var(--color) 80%, var(--md-sys-color-surface));
		--text-color: var(--md-sys-color-on-surface);
		-webkit-tap-highlight-color: transparent;
		background-color: var(--bg-color);
		color: var(--text-color);

		border: none;
		border-radius: 4px;
		--md-focus-ring-shape: 8px;

		&.outlined {
			outline: 2px solid var(--md-sys-color-surface);
		}
		top: 0;
		left: 0;

		transition: var(--md-default-transition);
		cursor: pointer;
		padding: 1px;

		& > .label {
			text-align: left;
			overflow: hidden;
			text-wrap: pretty;
			z-index: 1;
			width: 100%;
			height: 100%;
		}
	}
</style>
