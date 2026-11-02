// =====================================================================
//  DÉMO GRAIMBOUVILLE — remplace Firebase par une base en mémoire
//  remplie de FAUSSES données. Ce fichier est assemblé avec js/app.js
//  par demo/construire.py ; il n'est pas utilisé par la vraie application.
// =====================================================================
window.GRAIMBOUVILLE_DEMO = true;

const firebaseConfig = { apiKey: "DEMO" };
const PROFILS = ["Etienne", "Caroline", "Fabienne", "Amélie", "Matthias"].map((prenom) => ({
  prenom, identifiant: prenom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") + ".graimbouville@example.com"
}));
const PAYEURS = PROFILS.map((p) => p.prenom);

// ---------- Faux Firebase Auth ----------
let demoUtilisateur = null;
const demoAbonnesAuth = [];
function initializeApp(c) { return { c }; }
function getAuth() { return { get currentUser() { return demoUtilisateur; } }; }
function onAuthStateChanged(a, cb) { demoAbonnesAuth.push(cb); setTimeout(() => cb(demoUtilisateur), 0); }
async function signInWithEmailAndPassword(a, email) { // en démo, tout mot de passe est accepté
  await new Promise((r) => setTimeout(r, 400));
  demoUtilisateur = { email: email || PROFILS[0].identifiant };
  demoAbonnesAuth.forEach((s) => s(demoUtilisateur));
}
async function signOut() { demoUtilisateur = null; demoAbonnesAuth.forEach((s) => s(null)); }
async function sendPasswordResetEmail() { /* rien en démo */ }

// ---------- Faux Firestore ----------
const demoBase = {};
const demoEcouteurs = {};
let demoCompteur = 0;
const MARQUEUR_DATE = "__horodatage__";
const demoCollection = (nom) => (demoBase[nom] ||= new Map());
function demoInstantane(nom) {
  return {
    docs: [...demoCollection(nom).entries()].map(([id, d]) => ({
      id, data: () => ({ ...d, photos: d.photos ? d.photos.map((p) => ({ ...p })) : d.photos })
    }))
  };
}
function demoNotifier(nom) { (demoEcouteurs[nom] || []).forEach((cb) => cb(demoInstantane(nom))); }
function initializeFirestore() { return {}; }
function persistentLocalCache() { return {}; }
function persistentMultipleTabManager() { return {}; }
function collection(db, nom) { return { nom }; }
function doc(a, b, c) {
  if (a && a.nom && b === undefined) return { nom: a.nom, id: "demo" + (++demoCompteur) };
  return { nom: b, id: c };
}
function serverTimestamp() { return MARQUEUR_DATE; }
async function setDoc(ref, data, opts) {
  const m = demoCollection(ref.nom);
  const ancien = opts && opts.merge ? (m.get(ref.id) || {}) : {};
  const propre = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    if (v === MARQUEUR_DATE) { const t = Date.now(); propre[k] = { toMillis: () => t }; } else propre[k] = v;
  }
  m.set(ref.id, { ...ancien, ...propre });
  demoNotifier(ref.nom);
}
async function deleteDoc(ref) { demoCollection(ref.nom).delete(ref.id); demoNotifier(ref.nom); }
async function getDoc(ref) {
  await new Promise((r) => setTimeout(r, 120));
  const d = demoCollection(ref.nom).get(ref.id);
  return { exists: () => !!d, data: () => d };
}
function onSnapshot(c, cb) {
  (demoEcouteurs[c.nom] ||= []).push(cb);
  setTimeout(() => cb(demoInstantane(c.nom)), 250);
  return () => { demoEcouteurs[c.nom] = demoEcouteurs[c.nom].filter((x) => x !== cb); };
}
function writeBatch() {
  const ops = [];
  return {
    update(ref, d) { ops.push([ref, d]); },
    async commit() { for (const [r, d] of ops) await setDoc(r, d, { merge: true }); }
  };
}

