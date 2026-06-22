const timeSlots = [
  ["10:00", "11:00"],
  ["11:00", "12:00"],
  ["12:00", "13:00"],
  ["13:00", "14:00"],
  ["14:00", "15:00"],
  ["15:00", "16:00"],
];

const activeStatuses = ["reserved", "visited", "blocked"];

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayJst() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isWeekend(key) {
  const date = new Date(`${key}T00:00:00+09:00`);
  const day = date.getDay();
  return day === 0 || day === 6;
}

const holidays2026 = new Set([
  "2026-01-01", "2026-01-12", "2026-02-11", "2026-02-23", "2026-03-20",
  "2026-04-29", "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06",
  "2026-07-20", "2026-08-11", "2026-09-21", "2026-09-22", "2026-09-23",
  "2026-10-12", "2026-11-03", "2026-11-23",
]);

function restrictionFor(key) {
  const today = new Date(`${dateKey(todayJst())}T00:00:00+09:00`);
  const target = new Date(`${key}T00:00:00+09:00`);
  const diff = Math.round((target - today) / 86400000);
  if (diff < 0) return "受付終了";
  if (diff === 0) return "受付終了";
  if (diff > 60) return "受付終了";
  if (isWeekend(key) || holidays2026.has(key)) return "定休日";
  return null;
}

function env() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    const error = new Error("Supabaseの環境変数が設定されていません");
    error.status = 500;
    throw error;
  }
  return { supabaseUrl, supabaseKey };
}

async function supabaseFetch(path, options = {}) {
  const { supabaseUrl, supabaseKey } = env();
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || "Supabaseの処理に失敗しました");
    error.status = response.status;
    throw error;
  }
  return data;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

module.exports = {
  activeStatuses,
  addDays,
  dateKey,
  json,
  readBody,
  restrictionFor,
  supabaseFetch,
  timeSlots,
  todayJst,
};
