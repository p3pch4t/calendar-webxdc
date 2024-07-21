<script lang="ts">
	import { fade } from "svelte/transition";

	import "@material/web/fab/fab";
	import AddIcon from "~icons/material-symbols/add-rounded";
	import EventIcon from "~icons/material-symbols/event-rounded";
	import CalendarMonthIcon from "~icons/material-symbols/calendar-month-rounded";

	import CalendarAddDialog from "../dialogs/CalendarAddDialog.svelte";
	import CalendarEventAddDialog from "../dialogs/CalendarEventAddDialog.svelte";

	let showFabs = false;
	function toggleFabs() {
		showFabs = !showFabs;
	}

	let calendarEventAddDialog: CalendarEventAddDialog;
	function showAddEventDialog() {
		calendarEventAddDialog.show();
		toggleFabs();
	}

	let calendarAddDialog: CalendarAddDialog;
	function showAddCalendarDialog() {
		calendarAddDialog.show();
		toggleFabs();
	}
</script>

<CalendarAddDialog bind:this={calendarAddDialog} />
<CalendarEventAddDialog bind:this={calendarEventAddDialog} />

{#if showFabs}
	<div id="add-modal" on:click|self={toggleFabs} transition:fade={{ duration: 150 }}>
		<div id="add-fabs">
			<md-fab
				aria-label="Add event"
				label="Event"
				id="add-event-fab"
				variant="secondary"
				on:click={showAddEventDialog}
			>
				<EventIcon id="add-event-icon" slot="icon" />
			</md-fab>

			<md-fab
				aria-label="Add calendar"
				label="Calendar"
				id="add-calendar-fab"
				variant="tertiary"
				on:click={showAddCalendarDialog}
			>
				<CalendarMonthIcon id="add-calendar-icon" slot="icon" />
			</md-fab>
		</div>
	</div>
{:else}
	<md-fab aria-label="Add calendar or event" id="add-fab" variant="secondary" on:click={toggleFabs}>
		<AddIcon slot="icon" />
	</md-fab>
{/if}

<style>
	@keyframes spin-in {
		from {
			transform: rotate(-180deg);
		}

		to {
			transform: rotate(0deg);
		}
	}

	@keyframes transformation {
		from {
			transform: translate(72px, 72px);
		}
	}

	#add-fab,
	#add-modal > #add-fabs {
		position: fixed;
		bottom: 12px;
		right: 12px;
		z-index: 4;
	}

	#add-modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: #00000060;
		z-index: 3;
	}

	#add-fabs {
		display: flex;
		flex-direction: column;
		justify-content: end;
		align-items: end;
		gap: 8px;
		animation: transformation var(--md-transition-timing-function) 150ms;
	}

	:global(#add-calendar-icon) {
		animation: spin-in var(--md-transition-timing-function) 250ms;
	}
</style>
