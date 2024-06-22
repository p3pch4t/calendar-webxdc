# Development choices and problem solutions for _Milestone: c. Calendar (with external sync)_

Throughout the development of the Calendar there have been many decisions done
due to encountered problems or inconveniences.

1. Datetimes and Timezones Working with Timezones and Time in general with
   JavaScript's `Date` is a very bad DX and is prone to errors. Due to this it
   has been chosen to use a new, emerging standard for working with dates and
   times – [Temporal](https://github.com/tc39/proposal-temporal). Because it's
   still Stage 3, and not all web browsers support it already, Calendar uses
   polyfill to work with it.
   - Problems with `Date`:
     - Incosistencies:
       - Days are within range of 1–31,
       - Months are within range of 0–11
     - Missing functionality
       - `Date` cannot calculate days in given month, date ranges or time ranges
         - Doing all of these things with `Date` require hacks like negative
           days or relying on specific dates, which (as described earlier) is
           very error prone and hard to debug
       - Timezone conversion
   - Benefits of using `Temporal`
     - First party support of useful API's such as `dayOfWeek`, `daysInMonth`
     - Great support for timezones via `Temporal.ZonedDateTime`
     - Support for time ranges and durations
     - Strict options with checks and good errors

2. For external synchronization Calendar implements importing and exporting of
   iCalendar (ics) format, which is a de facto standard for calendars. To parse
   calendars Calendar uses [ical.js](https://github.com/kewisch/ical.js)
   library.
   - Why `ical.js`:
     - Open source with GPLv3 compatible license (MPL-2.0)
     - Extensive support for iCalendar with compliance to RFC 5545
     - Actively maintained
     - Encountered issues:
       - `ical.js` uses its own `ICAL.Time` class, which requires switching
         between it and `Temporal.ZonedDateTime` at times
         - Not a big issue, we can convert between them pretty easily
         - Why not just use something that uses `Temporal`?
           - Because no package with support for iCalendar uses `Temporal` at
             the time of writing this

3. Calendar uses [SvelteKit](https://kit.svelte.dev/) for its web framework,
   which allows for easy and fast iteration on the app, has great to use state
   management using stores and contexts.

4. Calendar adopts [Material 3 Design](https://m3.material.io/) for its
   graphical interface to integrate nicely on phones and give it that "native
   feel".
   - Because of that Calendar partially utilizes
     [Material Web Components](https://material-web.dev/), webcomponent set for
     Material 3 made by Google