// ---------- Photos d'exemple dessinées à la volée ----------
function demoPhoto(titre, emoji, teinte) {
  const c = document.createElement("canvas");
  c.width = 800; c.height = 560;
  const g = c.getContext("2d");
  const fond = g.createLinearGradient(0, 0, 800, 560);
  fond.addColorStop(0, `hsl(${teinte} 35% 78%)`);
  fond.addColorStop(1, `hsl(${teinte} 30% 58%)`);
  g.fillStyle = fond; g.fillRect(0, 0, 800, 560);
  g.font = "180px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(emoji, 400, 240);
  g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(0, 440, 800, 120);
  g.fillStyle = "#fff"; g.font = "bold 34px sans-serif"; g.fillText(titre, 400, 485);
  g.font = "22px sans-serif"; g.fillText("Photo d'exemple (démo)", 400, 528);
  return c.toDataURL("image/jpeg", 0.8);
}
function demoTicket() {
  const c = document.createElement("canvas");
  c.width = 500; c.height = 760;
  const g = c.getContext("2d");
  g.fillStyle = "#e9e6df"; g.fillRect(0, 0, 500, 760);
  g.fillStyle = "#fff"; g.fillRect(60, 30, 380, 700);
  g.fillStyle = "#222"; g.textAlign = "center";
  g.font = "bold 30px monospace"; g.fillText("BRICO-EXEMPLE", 250, 90);
  g.font = "18px monospace"; g.fillText("Magasin fictif — démo", 250, 122);
  g.textAlign = "left"; g.font = "20px monospace";
  const lignes = [["Peinture blanche 10L", "39,90"], ["Rouleau + bac", "6,00"], ["", ""], ["TOTAL TTC", "45,90 €"]];
  lignes.forEach(([a, b], i) => { g.fillText(a, 90, 200 + i * 44); g.textAlign = "right"; g.fillText(b, 410, 200 + i * 44); g.textAlign = "left"; });
  g.textAlign = "center"; g.font = "18px monospace"; g.fillText("Merci de votre visite", 250, 660);
  return c.toDataURL("image/jpeg", 0.8);
}

