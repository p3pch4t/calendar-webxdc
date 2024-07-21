<script lang="ts">
	import { getContext } from "svelte";
	import { writable } from "svelte/store";

	import { type MdDialog } from "@material/web/dialog/dialog";
	import "@material/web/iconbutton/icon-button";
	import "@material/web/button/text-button";
	import DownloadIcon from "~icons/material-symbols/download";

	import Menu from "../Menu.svelte";
	import MenuItem from "../MenuItem.svelte";

	import { calendarToIcalComponent, type Calendar } from "$lib/calendars";

	const calendars = getContext("calendars");

	const exportedCalendar = writable<Calendar>();

	let dialog: MdDialog;
	export function show(): void {
		dialog.show();
	}

	function exportCalendar(): void {
		const ical = calendarToIcalComponent($exportedCalendar);

		window.webxdc
			.sendToChat({
				file: {
					name: `${$exportedCalendar.name}.ics`,
					plainText: ical.toString(),
				},
				text: `Exported calendar "${$exportedCalendar.name}"`,
			})
			.catch(console.error);
	}
</script>

<md-dialog bind:this={dialog} id="calendar-export-dialog">
	<DownloadIcon slot="icon" />
	<div slot="headline">Export iCalendar</div>
	<div class="content" slot="content">
		<Menu label="Calendar" value={exportedCalendar}>
			{#each $calendars as calendar (calendar.id)}
				<MenuItem value={calendar} headline={calendar.name} />
			{/each}
		</Menu>
	</div>
	<div class="actions" slot="actions">
		<md-text-button title="Export calendar" on:click={exportCalendar}> Export </md-text-button>
	</div>
</md-dialog>

<style>
	#calendar-export-dialog {
		& > .content {
			& > .error-headline {
				color: var(--md-sys-color-error);
			}
		}

		& > .actions {
			& > .file-picker {
				display: none;
			}
		}
	}
</style>
