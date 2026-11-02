// =====================================================================
//  CONFIGURATION DE L'APPLICATION GRAIMBOUVILLE
//  -> C'est le SEUL fichier à modifier (voir le guide README.md, étape 5).
// =====================================================================

// 1) Collez ici la configuration donnée par Firebase
//    (Console Firebase > ⚙️ Paramètres du projet > Vos applications > Config)
export const firebaseConfig = {
  apiKey: "A_REMPLACER",
  authDomain: "A_REMPLACER.firebaseapp.com",
  projectId: "A_REMPLACER",
  storageBucket: "A_REMPLACER.appspot.com",
  messagingSenderId: "A_REMPLACER",
  appId: "A_REMPLACER"
};

// 2) Les profils proposés sur l'écran de connexion.
//    « identifiant » = l'adresse du compte créé dans Firebase > Authentication
//    pour ce profil (une adresse fictive en @example.com suffit : aucun email
//    n'y est jamais envoyé). Le mot de passe, lui, n'est JAMAIS écrit ici.
export const PROFILS = [
  { prenom: "Etienne", identifiant: "etienne.graimbouville@example.com" },
  { prenom: "Caroline", identifiant: "caroline.graimbouville@example.com" },
  { prenom: "Fabienne", identifiant: "fabienne.graimbouville@example.com" },
  { prenom: "Amélie", identifiant: "amelie.graimbouville@example.com" },
  { prenom: "Matthias", identifiant: "matthias.graimbouville@example.com" }
];

// 3) Payeurs proposés lors de la saisie d'une dépense : les prénoms des profils.
export const PAYEURS = PROFILS.map((p) => p.prenom);
