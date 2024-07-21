<script lang="ts">
	import { getContext } from "svelte";
	import { get, writable } from "svelte/store";

	import { type MdDialog } from "@material/web/dialog/dialog";
	import "@material/web/slider/slider";
	import "@material/web/button/text-button";
	import "@material/web/button/filled-tonal-button";
	import "@material/web/textfield/outlined-text-field";
	import EditIcon from "~icons/material-symbols/edit-rounded";

	import type { Calendar, CalendarChanges } from "$lib/calendars";
	import { bindValue } from "$lib/actions/bindValue";

	const calendarFunctions = getContext("calendarFunctions");

	let dialog: MdDialog;
	export function show() {
		dialog.show();
	}
	function close() {
		dialog.close();
	}

	const calendar = writable<Calendar>();
	export function setCalendar(calendar: Calendar) {
		$calendar = calendar;
	}

	const name = writable("");
	const description = writable("");
	const hue = writable(0);
	$: color = `hsl(${$hue}deg, 50%, 50%)`;

	calendar.subscribe((calendar) => {
		if (!calendar) return;

		$name = calendar.name;
		$description = calendar.description ?? "";
		$hue = calendar.hue;
	});

	function saveChanges() {
		const changes: CalendarChanges = {};
		if ($calendar.name !== $name) changes.name = $name;
		if ($calendar.description !== $description) changes.description = $description;
		if ($calendar.hue !== $hue) changes.hue = $hue;
		calendarFunctions.editCalendar($calendar, changes);
		close();
	}
</script>

<md-dialog bind:this={dialog} id="calendar-edition-dialog">
	<EditIcon slot="icon" />
	<div class="headline" slot="headline">
		Edit calendar <span style:color>{$calendar?.name}</span>
	</div>
	<div class="content" slot="content">
		<md-outlined-text-field class="name" label="Name" use:bindValue={name} />
		<md-outlined-text-field
			type="textarea"
			class="description"
			label="Description"
			use:bindValue={description}
		/>

		<div class="color-picker">
			<p class="md-typescale-label-large">Color:</p>
			<md-slider class="color-slider" min={0} max={360} style:--color={color} use:bindValue={hue} />
		</div>
	</div>
	<div class="actions" slot="actions">
		<md-text-button title="Close dialog" on:click={close}> Cancel </md-text-button>
		<md-filled-tonal-button title="Save changes" on:click={saveChanges}>
			Save
		</md-filled-tonal-button>
	</div>
</md-dialog>

<style>
	#calendar-edition-dialog {
		& > .headline {
			display: flex;
			flex-wrap: wrap;
		}

		& > .content {
			display: flex;
			flex-direction: column;
			gap: 8px;

			& > .name {
				width: 100%;
			}

			& > .description {
				resize: none;
			}

			& > .color-picker {
				display: flex;
				align-items: center;

				& > .color-slider {
					width: 100%;

					--md-slider-active-track-color: var(--color);
					--md-slider-handle-color: var(--color);

					--md-slider-hover-handle-color: var(--color);
					--md-slider-focus-handle-color: var(--color);
					--md-slider-pressed-handle-color: var(--color);

					--md-slider-hover-state-layer-color: var(--color);
					--md-slider-focus-state-layer-color: var(--color);
					--md-slider-pressed-state-layer-color: var(--color);
				}
			}
		}
	}
</style>
