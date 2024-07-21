<script lang="ts">
	import { getContext } from "svelte";

	import "@material/web/iconbutton/icon-button";
	import DeleteIcon from "~icons/material-symbols/delete-rounded";
	import EditIcon from "~icons/material-symbols/edit-rounded";

	import type { Calendar } from "$lib/calendars";

	import NavigationListItem from "./NavigationListItem.svelte";

	const calendars = getContext("calendars");
	const computedCalendars = getContext("computedCalendars");

	export let calendar: Calendar;
	$: computedCalendar = $computedCalendars.get(calendar)!;

	export let onEditCalendar: () => void;
	export let onDeleteCalendar: () => void;

	function toggleCalendarVisibility(event: Event) {
		computedCalendar.visible = (event.target as HTMLInputElement).checked;
		$calendars = $calendars;
	}
</script>

<NavigationListItem>
	<div class="headline" slot="headline">
		<div class="checkbox-container">
			<md-checkbox
				on:change={toggleCalendarVisibility}
				class="visibility-checkbox"
				checked={computedCalendar?.visible}
				style:--color={computedCalendar?.color}
			/>
		</div>
		<span class="label md-typescale-title-medium">
			{calendar.name}
		</span>
	</div>
	<div class="trailing-supporting-text" slot="trailing-supporting-text">
		<md-icon-button on:click={onEditCalendar}>
			<EditIcon />
		</md-icon-button>
		<md-icon-button on:click={onDeleteCalendar}>
			<DeleteIcon />
		</md-icon-button>
	</div>
</NavigationListItem>

<style>
	.headline {
		display: flex;
		align-items: center;
		justify-content: start;

		& > .checkbox-container {
			display: inline-flex;
			justify-content: center;
			align-items: center;
			width: 48px;
			height: 48px;

			& > .visibility-checkbox {
				--md-checkbox-outline-color: var(--color);

				--icon-color: color-mix(var(--color) 50%, var(--md-sys-color-on-surface));
				--md-checkbox-selected-icon-color: var(--icon-color);
				--md-checkbox-selected-hover-icon-color: var(--icon-color);
				--md-checkbox-selected-focus-icon-color: var(--icon-color);
				--md-checkbox-selected-pressed-icon-color: var(--icon-color);

				--md-checkbox-selected-container-color: var(--color);
				--md-checkbox-selected-hover-container-color: var(--color);
				--md-checkbox-selected-focus-container-color: var(--color);
				--md-checkbox-selected-pressed-container-color: var(--color);
			}
		}

		& > .label {
			flex: 1;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
	}

	.trailing-supporting-text {
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
