// =====================================================================
//  CONFIGURATION DE L'APPLICATION GRAIMBOUVILLE
//  -> C'est le SEUL fichier à modifier (voir le guide README.md, étape 5).
// =====================================================================

// 1) Configuration du projet Firebase « graimbouville » (non secrète : elle identifie
//    seulement le projet ; les données sont protégées par la connexion et les règles)
//    (Console Firebase > ⚙️ Paramètres du projet > Vos applications > Config)
export const firebaseConfig = {
  apiKey: "AIzaSyAgkwpmrV0GZzzzwJ5BJMP_MyG3bhcRgiE",
  authDomain: "graimbouville.firebaseapp.com",
  projectId: "graimbouville",
  storageBucket: "graimbouville.firebasestorage.app",
  messagingSenderId: "295979794514",
  appId: "1:295979794514:web:d718f8fad4bfe33f5e9f8b"
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
