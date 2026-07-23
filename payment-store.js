// Stockage minimal des transactions de paiement, sur fichier JSON.
// Suffisant pour démarrer ; à remplacer par une vraie base (Postgres/SQLite)
// si le volume de clients augmente.

const fs = require("fs");
const path = require("path");

const STORE_PATH = path.join(__dirname, "transactions.json");

function readAll() {
  if (!fs.existsSync(STORE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function writeAll(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function createPending({ transactionId, email, phone, amount }) {
  const all = readAll();
  all[transactionId] = {
    status: "PENDING",
    email: email || null,
    phone: phone || null,
    amount,
    createdAt: new Date().toISOString(),
    usedForReport: false,
  };
  writeAll(all);
}

function markPaid(transactionId, extra = {}) {
  const all = readAll();
  if (!all[transactionId]) {
    all[transactionId] = { status: "ACCEPTED", createdAt: new Date().toISOString(), usedForReport: false };
  }
  all[transactionId].status = "ACCEPTED";
  all[transactionId].paidAt = new Date().toISOString();
  Object.assign(all[transactionId], extra);
  writeAll(all);
}

function markFailed(transactionId, reason) {
  const all = readAll();
  if (!all[transactionId]) return;
  all[transactionId].status = "REFUSED";
  all[transactionId].failReason = reason;
  writeAll(all);
}

function isPaid(transactionId) {
  const all = readAll();
  const record = all[transactionId];
  return !!record && record.status === "ACCEPTED";
}

function wasAlreadyUsedForReport(transactionId) {
  const all = readAll();
  const record = all[transactionId];
  return !!record && record.usedForReport === true;
}

function markUsedForReport(transactionId) {
  const all = readAll();
  if (all[transactionId]) {
    all[transactionId].usedForReport = true;
    writeAll(all);
  }
}

function get(transactionId) {
  return readAll()[transactionId];
}

module.exports = {
  createPending,
  markPaid,
  markFailed,
  isPaid,
  wasAlreadyUsedForReport,
  markUsedForReport,
  get,
};