// ---------- Fausses données ----------
(function remplirDemo() {
  const ajout = (nom, data) => {
    const id = "demo" + (++demoCompteur);
    demoCollection(nom).set(id, data);
    return id;
  };
  const photo = (dataUrl) => ajout("photos", { data: dataUrl });
  const auteur = { creePar: "Etienne" };

  // Dépenses
  const ticket = photo(demoTicket());
  [
    ["2026-10-24", "Achat de peinture (chambre du haut)", "Achats divers / courses", 45.9, "Matthias", ticket],
    ["2026-10-12", "Ramonage de la cheminée", "Réparations", 85, "Etienne"],
    ["2026-10-03", "Facture d'électricité septembre", "Électricité", 38.6, "Fabienne"],
    ["2026-09-18", "Réparation fuite toiture", "Réparations", 820, "Etienne"],
    ["2026-09-05", "Courses d'ouverture (produits ménagers)", "Achats divers / courses", 62.35, "Amélie"],
    ["2026-08-28", "Facture d'eau semestrielle", "Eau", 74.2, "Caroline"],
    ["2026-08-14", "Remplacement du ballon d'eau chaude", "Réparations", 1240, "Matthias"],
    ["2026-07-02", "Tondeuse : révision", "Réparations", 95, "Amélie"],
    ["2026-06-15", "Facture d'électricité printemps", "Électricité", 52.1, "Fabienne"],
    ["2026-03-01", "Assurance habitation 2026", "Assurance", 412.4, "Etienne"],
    ["2026-02-10", "Bois de chauffage (2 stères)", "Achats divers / courses", 190, "Caroline"],
    ["2025-12-20", "Facture d'eau semestrielle", "Eau", 68.9, "Fabienne"],
    ["2025-11-08", "Purge et entretien chaudière", "Réparations", 160, "Etienne"],
    ["2025-03-01", "Assurance habitation 2025", "Assurance", 398, "Etienne"]
  ].forEach(([date, libelle, categorie, montant, payeur, photoId]) =>
    ajout("depenses", { date, libelle, categorie, montant, payeur, photoId: photoId || null, notes: "", ...auteur }));

  // Contacts (noms et numéros fictifs)
  [
    ["artisan", "Plomberie Exemple", "Plombier", "02 00 00 00 01", "Intervient sous 48 h. A remplacé le ballon d'eau chaude en 2026."],
    ["artisan", "Toitures Démo", "Couvreur", "02 00 00 00 02", "Devis gratuit. Réparation de la fuite en septembre."],
    ["artisan", "Élec Service Fictif", "Électricien", "06 00 00 00 03", ""],
    ["artisan", "M. Exemple", "Jardinier / paysagiste", "06 00 00 00 04", "Tonte toutes les 3 semaines d'avril à octobre."],
    ["voisin", "Mme Voisine (exemple)", "Voisine d'en face, garde un double des clés", "06 00 00 00 05", "Prévenir de nos dates d'arrivée."],
    ["voisin", "M. Gardien (exemple)", "Fait le tour de la maison en notre absence", "06 00 00 00 06", ""],
    ["urgence", "Cabinet médical (exemple)", "Médecin généraliste", "02 00 00 00 07", "Ouvert lundi au samedi matin."],
    ["urgence", "Mairie (exemple)", "Mairie", "02 00 00 00 08", ""]
  ].forEach(([type, nom, specialite, telephone, notes]) =>
    ajout("contacts", { type, nom, specialite, telephone, notes, ...auteur }));

  // Coffre-fort (identifiants entièrement fictifs)
  ajout("coffre", { type: "acces", titre: "Électricité (exemple)", url: "https://www.exemple.fr", identifiant: "famille.demo@exemple.fr", motDePasse: "Demo-Mdp-2026!", notes: "Compte au nom de Papa." });
  ajout("coffre", { type: "acces", titre: "Box internet (exemple)", url: "https://www.exemple.fr", identifiant: "0200000000", motDePasse: "Faux-Code-1234", notes: "Code wifi au dos de la box." });
  ajout("coffre", { type: "acces", titre: "Eau (exemple)", url: "https://www.exemple.fr", identifiant: "CLIENT-000123", motDePasse: "Exemple#Eau" });
  ajout("coffre", { type: "contrat", titre: "Assurance habitation", categorie: "Assurance", compagnie: "Assureur Exemple", numeroContrat: "HAB-0000-1234", referenceClient: "CL-998877", contact: "02 00 00 00 09", notes: "Échéance annuelle le 1er mars." });
  ajout("coffre", { type: "contrat", titre: "Électricité", categorie: "Électricité", compagnie: "Fournisseur Exemple", referenceClient: "000 111 222", compteur: "PDL 00000000000000", contact: "09 00 00 00 10" });
  ajout("coffre", { type: "contrat", titre: "Internet", categorie: "Internet / Box", compagnie: "Opérateur Exemple", numeroContrat: "BOX-4455", referenceClient: "0200000000" });
  ajout("coffre", { type: "banque", titre: "Compte maison (exemple)", titulaire: "Famille Exemple", banque: "Banque Fictive", iban: "FR7600000000000000000000000", bic: "EXEMFRPP", notes: "Faux RIB pour la démonstration." });

  // Procédures
  const etapes = {
    arrivee: [
      ["Ouvrir le robinet d'arrêt général", "Tourner la vanne bleue dans le sens inverse des aiguilles d'une montre, doucement.", [["Robinet d'arrêt", "🚰", 200, "Le robinet est dans le placard sous l'évier, derrière les produits ménagers."]]],
      ["Remonter le disjoncteur général", "Lever la manette du disjoncteur, puis vérifier que tous les petits interrupteurs sont en haut.", [["Tableau électrique", "⚡", 45, "Le tableau est dans l'entrée, derrière la porte."]]],
      ["Rallumer le chauffe-eau", "Mettre l'interrupteur « chauffe-eau » du tableau sur Marche. Compter 6 h pour avoir de l'eau chaude."],
      ["Ouvrir les volets et aérer", "Commencer par le rez-de-chaussée. Aérer 15 minutes."],
      ["Remettre le chauffage en route", "Thermostat sur 19 °C."]
    ],
    depart: [
      ["Fermer tous les volets", "Vérifier aussi le volet de la salle de bain."],
      ["Vider le réfrigérateur et le laisser ouvert", ""],
      ["Couper le chauffe-eau", "Interrupteur « chauffe-eau » du tableau sur Arrêt."],
      ["Fermer le robinet d'arrêt général", "Sens des aiguilles d'une montre jusqu'au blocage.", [["Robinet d'arrêt", "🚰", 200, "Même robinet qu'à l'arrivée, sous l'évier."]]],
      ["Chauffage en mode hors-gel", "Mettre le thermostat sur le flocon ❄️ (hors-gel) en hiver."],
      ["Fermer à clé et prévenir la voisine", "Envoyer un SMS à Mme Voisine pour la prévenir du départ."]
    ],
    repere: [
      ["Purge du chauffe-eau", "Dans le cellier, en bas à droite du ballon.", [["Purge du chauffe-eau", "🔧", 15, "Robinet rouge en bas du ballon. Ne l'ouvrir qu'avec le chauffe-eau coupé."]]],
      ["Compteur d'eau", "Regard dans le jardin, à gauche du portail. Couvercle vert."],
      ["Double des clés", "Chez Mme Voisine (voir Contacts)."]
    ]
  };
  for (const [type, liste] of Object.entries(etapes)) {
    liste.forEach(([titre, description, photos], i) => {
      ajout("procedures", {
        type, titre, description, ordre: i + 1,
        photos: (photos || []).map(([t, e, teinte, commentaire]) => ({ photoId: photo(demoPhoto(t, e, teinte)), commentaire }))
      });
    });
  }
})();

