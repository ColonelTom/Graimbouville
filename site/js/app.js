// =====================================================================
//  GRAIMBOUVILLE — Application familiale de gestion de la maison
//  Firebase : Authentication (email / mot de passe) + Cloud Firestore
//  Les photos sont compressées sur le téléphone puis stockées dans
//  Firestore (collection "photos") : aucun service payant n'est requis.
// =====================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, deleteDoc, getDoc, onSnapshot, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, PAYEURS } from "./firebase-config.js";

// ---------------------------------------------------------------------
//  Listes de référence
// ---------------------------------------------------------------------
const CATEGORIES = ["Assurance", "Réparations", "Électricité", "Eau", "Achats divers / courses"];
const ICONES_CATEGORIE = {
  "Assurance": "bouclier", "Réparations": "outil", "Électricité": "eclair", "Eau": "goutte", "Achats divers / courses": "panier"
};
const SPECIALITES = [
  "Plombier", "Couvreur", "Électricien", "Maçon", "Chauffagiste", "Menuisier",
  "Serrurier", "Peintre", "Jardinier / paysagiste", "Ramoneur", "Vidange fosse septique", "Homme toutes mains"
];
const TYPES_CONTACT = {
  artisan: { libelle: "Artisans", icone: "outil", champSpecialite: "Spécialité", exemple: "ex : Plombier" },
  voisin: { libelle: "Voisins", icone: "maison", champSpecialite: "Lien / rôle", exemple: "ex : Voisin de droite, gardien" },
  urgence: { libelle: "Secours", icone: "secours", champSpecialite: "Service", exemple: "ex : Médecin, mairie, hôpital" }
};
const URGENCES_NATIONALES = [
  { nom: "SAMU", tel: "15" },
  { nom: "Police / Gendarmerie", tel: "17" },
  { nom: "Pompiers", tel: "18" },
  { nom: "Urgence européen", tel: "112" },
  { nom: "Urgence gaz (GRDF)", tel: "0800473333" },
  { nom: "Dépannage électricité Enedis (76)", tel: "0972675076" }
];
const TYPES_COFFRE = {
  acces: { libelle: "Identifiants", },
  contrat: { libelle: "Contrats", },
  banque: { libelle: "Banque", }
};
const TYPES_CONTRAT = ["Assurance", "Électricité", "Eau", "Internet / Box", "Gaz / Fioul", "Autre"];
const TYPES_PROCEDURE = {
  arrivee: { libelle: "Arrivée", vide: "Ajoutez les étapes pour ouvrir la maison (eau, électricité, chauffage…)." },
  depart: { libelle: "Départ", vide: "Ajoutez les étapes pour fermer la maison (couper l'eau, volets, vannes…)." },
  repere: { libelle: "Repères", vide: "Notez où se trouvent les choses importantes (robinet d'arrêt, tableau électrique, purge du chauffe-eau…)." }
};

// ---------------------------------------------------------------------
//  Icônes au trait (dessins fixes, sans texte venant de l'utilisateur)
// ---------------------------------------------------------------------
const ICONES = {
  euro: '<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10h9M4 14h9"/>',
  tel: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  cadenas: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  maison: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  perso: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  panier: '<path d="M3 4h2l2 11h11l2-8H6"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
  outil: '<path d="M14.7 6.3a4 4 0 0 0 5 5L11 20a2.1 2.1 0 0 1-3-3l8.7-8.7a4 4 0 0 0-2-2z"/>',
  eclair: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  goutte: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  bouclier: '<path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z"/>',
  secours: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  crayon: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  oeil: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  oeilBarre: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/>',
  copier: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  photo: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  trombone: '<path d="M20 11l-8 8a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7-7"/>',
  epingle: '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  haut: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  bas: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  ok: '<path d="M5 12l5 5 9-10"/>',
  croix: '<path d="M6 6l12 12M18 6L6 18"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  telecharger: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  bulle: '<path d="M4 5h16v11H9l-5 4z"/>'
};
/** Renvoie une icône prête à insérer (span contenant un dessin SVG). */
function ic(nom) {
  const s = document.createElement("span");
  s.className = "ico";
  s.setAttribute("aria-hidden", "true");
  s.innerHTML = `<svg viewBox="0 0 24 24">${ICONES[nom] || ""}</svg>`;
  return s;
}

// ---------------------------------------------------------------------
//  Petits utilitaires
// ---------------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);

/** Crée un élément HTML de façon sûre (le texte n'est jamais interprété comme du HTML). */
function h(tag, attrs, ...enfants) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (k === "class") n.className = v;
    else if (k === "value") n.value = v;
    else if (k === "checked" || k === "disabled" || k === "hidden" || k === "required" || k === "selected") n[k] = !!v;
    else n.setAttribute(k, v === true ? "" : String(v));
  }
  for (const e of enfants.flat(Infinity)) {
    if (e === null || e === undefined || e === false) continue;
    n.append(e instanceof Node ? e : String(e));
  }
  return n;
}

const formatEuro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const euros = (n) => formatEuro.format(Number(n) || 0);

function dateDepuisISO(iso) {
  const [a, m, j] = String(iso || "").split("-").map(Number);
  return a ? new Date(a, (m || 1) - 1, j || 1) : null;
}
function dateLisible(iso) {
  const d = dateDepuisISO(iso);
  return d ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";
}
function moisLisible(cle) {
  const d = dateDepuisISO(cle + "-01");
  if (!d) return "Sans date";
  const t = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function aujourdhui() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const telLien = (t) => "tel:" + String(t || "").replace(/[^\d+]/g, "");
function telLisible(t) {
  const brut = String(t || "").replace(/\s/g, "");
  if (/^0\d{9}$/.test(brut)) return brut.replace(/(\d{2})(?=\d)/g, "$1 ");
  return t || "";
}
function ibanLisible(i) {
  return String(i || "").replace(/\s/g, "").toUpperCase().replace(/(.{4})(?=.)/g, "$1 ");
}
function ibanMasque(i) {
  const brut = String(i || "").replace(/\s/g, "").toUpperCase();
  if (brut.length < 8) return "••••";
  return brut.slice(0, 4) + " •••• •••• " + brut.slice(-4);
}
function lireMontant(texte) {
  const n = Number(String(texte || "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}
function stockageLire(cle) { try { return localStorage.getItem(cle); } catch { return null; } }
function stockageEcrire(cle, v) { try { localStorage.setItem(cle, v); } catch { /* ignoré */ } }

let minuteurToast;
function toast(message, erreur = false) {
  const t = $("#toast");
  // Quand une fenêtre est ouverte, le message doit s'afficher par-dessus
  const modale = $("#modale");
  const parent = modale.open ? modale : document.body;
  if (t.parentNode !== parent) parent.append(t);
  t.textContent = message;
  t.className = "visible" + (erreur ? " erreur" : "");
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => { t.className = ""; }, erreur ? 5000 : 2500);
}

async function copier(texte, quoi = "Copié") {
  try {
    await navigator.clipboard.writeText(texte);
    toast(quoi + " dans le presse-papiers");
  } catch {
    // Solution de secours pour les anciens navigateurs
    const zone = h("textarea", { value: texte, readonly: true, style: "position:fixed;opacity:0" });
    document.body.append(zone);
    zone.select();
    try { document.execCommand("copy"); toast(quoi); } catch { toast("Copie impossible", true); }
    zone.remove();
  }
}

/** Fenêtre de confirmation intégrée (remplace confirm() du navigateur). */
function confirmer(message, libelleOk = "Supprimer") {
  return new Promise((repondre) => {
    const dlg = h("dialog", { class: "confirmation" });
    const fin = (v) => { dlg.close(); dlg.remove(); repondre(v); };
    dlg.append(
      h("p", {}, message),
      h("div", { class: "rangee-droite" },
        h("button", { type: "button", class: "btn secondaire", onclick: () => fin(false) }, "Annuler"),
        h("button", { type: "button", class: "btn danger", onclick: () => fin(true) }, libelleOk)
      )
    );
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); fin(false); });
    document.body.append(dlg);
    dlg.showModal();
  });
}

