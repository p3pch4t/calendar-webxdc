<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { derived, get, writable, type Readable } from "svelte/store";

	import { Temporal } from "temporal-polyfill";

	import "@material/web/textfield/filled-text-field";
	import "@material/web/iconbutton/icon-button";
	import ScheduleIcon from "~icons/material-symbols/schedule-outline-rounded";

	import ModalTimePicker from "./ModalTimePicker.svelte";
	import { tick } from "svelte";

	export let label = "Enter time";

	export let value = writable<Temporal.PlainTime>();
	$value ??= Temporal.Now.plainTimeISO();

	const modalTimePickerValue = writable($value);

	const opened = writable(false);
	function openTimePicker() {
		$opened = true;
	}
	function closeTimePicker() {
		$opened = false;
	}

	let modalTimePicker: ModalTimePicker;

	let modalTextFieldValue: Readable<string>;
	const textFieldValue = writable("");

	function selectTime() {
		$value = $modalTimePickerValue;
		$textFieldValue = $modalTextFieldValue;
		closeTimePicker();
	}

	onMount(() => {
		// For whatever reason HMR sometimes fails on these
		if (!modalTimePicker.strHour || !modalTimePicker.strMinute) {
			return;
		}

		modalTextFieldValue = derived(
			[modalTimePicker.strHour, modalTimePicker.strMinute],
			([hour, minute]) => `${hour}:${minute}`,
		);

		return value.subscribe(async (value) => {
			$modalTimePickerValue = value;
			await tick(); // wait for value to propagate
			$textFieldValue = $modalTextFieldValue;
		});
	});
</script>

<div class="time-picker">
	<md-filled-text-field
		class="time-picker-text-field"
		supporting-text="HH:MM"
		readonly
		{label}
		value={$textFieldValue}
	>
		<md-icon-button class="time-picker-toggle" slot="trailing-icon" on:click={openTimePicker}>
			<ScheduleIcon />
		</md-icon-button>
	</md-filled-text-field>

	<ModalTimePicker
		{label}
		{opened}
		value={modalTimePickerValue}
		bind:this={modalTimePicker}
		on:cancel={closeTimePicker}
		on:change={selectTime}
	/>
</div>

<style>
	.time-picker {
		& > .time-picker-text-field {
			& > .time-picker-toggle {
				margin-right: 8px;
			}
		}
	}
</style>