// ---------- Interface propre à la démo ----------
// Lancée juste après le chargement de l'application (elle utilise ses fonctions).
setTimeout(function interfaceDemo() {
  // Formulaire de connexion pré-rempli
  const form = document.querySelector("#form-connexion");
  form.motdepasse.value = "demonstration";
  form.querySelector("button[type=submit]").before(
    h("p", { class: "aide-demo" }, "Démo : touchez un prénom puis « Se connecter » (le mot de passe est déjà rempli).")
  );

  // Bandeau « démo » sous l'en-tête
  const bandeau = h("div", { class: "bandeau-demo" },
    h("span", {}, "Démo avec de fausses données. Rien n'est enregistré : tout revient à zéro au rechargement."),
    h("button", { type: "button", class: "btn primaire petit", onclick: () => ouvrirAvis() }, ic("bulle"), "Donner mon avis")
  );
  document.querySelector(".entete").after(bandeau);

  // Commentaires claude.ai (disponibles pour le propriétaire de la page)
  let commentaires = null;
  if (window.claude && typeof window.claude.use === "function") {
    window.claude.use("comments").then((c) => { commentaires = c; }).catch(() => {});
  }

  const RUBRIQUES = { depenses: "Dépenses", contacts: "Contacts", coffre: "Coffre-fort", maison: "Maison", general: "Général / autre" };
  let brouillon = "";

  function ouvrirAvis() {
    const dlg = document.querySelector("#modale");
    const zone = h("textarea", { id: "avis-texte", rows: 5, maxlength: 3000, placeholder: "Ce qui vous plaît, ce qui manque, ce qui n'est pas clair…" });
    zone.value = brouillon;
    zone.addEventListener("input", () => { brouillon = zone.value; });
    const qui = h("input", { id: "avis-qui", type: "text", placeholder: "ex : Caroline", autocomplete: "off", value: profilCourant() });
    const sujet = h("select", { id: "avis-sujet" }, Object.entries(RUBRIQUES).map(([k, v]) => h("option", { value: k }, v)));
    sujet.value = RUBRIQUES[etat.route] ? etat.route : "general";
    const message = h("p", { class: "erreur", hidden: true });

    const texteFinal = () => {
      const t = zone.value.trim();
      if (!t) return "";
      return `[${RUBRIQUES[sujet.value]}]${qui.value.trim() ? " " + qui.value.trim() + " :" : ""} ${t}`;
    };
    const exiger = () => {
      const t = texteFinal();
      if (!t) { message.textContent = "Écrivez d'abord votre remarque."; message.hidden = false; }
      return t;
    };

    const btnPublier = h("button", {
      type: "button", class: "btn primaire",
      onclick: async () => {
        const t = exiger(); if (!t) return;
        btnPublier.disabled = true; btnPublier.textContent = "Envoi…";
        try {
          const ancre = await commentaires.anchorFor(document.querySelector("#titre-page"));
          await commentaires.create({ anchor: ancre, text: t });
          brouillon = "";
          dlg.close();
          toast("Avis enregistré. Merci !");
        } catch (e) {
          const code = e && e.code;
          message.textContent = code === "consent_required"
            ? "L'avis n'a pas été publié : autorisez les commentaires pour cette page, puis réessayez."
            : "Impossible de publier l'avis ici. Utilisez « Copier le texte » et envoyez-le par SMS ou email.";
          message.hidden = false;
          if (code === "forbidden" || code === "not_granted") btnPublier.hidden = true;
        } finally {
          btnPublier.disabled = false; btnPublier.textContent = "Publier l'avis";
        }
      }
    }, "Publier l'avis");
    btnPublier.hidden = !commentaires;

    const btnCopier = h("button", {
      type: "button", class: commentaires ? "btn secondaire" : "btn primaire",
      onclick: () => { const t = exiger(); if (t) copier(t, "Texte"); }
    }, "Copier le texte");

    dlg.replaceChildren(h("div", { class: "formulaire" },
      h("div", { class: "formulaire-entete" },
        h("h2", {}, "Votre avis sur l'application"),
        h("button", { type: "button", class: "btn-icone", "aria-label": "Fermer", onclick: () => dlg.close() }, ic("croix"))
      ),
      h("div", { class: "formulaire-corps" },
        h("label", { class: "champ", for: "avis-qui" }, h("span", { class: "label" }, "Votre prénom"), qui),
        h("label", { class: "champ", for: "avis-sujet" }, h("span", { class: "label" }, "Ça concerne"), sujet),
        h("label", { class: "champ", for: "avis-texte" }, h("span", { class: "label" }, "Votre remarque ou idée"), zone),
        h("p", { class: "discret" }, commentaires
          ? "« Publier l'avis » l'ajoute en commentaire sur cette page, lisible ensuite pour faire évoluer l'application."
          : "Copiez le texte puis envoyez-le par SMS ou email à la personne qui vous a montré l'application.")
      ),
      message,
      h("div", { class: "formulaire-pied" }, h("span", { class: "espace" }), btnCopier, btnPublier)
    ));
    dlg.showModal();
  }
}, 0);
