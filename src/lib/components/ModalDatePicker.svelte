<script context="module" lang="ts">
	import { get } from "svelte/store";

	export function datePickerTextFieldHandler(
		textField: MdOutlinedTextField | MdFilledTextField,
		value: Writable<Temporal.PlainDate>,
	) {
		return function handleDateInput(event: KeyboardEvent) {
			if (!(event.target instanceof HTMLElement) || event.key.length > 1) return;

			// Error and cancel event if character other than number or `/` gets typed
			if (!/\d|\//.test(event.key)) {
				event.preventDefault();
				textField.error = true;
				textField.errorText = "Date must be in 'dd/mm/yyyy' format";
				return;
			}

			// Automatically insert `/` after day and month
			if (textField.value.length === 2 || textField.value.length === 5) {
				textField.value += "/";
			}

			if (textField.value.length < 10) return;

			if (!/(\d{2}\/)\d{4}/.test(textField.value)) {
				textField.error = true;
				textField.errorText = "Date must be in 'dd/mm/yyyy' format";
			} else {
				const { value: textFieldValue } = textField;
				const day = Number(textFieldValue.slice(0, 2));
				const month = Number(textFieldValue.slice(3, 5));
				const year = Number(textFieldValue.slice(6));

				try {
					const newTime = get(value).with({ day, month, year });
					if (newTime.day !== day || newTime.month !== month) {
						textField.error = true;
						textField.errorText = "Invalid date (day or month out of bounds)";
						return;
					}

					value.set(newTime);
					textField.error = false;
				} catch (error) {
					textField.error = true;
					textField.errorText = "Invalid date";
				}
			}
		};
	}
</script>

<script lang="ts">
	import { fade } from "svelte/transition";
	import { derived, writable, type Readable, type Writable } from "svelte/store";
	import { onDestroy, createEventDispatcher, getContext } from "svelte";

	import { Temporal, Intl } from "temporal-polyfill";

	import "@material/web/button/text-button";
	import "@material/web/iconbutton/icon-button";
	import { type MdOutlinedTextField } from "@material/web/textfield/outlined-text-field";
	import type { MdFilledTextField } from "@material/web/textfield/filled-text-field";
	import ChevronLeftIcon from "$lib/components/icons/ChevronLeftIcon.svelte";
	import ChevronRightIcon from "$lib/components/icons/ChevronRightIcon.svelte";
	import CalendarTodayIcon from "$lib/components/icons/CalendarTodayIcon.svelte";
	import EditIcon from "$lib/components/icons/EditIcon.svelte";
	import ArrowDropDownIcon from "$lib/components/icons/ArrowDropDownIcon.svelte";

	import { monthNames, narrowWeekdayNames } from "$lib/shared";

	let _class = "";
	export { _class as class };
	export let label = "Select date";
	export let showEditButton = true;
	export let showHeader = true;
	export let replaceActionsWithClick = false;
	export let opened: Readable<boolean> = writable(true);

	const dispatch = createEventDispatcher();

	const userTime = getContext("userTime");
	const today = Temporal.Now.plainDateISO();

	export let value = writable($userTime.toPlainDate());
	onDestroy(value.subscribe(dispatchInput));

	let dateInputTextField: MdOutlinedTextField;

	$: browsingSamePeriod = $value.month === today.month && $value.year === today.year;
	$: firstDay = $value.with({ day: 1 });

	const headerLabelFormatter = new Intl.DateTimeFormat(navigator.language, {
		// Mon, Aug 17
		weekday: "short",
		month: "short",
		day: "numeric",
	});
	$: headerLabel = headerLabelFormatter.format($value);

	const monthSelectLabelFormatter = new Intl.DateTimeFormat(navigator.language, {
		// August 2020
		month: "long",
		year: "numeric",
	});
	$: monthSelectLabel = monthSelectLabelFormatter.format($value);

	function setDay(day: number): void {
		$value = $value.with({ day });
		if (replaceActionsWithClick) dispatchChange();
	}

	function setMonth(month: number): void {
		$value = $value.with({ month });
	}

	function setYear(year: number): void {
		$value = $value.with({ year });
	}

	function offsetMonth(offsetMonth: number): void {
		$value = $value.add({ months: offsetMonth });
	}

	let currentView: "day" | "month" | "year" | "edit" = "day";

	$: yearView = currentView === "year";
	// Also has to be changed in .years-container CSS
	const yearViewGridSize = 5 * 5;
	const forcedYearViewOffset = -Math.floor(yearViewGridSize / 2);
	let yearViewOffset = 0;
	function toggleYearView(): void {
		currentView = "year";
		yearViewOffset = 0;
	}
	function setYearViewOffset(offset: number): void {
		yearViewOffset += offset;
	}
	function selectYear(year: number): void {
		setYear(year);
		currentView = "month";
	}

	$: monthView = currentView === "month";

	function selectMonth(month: number): void {
		setMonth(month);
		currentView = "day";
	}

	$: editView = currentView === "edit";

	export const textFieldValue = derived(value, (value) => {
		const { day, month, year } = value;
		const dayText = day.toString().padStart(2, "0");
		const monthText = month.toString().padStart(2, "0");
		const yearText = year.toString().padStart(2, "0");
		return `${dayText}/${monthText}/${yearText}`;
	});

	function toggleEditView() {
		currentView = currentView === "edit" ? "day" : "edit";
	}

	function dispatchCancel(): void {
		dispatch("cancel", { value: $value });
	}

	function dispatchInput(): void {
		dispatch("input", { value: $value });
	}

	function dispatchChange(): void {
		dispatch("change", { value: $value });
	}