function messageErreur(err) {
  const code = err && err.code ? String(err.code) : "";
  const messages = {
    "auth/invalid-credential": "Email ou mot de passe incorrect.",
    "auth/wrong-password": "Email ou mot de passe incorrect.",
    "auth/user-not-found": "Email ou mot de passe incorrect.",
    "auth/invalid-email": "Adresse email invalide.",
    "auth/user-disabled": "Ce compte a été désactivé.",
    "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
    "auth/network-request-failed": "Pas de connexion internet.",
    "auth/missing-email": "Saisissez d'abord votre adresse email.",
    "permission-denied": "Accès refusé : ce compte n'est pas autorisé.",
    "unavailable": "Serveur injoignable, vérifiez la connexion.",
    "invalid-argument": "Données invalides (photo trop lourde ?)."
  };
  return messages[code] || (err && err.message) || "Erreur inconnue";
}

// ---------------------------------------------------------------------
//  Firebase
// ---------------------------------------------------------------------
const configOK = firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith("A_REMPLACER");
let auth = null;
let db = null;
if (configOK) {
  const appFirebase = initializeApp(firebaseConfig);
  auth = getAuth(appFirebase);
  try {
    // Cache local : l'application fonctionne même sans réseau à la maison
    db = initializeFirestore(appFirebase, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch {
    db = initializeFirestore(appFirebase, {});
  }
}

/**
 * Lance une écriture Firestore. Hors connexion, Firestore garde l'écriture
 * en attente et la synchronise plus tard : on n'attend donc pas plus de 2,5 s.
 */
function ecrire(promesse) {
  const suivie = promesse.catch((err) => {
    console.error(err);
    toast("Erreur d'enregistrement : " + messageErreur(err), true);
    err._signale = true;
    throw err;
  });
  return Promise.race([suivie, new Promise((ok) => setTimeout(ok, 2500))]);
}

const emailCourant = () => (auth && auth.currentUser && auth.currentUser.email) || "";

// ---------------------------------------------------------------------
//  État de l'application
// ---------------------------------------------------------------------
const etat = {
  route: "depenses",
  depenses: [], contacts: [], coffre: [], procedures: [],
  charge: { depenses: false, contacts: false, coffre: false, procedures: false },
  filtres: { categorie: "", payeur: "", annee: "" },
  ongletContacts: "artisan",
  ongletCoffre: "acces",
  ongletMaison: "arrivee",
  recherche: "",
  reveles: new Set(),     // champs secrets actuellement affichés en clair
  coches: new Set(),      // étapes cochées pendant une procédure (non enregistré)
  desabonnements: []
};

// ---------------------------------------------------------------------
//  Photos (compression + lecture)
// ---------------------------------------------------------------------
const cachePhotos = new Map();

async function compresserImage(fichier, dimMax = 1400, tailleMax = 650000) {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("Format d'image non reconnu."));
      i.src = url;
    });
    let dim = dimMax;
    let qualite = 0.78;
    let resultat = "";
    for (let essai = 0; essai < 7; essai++) {
      const ratio = Math.min(1, dim / Math.max(img.naturalWidth, img.naturalHeight));
      const l = Math.max(1, Math.round(img.naturalWidth * ratio));
      const ht = Math.max(1, Math.round(img.naturalHeight * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = l;
      canvas.height = ht;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, l, ht);
      ctx.drawImage(img, 0, 0, l, ht);
      resultat = canvas.toDataURL("image/jpeg", qualite);
      if (resultat.length <= tailleMax) return resultat;
      dim = Math.round(dim * 0.8);
      qualite = Math.max(0.5, qualite - 0.07);
    }
    if (resultat.length > 950000) throw new Error("Photo trop lourde, essayez-en une autre.");
    return resultat;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function chargerPhoto(id) {
  if (!id) return null;
  if (cachePhotos.has(id)) return cachePhotos.get(id);
  const snap = await getDoc(doc(db, "photos", id));
  const data = snap.exists() ? snap.data().data : null;
  if (data) cachePhotos.set(id, data);
  return data;
}

/** Image qui se charge toute seule depuis Firestore. */
function imagePhoto(id, legende = "", classe = "miniature") {
  const img = h("img", { class: classe + " en-chargement", alt: legende || "Photo" });
  img.addEventListener("click", (e) => { e.stopPropagation(); if (img.src) ouvrirVisionneuse(img.src, legende); });
  chargerPhoto(id)
    .then((data) => {
      img.classList.remove("en-chargement");
      if (data) img.src = data;
      else img.replaceWith(h("span", { class: "photo-absente" }, "Photo introuvable"));
    })
    .catch(() => {
      img.classList.remove("en-chargement");
      img.replaceWith(h("span", { class: "photo-absente" }, "Photo indisponible hors connexion"));
    });
  return img;
}

function enregistrerNouvellePhoto(dataUrl) {
  const ref = doc(collection(db, "photos"));
  cachePhotos.set(ref.id, dataUrl);
  const promesse = ecrire(setDoc(ref, { data: dataUrl, creePar: emailCourant(), creeLe: serverTimestamp() }));
  return { id: ref.id, promesse };
}
function supprimerPhoto(id) {
  if (!id) return;
  cachePhotos.delete(id);
  ecrire(deleteDoc(doc(db, "photos", id))).catch(() => {});
}

function ouvrirVisionneuse(src, legende) {
  const v = $("#visionneuse");
  v.querySelector("img").src = src;
  v.querySelector(".legende").textContent = legende || "";
  v.hidden = false;
}
function fermerVisionneuse() {
  const v = $("#visionneuse");
  v.hidden = true;
  v.querySelector("img").removeAttribute("src");
}

// ---------------------------------------------------------------------
//  Formulaire générique (fenêtre modale)
// ---------------------------------------------------------------------
/**
 * champs : [{ nom, label, type, options, requis, placeholder, aide, suggestions }]
 * types : text, email, tel, url, date, montant, textarea, select, choix, secret, photo, photos
 */
function ouvrirFormulaire({ titre, champs, valeurs = {}, onValider, onSupprimer, texteSupprimer }) {
  const dlg = $("#modale");
  const lecteurs = {};
  const form = h("form", { class: "formulaire", novalidate: true });
  form.append(h("div", { class: "formulaire-entete" },
    h("h2", {}, titre),
    h("button", { type: "button", class: "btn-icone", "aria-label": "Fermer", onclick: () => dlg.close() }, ic("croix"))
  ));
  const corps = h("div", { class: "formulaire-corps" });
  form.append(corps);

  for (const c of champs) {
    const v = valeurs[c.nom];
    let controle;

    if (c.type === "photo") {
      const champ = champPhoto(v);
      lecteurs[c.nom] = champ.lire;
      corps.append(h("div", { class: "champ" }, h("span", { class: "label" }, c.label), champ.noeud));
      continue;
    }
    if (c.type === "photos") {
      const champ = champPhotosCommentees(v || []);
      lecteurs[c.nom] = champ.lire;
      corps.append(h("div", { class: "champ" }, h("span", { class: "label" }, c.label), champ.noeud));
      continue;
    }
    if (c.type === "choix") {
      const groupe = h("div", { class: "segments" });
      const valeurInitiale = v || c.options[0];
      c.options.forEach((opt) => {
        groupe.append(h("label", {},
          h("input", { type: "radio", name: c.nom, value: opt, checked: opt === valeurInitiale }),
          h("span", {}, opt)
        ));
      });
      lecteurs[c.nom] = () => (form.querySelector(`input[name="${c.nom}"]:checked`) || {}).value || "";
      corps.append(h("div", { class: "champ" }, h("span", { class: "label" }, c.label), groupe));
      continue;
    }

    if (c.type === "textarea") {
      controle = h("textarea", { name: c.nom, rows: c.lignes || 3, placeholder: c.placeholder || "" });
      controle.value = v || "";
    } else if (c.type === "select") {
      controle = h("select", { name: c.nom },
        c.options.map((o) => {
          const val = typeof o === "string" ? o : o.valeur;
          const lib = typeof o === "string" ? o : o.libelle;
          return h("option", { value: val }, lib);
        })
      );
      if (v) controle.value = v;
    } else if (c.type === "montant") {
      controle = h("input", {
        type: "text", inputmode: "decimal", name: c.nom, placeholder: "0,00", autocomplete: "off",
        value: v !== undefined && v !== null && v !== "" ? (Number.isFinite(Number(v)) ? Number(v).toFixed(2) : String(v)).replace(".", ",") : ""
      });
    } else if (c.type === "secret") {
      const input = h("input", { type: "password", name: c.nom, autocomplete: "new-password", value: v || "", placeholder: c.placeholder || "" });
      const oeil = h("button", {
        type: "button", class: "btn-icone petit", "aria-label": "Afficher",
        onclick: () => { input.type = input.type === "password" ? "text" : "password"; }
      }, ic("oeil"));
      controle = input;
      lecteurs[c.nom] = () => input.value.trim();
      corps.append(h("label", { class: "champ" }, h("span", { class: "label" }, c.label + (c.requis ? " *" : "")),
        h("div", { class: "avec-bouton" }, input, oeil)));
      continue;
    } else {
      const attrs = {
        type: c.type || "text", name: c.nom, value: v || "", placeholder: c.placeholder || "",
        autocomplete: "off"
      };
      if (c.type === "url") attrs.inputmode = "url";
      if (c.suggestions) attrs.list = "liste-" + c.nom;
      controle = h("input", attrs);
    }

    lecteurs[c.nom] = () => controle.value.trim();
    const libelle = h("label", { class: "champ" },
      h("span", { class: "label" }, c.label + (c.requis ? " *" : "")),
      controle,
      c.aide ? h("small", { class: "aide" }, c.aide) : null
    );
    if (c.suggestions) {
      libelle.append(h("datalist", { id: "liste-" + c.nom }, c.suggestions.map((s) => h("option", { value: s }))));
    }
    corps.append(libelle);
  }

  const erreur = h("p", { class: "erreur", hidden: true });
  const btnValider = h("button", { type: "submit", class: "btn primaire" }, "Enregistrer");
  const pied = h("div", { class: "formulaire-pied" });
  if (onSupprimer) {
    pied.append(h("button", {
      type: "button", class: "btn danger",
      onclick: async () => {
        if (!(await confirmer(texteSupprimer || "Supprimer définitivement cet élément ?"))) return;
        try {
          await onSupprimer();
          dlg.close();
          toast("Supprimé");
        } catch (e) {
          if (!e._signale) toast(messageErreur(e), true);
        }
      }
    }, "Supprimer"));
  }
  pied.append(h("span", { class: "espace" }));
  pied.append(h("button", { type: "button", class: "btn secondaire", onclick: () => dlg.close() }, "Annuler"));
  pied.append(btnValider);
  form.append(erreur, pied);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const valeursLues = {};
    for (const [nom, lire] of Object.entries(lecteurs)) valeursLues[nom] = lire();
    const manquants = champs.filter((c) => c.requis && (valeursLues[c.nom] === "" || valeursLues[c.nom] === undefined));
    if (manquants.length) {
      erreur.textContent = "Champ obligatoire : " + manquants.map((c) => c.label).join(", ");
      erreur.hidden = false;
      return;
    }
    erreur.hidden = true;
    btnValider.disabled = true;
    btnValider.textContent = "Enregistrement…";
    try {
      await onValider(valeursLues);
      dlg.close();
      toast("Enregistré");
    } catch (err) {
      erreur.textContent = err._signale ? "L'enregistrement a échoué." : messageErreur(err);
      erreur.hidden = false;
    } finally {
      btnValider.disabled = false;
      btnValider.textContent = "Enregistrer";
    }
  });

  dlg.replaceChildren(form);
  dlg.showModal();
  corps.scrollTop = 0;
}

