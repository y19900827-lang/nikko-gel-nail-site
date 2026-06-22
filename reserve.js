const dateSelect = document.getElementById("dateSelect");
const slotsEl = document.getElementById("slots");
const messageEl = document.getElementById("message");
let availability = [];
let selectedSlot = null;
let calendarMonth = new Date();
calendarMonth.setDate(1);

function menuLabel(value) {
  return value === "trial" ? "体験ジェルネイル" : "2回目以降のお客様";
}

async function loadAvailability() {
  const res = await fetch("/api/public/availability?days=61");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "空き状況を取得できませんでした");
  availability = data.days.filter((day) => !day.restriction);
  dateSelect.innerHTML = availability.map((day) => `<option value="${day.date}">${day.date}</option>`).join("");
  renderSlots();
  renderCalendar(data.days);
}

function renderSlots() {
  selectedSlot = null;
  const day = availability.find((item) => item.date === dateSelect.value);
  slotsEl.innerHTML = "";
  if (!day) {
    slotsEl.innerHTML = "<p>予約できる日付がありません。</p>";
    return;
  }
  day.slots.forEach((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `slot-button ${slot.state === "空きあり" ? "available" : ""}`;
    button.disabled = slot.state !== "空きあり";
    button.innerHTML = `<strong>${slot.startTime}〜${slot.endTime}</strong><br><span>${slot.state}</span>`;
    button.addEventListener("click", () => {
      selectedSlot = slot;
      document.querySelectorAll(".slot-button").forEach((el) => el.classList.remove("selected"));
      button.classList.add("selected");
    });
    slotsEl.appendChild(button);
  });
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function renderCalendar(allDays = null) {
  const calendar = document.getElementById("monthCalendar");
  const title = document.getElementById("calendarTitle");
  if (!calendar || !title) return;
  const source = allDays || availability;

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  title.textContent = `${year}年${month + 1}月`;
  calendar.innerHTML = "";

  ["日", "月", "火", "水", "木", "金", "土"].forEach((label) => {
    const head = document.createElement("div");
    head.className = "calendar-head";
    head.textContent = label;
    calendar.appendChild(head);
  });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  for (let i = 0; i < firstDay.getDay(); i += 1) {
    const empty = document.createElement("div");
    empty.className = "calendar-day empty";
    calendar.appendChild(empty);
  }

  for (let dayNumber = 1; dayNumber <= lastDay.getDate(); dayNumber += 1) {
    const current = new Date(year, month, dayNumber);
    const key = dateKey(current);
    const day = source.find((item) => item.date === key);
    const availableCount = day ? day.slots.filter((slot) => slot.state === "空きあり").length : 0;
    const cell = document.createElement("div");
    let label = "受付終了";
    let stateClass = "ended";
    if (day && day.restriction === "定休日") {
      label = "定休日";
      stateClass = "closed";
    } else if (day && availableCount > 0) {
      label = `空き ${availableCount}枠`;
      stateClass = "available";
    } else if (day) {
      label = "満席";
      stateClass = "full";
    }
    cell.className = `calendar-day ${stateClass}`;
    const content = `<strong>${dayNumber}</strong><span>${label}</span>`;
    if (day && availableCount > 0) {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = content;
      button.addEventListener("click", () => {
        dateSelect.value = key;
        renderSlots();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      cell.appendChild(button);
    } else {
      cell.innerHTML = content;
    }
    calendar.appendChild(cell);
  }
}

async function submitReservation() {
  messageEl.textContent = "";
  messageEl.classList.remove("danger");
  if (!selectedSlot) {
    messageEl.textContent = "空いている時間枠を選んでください。";
    return;
  }
  const payload = {
    menuType: document.getElementById("menuType").value,
    date: dateSelect.value,
    startTime: selectedSlot.startTime,
    customerName: document.getElementById("customerName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    note: document.getElementById("note").value.trim(),
  };
  const res = await fetch("/api/public/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    messageEl.textContent = data.error || "予約できませんでした。";
    messageEl.classList.add("danger");
    await loadAvailability();
    return;
  }
  sessionStorage.setItem("lastReservation", JSON.stringify({ ...data.reservation, menuType: payload.menuType }));
  location.href = "reserve-complete.html";
}

dateSelect.addEventListener("change", renderSlots);
document.getElementById("submitReservation").addEventListener("click", submitReservation);
document.getElementById("prevMonth").addEventListener("click", () => {
  calendarMonth.setMonth(calendarMonth.getMonth() - 1);
  renderCalendar();
});
document.getElementById("nextMonth").addEventListener("click", () => {
  calendarMonth.setMonth(calendarMonth.getMonth() + 1);
  renderCalendar();
});
loadAvailability().catch((error) => {
  messageEl.textContent = error.message || "予約情報を読み込めませんでした。";
  messageEl.classList.add("danger");
});