</script>

{#if $opened}
	<div
		transition:fade={{ duration: 200 }}
		class="modal-date-picker-container"
		on:click|self={dispatchCancel}
	>
		<div class="modal-date-picker {_class}">
			{#if showHeader}
				<div class="header">
					<div class="label-and-date">
						<span class="md-typescale-title-small">{label}</span>
						<h1 class="md-typescale-display-small">{headerLabel}</h1>
					</div>
					{#if showEditButton}
						<md-icon-button class="edit-button" on:click={toggleEditView}>
							{#if editView}
								<CalendarTodayIcon />
							{:else}
								<EditIcon />
							{/if}
						</md-icon-button>
					{/if}
				</div>
			{/if}

			{#if editView}
				<div class="date-input-container">
					<md-outlined-text-field
						bind:this={dateInputTextField}
						on:keyup={datePickerTextFieldHandler(dateInputTextField, value)}
						class="date-input"
						label="Date"
						placeholder="dd/mm/yyyy"
						value={$textFieldValue}
					/>
				</div>
			{:else}
				<div class="local-selection-row" class:without-header={!showHeader}>
					<md-text-button class="month-select" on:click={toggleYearView}>
						<span class="text">
							{monthSelectLabel}
							<ArrowDropDownIcon />
						</span>
					</md-text-button>

					<div class="controls">
						{#if yearView}
							<md-icon-button on:click={() => setYearViewOffset(-yearViewGridSize)}>
								<ChevronLeftIcon />
							</md-icon-button>
							<md-icon-button on:click={() => setYearViewOffset(yearViewGridSize)}>
								<ChevronRightIcon />
							</md-icon-button>
						{:else}
							<md-icon-button on:click={() => offsetMonth(-1)}>
								<ChevronLeftIcon />
							</md-icon-button>
							<md-icon-button on:click={() => offsetMonth(1)}>
								<ChevronRightIcon />
							</md-icon-button>
						{/if}
					</div>
				</div>

				<div class="local-content-container" class:without-actions={replaceActionsWithClick}>
					{#if yearView}
						<div class="years-container">
							{#each { length: yearViewGridSize } as _, i}
								{@const year = $value.year + forcedYearViewOffset + yearViewOffset + i}
								<md-text-button
									class="year-button"
									class:current={today.year === year}
									class:selected={$value.year === year}
									on:click={() => selectYear(year)}
								>
									{year}
								</md-text-button>
							{/each}
						</div>
					{:else if monthView}
						<div class="months-container">
							{#each { length: 12 } as _, i}
								{@const month = i + 1}

								<md-text-button
									class="month-button"
									class:current={today.month === month}
									class:selected={$value.month === month}
									on:click={() => selectMonth(month)}
								>
									{monthNames[i]}
								</md-text-button>
							{/each}
						</div>
					{:else}
						<div class="local-calendar-grid">
							<div class="days-of-the-week">
								{#each narrowWeekdayNames as weekday}
									<span class="cell">{weekday}</span>
								{/each}
							</div>

							<div class="days">
								<!-- fill X days as empty cells, so that it starts on the correct day -->
								{#each { length: Math.max(firstDay.dayOfWeek - 1, 0) } as _}
									<div class="cell"></div>
								{/each}

								{#each { length: $value.daysInMonth } as _, i}
									{@const day = i + 1}
									{@const selected = $value.day === day}
									<md-text-button
										class="day-button"
										class:today={!selected && browsingSamePeriod && today.day === day}
										class:selected
										on:click={() => setDay(day)}
									>
										{day}
									</md-text-button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}

			{#if !replaceActionsWithClick}
				<div class="local-actions">
					<div class="button-container">
						<md-text-button on:click={dispatchCancel}>Cancel</md-text-button>
						<md-text-button on:click={dispatchChange}>OK</md-text-button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-date-picker-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;

		background-color: #00000060;
		z-index: 2;

		& > .modal-date-picker {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);

			background-color: var(--md-sys-color-surface-container-high);
			color: var(--md-sys-color-on-surface);

			width: min-content;

			border-radius: 28px;
			width: max-content;

			flex-direction: row;
			gap: 8px;
			justify-content: center;
			align-items: end;

			& > .header {
				display: flex;
				flex-direction: row;
				gap: 8px;
				justify-content: space-between;
				align-items: end;

				padding: 16px 12px 12px 24px;

				border-bottom: 1px solid var(--md-sys-color-outline-variant);

				& > .label-and-date {
					display: flex;
					gap: 36px;
					flex-direction: column;
					justify-content: space-between;
					align-items: start;

					& > h1 {
						padding: 0;
						margin: 0;
					}
				}

				& > .edit-button {
					width: 48px;
					height: 48px;
					--md-icon-button-icon-size: 24px;

					display: flex;
					flex-direction: row;
					gap: 10px;
				}
			}

			& > .date-input-container {
				display: flex;
				padding: 16px 24px 12px 24px;

				& > .date-input {
					width: 308px;
				}
			}

			& > .local-selection-row {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 4px 12px 4px 16px;

				&.without-header {
					padding-top: 16px;
				}

				& > .month-select {
					& > .text {
						color: var(--md-sys-color-on-surface-variant);
						display: flex;

						& > .icon {
							width: 20px;
							height: 20px;
						}
					}
				}

				& > .controls {
					display: flex;
				}
			}

			& > .local-content-container {
				&.without-actions {
					padding-bottom: 12px;
				}

				& > .years-container {
					display: grid;
					grid-template-columns: repeat(5, 1fr);
					padding: 8px 12px 12px 12px;
					gap: 3px;

					& > .year-button {
						--md-text-button-label-text-color: var(--md-sys-color-on-surface);

						&.current {
							--md-text-button-label-text-color: var(--md-sys-color-primary);
							outline: 1px solid var(--md-sys-color-primary);
						}

						&.selected {
							background-color: var(--md-sys-color-primary);
							--md-text-button-label-text-color: var(--md-sys-color-on-primary);
							--md-text-button-focus-label-text-color: var(--md-sys-color-on-primary);
							--md-text-button-hover-label-text-color: var(--md-sys-color-on-primary);
							--md-text-button-pressed-label-text-color: var(--md-sys-color-on-primary);
						}
					}
				}

				& > .months-container {
					display: grid;
					grid-template-columns: repeat(5, 1fr);
					padding: 8px 12px 12px 12px;
					gap: 3px;

					& > .month-button {
						--md-text-button-label-text-color: var(--md-sys-color-on-surface);

						&.current {
							--md-text-button-label-text-color: var(--md-sys-color-primary);
							outline: 1px solid var(--md-sys-color-primary);
						}

						&.selected {
							background-color: var(--md-sys-color-primary);
							--md-text-button-label-text-color: var(--md-sys-color-on-primary);
							--md-text-button-focus-label-text-color: var(--md-sys-color-on-primary);
							--md-text-button-hover-label-text-color: var(--md-sys-color-on-primary);
							--md-text-button-pressed-label-text-color: var(--md-sys-color-on-primary);
						}
					}
				}

				& > .local-calendar-grid {
					padding-inline: 12px;

					& > .days,
					& > .days-of-the-week {
						display: grid;
						gap: 4px;
						grid-template-columns: repeat(7, 1fr);

						& > .cell,
						& > .day-button {
							display: flex;

							align-items: center;
							justify-content: center;
							width: 44px;
							height: 44px;
						}
					}

					& > .days {
						& > .day-button {
							--md-text-button-label-text-color: var(--md-sys-color-on-surface);

							&.today {
								--md-text-button-label-text-color: var(--md-sys-color-primary);
								border: 1px solid var(--md-sys-color-primary);

								&:hover {
									background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
								}

								&:focus,
								&:active {
									background-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
								}
							}

							&.selected {
								background-color: var(--md-sys-color-primary);
								--md-text-button-label-text-color: var(--md-sys-color-on-primary);
								--md-text-button-focus-label-text-color: var(--md-sys-color-on-primary);
								--md-text-button-hover-label-text-color: var(--md-sys-color-on-primary);
								--md-text-button-pressed-label-text-color: var(--md-sys-color-on-primary);
							}
						}
					}
				}
			}

			& > .local-actions {
				display: flex;
				align-items: center;
				justify-content: end;

				padding: 8px 12px 12px 12px;

				& > .button-container {
					display: flex;
				}
			}
		}
	}
</style>
