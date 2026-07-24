// Counts whole weekdays (Mon-Fri), excluding Irish public holidays, elapsed
// between `from` and now — used to gauge the 30-working-day statutory
// response window for formal complaints. This is an approximation for
// tracking purposes, not a legal calculation.

// Easter Sunday via the anonymous Gregorian algorithm (Meeus/Jones/Butcher).
function easterSunday(year) {
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
  return new Date(year, month - 1, day);
}

// Shifts a fixed-date holiday to the following Monday if it falls on a
// weekend (used for New Year's Day, St. Brigid's Day, and St. Patrick's Day
// — Christmas Day and St. Stephen's Day do not shift).
function nextMondayIfWeekend(date) {
  const day = date.getDay();
  if (day === 6) date.setDate(date.getDate() + 2);
  else if (day === 0) date.setDate(date.getDate() + 1);
  return date;
}

function nthMondayOfMonth(year, month, n) {
  const d = new Date(year, month, 1);
  d.setDate(1 + ((8 - d.getDay()) % 7) + (n - 1) * 7);
  return d;
}

function lastMondayOfMonth(year, month) {
  const d = new Date(year, month + 1, 0); // last day of month
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

// Ireland's public holidays (gov.ie national list). St. Brigid's Day is the
// first Monday in February, unless 1 Feb is itself a Friday.
function irishPublicHolidays(year) {
  const feb1 = new Date(year, 1, 1);
  const easter = easterSunday(year);

  return [
    nextMondayIfWeekend(new Date(year, 0, 1)),
    feb1.getDay() === 5 ? feb1 : nthMondayOfMonth(year, 1, 1),
    nextMondayIfWeekend(new Date(year, 2, 17)),
    new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1), // Easter Monday
    nthMondayOfMonth(year, 4, 1),
    nthMondayOfMonth(year, 5, 1),
    nthMondayOfMonth(year, 7, 1),
    lastMondayOfMonth(year, 9),
    new Date(year, 11, 25),
    new Date(year, 11, 26),
  ];
}

const holidayCache = new Map();
function isIrishPublicHoliday(date) {
  const year = date.getFullYear();
  if (!holidayCache.has(year)) {
    holidayCache.set(year, new Set(irishPublicHolidays(year).map(d => d.toDateString())));
  }
  return holidayCache.get(year).has(date.toDateString());
}

function businessDaysSince(from) {
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  let count = 0;
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6 && !isIrishPublicHoliday(cur)) count++;
  }
  return count;
}

module.exports = { businessDaysSince };
