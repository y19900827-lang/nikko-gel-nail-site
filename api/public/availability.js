const {
  activeStatuses,
  addDays,
  dateKey,
  json,
  restrictionFor,
  supabaseFetch,
  timeSlots,
  todayJst,
} = require("../_shared");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

    const today = todayJst();
    const from = req.query.from || dateKey(today);
    const days = Math.min(Number(req.query.days || 61), 90);
    const to = dateKey(addDays(new Date(`${from}T00:00:00+09:00`), days));
    const query = `reservations?select=id,date,start_time,end_time,status&date=gte.${from}&date=lte.${to}`;
    const records = await supabaseFetch(query);

    const result = [];
    const start = new Date(`${from}T00:00:00+09:00`);
    for (let i = 0; i < days; i += 1) {
      const current = addDays(start, i);
      const key = dateKey(current);
      const restriction = restrictionFor(key);
      const slots = timeSlots.map(([startTime, endTime]) => {
        const taken = records.find((record) => (
          record.date === key
          && record.start_time.slice(0, 5) === startTime
          && activeStatuses.includes(record.status)
        ));
        if (restriction) return { startTime, endTime, state: restriction };
        if (!taken) return { startTime, endTime, state: "空きあり" };
        return { startTime, endTime, state: taken.status === "blocked" ? "受付停止" : "満席" };
      });
      result.push({ date: key, restriction, slots });
    }

    return json(res, 200, {
      menus: [
        { value: "trial", label: "体験ジェルネイル" },
        { value: "repeat", label: "2回目以降のお客様" },
      ],
      days: result,
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || "空き状況を取得できませんでした" });
  }
};