/** Champ « une seule photo » (ticket de caisse, facture). */
function champPhoto(idInitial) {
  let etatPhoto = { action: "garder" };
  let aUnePhoto = !!idInitial;
  const apercu = h("div", { class: "apercu-photo" });
  const input = h("input", { type: "file", accept: "image/*", hidden: true });
  const btnAjout = h("button", { type: "button", class: "btn secondaire" });
  const btnRetirer = h("button", { type: "button", class: "btn lien danger" }, "Retirer la photo");

  function majBoutons() {
    btnAjout.replaceChildren(ic("photo"), aUnePhoto ? "Remplacer la photo" : "Ajouter une photo");
    btnRetirer.hidden = !aUnePhoto;
  }
  function montrer(src) {
    apercu.replaceChildren();
    if (src) {
      const img = h("img", { src, class: "apercu", alt: "Aperçu" });
      img.addEventListener("click", () => ouvrirVisionneuse(src, ""));
      apercu.append(img);
    }
  }
  if (idInitial) apercu.append(imagePhoto(idInitial, "", "apercu"));
  majBoutons();

  btnAjout.addEventListener("click", () => input.click());
  btnRetirer.addEventListener("click", () => {
    etatPhoto = { action: "supprimer" };
    aUnePhoto = false;
    montrer(null);
    majBoutons();
  });
  input.addEventListener("change", async () => {
    const fichier = input.files && input.files[0];
    if (!fichier) return;
    btnAjout.disabled = true;
    btnAjout.textContent = "Traitement de la photo…";
    try {
      const data = await compresserImage(fichier);
      etatPhoto = { action: "nouvelle", dataUrl: data };
      aUnePhoto = true;
      montrer(data);
    } catch (e) {
      toast(e.message, true);
    } finally {
      btnAjout.disabled = false;
      input.value = "";
      majBoutons();
    }
  });

  return {
    noeud: h("div", { class: "champ-photo" }, apercu, h("div", { class: "rangee" }, btnAjout, btnRetirer), input),
    lire: () => etatPhoto
  };
}

