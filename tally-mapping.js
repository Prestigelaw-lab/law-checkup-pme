// Traduit une soumission Tally (webhook) en objet answers.json exploitable
// par generate-report.js

const { BLOCKS } = require("./questions");

// Libellés des champs spéciaux (hors questionnaire) — à utiliser TELS QUELS
// comme intitulés de question dans le formulaire Tally.
const FIELD_CLIENT_NAME = "Nom de l'entreprise";
const FIELD_FAMILY_BUSINESS = "Votre entreprise est-elle familiale, ou avez-vous plus de 50 ans ?";

// Construit un dictionnaire { texte exact de la question: id } à partir de questions.js
// -> le formulaire Tally DOIT utiliser exactement le même texte que "text" dans questions.js
function buildQuestionTextIndex() {
  const index = {};
  for (const block of BLOCKS) {
    for (const q of block.questions) {
      index[q.text.trim()] = q.id;
    }
  }
  return index;
}

// Résout la valeur textuelle d'un champ Tally, qu'il soit texte libre ou choix multiple
function resolveFieldValue(field) {
  if (!field.value) return undefined;

  // Choix multiple / select : value est un tableau d'IDs d'options
  if (Array.isArray(field.value) && field.options) {
    const selectedId = field.value[0];
    const option = field.options.find((o) => o.id === selectedId);
    return option ? option.text.trim() : undefined;
  }

  // Texte libre ou nombre
  if (typeof field.value === "string") return field.value.trim();
  if (Array.isArray(field.value)) return field.value.join(", ");

  return String(field.value);
}

// payload = le corps JSON envoyé par le webhook Tally (payload.data.fields)
function buildAnswersFromTally(payload) {
  const fields = payload && payload.data && payload.data.fields ? payload.data.fields : [];
  const questionIndex = buildQuestionTextIndex();

  const result = {
    clientName: "Entreprise cliente",
    date: new Date().toLocaleDateString("fr-FR"),
    includeSuccession: false,
    answers: {},
  };

  for (const field of fields) {
    const label = (field.label || "").trim();
    const value = resolveFieldValue(field);
    if (value === undefined) continue;

    if (label === FIELD_CLIENT_NAME) {
      result.clientName = value;
      continue;
    }
    if (label === FIELD_FAMILY_BUSINESS) {
      result.includeSuccession = value === "Oui";
      continue;
    }
    const questionId = questionIndex[label];
    if (questionId) {
      result.answers[questionId] = value;
    }
    // Si le libellé ne correspond à rien de connu, on l'ignore silencieusement
    // (utile si le formulaire contient des champs de présentation/consignes).
  }

  return result;
}

module.exports = { buildAnswersFromTally, FIELD_CLIENT_NAME, FIELD_FAMILY_BUSINESS };
