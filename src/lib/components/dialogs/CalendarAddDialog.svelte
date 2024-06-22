<script lang="ts">
	import { getContext } from "svelte";
	import { writable } from "svelte/store";

	import { type MdDialog } from "@material/web/dialog/dialog";
	import "@material/web/slider/slider";
	import "@material/web/button/text-button";
	import "@material/web/button/filled-tonal-button";
	import { type MdFilledTextField } from "@material/web/textfield/filled-text-field";
	import CalendarMonthIcon from "$lib/components/icons/CalendarMonthIcon.svelte";

	import { generateRandomID, type Calendar } from "$lib/calendars";
	import { bindValue } from "$lib/actions/bindValue";

	const calendarFunctions = getContext("calendarFunctions");

	let dialog: MdDialog;
	let nameElement: MdFilledTextField;
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

	function createCalendar() {
		if (!$name) {
			nameElement.error = true;
			nameElement.errorText = "Name cannot be empty";
			return;
		} else {
			nameElement.error = false;
		}

		const calendar: Calendar = {
			id: generateRandomID(),
			name: $name,
			description: $description,
			hue: $hue,
			events: [],
		};

		$name = "";
		$description = "";
		$hue = 0;

		calendarFunctions.addCalendar(calendar);
		close();
	}
</script>

<md-dialog bind:this={dialog} id="add-calendar-dialog">
	<CalendarMonthIcon slot="icon" />
	<div class="headline" slot="headline">Create calendar</div>
	<div class="content" slot="content">
		<md-filled-text-field bind:this={nameElement} class="name" label="Name" use:bindValue={name} />
		<md-filled-text-field
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
		<md-filled-tonal-button title="Create calendar" on:click={createCalendar}>
			Create
		</md-filled-tonal-button>
	</div>
</md-dialog>

<style>
	#add-calendar-dialog {
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
