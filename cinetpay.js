// Intégration CinetPay — API Checkout
// Documentation officielle : https://docs.cinetpay.com/api/1.0-fr/checkout/initialisation

const INIT_URL = "https://api-checkout.cinetpay.com/v2/payment";
const CHECK_URL = "https://api-checkout.cinetpay.com/v2/payment/check";

function requiredEnv() {
  const { CINETPAY_APIKEY, CINETPAY_SITE_ID } = process.env;
  if (!CINETPAY_APIKEY || !CINETPAY_SITE_ID) {
    throw new Error("CINETPAY_APIKEY et CINETPAY_SITE_ID doivent être définis dans .env");
  }
  return { apikey: CINETPAY_APIKEY, site_id: CINETPAY_SITE_ID };
}

// Crée un lien de paiement. Retourne { transactionId, paymentUrl }
async function initiatePayment({ transactionId, amount, description, customerEmail, customerPhone, baseUrl }) {
  const { apikey, site_id } = requiredEnv();

  // Le montant doit être un multiple de 5 (contrainte CinetPay)
  const roundedAmount = Math.round(amount / 5) * 5;

  const body = {
    apikey,
    site_id,
    transaction_id: transactionId,
    amount: roundedAmount,
    currency: "XOF",
    description: description || "Legal Check-up PME",
    notify_url: `${baseUrl}/pay/notify`,
    return_url: `${baseUrl}/pay/return?transaction_id=${transactionId}`,
    channels: "ALL",
    lang: "fr",
    metadata: customerEmail || "",
  };

  const response = await fetch(INIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  if (data.code !== "201") {
    throw new Error(`Échec d'initialisation CinetPay : ${data.code} — ${data.message || data.description}`);
  }

  return { transactionId, paymentUrl: data.data.payment_url, paymentToken: data.data.payment_token };
}

// Vérifie le vrai statut d'une transaction auprès de CinetPay (ne JAMAIS faire confiance
// uniquement au contenu du webhook de notification — toujours revérifier via cette API).
async function verifyTransaction(transactionId) {
  const { apikey, site_id } = requiredEnv();

  const response = await fetch(CHECK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey, site_id, transaction_id: transactionId }),
  });
  const data = await response.json();

  if (data.code !== "00") {
    return { status: "UNKNOWN", raw: data };
  }
  // data.data.status vaut par exemple "ACCEPTED", "REFUSED", "PENDING"
  return { status: data.data.status, raw: data.data };
}

module.exports = { initiatePayment, verifyTransaction };
