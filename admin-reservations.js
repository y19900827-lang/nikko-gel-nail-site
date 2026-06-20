const slots = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
const labels = { trial: "体験ジェルネイル", repeat: "2回目以降のお客様" };
document.getElementById("adminStartTime").innerHTML = slots.map((slot) => `<option>${slot}</option>`).join("");

async function api(path, options = {}) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "エラーが発生しました");
  return data;
}

async function login() {
  try {
    await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password: document.getElementById("adminPassword").value }) });
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminApp").style.display = "block";
    await loadReservations();
  } catch (error) {
    document.getElementById("loginMessage").textContent = error.message;
  }
}

async function loadReservations() {
  const data = await api("/api/admin/reservations");
  const rows = document.getElementById("reservationRows");
  rows.innerHTML = data.reservations.map((item) => `
    <tr>
      <td><input data-date="${item.id}" type="date" value="${item.date}"></td>
      <td><select data-time="${item.id}">${slots.map((slot) => `<option value="${slot}">${slot}</option>`).join("")}</select></td>
      <td>${item.customerName || "-"}</td>
      <td>${item.phone || "-"}</td>
      <td>${labels[item.menuType] || item.menuType || "-"}</td>
      <td>${item.note || ""}</td>
      <td><textarea data-memo="${item.id}" rows="2">${item.adminMemo || ""}</textarea></td>
      <td><select data-status="${item.id}"><option value="reserved">予約済み</option><option value="cancelled">キャンセル</option><option value="visited">来店済み</option><option value="blocked">受付停止</option></select></td>
      <td><button class="slot-button" data-save="${item.id}" type="button">保存</button></td>
    </tr>
  `).join("");
  data.reservations.forEach((item) => {
    rows.querySelector(`[data-status="${item.id}"]`).value = item.status;
    rows.querySelector(`[data-time="${item.id}"]`).value = item.startTime;
  });
}

async function addReservation() {
  const msg = document.getElementById("adminMessage");
  msg.textContent = "";
  const status = document.getElementById("adminStatus").value;
  try {
    await api("/api/admin/reservations", {
      method: "POST",
      body: JSON.stringify({
        date: document.getElementById("adminDate").value,
        startTime: document.getElementById("adminStartTime").value,
        status,
        menuType: document.getElementById("adminMenu").value,
        customerName: status === "blocked" ? "受付停止" : document.getElementById("adminName").value,
        phone: document.getElementById("adminPhone").value,
        note: document.getElementById("adminNote").value,
        adminMemo: document.getElementById("adminMemo").value,
      }),
    });
    msg.textContent = "追加しました。";
    await loadReservations();
  } catch (error) {
    msg.textContent = error.message;
    msg.classList.add("danger");
  }
}

async function saveRow(id) {
  await api(`/api/admin/reservations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: document.querySelector(`[data-status="${id}"]`).value,
      date: document.querySelector(`[data-date="${id}"]`).value,
      startTime: document.querySelector(`[data-time="${id}"]`).value,
      adminMemo: document.querySelector(`[data-memo="${id}"]`).value,
    }),
  });
  await loadReservations();
}

document.getElementById("loginButton").addEventListener("click", login);
document.getElementById("addAdminReservation").addEventListener("click", addReservation);
document.getElementById("reservationRows").addEventListener("click", (event) => {
  if (event.target.dataset.save) saveRow(event.target.dataset.save);
});