/** Champ « plusieurs photos, chacune avec un commentaire » (procédures). */
function champPhotosCommentees(initiales) {
  const elements = initiales.map((p) => ({ photoId: p.photoId, commentaire: p.commentaire || "" }));
  const supprimes = [];
  const liste = h("div", { class: "liste-photos-form" });
  const input = h("input", { type: "file", accept: "image/*", multiple: true, hidden: true });
  const btnAjout = h("button", { type: "button", class: "btn secondaire" }, ic("photo"), "Ajouter des photos");

  function dessiner() {
    liste.replaceChildren();
    elements.forEach((el, i) => {
      const image = el.dataUrl
        ? h("img", { src: el.dataUrl, class: "miniature", alt: "" })
        : imagePhoto(el.photoId, el.commentaire);
      const zone = h("textarea", { rows: 2, placeholder: "Commentaire : ex. « Le robinet est derrière la trappe, sous l'évier »" });
      zone.value = el.commentaire;
      zone.addEventListener("input", () => { el.commentaire = zone.value; });
      liste.append(h("div", { class: "photo-form" },
        image,
        h("div", { class: "photo-form-texte" },
          zone,
          h("button", {
            type: "button", class: "btn lien danger",
            onclick: () => {
              if (el.photoId) supprimes.push(el.photoId);
              elements.splice(i, 1);
              dessiner();
            }
          }, "Retirer")
        )
      ));
    });
  }
  dessiner();

  btnAjout.addEventListener("click", () => input.click());
  input.addEventListener("change", async () => {
    const fichiers = [...(input.files || [])];
    if (!fichiers.length) return;
    btnAjout.disabled = true;
    btnAjout.textContent = "Traitement des photos…";
    for (const f of fichiers) {
      try {
        elements.push({ dataUrl: await compresserImage(f), commentaire: "" });
      } catch (e) {
        toast(e.message, true);
      }
    }
    input.value = "";
    btnAjout.disabled = false;
    btnAjout.replaceChildren(ic("photo"), "Ajouter des photos");
    dessiner();
  });

  return {
    noeud: h("div", { class: "champ-photos" }, liste, btnAjout, input),
    lire: () => ({ elements: elements.map((e) => ({ ...e, commentaire: e.commentaire.trim() })), supprimes })
  };
}

// ---------------------------------------------------------------------
//  Composants d'affichage
// ---------------------------------------------------------------------
function chargement() {
  return h("div", { class: "vide" }, h("div", { class: "rouet" }), "Chargement…");
}
function vide(texte) {
  return h("div", { class: "vide" }, h("p", {}, texte), h("p", { class: "discret" }, "Appuyez sur « + » pour ajouter."));
}
function sousOnglets(types, actif, onChange) {
  return h("div", { class: "sous-onglets" },
    Object.entries(types).map(([cle, t]) =>
      h("button", { type: "button", class: cle === actif ? "actif" : "", onclick: () => onChange(cle) }, t.libelle)
    )
  );
}
function filtreSelect(libelle, valeur, options, onChange) {
  const s = h("select", { "aria-label": libelle, onchange: (e) => onChange(e.target.value) },
    h("option", { value: "" }, libelle),
    options.map((o) => h("option", { value: o }, o))
  );
  s.value = valeur;
  if (valeur) s.classList.add("actif");
  return s;
}

/** Ligne d'information (avec option secret / copie / lien). */
function ligneInfo(libelle, valeur, opts = {}) {
  if (!valeur) return null;
  const { secret = false, cleSecret = "", copiable = false, lien = null, masque = null, affichage = null } = opts;
  const revele = secret && etat.reveles.has(cleSecret);
  let texte;
  if (secret && !revele) texte = masque ? masque(valeur) : "••••••••";
  else texte = affichage ? affichage(valeur) : valeur;

  const contenuValeur = lien && (!secret || revele)
    ? h("a", { href: lien, target: lien.startsWith("http") ? "_blank" : null, rel: "noopener noreferrer" }, texte)
    : h("span", { class: secret && !revele ? "masque" : "" }, texte);

  const actions = h("span", { class: "actions-ligne" });
  if (secret) {
    actions.append(h("button", {
      type: "button", class: "btn-icone petit", "aria-label": revele ? "Masquer" : "Afficher",
      onclick: () => basculerSecret(cleSecret)
    }, ic(revele ? "oeilBarre" : "oeil")));
  }
  if (copiable) {
    actions.append(h("button", {
      type: "button", class: "btn-icone petit", "aria-label": "Copier",
      onclick: () => copier(valeur, libelle + " copié")
    }, ic("copier")));
  }
  return h("div", { class: "ligne-info" },
    h("span", { class: "ligne-libelle" }, libelle),
    h("span", { class: "ligne-valeur" }, contenuValeur),
    actions
  );
}

const minuteursSecrets = new Map();
function basculerSecret(cle) {
  if (etat.reveles.has(cle)) {
    etat.reveles.delete(cle);
  } else {
    etat.reveles.add(cle);
    clearTimeout(minuteursSecrets.get(cle));
    // Masquage automatique au bout de 30 secondes
    minuteursSecrets.set(cle, setTimeout(() => { etat.reveles.delete(cle); afficher(); }, 30000));
  }
  afficher();
}

// =====================================================================
//  MODULE A — DÉPENSES
// =====================================================================
function vueDepenses() {
  if (!etat.charge.depenses) return chargement();
  const f = etat.filtres;
  const payeurs = [...new Set([...PAYEURS, ...etat.depenses.map((d) => d.payeur).filter(Boolean)])];
  const annees = [...new Set(etat.depenses.map((d) => String(d.date || "").slice(0, 4)).filter(Boolean))].sort().reverse();

  const liste = etat.depenses
    .filter((d) =>
      (!f.categorie || d.categorie === f.categorie) &&
      (!f.payeur || d.payeur === f.payeur) &&
      (!f.annee || String(d.date || "").startsWith(f.annee)))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) ||
      ((b.creeLe && b.creeLe.toMillis ? b.creeLe.toMillis() : 0) - (a.creeLe && a.creeLe.toMillis ? a.creeLe.toMillis() : 0)));

  const total = liste.reduce((s, d) => s + (Number(d.montant) || 0), 0);
  const parPayeur = {};
  liste.forEach((d) => { parPayeur[d.payeur || "?"] = (parPayeur[d.payeur || "?"] || 0) + (Number(d.montant) || 0); });

  const filtresActifs = f.categorie || f.payeur || f.annee;
  const barreFiltres = h("div", { class: "filtres" },
    filtreSelect("Toutes catégories", f.categorie, CATEGORIES, (v) => { f.categorie = v; afficher(); }),
    filtreSelect("Tous payeurs", f.payeur, payeurs, (v) => { f.payeur = v; afficher(); }),
    filtreSelect("Toutes années", f.annee, annees, (v) => { f.annee = v; afficher(); }),
    filtresActifs ? h("button", {
      type: "button", class: "btn lien",
      onclick: () => { f.categorie = ""; f.payeur = ""; f.annee = ""; afficher(); }
    }, "Effacer") : null
  );

  const resume = h("div", { class: "carte resume" },
    h("div", { class: "resume-total" },
      h("span", { class: "discret" }, filtresActifs ? "Total (filtré)" : "Total des dépenses"),
      h("strong", {}, euros(total)),
      h("span", { class: "discret" }, liste.length + " dépense" + (liste.length > 1 ? "s" : ""))
    ),
    h("div", { class: "resume-payeurs" },
      Object.entries(parPayeur).map(([p, m]) => h("div", {}, h("span", {}, p), h("strong", {}, euros(m))))
    )
  );

  if (!etat.depenses.length) return [vide("Aucune dépense enregistrée pour le moment.")];
  if (!liste.length) return [barreFiltres, h("div", { class: "vide" }, "Aucune dépense ne correspond à ces filtres.")];

  // Regroupement par mois
  const groupes = new Map();
  liste.forEach((d) => {
    const cle = String(d.date || "").slice(0, 7) || "0000-00";
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle).push(d);
  });

  const blocs = [...groupes.entries()].map(([cle, deps]) =>
    h("section", { class: "groupe" },
      h("div", { class: "groupe-titre" },
        h("span", {}, moisLisible(cle)),
        h("span", {}, euros(deps.reduce((s, d) => s + (Number(d.montant) || 0), 0)))
      ),
      h("div", { class: "carte liste" },
        deps.map((d) => h("button", { type: "button", class: "ligne-depense", onclick: () => formulaireDepense(d) },
          h("span", { class: "icone-cat", title: d.categorie }, ic(ICONES_CATEGORIE[d.categorie] || "euro")),
          h("span", { class: "depense-texte" },
            h("strong", {}, d.libelle || "(sans intitulé)", d.photoId ? h("span", { class: "trombone", title: "Justificatif joint" }, ic("trombone")) : null),
            h("small", {}, dateLisible(d.date) + " · " + (d.categorie || "") + " · " + (d.payeur || ""))
          ),
          h("span", { class: "montant" }, euros(d.montant))
        ))
      )
    )
  );

  return [
    barreFiltres,
    resume,
    ...blocs,
    h("div", { class: "pied-liste" },
      h("button", { type: "button", class: "btn secondaire", onclick: () => exporterCSV(liste) }, ic("telecharger"), "Exporter ces dépenses (tableur)")
    )
  ];
}

