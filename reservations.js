const { activeStatuses, json, readBody, restrictionFor, supabaseFetch, timeSlots } = require("../_shared");

function validate(body) {
  if (!["trial", "repeat"].includes(body.menuType)) throw Object.assign(new Error("メニューを選んでください"), { status: 400 });
  if (!body.customerName || body.customerName.trim().length < 1) throw Object.assign(new Error("お名前を入力してください"), { status: 400 });
  if (!body.phone || body.phone.trim().length < 8) throw Object.assign(new Error("電話番号を入力してください"), { status: 400 });
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) throw Object.assign(new Error("予約日を選んでください"), { status: 400 });
  const restriction = restrictionFor(body.date);
  if (restriction) throw Object.assign(new Error("この日はWeb予約できません"), { status: 400 });
  const slot = timeSlots.find(([start]) => start === body.startTime);
  if (!slot) throw Object.assign(new Error("予約時間を選んでください"), { status: 400 });
  return slot[1];
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
    const body = await readBody(req);
    const endTime = validate(body);

    const existing = await supabaseFetch(
      `reservations?select=id,status&date=eq.${body.date}&start_time=eq.${body.startTime}:00`
    );
    if (existing.some((record) => activeStatuses.includes(record.status))) {
      return json(res, 409, { error: "この枠はすでに予約されています" });
    }

    const inserted = await supabaseFetch("reservations", {
      method: "POST",
      body: JSON.stringify({
        customer_name: body.customerName.trim(),
        phone: body.phone.trim(),
        menu_type: body.menuType,
        date: body.date,
        start_time: body.startTime,
        end_time: endTime,
        note: body.note || "",
        admin_memo: "",
        status: "reserved",
      }),
    });
    const reservation = inserted[0];
    return json(res, 201, {
      reservation: {
        id: reservation.id,
        customerName: reservation.customer_name,
        menuType: reservation.menu_type,
        date: reservation.date,
        startTime: reservation.start_time.slice(0, 5),
        endTime: reservation.end_time.slice(0, 5),
      },
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || "予約できませんでした" });
  }
};
