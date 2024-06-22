<script lang="ts">
	import { onMount, tick } from "svelte";
	import { writable, type Readable } from "svelte/store";

	import { Temporal } from "temporal-polyfill";

	import "@material/web/textfield/filled-text-field";
	import "@material/web/iconbutton/icon-button";
	import CalendarMonthIcon from "$lib/components/icons/CalendarMonthIcon.svelte";

	import ModalDatePicker, { datePickerTextFieldHandler } from "./ModalDatePicker.svelte";
	import type { MdFilledTextField } from "@material/web/textfield/filled-text-field";

	export let label = "Choose a date";
	export let value = writable<Temporal.PlainDate>();
	$value ??= Temporal.Now.plainDateISO();

	const modalDatePickerValue = writable($value);

	const opened = writable(false);
	let modalDatePicker: ModalDatePicker;
	function openDatePicker() {
		$opened = true;
	}
	function closeDatePicker() {
		$opened = false;
	}

	let modalTextFieldValue: Readable<string>;
	let textField: MdFilledTextField;
	export const textFieldValue = writable("");

	function selectDate() {
		$textFieldValue = $modalTextFieldValue;
		$value = $modalDatePickerValue;
		closeDatePicker();
	}

	onMount(() => {
		modalTextFieldValue = modalDatePicker.textFieldValue;

		selectDate();

		return value.subscribe(async (value) => {
			$modalDatePickerValue = value;
			await tick(); // wait for value to propagate
			$textFieldValue = $modalTextFieldValue;
		});
	});
</script>

<div class="date-picker" class:opened={$opened}>
	<md-filled-text-field
		class="date-picker-text-field"
		supporting-text="DD/MM/YYYY"
		{label}
		value={$textFieldValue}
		bind:this={textField}
		on:keyup={datePickerTextFieldHandler(textField, value)}
	>
		<md-icon-button class="date-picker-toggle" slot="trailing-icon" on:click={openDatePicker}>
			<CalendarMonthIcon />
		</md-icon-button>
	</md-filled-text-field>

	<ModalDatePicker
		class="modal-date-picker"
		{label}
		{opened}
		value={modalDatePickerValue}
		showHeader={true}
		replaceActionsWithClick={false}
		bind:this={modalDatePicker}
		on:change={selectDate}
		on:cancel={closeDatePicker}
	/>
</div>

<style>
	.date-picker {
		position: relative;

		& > .date-picker-text-field {
			& > .date-picker-toggle {
				margin-right: 8px;
			}
		}

		& > .modal-date-picker {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}
	}
</style>
