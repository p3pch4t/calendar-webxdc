<script context="module" lang="ts">
	export const ssr = false;
	export const prerender = true;
</script>

<script lang="ts">
	import { setContext, getContext } from "svelte";
	import { derived, writable } from "svelte/store";

	import CalendarViewDayIcon from "~icons/material-symbols/calendar-view-day-outline-rounded";
	import CalendarViewWeekIcon from "~icons/material-symbols/calendar-view-week-outline";
	import CalendarViewMonthIcon from "~icons/material-symbols/calendar-view-month-outline";
	import UploadIcon from "~icons/material-symbols/upload";
	import DownloadIcon from "~icons/material-symbols/download";
	import ListIcon from "~icons/material-symbols/list-alt-outline";
	import MenuIcon from "~icons/material-symbols/menu-rounded";
	import ChevronLeftIcon from "~icons/material-symbols/chevron-left-rounded";
	import ChevronRightIcon from "~icons/material-symbols/chevron-right-rounded";

	import NavigationTopAppBar from "$lib/components/navigation/NavigationTopAppBar.svelte";
	import NavigationDrawer from "$lib/components/navigation/NavigationDrawer.svelte";
	import NavigationDrawerButton from "$lib/components/navigation/NavigationDrawerButton.svelte";
	import NavigationListItem from "$lib/components/navigation/NavigationListItem.svelte";
	import NavigationExpandableList from "$lib/components/navigation/NavigationExpandableList.svelte";
	import CalendarListItem from "$lib/components/navigation/CalendarListItem.svelte";
	import ThemeSwitcher from "$lib/components/ThemeSwitcher.svelte";

	import ICALImportDialog from "$lib/components/dialogs/ICALImportDialog.svelte";
	import ICALExportDialog from "$lib/components/dialogs/ICALExportDialog.svelte";
	import CalendarEditDialog from "$lib/components/dialogs/CalendarEditDialog.svelte";
	import CalendarDeleteDialog from "$lib/components/dialogs/CalendarDeleteDialog.svelte";

	import { monthNames } from "$lib/shared";
	import AddFab from "$lib/components/fabs/AddFab.svelte";

	const currentView = setContext("currentView", writable("month"));

	const userTime = getContext("userTime");

	const topBarHeadline = derived([userTime, currentView], ([userTime, currentView]) => {
		switch (currentView) {
			case "day":
			case "incoming":
				return `${monthNames[userTime.month - 1]} ${userTime.day}, ${userTime.year}`;
			case "week":
			case "month":
				return `${monthNames[userTime.month - 1]} ${userTime.year}`;
		}
	});

	function addInterval(): void {
		$userTime = $userTime.add({ [$currentView + "s"]: 1 });
	}
	function subtractInterval(): void {
		$userTime = $userTime.subtract({ [$currentView + "s"]: 1 });
	}

	const calendars = getContext("calendars");

	let icalImportDialog: ICALImportDialog;
	let icalExportDialog: ICALExportDialog;
	let navigationDrawer: NavigationDrawer;
	let calendarEditDialog: CalendarEditDialog;
	let calendarDeleteDialog: CalendarDeleteDialog;
</script>

<AddFab />

<NavigationTopAppBar>
	<svelte:fragment slot="leading-items">
		<md-icon-button aria-label="Open navigation bar" on:click={navigationDrawer.show}>
			<MenuIcon />
		</md-icon-button>
	</svelte:fragment>

	<svelte:fragment slot="headline">
		{#if $currentView !== "incoming"}
			<md-icon-button aria-label="Go to previous {$currentView}" on:click={subtractInterval}>
				<ChevronLeftIcon />
			</md-icon-button>

			{$topBarHeadline}

			<md-icon-button aria-label="Go to next {$currentView}" on:click={addInterval}>
				<ChevronRightIcon />
			</md-icon-button>
		{:else}
			{$topBarHeadline}
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="trailing-items">
		<ThemeSwitcher />
	</svelte:fragment>
</NavigationTopAppBar>

<NavigationDrawer bind:this={navigationDrawer} headline={"Calendar"}>
	<svelte:fragment slot="associated">
		<ICALImportDialog bind:this={icalImportDialog} />
		<ICALExportDialog bind:this={icalExportDialog} />
		<CalendarEditDialog bind:this={calendarEditDialog} />
		<CalendarDeleteDialog bind:this={calendarDeleteDialog} />
	</svelte:fragment>

	<h2 class="section-header md-typescale-title-small">View modes</h2>
	<NavigationDrawerButton selected={$currentView === "day"} href="/view/day">
		<CalendarViewDayIcon slot="icon" />
		Day
	</NavigationDrawerButton>
	<NavigationDrawerButton selected={$currentView === "week"} href="/view/week">
		<CalendarViewWeekIcon slot="icon" />
		Week
	</NavigationDrawerButton>
	<NavigationDrawerButton selected={$currentView === "month"} href="/view/month">
		<CalendarViewMonthIcon slot="icon" />
		Month
	</NavigationDrawerButton>

	<NavigationDrawerButton selected={$currentView === "incoming"} href="/view/incoming">
		<ListIcon slot="icon" />
		Incoming
	</NavigationDrawerButton>

	<hr />
	<NavigationExpandableList title="Calendars">
		{#each $calendars as calendar (calendar.id)}
			<CalendarListItem
				{calendar}
				onEditCalendar={() => {
					calendarEditDialog.setCalendar(calendar);
					calendarEditDialog.show();
				}}
				onDeleteCalendar={() => {
					calendarDeleteDialog.setCalendar(calendar);
					calendarDeleteDialog.show();
				}}
			/>
		{:else}
			<NavigationListItem>
				<span slot="headline">No calendars</span>
			</NavigationListItem>
		{/each}
	</NavigationExpandableList>

	<hr />
	<h2 class="section-header md-typescale-title-small">Import calendar</h2>
	<NavigationDrawerButton on:click={icalImportDialog.show}>
		<UploadIcon slot="icon" />
		Import iCalendar
	</NavigationDrawerButton>
	<NavigationDrawerButton on:click={icalExportDialog.show}>
		<DownloadIcon slot="icon" />
		Export iCalendar
	</NavigationDrawerButton>
</NavigationDrawer>

<slot />