function formulaireDepense(dep) {
  ouvrirFormulaire({
    titre: dep ? "Modifier la dépense" : "Nouvelle dépense",
    valeurs: dep ? { ...dep, photo: dep.photoId } : { date: aujourdhui(), payeur: PAYEURS[0], categorie: CATEGORIES[0] },
    champs: [
      { nom: "date", label: "Date", type: "date", requis: true },
      { nom: "libelle", label: "Intitulé / description", requis: true, placeholder: "ex : Réparation fuite toiture" },
      { nom: "categorie", label: "Catégorie", type: "select", options: CATEGORIES, requis: true },
      { nom: "montant", label: "Montant (€)", type: "montant", requis: true },
      { nom: "payeur", label: "Payé par", type: "choix", options: PAYEURS, requis: true },
      { nom: "photo", label: "Ticket de caisse / facture", type: "photo" },
      { nom: "notes", label: "Notes (facultatif)", type: "textarea", lignes: 2 }
    ],
    onValider: async (v) => {
      const montant = lireMontant(v.montant);
      if (!Number.isFinite(montant) || montant < 0) throw new Error("Le montant n'est pas valide (ex : 45,90).");
      let photoId = dep ? dep.photoId || null : null;
      const attentes = [];
      if (v.photo.action === "supprimer" || v.photo.action === "nouvelle") {
        if (photoId) supprimerPhoto(photoId);
        photoId = null;
      }
      if (v.photo.action === "nouvelle") {
        const p = enregistrerNouvellePhoto(v.photo.dataUrl);
        photoId = p.id;
        attentes.push(p.promesse);
      }
      const ref = dep ? doc(db, "depenses", dep.id) : doc(collection(db, "depenses"));
      const donnees = {
        date: v.date, libelle: v.libelle, categorie: v.categorie, montant, payeur: v.payeur,
        notes: v.notes, photoId, modifiePar: emailCourant(), modifieLe: serverTimestamp()
      };
      if (!dep) { donnees.creePar = emailCourant(); donnees.creeLe = serverTimestamp(); }
      attentes.push(ecrire(setDoc(ref, donnees, { merge: true })));
      await Promise.all(attentes);
    },
    onSupprimer: dep ? async () => {
      supprimerPhoto(dep.photoId);
      await ecrire(deleteDoc(doc(db, "depenses", dep.id)));
    } : null,
    texteSupprimer: "Supprimer cette dépense et son justificatif ?"
  });
}

