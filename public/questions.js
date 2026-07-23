// Base de questions du Legal Check-up PME
// Chaque question : id, texte, options possibles, valeurs "à risque", poids, et textes de rapport
// weight >= 3  -> "point critique" (recommandation avocat)
// weight == 2  -> "point de vigilance"
// weight <= 1  -> signalé mais mineur (classé en vigilance légère)
// Une réponse qui N'EST PAS dans riskValues est comptée comme "point fort"

const BLOCKS = [
  {
    key: "social",
    title: "Social / RH",
    conditional: false,
    questions: [
      {
        id: "1.1",
        text: "Chacun de vos employés a-t-il un contrat de travail écrit, daté et signé ?",
        options: ["Oui", "Non", "Certains seulement"],
        riskValues: ["Non", "Certains seulement"],
        weight: 3,
        strength: "Tous vos employés disposent d'un contrat de travail écrit et signé.",
        issue: "Certains employés n'ont pas de contrat de travail écrit et signé, ce qui expose l'entreprise en cas de litige sur les conditions d'emploi.",
      },
      {
        id: "1.2",
        text: "Vos contrats précisent-ils clairement le poste, la rémunération et la période d'essai ?",
        options: ["Oui", "Non", "Je ne sais pas"],
        riskValues: ["Non", "Je ne sais pas"],
        weight: 2,
        strength: "Vos contrats de travail précisent clairement poste, rémunération et période d'essai.",
        issue: "Le contenu de vos contrats de travail (poste, rémunération, période d'essai) n'est pas clairement sécurisé.",
      },
      {
        id: "1.3a",
        text: "En cas de licenciement au cours des 24 derniers mois, la procédure a-t-elle inclus un entretien préalable et une notification écrite motivée ?",
        options: ["Oui", "Non", "Je ne sais pas", "Non applicable"],
        riskValues: ["Non", "Je ne sais pas"],
        weight: 3,
        strength: "Vos procédures de licenciement récentes ont respecté l'entretien préalable et la notification écrite motivée.",
        issue: "Une procédure de licenciement récente pourrait ne pas avoir respecté l'entretien préalable ou la notification écrite motivée, exposant l'entreprise à un risque de requalification.",
      },
      {
        id: "1.4",
        text: "Utilisez-vous le terme « faute lourde » ou « faute grave » sans vous appuyer sur un motif précis prévu par la loi ?",
        options: ["Oui", "Non", "Je ne sais pas"],
        riskValues: ["Oui", "Je ne sais pas"],
        weight: 3,
        strength: "Le motif de faute lourde ou grave, lorsqu'il est invoqué, s'appuie sur un motif légal précis.",
        issue: "Le terme « faute lourde/grave » pourrait être invoqué sans motif légal précis, ce qui est un motif fréquent de requalification devant le tribunal du travail.",
      },
      {
        id: "1.5",
        text: "Avez-vous des accords de fin de contrat (rupture d'un commun accord, transaction) non signés ou signés sans conseil ?",
        options: ["Oui", "Non", "Non applicable"],
        riskValues: ["Oui"],
        weight: 2,
        strength: "Vos accords de fin de contrat sont formalisés et sécurisés.",
        issue: "Des accords de fin de contrat ont été signés sans conseil juridique, ce qui peut fragiliser leur validité en cas de contestation.",
      },
      {
        id: "1.6",
        text: "Vos employés reçoivent-ils un bulletin de paie conforme chaque mois ?",
        options: ["Oui", "Non", "Je ne sais pas"],
        riskValues: ["Non", "Je ne sais pas"],
        weight: 2,
        strength: "Vos employés reçoivent un bulletin de paie conforme chaque mois.",
        issue: "La conformité des bulletins de paie mensuels n'est pas assurée.",
      },
      {
        id: "1.7",
        text: "Avez-vous des stagiaires ou des employés « au noir » sans aucun document ?",
        options: ["Oui", "Non"],
        riskValues: ["Oui"],
        weight: 3,
        strength: "Tous vos collaborateurs, y compris stagiaires, disposent d'un document encadrant leur activité.",
        issue: "Des stagiaires ou employés exercent sans aucun document, ce qui constitue un risque social et administratif direct.",
      },
    ],
  },
  {
    key: "bail",
    title: "Commercial / Bail",
    conditional: false,
    questions: [
      {
        id: "2.1",
        text: "Votre bail commercial est-il signé en votre nom personnel ou au nom de votre société ?",
        options: ["Personnel", "Société", "Je ne sais pas"],
        riskValues: ["Personnel", "Je ne sais pas"],
        weight: 3,
        strength: "Votre bail commercial est signé au nom de votre société.",
        issue: "Votre bail commercial pourrait être signé à titre personnel, ce qui vous engage directement même en cas de litige sur les activités de la société.",
      },
      {
        id: "2.2",
        text: "Si signé personnellement, exercez-vous pourtant l'activité via une société distincte ?",
        options: ["Oui", "Non", "Non applicable"],
        riskValues: ["Oui"],
        weight: 3,
        strength: "Aucune confusion entre votre engagement personnel et l'activité de la société sur le bail.",
        issue: "Une confusion existe entre l'engagement personnel sur le bail et l'activité exercée par la société : c'est une source fréquente de contentieux (résiliation, expulsion).",
      },
      {
        id: "2.3",
        text: "Votre bail contient-il une clause résolutoire (résiliation automatique en cas d'impayé) ?",
        options: ["Oui", "Non", "Je ne sais pas"],
        riskValues: ["Non", "Je ne sais pas"],
        weight: 2,
        strength: "Votre bail comporte une clause résolutoire clairement identifiée.",
        issue: "La présence d'une clause résolutoire dans votre bail n'est pas confirmée, ce qui rend la réaction en cas d'impayé plus incertaine.",
      },
      {
        id: "2.4",
        text: "Avez-vous déjà reçu une mise en demeure ou un commandement de payer de votre bailleur ?",
        options: ["Oui", "Non"],
        riskValues: ["Oui"],
        weight: 3,
        strength: "Aucune mise en demeure ou commandement de payer reçu de votre bailleur.",
        issue: "Une mise en demeure ou un commandement de payer a déjà été reçu de votre bailleur : ce point nécessite une attention immédiate.",
      },
      {
        id: "2.5",
        text: "La durée et le renouvellement de votre bail sont-ils clairement écrits et compris ?",
        options: ["Oui", "Non", "Je ne sais pas"],
        riskValues: ["Non", "Je ne sais pas"],
        weight: 1,
        strength: "La durée et les conditions de renouvellement de votre bail sont claires.",
        issue: "La durée et les conditions de renouvellement de votre bail méritent d'être clarifiées.",
      },
    ],
  },
  {
    key: "ohada",
    title: "OHADA / Gouvernance",
    conditional: false,
    questions: [
      {
        id: "3.1",
        text: "Vos statuts ont-ils été rédigés ou révisés par un professionnel du droit ?",
        options: ["Oui", "Non", "Je ne sais pas"],
        riskValues: ["Non", "Je ne sais pas"],
        weight: 2,
        strength: "Vos statuts ont été rédigés ou révisés par un professionnel du droit.",
        issue: "Vos statuts n'ont pas été rédigés ou révisés par un professionnel, ce qui peut laisser des failles dans la gouvernance de la société.",
      },
      {
        id: "3.2",
        text: "Toutes vos assemblées générales des 3 dernières années ont-elles un procès-verbal signé ?",
        options: ["Oui", "Non", "Partiellement"],
        riskValues: ["Non", "Partiellement"],
        weight: 3,
        strength: "Toutes vos assemblées générales récentes sont couvertes par un procès-verbal signé.",
        issue: "Certaines assemblées générales récentes n'ont pas de procès-verbal signé, ce qui fragilise juridiquement les décisions prises (cf. contentieux de gouvernance).",
      },
      {
        id: "3.3",
        text: "Les pouvoirs du gérant sont-ils clairement limités dans les statuts (montants, actes nécessitant l'accord des associés) ?",
        options: ["Oui", "Non", "Je ne sais pas"],
        riskValues: ["Non", "Je ne sais pas"],
        weight: 2,
        strength: "Les pouvoirs du gérant sont clairement délimités dans les statuts.",
        issue: "Les limites de pouvoir du gérant ne sont pas clairement établies dans les statuts, ce qui peut ouvrir la voie à des actes contestables.",
      },
      {
        id: "3.4",
        text: "Y a-t-il eu un changement de gérant ou d'associé sans formalisation complète (acte, dépôt au greffe) ?",
        options: ["Oui", "Non", "Non applicable"],
        riskValues: ["Oui"],
        weight: 3,
        strength: "Tout changement de gérant ou d'associé a été formalisé et déposé au greffe.",
        issue: "Un changement de gérant ou d'associé n'a pas été complètement formalisé, ce qui peut être contesté par un tiers ou un associé.",
      },
      {
        id: "3.5",
        text: "Des désaccords entre associés existent-ils actuellement, même non formalisés ?",
        options: ["Oui", "Non"],
        riskValues: ["Oui"],
        weight: 2,
        strength: "Aucun désaccord actif entre associés n'a été signalé.",
        issue: "Des désaccords entre associés existent actuellement : sans anticipation, ils peuvent dégénérer en blocage de gouvernance.",
      },
    ],
  },
  {
    key: "contrats",
    title: "Contrats fournisseurs / clients",
    conditional: false,
    questions: [
      {
        id: "4.1",
        text: "Vos contrats avec fournisseurs importants sont-ils écrits (pas seulement des bons de commande) ?",
        options: ["Oui", "Non", "Certains"],
        riskValues: ["Non", "Certains"],
        weight: 2,
        strength: "Vos relations avec les fournisseurs importants sont couvertes par des contrats écrits.",
        issue: "Certaines relations fournisseurs importantes reposent uniquement sur des bons de commande, sans contrat-cadre écrit.",
      },
      {
        id: "4.2",
        text: "Vos contrats de vente à crédit ou en plusieurs fois incluent-ils une clause de réserve de propriété ?",
        options: ["Oui", "Non", "Je ne sais pas"],
        riskValues: ["Non", "Je ne sais pas"],
        weight: 2,
        strength: "Vos ventes à crédit sont protégées par une clause de réserve de propriété.",
        issue: "Vos ventes à crédit ne comportent pas de clause de réserve de propriété identifiée, ce qui limite vos recours en cas d'impayé.",
      },
      {
        id: "4.3",
        text: "Si vous vendez en ligne, avez-vous des CGU/CGV affichées et applicables ?",
        options: ["Oui", "Non", "Je vends en ligne sans CGU", "Non applicable"],
        riskValues: ["Non", "Je vends en ligne sans CGU"],
        weight: 3,
        strength: "Votre activité de vente en ligne est couverte par des CGU/CGV affichées.",
        issue: "Votre vente en ligne n'est pas couverte par des CGU/CGV affichées, ce qui expose l'entreprise en cas de litige client ou de contrôle de conformité.",
      },
      {
        id: "4.4",
        text: "Avez-vous des impayés clients de plus de 90 jours sans mise en demeure envoyée ?",
        options: ["Oui", "Non"],
        riskValues: ["Oui"],
        weight: 2,
        strength: "Aucun impayé ancien n'est resté sans action de recouvrement.",
        issue: "Des impayés clients de plus de 90 jours n'ont pas encore fait l'objet d'une mise en demeure, ce qui retarde vos chances de recouvrement.",
      },
      {
        id: "4.5",
        text: "Utilisez-vous des accords oraux ou WhatsApp comme seule preuve d'engagement avec des partenaires importants ?",
        options: ["Oui", "Non"],
        riskValues: ["Oui"],
        weight: 2,
        strength: "Vos engagements importants reposent sur des preuves écrites solides.",
        issue: "Certains engagements importants reposent uniquement sur des échanges oraux ou WhatsApp, difficiles à faire valoir devant un tribunal.",
      },
    ],
  },
  {
    key: "succession",
    title: "Succession / Patrimoine de l'entreprise",
    conditional: true, // affiché seulement si entreprise familiale ou dirigeant 50+
    questions: [
      {
        id: "5.1",
        text: "Avez-vous anticipé ce qu'il adviendrait de l'entreprise en cas de décès ou d'incapacité du dirigeant ?",
        options: ["Oui", "Non"],
        riskValues: ["Non"],
        weight: 3,
        strength: "La transmission de l'entreprise en cas de décès ou d'incapacité du dirigeant a été anticipée.",
        issue: "Aucune anticipation n'a été faite sur le devenir de l'entreprise en cas de décès ou d'incapacité du dirigeant.",
      },
      {
        id: "5.2",
        text: "L'entreprise ou ses locaux sont-ils détenus en indivision avec d'autres membres de la famille ?",
        options: ["Oui", "Non", "Je ne sais pas"],
        riskValues: ["Oui", "Je ne sais pas"],
        weight: 3,
        strength: "Aucune situation d'indivision familiale n'affecte l'entreprise ou ses locaux.",
        issue: "L'entreprise ou ses locaux sont potentiellement détenus en indivision familiale, une situation fréquemment source de blocages et de contentieux.",
      },
      {
        id: "5.3",
        text: "Existe-t-il un testament ou un pacte successoral couvrant les parts de l'entreprise ?",
        options: ["Oui", "Non"],
        riskValues: ["Non"],
        weight: 2,
        strength: "Un testament ou un pacte successoral couvre les parts de l'entreprise.",
        issue: "Aucun testament ou pacte successoral ne couvre actuellement les parts de l'entreprise.",
      },
    ],
  },
];

function blockLevel(score) {
  if (score >= 6) return { label: "Risque élevé", color: "C00000" };
  if (score >= 3) return { label: "Risque modéré", color: "E36C09" };
  return { label: "Risque faible", color: "2E7D32" };
}

function globalLevel(score) {
  if (score >= 15) return { label: "Risque élevé", color: "C00000" };
  if (score >= 7) return { label: "Risque modéré", color: "E36C09" };
  return { label: "Risque faible", color: "2E7D32" };
}

module.exports = { BLOCKS, blockLevel, globalLevel };
