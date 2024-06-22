# WebXDC Calendar

Calendar with support for WebXDC application format.

## Features

- Day, Week, Month and Incoming Events views
- Material3 UI with Dark and Light themes
- Import from and Export to iCalendar (`.ics`) format
- Calendar management
  - Add/Delete/Edit
    - Name
    - Description
    - Color
    - Visibility
- Event management
  - Add/Delete/Edit
    - Title
    - Description
      - Markdown support
    - Location
    - Recurrence
    - Exclusion dates
    - Start and End time, Partial and All day

## Development

Use [pnpm](https://pnpm.io/) package manager

- `pnpm dev` – run dev server
- `pnpm build` – build app into `build/` directory, automatically generates
  `.xdc` file as well
  - It requires `zip` to be installed in order to generate `.xdc` file

## License

This code is licensed under GPLv3