function exporterCSV(liste) {
  if (window.GRAIMBOUVILLE_DEMO) {
    toast("Dans la vraie application, ce bouton télécharge un fichier Excel.");
    return;
  }
  const cellule = (v) => '"' + String(v === undefined || v === null ? "" : v).replace(/"/g, '""') + '"';
  const lignes = [["Date", "Intitulé", "Catégorie", "Montant (€)", "Payé par", "Notes", "Justificatif"].map(cellule).join(";")];
  liste.forEach((d) => {
    lignes.push([
      d.date, d.libelle, d.categorie, String(Number(d.montant) || 0).replace(".", ","),
      d.payeur, d.notes, d.photoId ? "oui" : "non"
    ].map(cellule).join(";"));
  });
  const blob = new Blob(["﻿" + lignes.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const lienTelechargement = h("a", { href: URL.createObjectURL(blob), download: `depenses-graimbouville-${aujourdhui()}.csv` });
  document.body.append(lienTelechargement);
  lienTelechargement.click();
  setTimeout(() => { URL.revokeObjectURL(lienTelechargement.href); lienTelechargement.remove(); }, 1000);
}

// =====================================================================
//  MODULE B — CONTACTS
// =====================================================================
function vueContacts() {
  if (!etat.charge.contacts) return chargement();
  const type = etat.ongletContacts;
  const recherche = etat.recherche.toLowerCase();

  const champRecherche = h("input", {
    type: "search", class: "recherche", placeholder: "Rechercher un nom, un métier…", value: etat.recherche,
    oninput: (e) => {
      etat.recherche = e.target.value;
      const pos = e.target.selectionStart;
      afficher();
      const nouveau = $(".recherche");
      if (nouveau) { nouveau.focus(); nouveau.setSelectionRange(pos, pos); }
    }
  });

  const correspond = (c) => !recherche ||
    [c.nom, c.specialite, c.notes, c.telephone, c.adresse].some((x) => String(x || "").toLowerCase().includes(recherche));

  const liste = etat.contacts
    .filter((c) => (recherche ? true : (c.type || "artisan") === type) && correspond(c))
    .sort((a, b) => String(a.specialite || "").localeCompare(String(b.specialite || ""), "fr") || String(a.nom || "").localeCompare(String(b.nom || ""), "fr"));

  const cartes = liste.map((c) => carteContact(c));
  const resultat = [
    champRecherche,
    recherche ? h("p", { class: "discret" }, liste.length + " résultat(s) dans tous les contacts") :
      sousOnglets(TYPES_CONTACT, type, (t) => { etat.ongletContacts = t; afficher(); })
  ];

  if (!recherche && type === "urgence") {
    resultat.push(h("section", { class: "groupe" },
      h("div", { class: "groupe-titre" }, h("span", {}, "Numéros d'urgence")),
      h("div", { class: "grille-urgences" },
        URGENCES_NATIONALES.map((u) => h("a", { class: "urgence" + (u.tel.length > 4 ? " long" : ""), href: telLien(u.tel) },
          h("strong", {}, telLisible(u.tel)), h("span", {}, u.nom)))
      )
    ));
    resultat.push(h("div", { class: "groupe-titre" }, h("span", {}, "Contacts locaux")));
  }

  if (cartes.length) resultat.push(h("div", { class: "pile" }, cartes));
  else if (recherche) resultat.push(h("div", { class: "vide" }, "Aucun contact trouvé."));
  else resultat.push(vide(type === "urgence"
    ? "Ajoutez les contacts locaux : médecin, mairie, pharmacie de garde…"
    : "Aucun contact dans cette rubrique."));
  return resultat;
}

function carteContact(c) {
  const t = TYPES_CONTACT[c.type] || TYPES_CONTACT.artisan;
  return h("div", { class: "carte contact" },
    h("button", { type: "button", class: "contact-entete", onclick: () => formulaireContact(c) },
      h("span", { class: "avatar" }, ic(t.icone)),
      h("span", { class: "contact-texte" },
        h("strong", {}, c.nom),
        c.specialite ? h("small", {}, c.specialite) : null
      ),
      h("span", { class: "chevron" }, ic("crayon"))
    ),
    c.adresse ? h("p", { class: "contact-detail" }, ic("epingle"), " " + c.adresse) : null,
    c.notes ? h("p", { class: "contact-detail notes" }, c.notes) : null,
    h("div", { class: "contact-actions" },
      c.telephone ? h("a", { class: "btn primaire", href: telLien(c.telephone) }, ic("tel"), telLisible(c.telephone)) : null,
      c.telephone2 ? h("a", { class: "btn secondaire", href: telLien(c.telephone2) }, ic("tel"), telLisible(c.telephone2)) : null,
      c.email ? h("a", { class: "btn secondaire", href: "mailto:" + c.email }, ic("mail"), "Email") : null
    )
  );
}

function formulaireContact(c) {
  const type = c ? c.type || "artisan" : etat.ongletContacts;
  const t = TYPES_CONTACT[type];
  ouvrirFormulaire({
    titre: c ? "Modifier le contact" : "Nouveau contact",
    valeurs: c || { type },
    champs: [
      { nom: "type", label: "Rubrique", type: "select", options: Object.entries(TYPES_CONTACT).map(([k, v]) => ({ valeur: k, libelle: v.libelle })) },
      { nom: "nom", label: "Nom", requis: true, placeholder: "ex : M. Dupont" },
      { nom: "specialite", label: t.champSpecialite, placeholder: t.exemple, suggestions: type === "artisan" ? SPECIALITES : null },
      { nom: "telephone", label: "Téléphone", type: "tel", placeholder: "06 12 34 56 78" },
      { nom: "telephone2", label: "Autre téléphone (facultatif)", type: "tel" },
      { nom: "email", label: "Email (facultatif)", type: "email" },
      { nom: "adresse", label: "Adresse (facultatif)" },
      { nom: "notes", label: "Notes", type: "textarea", placeholder: "ex : Très réactif, a refait la toiture en 2024" }
    ],
    onValider: async (v) => {
      const ref = c ? doc(db, "contacts", c.id) : doc(collection(db, "contacts"));
      await ecrire(setDoc(ref, { ...v, modifiePar: emailCourant(), modifieLe: serverTimestamp() }, { merge: true }));
      etat.ongletContacts = v.type;
    },
    onSupprimer: c ? () => ecrire(deleteDoc(doc(db, "contacts", c.id))) : null
  });
}

// =====================================================================
//  MODULE C — COFFRE-FORT
// =====================================================================
function vueCoffre() {
  if (!etat.charge.coffre) return chargement();
  const type = etat.ongletCoffre;
  const liste = etat.coffre
    .filter((e) => e.type === type)
    .sort((a, b) => String(a.titre || "").localeCompare(String(b.titre || ""), "fr"));

  const cartes = liste.map((e) => {
    let lignes = [];
    if (type === "acces") {
      lignes = [
        ligneInfo("Site", e.url, { lien: /^https?:\/\//i.test(e.url || "") ? e.url : "https://" + e.url }),
        ligneInfo("Identifiant", e.identifiant, { copiable: true }),
        ligneInfo("Mot de passe", e.motDePasse, { secret: true, cleSecret: e.id + ":mdp", copiable: true }),
        ligneInfo("Notes", e.notes)
      ];
    } else if (type === "contrat") {
      lignes = [
        ligneInfo("Compagnie", e.compagnie),
        ligneInfo("N° de contrat", e.numeroContrat, { copiable: true }),
        ligneInfo("Réf. client", e.referenceClient, { copiable: true }),
        ligneInfo("N° de compteur / PDL", e.compteur, { copiable: true }),
        ligneInfo("Contact", e.contact, { lien: /^[\d\s+.]+$/.test(e.contact || "") ? telLien(e.contact) : null }),
        ligneInfo("Notes", e.notes)
      ];
    } else {
      lignes = [
        ligneInfo("Titulaire", e.titulaire),
        ligneInfo("Banque", e.banque),
        ligneInfo("IBAN", e.iban, { secret: true, cleSecret: e.id + ":iban", copiable: true, masque: ibanMasque, affichage: ibanLisible }),
        ligneInfo("BIC", e.bic, { copiable: true }),
        ligneInfo("Notes", e.notes)
      ];
    }
    const sousTitre = type === "contrat" ? e.categorie : null;
    return h("div", { class: "carte coffre" },
      h("button", { type: "button", class: "coffre-entete", onclick: () => formulaireCoffre(type, e) },
        h("span", { class: "contact-texte" }, h("strong", {}, e.titre), sousTitre ? h("small", {}, sousTitre) : null),
        h("span", { class: "chevron" }, ic("crayon"))
      ),
      lignes
    );
  });

  return [
    h("div", { class: "bandeau info" }, ic("cadenas"), "Données sensibles : ne partagez pas votre écran. Les mots de passe se masquent seuls après 30 s."),
    sousOnglets(TYPES_COFFRE, type, (t) => { etat.ongletCoffre = t; afficher(); }),
    cartes.length ? h("div", { class: "pile" }, cartes) : vide({
      acces: "Aucun identifiant. Ajoutez vos espaces clients (électricité, eau, box internet…).",
      contrat: "Aucun contrat. Ajoutez l'assurance, l'électricité, l'eau, internet…",
      banque: "Aucun RIB. Ajoutez le compte dédié à la maison."
    }[type])
  ];
}

function formulaireCoffre(type, e) {
  const config = {
    acces: {
      titre: "identifiant",
      champs: [
        { nom: "titre", label: "Nom du service", requis: true, placeholder: "ex : EDF, Orange, Veolia" },
        { nom: "url", label: "Adresse de connexion (URL)", type: "url", placeholder: "https://…" },
        { nom: "identifiant", label: "Identifiant / login" },
        { nom: "motDePasse", label: "Mot de passe", type: "secret" },
        { nom: "notes", label: "Notes", type: "textarea", lignes: 2 }
      ]
    },
    contrat: {
      titre: "contrat",
      champs: [
        { nom: "titre", label: "Intitulé", requis: true, placeholder: "ex : Assurance habitation" },
        { nom: "categorie", label: "Type", type: "select", options: TYPES_CONTRAT },
        { nom: "compagnie", label: "Compagnie / fournisseur", placeholder: "ex : MAIF, EDF, Orange" },
        { nom: "numeroContrat", label: "N° de contrat" },
        { nom: "referenceClient", label: "Référence client / n° de compte" },
        { nom: "compteur", label: "N° de compteur / PDL / PCE (facultatif)" },
        { nom: "contact", label: "Contact (téléphone, email…)" },
        { nom: "notes", label: "Notes", type: "textarea", lignes: 2, placeholder: "ex : échéance annuelle en mars" }
      ]
    },
    banque: {
      titre: "RIB",
      champs: [
        { nom: "titre", label: "Nom du compte", requis: true, placeholder: "ex : Compte maison" },
        { nom: "titulaire", label: "Titulaire" },
        { nom: "banque", label: "Banque" },
        { nom: "iban", label: "IBAN", placeholder: "FR76 …" },
        { nom: "bic", label: "BIC" },
        { nom: "notes", label: "Notes", type: "textarea", lignes: 2 }
      ]
    }
  }[type];

  ouvrirFormulaire({
    titre: (e ? "Modifier : " : "Nouveau ") + config.titre,
    valeurs: e || {},
    champs: config.champs,
    onValider: async (v) => {
      if (v.iban) v.iban = v.iban.replace(/\s/g, "").toUpperCase();
      if (v.bic) v.bic = v.bic.replace(/\s/g, "").toUpperCase();
      const ref = e ? doc(db, "coffre", e.id) : doc(collection(db, "coffre"));
      await ecrire(setDoc(ref, { ...v, type, modifiePar: emailCourant(), modifieLe: serverTimestamp() }, { merge: true }));
    },
    onSupprimer: e ? () => ecrire(deleteDoc(doc(db, "coffre", e.id))) : null
  });
}

// =====================================================================
//  MODULE D — PROCÉDURES (Arrivée / Départ / Repères)
// =====================================================================
function etapesDuType(type) {
  return etat.procedures
    .filter((p) => p.type === type)
    .sort((a, b) => (Number(a.ordre) || 0) - (Number(b.ordre) || 0));
}

function vueMaison() {
  if (!etat.charge.procedures) return chargement();
  const type = etat.ongletMaison;
  const etapes = etapesDuType(type);
  const estProcedure = type !== "repere";
  const nbCoches = etapes.filter((e) => etat.coches.has(e.id)).length;

  const resultat = [sousOnglets(TYPES_PROCEDURE, type, (t) => { etat.ongletMaison = t; afficher(); })];
  if (!etapes.length) {
    resultat.push(vide(TYPES_PROCEDURE[type].vide));
    return resultat;
  }

  if (estProcedure) {
    resultat.push(h("div", { class: "progression" },
      h("div", { class: "barre" }, h("div", { style: `width:${Math.round((nbCoches / etapes.length) * 100)}%` })),
      h("span", {}, `${nbCoches} / ${etapes.length} étape${etapes.length > 1 ? "s" : ""}`),
      nbCoches ? h("button", {
        type: "button", class: "btn lien",
        onclick: () => { etapes.forEach((e) => etat.coches.delete(e.id)); afficher(); }
      }, "Tout décocher") : null
    ));
  }

  resultat.push(h("div", { class: "pile" }, etapes.map((e, i) => {
    const coche = etat.coches.has(e.id);
    return h("article", { class: "carte etape" + (coche ? " faite" : "") },
      h("div", { class: "etape-entete" },
        estProcedure
          ? h("button", {
            type: "button", class: "case" + (coche ? " cochee" : ""), "aria-label": coche ? "Décocher" : "Marquer comme fait",
            onclick: () => { coche ? etat.coches.delete(e.id) : etat.coches.add(e.id); afficher(); }
          }, coche ? ic("ok") : String(i + 1))
          : h("span", { class: "case repere" }, ic("epingle")),
        h("h3", {}, e.titre),
        h("div", { class: "etape-outils" },
          h("button", { type: "button", class: "btn-icone petit", "aria-label": "Monter", disabled: i === 0, onclick: () => deplacerEtape(etapes, i, -1) }, ic("haut")),
          h("button", { type: "button", class: "btn-icone petit", "aria-label": "Descendre", disabled: i === etapes.length - 1, onclick: () => deplacerEtape(etapes, i, 1) }, ic("bas")),
          h("button", { type: "button", class: "btn-icone petit", "aria-label": "Modifier", onclick: () => formulaireEtape(type, e) }, ic("crayon"))
        )
      ),
      e.description ? h("p", { class: "etape-description" }, e.description) : null,
      (e.photos || []).length ? h("div", { class: "etape-photos" },
        e.photos.map((p) => h("figure", {},
          imagePhoto(p.photoId, p.commentaire, "photo-etape"),
          p.commentaire ? h("figcaption", {}, p.commentaire) : null
        ))
      ) : null
    );
  })));
  return resultat;
}

async function deplacerEtape(etapes, i, sens) {
  const a = etapes[i];
  const b = etapes[i + sens];
  if (!a || !b) return;
  // On renumérote toute la liste pour éviter les égalités
  const nouvelOrdre = etapes.slice();
  nouvelOrdre[i] = b;
  nouvelOrdre[i + sens] = a;
  const lot = writeBatch(db);
  nouvelOrdre.forEach((e, idx) => {
    if (Number(e.ordre) !== idx + 1) lot.update(doc(db, "procedures", e.id), { ordre: idx + 1 });
  });
  try { await ecrire(lot.commit()); } catch { /* déjà signalé */ }
}

function formulaireEtape(type, e) {
  const t = TYPES_PROCEDURE[type];
  ouvrirFormulaire({
    titre: e ? "Modifier" : (type === "repere" ? "Nouveau repère" : "Nouvelle étape — " + t.libelle),
    valeurs: e || { type },
    champs: [
      { nom: "type", label: "Rubrique", type: "select", options: Object.entries(TYPES_PROCEDURE).map(([k, v]) => ({ valeur: k, libelle: v.libelle })) },
      { nom: "titre", label: type === "repere" ? "Quoi ?" : "Titre de l'étape", requis: true, placeholder: type === "repere" ? "ex : Robinet d'arrêt général" : "ex : Ouvrir l'eau" },
      { nom: "description", label: "Explications", type: "textarea", lignes: 4, placeholder: "ex : Tourner la vanne bleue dans le sens inverse des aiguilles d'une montre, puis…" },
      { nom: "photos", label: "Photos avec commentaires", type: "photos" }
    ],
    onValider: async (v) => {
      const attentes = [];
      const photos = v.photos.elements.map((p) => {
        if (p.photoId) return { photoId: p.photoId, commentaire: p.commentaire };
        const n = enregistrerNouvellePhoto(p.dataUrl);
        attentes.push(n.promesse);
        return { photoId: n.id, commentaire: p.commentaire };
      });
      v.photos.supprimes.forEach(supprimerPhoto);

      const changeDeType = e && e.type !== v.type;
      const ordre = !e || changeDeType
        ? etapesDuType(v.type).reduce((m, x) => Math.max(m, Number(x.ordre) || 0), 0) + 1
        : e.ordre;
      const ref = e ? doc(db, "procedures", e.id) : doc(collection(db, "procedures"));
      attentes.push(ecrire(setDoc(ref, {
        type: v.type, titre: v.titre, description: v.description, photos, ordre,
        modifiePar: emailCourant(), modifieLe: serverTimestamp()
      }, { merge: true })));
      await Promise.all(attentes);
      etat.ongletMaison = v.type;
    },
    onSupprimer: e ? async () => {
      (e.photos || []).forEach((p) => supprimerPhoto(p.photoId));
      await ecrire(deleteDoc(doc(db, "procedures", e.id)));
    } : null,
    texteSupprimer: "Supprimer cette étape et ses photos ?"
  });
}

// =====================================================================
//  Navigation & affichage
// =====================================================================
const VUES = {
  depenses: { titre: "Dépenses", rendu: vueDepenses, ajouter: () => formulaireDepense(null) },
  contacts: { titre: "Contacts", rendu: vueContacts, ajouter: () => formulaireContact(null) },
  coffre: { titre: "Coffre-fort", rendu: vueCoffre, ajouter: () => formulaireCoffre(etat.ongletCoffre, null) },
  maison: { titre: "La maison", rendu: vueMaison, ajouter: () => formulaireEtape(etat.ongletMaison, null) }
};

function afficher() {
  if ($("#app").hidden) return;
  const vue = VUES[etat.route] || VUES.depenses;
  $("#titre-page").textContent = vue.titre;
  document.querySelectorAll(".onglets button").forEach((b) => b.classList.toggle("actif", b.dataset.route === etat.route));
  $("#contenu").replaceChildren(...[vue.rendu()].flat().filter(Boolean));
}

function lireRoute() {
  const r = location.hash.replace("#", "");
  etat.route = VUES[r] ? r : "depenses";
  if (etat.route !== "contacts") etat.recherche = "";
  afficher();
  window.scrollTo(0, 0);
}

function montrerEcran(nom) {
  for (const id of ["ecran-chargement", "ecran-config", "ecran-connexion", "app"]) {
    $("#" + id).hidden = id !== nom;
  }
}

// ---------------------------------------------------------------------
//  Synchronisation temps réel avec Firestore
// ---------------------------------------------------------------------
function abonner() {
  desabonner();
  for (const nom of ["depenses", "contacts", "coffre", "procedures"]) {
    const arret = onSnapshot(collection(db, nom), (snap) => {
      etat[nom] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      etat.charge[nom] = true;
      afficher();
    }, async (err) => {
      console.error(err);
      if (err.code === "permission-denied") {
        desabonner();
        await signOut(auth);
        afficherErreurConnexion("Ce compte n'est pas autorisé à accéder aux données de la famille. Vérifiez les règles de sécurité Firestore (voir le guide).");
      } else {
        toast("Synchronisation : " + messageErreur(err), true);
      }
    });
    etat.desabonnements.push(arret);
  }
}
function desabonner() {
  etat.desabonnements.forEach((f) => f());
  etat.desabonnements = [];
  for (const k of Object.keys(etat.charge)) etat.charge[k] = false;
}

// ---------------------------------------------------------------------
//  Connexion
// ---------------------------------------------------------------------
function afficherErreurConnexion(message) {
  const p = $("#erreur-connexion");
  p.textContent = message;
  p.hidden = !message;
}

function initialiserConnexion() {
  $("#form-connexion").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector("button[type=submit]");
    afficherErreurConnexion("");
    btn.disabled = true;
    btn.textContent = "Connexion…";
    try {
      await signInWithEmailAndPassword(auth, f.email.value.trim(), f.motdepasse.value);
      f.motdepasse.value = "";
    } catch (err) {
      afficherErreurConnexion(messageErreur(err));
    } finally {
      btn.disabled = false;
      btn.textContent = "Se connecter";
    }
  });

  $("#btn-oubli").addEventListener("click", async () => {
    const email = $("#form-connexion").email.value.trim();
    if (!email) { afficherErreurConnexion("Saisissez d'abord votre adresse email ci-dessus."); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      afficherErreurConnexion("");
      toast("Si ce compte existe, un email de réinitialisation a été envoyé à " + email);
    } catch (err) {
      afficherErreurConnexion(messageErreur(err));
    }
  });
}

function ouvrirCompte() {
  const dlg = $("#modale");
  dlg.replaceChildren(h("div", { class: "formulaire" },
    h("div", { class: "formulaire-entete" },
      h("h2", {}, "Mon compte"),
      h("button", { type: "button", class: "btn-icone", "aria-label": "Fermer", onclick: () => dlg.close() }, ic("croix"))
    ),
    h("div", { class: "formulaire-corps" },
      h("p", {}, "Connecté en tant que :"),
      h("p", {}, h("strong", {}, emailCourant())),
      h("p", { class: "discret" }, "Les données sont partagées en temps réel avec toute la famille et restent consultables hors connexion sur ce téléphone.")
    ),
    h("div", { class: "formulaire-pied" },
      h("button", {
        type: "button", class: "btn secondaire",
        onclick: async () => {
          try { await sendPasswordResetEmail(auth, emailCourant()); toast("Email de changement de mot de passe envoyé"); }
          catch (err) { toast(messageErreur(err), true); }
        }
      }, "Changer mon mot de passe"),
      h("span", { class: "espace" }),
      h("button", {
        type: "button", class: "btn danger",
        onclick: async () => { dlg.close(); await signOut(auth); }
      }, "Se déconnecter")
    )
  ));
  dlg.showModal();
}

// ---------------------------------------------------------------------
//  Installation sur l'écran d'accueil
// ---------------------------------------------------------------------
let invitationInstallation = null;
function bandeauInstallation() {
  const b = $("#bandeau-installation");
  const dejaInstallee = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (dejaInstallee || stockageLire("installation-masquee") === "1") { b.hidden = true; return; }
  const estIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const fermer = h("button", {
    type: "button", class: "btn-icone petit", "aria-label": "Masquer",
    onclick: () => { stockageEcrire("installation-masquee", "1"); b.hidden = true; }
  }, ic("croix"));
  if (invitationInstallation) {
    b.replaceChildren(
      h("span", {}, "Installez l'application sur votre téléphone"),
      h("button", {
        type: "button", class: "btn primaire petit",
        onclick: async () => { invitationInstallation.prompt(); await invitationInstallation.userChoice; invitationInstallation = null; b.hidden = true; }
      }, "Installer"),
      fermer
    );
    b.hidden = false;
  } else if (estIOS) {
    b.replaceChildren(h("span", {}, "Pour installer : touchez « Partager » puis « Sur l'écran d'accueil »."), fermer);
    b.hidden = false;
  }
}

// ---------------------------------------------------------------------
//  Démarrage
// ---------------------------------------------------------------------
function demarrer() {
  // Visionneuse
  $("#visionneuse").addEventListener("click", fermerVisionneuse);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fermerVisionneuse(); });

  // Fermer la modale en touchant le fond
  $("#modale").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  // Navigation
  document.querySelectorAll(".onglets button").forEach((b) => {
    b.addEventListener("click", () => { location.hash = b.dataset.route; });
  });
  window.addEventListener("hashchange", lireRoute);
  $("#fab").addEventListener("click", () => (VUES[etat.route] || VUES.depenses).ajouter());
  $("#btn-compte").addEventListener("click", ouvrirCompte);

  // Masquer les secrets dès que l'application passe en arrière-plan
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && etat.reveles.size) { etat.reveles.clear(); afficher(); }
  });

  // Indicateur hors connexion
  const majReseau = () => { $("#hors-ligne").hidden = navigator.onLine; };
  window.addEventListener("online", majReseau);
  window.addEventListener("offline", majReseau);
  majReseau();

  // Installation PWA (Android / Chrome)
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    invitationInstallation = e;
    bandeauInstallation();
  });

  if (!configOK) { montrerEcran("ecran-config"); return; }

  initialiserConnexion();
  onAuthStateChanged(auth, (utilisateur) => {
    if (utilisateur) {
      montrerEcran("app");
      bandeauInstallation();
      abonner();
      lireRoute();
    } else {
      desabonner();
      etat.depenses = []; etat.contacts = []; etat.coffre = []; etat.procedures = [];
      etat.reveles.clear();
      cachePhotos.clear();
      montrerEcran("ecran-connexion");
    }
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("Service worker non enregistré", e));
  });
}

demarrer();
