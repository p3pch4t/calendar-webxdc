<script lang="ts">
	import { fade } from "svelte/transition";
	import { derived, writable, type Readable } from "svelte/store";
	import { createEventDispatcher, onDestroy, getContext } from "svelte";

	import { Temporal } from "temporal-polyfill";

	import "@material/web/iconbutton/icon-button";
	import "@material/web/button/text-button";
	import "@material/web/textfield/filled-text-field";

	let _class = "";
	export { _class as class };
	export let label = "Enter time";
	export let opened: Readable<boolean> = writable(true);

	const dispatch = createEventDispatcher();

	const userTime = getContext("userTime");

	const hour = writable($userTime.hour);
	const minute = writable($userTime.minute);
	export const strHour = derived(hour, (hour) => String(hour).padStart(2, "0"));
	export const strMinute = derived(minute, (minute) => String(minute).padStart(2, "0"));

	export let value = writable<Temporal.PlainTime>();
	onDestroy(
		value.subscribe((value) => {
			$hour = value.hour;
			$minute = value.minute;
			dispatchInput();
		}),
	);

	let hourInput: HTMLElement;
	$: if (hourInput) {
		setTimeout(() => hourInput.focus(), 16);
	}

	let minuteInput: HTMLElement;

	function handleKeyboardInput(event: KeyboardEvent): void {
		switch (event.key) {
			case "Enter":
			case "Tab":
				return;
			default:
				event.stopImmediatePropagation();
				event.preventDefault();
				if (/[^0-9]/.test(event.key)) return;
		}

		const digit = +event.key;
		if (event.target === hourInput) {
			$hour = +`${$hour}${digit}`;
			if ($hour > 23) $hour = digit;
			if ($hour > 9) minuteInput.focus();
		} else {
			$minute = +`${$minute}${digit}`;
			if ($minute > 59) $minute = digit;
		}

		$value = Temporal.PlainTime.from({ hour: $hour, minute: $minute });
	}

	function dispatchCancel() {
		dispatch("cancel", { value: $value });
	}

	function dispatchInput() {
		dispatch("input", { value: $value });
	}

	function dispatchChange() {
		dispatch("change", { value: $value });
	}
</script>

{#if $opened}
	<div transition:fade={{ duration: 200 }} class="modal-time-picker-container">
		<div class="modal-time-picker {_class}">
			<div class="header">
				<span class="md-typescale-title-small">{label}</span>
			</div>

			<div class="input-selection">
				<div class="hour-and-minute-selector" on:keydown={handleKeyboardInput}>
					<div class="hour">
						<md-outlined-text-field
							inputmode="numeric"
							bind:this={hourInput}
							class="hour-input"
							value={$strHour}
						/>
						<span class="supporting-text">Hour</span>
					</div>
					<span class="separator">:</span>
					<div class="minute">
						<md-outlined-text-field
							inputmode="numeric"
							bind:this={minuteInput}
							class="minute-input"
							value={$strMinute}
						/>
						<span class="supporting-text">Minute</span>
					</div>
				</div>
			</div>

			<div class="actions">
				<div class="action-buttons">
					<md-text-button on:click={dispatchCancel}>Cancel</md-text-button>
					<md-text-button on:click={dispatchChange}>Ok</md-text-button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-time-picker-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;

		background-color: #00000060;
		z-index: 2;

		& > .modal-time-picker {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);

			display: flex;
			flex-direction: column;
			gap: 20px;

			width: max-content;
			border-radius: 28px;

			background-color: var(--md-sys-color-surface-container);
			color: var(--md-sys-color-on-surface);

			& > .header {
				padding: 24px 24px 0 24px;
			}

			& > .input-selection {
				& > .hour-and-minute-selector {
					display: flex;
					padding-inline: 24px;
					justify-content: center;
					align-items: start;

					& > .hour,
					& > .minute {
						display: flex;
						flex-direction: column;
						gap: 7px;

						& > .hour-input,
						& > .minute-input {
							appearance: none;

							width: 96px;
							text-align: center;

							border: none;
							border-radius: 8px;

							transition: var(--md-default-transition);

							--md-outlined-text-field-outline-color: transparent;
							--md-outlined-text-field-container-shape: 8px;
							--md-outlined-field-content-size: 45px;
							background-color: var(--md-sys-color-surface-container-highest);

							&:focus {
								background-color: var(--md-sys-color-primary-container);
							}
						}

						& > .supporting-text {
							font-family: "Roboto Flex";
							font-size: 12px;
						}
					}

					& > .separator {
						padding-top: 32px;
						font-size: 57px;
					}
				}
			}

			& > .actions {
				display: flex;
				justify-content: end;
				align-items: center;
				padding: 0 24px 20px 12px;

				& > .action-buttons {
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 8px;
				}
			}
		}
	}
</style>
