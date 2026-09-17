"use strict";

const MEXICO_CITY_TIME_ZONE = "America/Mexico_City";
const PRESIDENTIAL_TRANSITION_BASE_YEAR = 2024;

function assertValidYear(year) {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new RangeError("year must be an integer between 1 and 9999");
  }
}

function dateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateKeyFromMonthDay(year, monthDay) {
  const [month, day] = monthDay.split("-").map(Number);
  return dateKey(year, month, day);
}

function nthWeekdayOfMonth(year, month, weekday, occurrence) {
  // JavaScript weekdays: Sunday = 0, Monday = 1, ..., Saturday = 6.
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const day = 1 + ((weekday - firstDay + 7) % 7) + (occurrence - 1) * 7;

  return dateKey(year, month, day);
}

function getEasterSunday(year) {
  // Gregorian computus (Meeus/Jones/Butcher), using only integer arithmetic.
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return { month, day };
}

function normalizeOptions(options) {
  if (options === undefined) {
    return { includeHolyWeek: false };
  }

  if (
    options === null ||
    typeof options !== "object" ||
    Array.isArray(options)
  ) {
    throw new TypeError("options must be an object");
  }

  if (
    options.includeHolyWeek !== undefined &&
    typeof options.includeHolyWeek !== "boolean"
  ) {
    throw new TypeError("options.includeHolyWeek must be a boolean");
  }

  return { includeHolyWeek: options.includeHolyWeek === true };
}

function parseDateOnlyString(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new TypeError("date strings must use the YYYY-MM-DD format");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new RangeError(`invalid calendar date: ${value}`);
  }

  return { year, month, day };
}

function parseDateParts(date) {
  if (typeof date === "string") {
    return parseDateOnlyString(date);
  }

  if (!(date instanceof Date)) {
    throw new TypeError("date must be a Date or a YYYY-MM-DD string");
  }

  if (Number.isNaN(date.getTime())) {
    throw new RangeError("date must be a valid Date");
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MEXICO_CITY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year").value),
    month: Number(parts.find((part) => part.type === "month").value),
    day: Number(parts.find((part) => part.type === "day").value)
  };
}

function getHolidayDates(year, options) {
  assertValidYear(year);
  const normalizedOptions = normalizeOptions(options);

  const holidays = [];

  const addHoliday = (monthDay, name, nameEs, legalReference) => {
    holidays.push({
      date: dateKeyFromMonthDay(year, monthDay),
      name,
      nameEs,
      legalReference
    });
  };

  addHoliday("01-01", "New Year's Day", "Año Nuevo", "Article 74(I)");

  holidays.push({
    date: nthWeekdayOfMonth(year, 2, 1, 1),
    name: "Constitution Day",
    nameEs: "Día de la Constitución",
    legalReference: "Article 74(II)"
  });

  holidays.push({
    date: nthWeekdayOfMonth(year, 3, 1, 3),
    name: "Benito Juárez's Birthday",
    nameEs: "Natalicio de Benito Juárez",
    legalReference: "Article 74(III)"
  });

  addHoliday("05-01", "Labor Day", "Día del Trabajo", "Article 74(IV)");
  addHoliday(
    "09-16",
    "Independence Day",
    "Día de la Independencia",
    "Article 74(V)"
  );

  holidays.push({
    date: nthWeekdayOfMonth(year, 11, 1, 3),
    name: "Revolution Day",
    nameEs: "Día de la Revolución",
    legalReference: "Article 74(VI)"
  });

  // The current presidential-transition cycle began in 2024.
  if (
    year >= PRESIDENTIAL_TRANSITION_BASE_YEAR &&
    (year - PRESIDENTIAL_TRANSITION_BASE_YEAR) % 6 === 0
  ) {
    addHoliday(
      "10-01",
      "Federal Executive Power Transition Day",
      "Día de la Transmisión del Poder Ejecutivo Federal",
      "Article 74(VII)"
    );
  }

  addHoliday("12-25", "Christmas Day", "Navidad", "Article 74(VIII)");

  if (normalizedOptions.includeHolyWeek) {
    const easterSunday = getEasterSunday(year);

    holidays.push(
      {
        date: dateKey(year, easterSunday.month, easterSunday.day - 2),
        name: "Good Friday",
        nameEs: "Viernes Santo",
        legalReference: "Customary closure (not Article 74)"
      },
      {
        date: dateKey(year, easterSunday.month, easterSunday.day - 1),
        name: "Holy Saturday",
        nameEs: "Sábado Santo",
        legalReference: "Customary closure (not Article 74)"
      }
    );
  }

  return holidays.sort((left, right) => left.date.localeCompare(right.date));
}

/**
 * Returns Mexico's predictable federal mandatory-rest days for a year.
 *
 * Article 74(IX) also refers to ordinary election days. Election dates are
 * not generated here because they depend on the applicable federal or local
 * electoral law and election cycle, rather than on a permanent annual rule.
 */
function getHolidays(year, options) {
  return getHolidayDates(year, options);
}

function isHoliday(date, options) {
  const parts = parseDateParts(date);
  const key = dateKey(parts.year, parts.month, parts.day);

  return getHolidayDates(parts.year, options).some(
    (holiday) => holiday.date === key
  );
}

function isBusinessDay(date, options) {
  const parts = parseDateParts(date);
  const weekday = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day)
  ).getUTCDay();

  return (
    weekday !== 0 &&
    weekday !== 6 &&
    !isHoliday(date, options)
  );
}

module.exports = {
  isHoliday,
  isBusinessDay,
  getHolidays
};
