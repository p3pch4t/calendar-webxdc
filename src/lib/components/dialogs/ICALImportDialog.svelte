<script lang="ts">
	import { getContext } from "svelte";

	import ICAL from "ical.js";

	import { type MdDialog } from "@material/web/dialog/dialog";
	import "@material/web/iconbutton/icon-button";
	import "@material/web/button/text-button";
	import UploadFileIcon from "$lib/components/icons/UploadFileIcon.svelte";

	import { type Calendar, icalComponentToCalendar } from "$lib/calendars";
	import UploadIcon from "../icons/UploadIcon.svelte";

	const calendarFunctions = getContext("calendarFunctions");

	let dialog: MdDialog;
	export function show() {
		dialog.show();
	}

	let filePicker: HTMLInputElement;
	function openFilePicker(): void {
		filePicker.click();
	}

	let files: FileList | undefined;
	let importError: string | undefined;
	let importedCalendar: Calendar | undefined;
	async function loadCalendar(): Promise<void> {
		if (!files) {
			console.warn("Tried to load calendar when files weren't selected");

			return;
		}

		const [file] = files;
		const text = await file.text();

		let component: ICAL.Component;
		importError = undefined;
		try {
			const jCal = ICAL.parse(text);
			component = new ICAL.Component(jCal);
		} catch (error) {
			importError = (error as Error)?.message;
			return;
		}

		importedCalendar = icalComponentToCalendar(component);
	}

	function importCalendar(): void {
		if (!importedCalendar) {
			console.warn("Tried to import calendar when its not loaded");
			return;
		}

		calendarFunctions.addCalendar(importedCalendar);

		importedCalendar = undefined;
		files = undefined;
		// @ts-expect-error
		filePicker.value = null;
		dialog.close();
	}
</script>

<md-dialog bind:this={dialog} id="calendar-import-dialog">
	<UploadIcon slot="icon" />
	<div slot="headline">Import iCalendar</div>
	<div class="content" slot="content">
		{#if importError}
			<h1 class="error-headline md-typescale-title-small">Couldn't import calendar</h1>
			<p>
				{importError}
			</p>
		{:else if importedCalendar}
			<h1 class="md-typescale-title-small">Calendar information</h1>
			<p>
				Name: {importedCalendar.name} <br />
				{#if importedCalendar.description}
					Description: {importedCalendar.description} <br />
				{/if}
				{importedCalendar.events.length} events
			</p>
		{:else}
			Please select file that contains your iCal calendar.
		{/if}
	</div>
	<div class="actions" slot="actions">
		<input
			bind:this={filePicker}
			class="file-picker"
			type="file"
			accept=".ical,.ics,.ifb,.icalendar,text/calendar"
			bind:files
			on:change={loadCalendar}
		/>
		<md-icon-button title="Select calendar file" on:click={openFilePicker}>
			<UploadFileIcon />
		</md-icon-button>
		<md-text-button title="Import calendar" disabled={!importedCalendar} on:click={importCalendar}>
			Import
		</md-text-button>
	</div>
</md-dialog>

<style>
	#calendar-import-dialog {
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
