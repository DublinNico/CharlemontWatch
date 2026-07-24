// Counts whole weekdays (Mon-Fri) elapsed between `from` and now, used to
// gauge the 30-working-day statutory response window for formal complaints.
// Irish public holidays aren't excluded — this is an approximation, not a
// legal calculation.
function businessDaysSince(from) {
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  let count = 0;
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

module.exports = { businessDaysSince };
