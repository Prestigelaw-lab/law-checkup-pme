require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { generate } = require("./generate-report");
const { buildAnswersFromTally } = require("./tally-mapping");
const { sendMail } = require("./mailer");
const paymentStore = require("./payment-store");
const paymentRoutes = require("./payment-routes");

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(paymentRoutes);

const PORT = process.env.PORT || 3000;
const OUTPUT_DIR = path.join(__dirname, "generated");
const CONVERT_TO_PDF = process.env.CONVERT_TO_PDF === "true";
const REQUIRE_PAYMENT = process.env.REQUIRE_PAYMENT !== "false"; // activé par défaut

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function convertToPdf(docxPath) {
  const pdfPath = docxPath.replace(/\.docx$/, ".pdf");
  execSync(`soffice --headless --convert-to pdf --outdir "${OUTPUT_DIR}" "${docxPath}"`, { stdio: "pipe" });
  return pdfPath;
}

async function sendReportEmail({ toEmail, clientName, attachmentPath }) {
  await sendMail({
    to: toEmail,
    subject: `Votre rapport Legal Check-up PME — ${clientName}`,
    text:
      `Bonjour,\n\nVeuillez trouver ci-joint le rapport de votre Legal Check-up PME.\n\n` +
      `Pour toute question ou pour approfondir les points signalés, vous pouvez prendre rendez-vous ` +
      `avec le Cabinet Prestige Center Consulting.\n\nCordialement.`,
    attachments: [{ path: attachmentPath }],
  });
}

app.post("/webhook/tally", async (req, res) => {
  try {
    const payload = req.body;

    // Le formulaire Tally doit contenir un champ caché "transaction_id",
    // prérempli via l'URL envoyée au client après paiement (voir payment-routes.js)
    const transactionField = (payload.data.fields || []).find(
      (f) => (f.label || "").trim() === "transaction_id" || f.key === "transaction_id"
    );
    const transactionId = transactionField ? transactionField.value : req.query.transaction_id;

    if (REQUIRE_PAYMENT) {
      if (!transactionId) {
        console.warn("Soumission Tally reçue sans transaction_id — rejetée.");
        return res.status(402).json({ status: "error", message: "Paiement requis (transaction_id manquant)." });
      }
      if (!paymentStore.isPaid(transactionId)) {
        console.warn(`Soumission Tally avec transaction_id non payé : ${transactionId}`);
        return res.status(402).json({ status: "error", message: "Paiement non confirmé pour cette transaction." });
      }
      if (paymentStore.wasAlreadyUsedForReport(transactionId)) {
        console.warn(`Transaction déjà utilisée pour un rapport : ${transactionId}`);
        return res.status(409).json({ status: "error", message: "Cette transaction a déjà généré un rapport." });
      }
    }

    const input = buildAnswersFromTally(payload);

    // Email du client : adapter le libellé exact du champ email dans le formulaire Tally
    const emailField = (payload.data.fields || []).find(
      (f) => (f.label || "").toLowerCase().includes("email")
    );
    const clientEmail = emailField ? emailField.value : null;

    const safeName = input.clientName.replace(/[^a-z0-9]/gi, "_");
    const docxPath = path.join(OUTPUT_DIR, `rapport_${safeName}_${Date.now()}.docx`);

    // Écrit un fichier temporaire answers.json pour réutiliser generate() tel quel
    const tmpAnswersPath = docxPath.replace(".docx", "_answers.json");
    fs.writeFileSync(tmpAnswersPath, JSON.stringify(input, null, 2));

    await generate(tmpAnswersPath, docxPath);

    let finalPath = docxPath;
    if (CONVERT_TO_PDF) {
      try {
        finalPath = await convertToPdf(docxPath);
      } catch (e) {
        console.error("Conversion PDF échouée, envoi du .docx à la place :", e.message);
      }
    }

    if (clientEmail) {
      await sendReportEmail({ toEmail: clientEmail, clientName: input.clientName, attachmentPath: finalPath });
    } else {
      console.warn("Aucun email client trouvé dans la soumission — rapport généré mais non envoyé.");
    }

    if (REQUIRE_PAYMENT && transactionId) {
      paymentStore.markUsedForReport(transactionId);
    }

    res.status(200).json({ status: "ok", report: path.basename(finalPath) });
  } catch (err) {
    console.error("Erreur de traitement du webhook :", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "up" }));

app.listen(PORT, () => {
  console.log(`Serveur webhook Legal Check-up en écoute sur le port ${PORT}`);
});
