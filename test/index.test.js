import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getHolidays,
  isBusinessDay,
  isHoliday
} from "../index.js";

test("getHolidays calculates the 2026 federal labor holidays", () => {
  assert.deepEqual(
    getHolidays(2026).map((holiday) => holiday.date),
    [
      "2026-01-01",
      "2026-02-02",
      "2026-03-16",
      "2026-05-01",
      "2026-09-16",
      "2026-11-16",
      "2026-12-25"
    ]
  );
});

test("movable holidays are recalculated for another year", () => {
  assert.deepEqual(
    getHolidays(2027).map((holiday) => holiday.date),
    [
      "2027-01-01",
      "2027-02-01",
      "2027-03-15",
      "2027-05-01",
      "2027-09-16",
      "2027-11-15",
      "2027-12-25"
    ]
  );
});

test("Holy Week can be included as an optional customary closure", () => {
  assert.deepEqual(
    getHolidays(2026, { includeHolyWeek: true })
      .filter((holiday) => holiday.nameEs.endsWith("Santo"))
      .map((holiday) => holiday.date),
    ["2026-04-03", "2026-04-04"]
  );

  assert.equal(isHoliday("2026-04-03"), false);
  assert.equal(isHoliday("2026-04-03", { includeHolyWeek: true }), true);
  assert.equal(isHoliday("2026-04-04", { includeHolyWeek: true }), true);
  assert.equal(isBusinessDay("2026-04-03"), true);
  assert.equal(
    isBusinessDay("2026-04-03", { includeHolyWeek: true }),
    false
  );
  assert.equal(
    isBusinessDay("2026-04-04", {
      includeHolyWeek: true,
      weekendDays: []
    }),
    false
  );
});

test("the presidential transition holiday occurs every six years", () => {
  assert.equal(isHoliday("2024-10-01"), true);
  assert.equal(isHoliday("2026-10-01"), false);
  assert.equal(isHoliday("2030-10-01"), true);
});

test("isHoliday accepts date-only strings and Date values", () => {
  assert.equal(isHoliday("2027-02-01"), true);
  assert.equal(isHoliday(new Date("2027-09-16T12:00:00.000Z")), true);
  assert.equal(isHoliday("2027-02-02"), false);
  assert.equal(isHoliday("2027-04-02"), false);
});

test("isBusinessDay excludes weekends and federal holidays", () => {
  assert.equal(isBusinessDay("2027-02-01"), false);
  assert.equal(isBusinessDay("2027-02-02"), true);
  assert.equal(isBusinessDay("2027-02-06"), false);
  assert.equal(isBusinessDay("2027-02-07"), false);
  assert.equal(isBusinessDay("2027-02-05"), true);
});

test("isBusinessDay allows customizing weekend days", () => {
  assert.equal(
    isBusinessDay("2027-02-06", { weekendDays: ["saturday"] }),
    false
  );
  assert.equal(
    isBusinessDay("2027-02-07", { weekendDays: ["saturday"] }),
    true
  );
  assert.equal(
    isBusinessDay("2027-02-06", { weekendDays: ["sunday"] }),
    true
  );
  assert.equal(
    isBusinessDay("2027-02-07", { weekendDays: ["sunday"] }),
    false
  );
  assert.equal(
    isBusinessDay("2027-02-07", { weekendDays: ["saturday", "sunday"] }),
    false
  );
  assert.equal(isBusinessDay("2027-02-07", { weekendDays: [] }), true);
  assert.equal(isBusinessDay("2023-01-01", { weekendDays: [] }), false);
});

test("weekendDays rejects unsupported day names", () => {
  assert.throws(
    () => isBusinessDay("2027-02-07", { weekendDays: ["friday"] }),
    /weekendDays must be an array/
  );
});

test("invalid inputs produce useful errors", () => {
  assert.throws(() => getHolidays(2027.5), /year must be an integer/);
  assert.throws(() => isHoliday("2027-02-30"), /invalid calendar date/);
  assert.throws(() => isBusinessDay("02\/01\/2027"), /YYYY-MM-DD/);
  assert.throws(
    () => isHoliday("2027-03-26", { includeHolyWeek: "yes" }),
    /includeHolyWeek must be a boolean/
  );
});
