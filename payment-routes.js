const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { initiatePayment, verifyTransaction } = require("./cinetpay");
const store = require("./payment-store");
const { sendMail } = require("./mailer");

const router = express.Router();

const PRICE_FCFA = Number(process.env.CHECKUP_PRICE_FCFA || 15000);
const TALLY_FORM_URL = process.env.TALLY_FORM_URL || "https://tally.so/r/VOTRE_FORMULAIRE";

function getBaseUrl(req) {
  return process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
}

function tallyLinkFor(transactionId) {
  const url = new URL(TALLY_FORM_URL);
  url.searchParams.set("transaction_id", transactionId);
  return url.toString();
}

// Page de paiement
router.get("/pay", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pay.html"));
});

// Initialisation du paiement — appelé par le bouton "Payer" de pay.html
router.post("/pay/init", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ message: "Nom, email et téléphone sont requis." });
    }

    const transactionId = `LCU-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    store.createPending({ transactionId, email, phone, amount: PRICE_FCFA });

    const { paymentUrl } = await initiatePayment({
      transactionId,
      amount: PRICE_FCFA,
      description: "Legal Check-up PME",
      customerEmail: email,
      customerPhone: phone,
      baseUrl: getBaseUrl(req),
    });

    res.json({ paymentUrl, transactionId });
  } catch (err) {
    console.error("Erreur /pay/init :", err);
    res.status(500).json({ message: "Erreur lors de l'initialisation du paiement." });
  }
});

// Webhook serveur-à-serveur envoyé par CinetPay après tentative de paiement.
// Répondre 200 rapidement ; ne jamais faire confiance au corps reçu sans revérifier.
router.post("/pay/notify", async (req, res) => {
  const transactionId = req.body.cpm_trans_id || req.body.transaction_id || req.query.transaction_id;
  res.status(200).send("OK"); // accuser réception immédiatement (exigé par CinetPay)

  if (!transactionId) {
    console.warn("Notify CinetPay reçu sans transaction_id identifiable :", req.body);
    return;
  }

  try {
    const verification = await verifyTransaction(transactionId);
    if (verification.status === "ACCEPTED") {
      const pending = store.get(transactionId);
      store.markPaid(transactionId);

      if (pending && pending.email) {
        const link = tallyLinkFor(transactionId);
        await sendMail({
          to: pending.email,
          subject: "Accès à votre Legal Check-up PME",
          text:
            `Bonjour,\n\nVotre paiement a bien été reçu. Vous pouvez maintenant remplir votre ` +
            `questionnaire Legal Check-up PME en suivant ce lien :\n\n${link}\n\n` +
            `Vous recevrez votre rapport personnalisé par email dès la fin du questionnaire.\n\nCordialement.`,
        });
      }
      console.log(`Paiement confirmé pour ${transactionId}`);
    } else {
      store.markFailed(transactionId, verification.status);
      console.log(`Paiement non confirmé pour ${transactionId} : ${verification.status}`);
    }
  } catch (err) {
    console.error("Erreur de vérification CinetPay :", err);
  }
});

// Page affichée au client juste après le paiement (redirection navigateur)
router.get("/pay/return", async (req, res) => {
  const { transaction_id: transactionId } = req.query;
  let html;

  try {
    const verification = transactionId ? await verifyTransaction(transactionId) : { status: "UNKNOWN" };
    if (verification.status === "ACCEPTED") {
      store.markPaid(transactionId);
      const link = tallyLinkFor(transactionId);
      html = `
        <h2>Paiement confirmé ✅</h2>
        <p>Vous pouvez accéder à votre questionnaire dès maintenant :</p>
        <p><a href="${link}">${link}</a></p>
        <p>Vous recevrez aussi ce lien par email.</p>`;
    } else {
      html = `
        <h2>Paiement en cours de vérification…</h2>
        <p>Si le paiement a bien été effectué, vous recevrez le lien du questionnaire par email
        dans quelques instants. En cas de doute, contactez le cabinet.</p>`;
    }
  } catch {
    html = `<h2>Merci</h2><p>Nous vérifions votre paiement, vous recevrez le lien par email.</p>`;
  }

  res.send(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Legal Check-up PME</title>
    <style>body{font-family:sans-serif;max-width:480px;margin:60px auto;padding:0 20px;color:#1a1a1a}
    a{color:#1F3864}</style></head><body>${html}</body></html>`);
});

module.exports = router;
