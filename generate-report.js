// Générateur automatique du rapport Legal Check-up PME
// Usage : node generate-report.js answers.json output.docx
//
// answers.json format :
// {
//   "clientName": "Société XYZ SARL",
//   "date": "23 juillet 2026",
//   "includeSuccession": true,
//   "answers": { "1.1": "Non", "1.2": "Oui", ... }
// }

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  ShadingType, LevelFormat, convertInchesToTwip, BorderStyle
} = require("docx");
const fs = require("fs");
const { BLOCKS, blockLevel, globalLevel } = require("./questions");

const FONT = "Calibri";

function buildBlockResult(block, answers) {
  const strengths = [];
  const vigilance = [];
  const critical = [];
  let score = 0;

  for (const q of block.questions) {
    const given = answers[q.id];
    if (given === undefined || given === "Non applicable") continue; // question non répondue ou non applicable
    const isRisk = q.riskValues.includes(given);
    if (!isRisk) {
      strengths.push(q.strength);
    } else {
      score += q.weight;
      if (q.weight >= 3) critical.push(q.issue);
      else vigilance.push(q.issue);
    }
  }

  return { score, strengths, vigilance, critical, level: blockLevel(score) };
}

function badge(text, color) {
  return new TextRun({
    text: `  ${text}  `,
    bold: true,
    font: FONT,
    size: 20,
    color: "FFFFFF",
    shading: { type: ShadingType.CLEAR, fill: color },
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, font: FONT, size: 30, color: "1F3864" })],
  });
}

function blockTitle(title, level) {
  return new Paragraph({
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F3864", space: 4 } },
    children: [
      new TextRun({ text: title + "   ", bold: true, font: FONT, size: 26, color: "1F3864" }),
      badge(level.label, level.color),
    ],
  });
}

function subHeading(text, color) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, font: FONT, size: 22, color })],
  });
}

function bulletItem(text, isCritical = false) {
  const children = [new TextRun({ text, font: FONT, size: 21 })];
  if (isCritical) {
    children.push(new TextRun({
      text: "  →  Ce point nécessite un examen par un avocat.",
      font: FONT, size: 21, italics: true, bold: true, color: "C00000",
    }));
  }
  return new Paragraph({
    numbering: { reference: "report-bullets", level: 0 },
    spacing: { after: 100 },
    children,
  });
}

function paragraph(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 160 },
    children: [new TextRun({ text, font: FONT, size: 22, ...opts })],
  });
}

function generate(inputPath, outputPath) {
  const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const answers = input.answers || {};
  const clientName = input.clientName || "Votre entreprise";
  const date = input.date || new Date().toLocaleDateString("fr-FR");
  const includeSuccession = !!input.includeSuccession;

  const blocksToRender = BLOCKS.filter((b) => !b.conditional || includeSuccession);
  const results = blocksToRender.map((b) => ({ block: b, result: buildBlockResult(b, answers) }));
  const totalScore = results.reduce((sum, r) => sum + r.result.score, 0);
  const overall = globalLevel(totalScore);

  const children = [];

  // Page de garde simplifiée
  children.push(
    new Paragraph({ spacing: { after: 800 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "LEGAL CHECK-UP PME", bold: true, font: FONT, size: 44, color: "1F3864" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 400 },
      children: [new TextRun({ text: "Rapport de diagnostic juridique", italics: true, font: FONT, size: 24, color: "2E5395" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: clientName, bold: true, font: FONT, size: 26 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: date, font: FONT, size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300 },
      children: [
        new TextRun({ text: "Score de risque global : ", bold: true, font: FONT, size: 26 }),
        badge(`${overall.label} (${totalScore} pts)`, overall.color),
      ],
    }),
    new Paragraph({
      children: [new TextRun({ text: "", break: 1 })],
      pageBreakBefore: true,
    })
  );

  children.push(h1("Synthèse"));
  children.push(paragraph(
    `Ce rapport présente un diagnostic automatisé des principaux risques juridiques identifiés pour ${clientName}, sur la base des réponses fournies au questionnaire Legal Check-up PME. Il ne remplace pas une consultation juridique mais permet d'orienter en priorité vers les points qui la justifient.`
  ));

  for (const { block, result } of results) {
    children.push(blockTitle(block.title, result.level));

    if (result.strengths.length) {
      children.push(subHeading("Points forts", "2E7D32"));
      result.strengths.forEach((s) => children.push(bulletItem(s, false)));
    }
    if (result.vigilance.length) {
      children.push(subHeading("Points de vigilance", "E36C09"));
      result.vigilance.forEach((s) => children.push(bulletItem(s, false)));
    }
    if (result.critical.length) {
      children.push(subHeading("Points critiques", "C00000"));
      result.critical.forEach((s) => children.push(bulletItem(s, true)));
    }
    if (!result.strengths.length && !result.vigilance.length && !result.critical.length) {
      children.push(paragraph("Aucune réponse exploitable pour ce bloc.", { italics: true }));
    }
  }

  children.push(h1("Prochaine étape"));
  children.push(paragraph(
    `Au vu de ce diagnostic (score global : ${overall.label}), nous recommandons un rendez-vous avec Maître Liliane G. SUSULI AMOUSSOU pour examiner en priorité les points critiques identifiés ci-dessus. Ce rapport servira de base de travail pour rendre cette consultation plus rapide et plus ciblée.`
  ));
  children.push(new Paragraph({
    spacing: { before: 300 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "📅 Prendre rendez-vous : [lien Calendly / contact WhatsApp du cabinet]", bold: true, font: FONT, size: 22, color: "1F3864" })],
  }));

  const doc = new Document({
    numbering: {
      config: [{
        reference: "report-bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: convertInchesToTwip(0.35), hanging: convertInchesToTwip(0.2) } } } }],
      }],
    },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      children,
    }],
  });

  return Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(outputPath, buffer);
    console.log(`Rapport généré : ${outputPath} — score global ${totalScore} (${overall.label})`);
  });
}

// CLI
if (require.main === module) {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error("Usage: node generate-report.js answers.json output.docx");
    process.exit(1);
  }
  generate(inputPath, outputPath).catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { generate };
