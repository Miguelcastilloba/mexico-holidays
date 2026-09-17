# mexico-holidays

Rule-based federal mandatory-rest days for Mexico under Article 74 of the Federal Labor Law.

This package calculates movable holidays instead of maintaining a list of dates for every year.

## Install

```bash
npm install mexico-holidays
```

## API

```js
import {
  getHolidays,
  isHoliday,
  isBusinessDay
} from "mexico-holidays";

getHolidays(2027);
// [
//   {
//     date: "2027-01-01",
//     name: "New Year's Day",
//     nameEs: "Año Nuevo",
//     legalReference: "Article 74(I)"
//   },
//   ...
// ]

isHoliday("2027-02-01"); // true
isBusinessDay("2027-02-01"); // false
isBusinessDay("2027-02-02"); // true
isBusinessDay("2027-02-06", { weekendDays: ["saturday"] }); // false
isBusinessDay("2027-02-07", { weekendDays: ["saturday"] }); // true

// Include the customary Holy Week closures in addition to federal holidays.
getHolidays(2027, { includeHolyWeek: true });
isHoliday("2027-03-26", { includeHolyWeek: true }); // Good Friday
isBusinessDay("2027-03-26", { includeHolyWeek: true }); // false
```

The functions accept either a `YYYY-MM-DD` string or a JavaScript `Date`.
Date-only strings are interpreted as calendar dates. `Date` values are converted using `America/Mexico_City`.
By default, Saturdays and Sundays are not business days. Pass a `weekendDays`
array to `isBusinessDay` to customize this: use `["saturday"]` for Saturdays
only, `["sunday"]` for Sundays only, or `["saturday", "sunday"]` for both.
An empty array makes both days business days. Federal holidays still take
precedence.

## Included holidays

- January 1
- First Monday of February
- Third Monday of March
- May 1
- September 16
- Third Monday of November
- October 1 every six years when the Federal Executive Power is transferred
- December 25

Article 74(IX) also refers to ordinary election days. Those dates depend on the applicable federal or local electoral law and election cycle, so they are not invented by this package. Add them in your application when the competent electoral authority publishes them.

Holy Week is not a federal mandatory-rest period under Article 74. Pass `{ includeHolyWeek: true }` to `getHolidays`, `isHoliday`, or `isBusinessDay` when your organization observes the customary closures on Good Friday and Holy Saturday. The option is disabled by default and the dates are calculated from Gregorian Easter.

This package does not include company closures, school holidays, banking calendars, vacations, or state-specific holidays.

## CommonJS

```js
const {
  getHolidays,
  isHoliday,
  isBusinessDay
} = require("mexico-holidays");
```

## Development

```bash
npm test
npm pack --dry-run
```

## License

MIT
