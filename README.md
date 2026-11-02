# 🏡 Graimbouville — l'application de la maison de famille

Application mobile (PWA) pour gérer la maison de Normandie en famille :

| Onglet | Contenu |
|---|---|
| 💶 **Dépenses** | Journal chronologique des frais : date, intitulé, catégorie, montant, payeur, photo du ticket. Filtres par catégorie, payeur et année, totaux par payeur, export tableur (Excel). |
| 📞 **Contacts** | Artisans (plombier, couvreur…), voisins/gardien, secours locaux + numéros d'urgence nationaux. Appel en un clic, recherche. |
| 🔐 **Coffre-fort** | Identifiants des espaces clients, contrats (assurance, électricité, eau, internet), RIB. Mots de passe et IBAN masqués, bouton copier. |
| 🏠 **Maison** | Procédures d'**arrivée** et de **départ** étape par étape (à cocher), et **repères** (où se trouve le robinet d'arrêt, le tableau électrique…), avec photos commentées. |

Les données sont partagées **en temps réel** entre tous les membres de la famille, et restent consultables **sans réseau** une fois chargées.

---

## Comment ça marche ?

- **Firebase** (service gratuit de Google) gère les comptes (email + mot de passe) et stocke les données.
- **Votre hébergement OVH** sert uniquement à mettre les fichiers de l'application en ligne (la base MySQL n'est pas utilisée).
- Les photos sont réduites sur le téléphone avant l'envoi, puis stockées dans Firebase : **aucune option payante n'est nécessaire**.

```
site/                      ← le dossier à mettre en ligne sur OVH
├── index.html
├── .htaccess              ← fichier caché, à envoyer aussi !
├── manifest.webmanifest
├── sw.js
├── css/style.css
├── js/app.js
├── js/firebase-config.js  ← le SEUL fichier à modifier
└── icons/…
firestore.rules            ← règles de sécurité à coller dans Firebase
```

---

## 📋 Installation pas à pas (environ 30 minutes)

### Étape 1 — Récupérer les fichiers

Sur la page GitHub du projet : bouton vert **Code** → **Download ZIP**, puis décompressez le fichier sur votre ordinateur.

### Étape 2 — Créer le projet Firebase

1. Allez sur <https://console.firebase.google.com> et connectez-vous avec un compte Google.
2. **Créer un projet** → nom : `graimbouville` → vous pouvez **désactiver Google Analytics** → **Créer le projet**.

### Étape 3 — Activer la connexion par email et créer les comptes de la famille

1. Menu de gauche : **Création** → **Authentication** → **Commencer**.
2. Onglet **Mode de connexion** → **Adresse e-mail/Mot de passe** → activez le premier interrupteur → **Enregistrer**.
3. Onglet **Utilisateurs** → **Ajouter un utilisateur** : saisissez l'email et un mot de passe pour **chaque membre** de la famille (vous, papa, maman…).
4. Onglet **Paramètres** → **Actions des utilisateurs** → **décochez** « Activer la création (inscription) » → **Enregistrer**.
   *(Ainsi, personne d'autre ne peut se créer un compte.)*

### Étape 4 — Créer la base de données et la protéger

1. Menu de gauche : **Création** → **Firestore Database** → **Créer une base de données**.
2. Emplacement : **europe-west9 (Paris)** → **Suivant** → **Démarrer en mode production** → **Créer**.
3. Ouvrez l'onglet **Règles**.
4. Ouvrez le fichier `firestore.rules` (avec le Bloc-notes), **remplacez les 3 adresses d'exemple** par les adresses email des comptes créés à l'étape 3 (en minuscules, entre apostrophes, séparées par des virgules). Exemple :

   ```
   && request.auth.token.email in [
     'thomas@gmail.com',
     'papa@orange.fr',
     'maman@orange.fr'
   ];
   ```

5. Copiez **tout** le contenu du fichier, collez-le à la place du texte présent dans l'onglet **Règles**, puis cliquez sur **Publier**.

> Pour ajouter un membre plus tard : créez son compte (étape 3) **et** ajoutez son email dans les règles (étape 4), puis **Publier**.

### Étape 5 — Relier l'application à Firebase

1. Dans Firebase, cliquez sur l'engrenage ⚙️ en haut à gauche → **Paramètres du projet**.
2. En bas, section **Vos applications** → cliquez sur l'icône **`</>`** (Web).
3. Surnom : `Graimbouville` → ne cochez **pas** Firebase Hosting → **Enregistrer l'application**.
4. Firebase affiche un bloc de code contenant `const firebaseConfig = { apiKey: "...", ... }`.
5. Ouvrez `site/js/firebase-config.js` avec le Bloc-notes et remplacez chaque `A_REMPLACER` par les valeurs affichées. Le résultat doit ressembler à :

   ```js
   export const firebaseConfig = {
     apiKey: "AIzaSyB...",
     authDomain: "graimbouville-1234.firebaseapp.com",
     projectId: "graimbouville-1234",
     storageBucket: "graimbouville-1234.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef"
   };
   ```

6. Facultatif : dans le même fichier, changez la ligne `PAYEURS` si vous préférez des prénoms à « Moi » / « Mes parents ».
7. Enregistrez le fichier.

> ℹ️ La « apiKey » n'est pas un secret : elle identifie simplement votre projet. La protection des données est assurée par les comptes et les règles de l'étape 4.

### Étape 6 — Mettre en ligne sur OVH

1. **Activer le HTTPS** (indispensable) : Espace client OVH → **Web Cloud** → **Hébergements** → votre hébergement → onglet **Multisite** : vérifiez que la colonne **SSL** est « Activé » pour votre domaine (sinon : bouton **…** → Modifier → cochez SSL, puis onglet **Informations générales** → Certificat SSL → Commander un certificat gratuit Let's Encrypt).
   - *Conseil* : créez un sous-domaine dédié, par exemple `maison.votredomaine.fr`, qui pointe vers un dossier `graimbouville` (onglet Multisite → **Ajouter un domaine ou sous-domaine**, avec SSL coché).
2. **Récupérer les accès FTP** : onglet **FTP-SSH** de l'hébergement (serveur, identifiant ; mot de passe modifiable ici).
3. Installez **FileZilla** (<https://filezilla-project.org>, version « Client »), connectez-vous avec ces accès.
4. Dans FileZilla, menu **Serveur** → cochez **Forcer l'affichage des fichiers cachés** (pour voir `.htaccess`).
5. Envoyez **le contenu** du dossier `site/` (pas le dossier lui-même) dans le dossier choisi sur OVH :
   - `www/` si l'application est à la racine de votre domaine ;
   - `www/graimbouville/` (ou le dossier choisi pour le sous-domaine).
6. Ouvrez l'adresse dans votre navigateur (ex. `https://maison.votredomaine.fr`) : l'écran de connexion doit apparaître.

### Étape 7 — Installer l'application sur les téléphones

- **iPhone / iPad** : ouvrez l'adresse dans **Safari** → bouton **Partager** ⬆️ → **Sur l'écran d'accueil** → Ajouter.
- **Android** : ouvrez l'adresse dans **Chrome** → bandeau **Installer** (ou menu ⋮ → **Installer l'application**).

L'icône « Graimbouville » apparaît alors sur l'écran d'accueil comme une application normale.

---

## 🔒 Sécurité

- Seules les adresses listées dans les règles Firestore peuvent lire ou écrire les données — même avec un compte Firebase valide, toute autre adresse est refusée.
- L'inscription libre est désactivée : seuls les comptes créés par vous existent.
- Les échanges sont chiffrés (HTTPS) et Google chiffre les données stockées.
- Dans le coffre-fort, mots de passe et IBAN sont masqués par défaut, se re-masquent automatiquement après 30 secondes, et dès que l'application passe en arrière-plan.
- Bon réflexe : utilisez un mot de passe solide pour chaque compte familial, et activez le verrouillage du téléphone.

## 🔄 Mettre à jour l'application plus tard

1. Remplacez les fichiers modifiés sur OVH (via FileZilla).
2. Dans `site/sw.js`, augmentez le numéro de version (`graimbouville-v1` → `graimbouville-v2`) et renvoyez ce fichier aussi.
3. Fermez puis rouvrez l'application sur les téléphones.

## 💡 Bon à savoir

- **Mot de passe oublié** : bouton sur l'écran de connexion (un email de réinitialisation est envoyé).
- **Hors connexion** : l'application reste consultable ; les ajouts faits sans réseau sont envoyés automatiquement au retour de la connexion (pastille « Hors connexion » en haut).
- **Export** : en bas de l'onglet Dépenses, le bouton « Exporter » crée un fichier ouvrable dans Excel (avec les filtres en cours).
- **Limites gratuites Firebase** : 1 Go de données (≈ 3 000 à 5 000 photos) et 50 000 lectures par jour — largement suffisant pour une famille.
- Le numéro « Dépannage électricité Enedis (76) » correspond à la Seine-Maritime.

## 🛠️ En cas de problème

| Symptôme | Solution |
|---|---|
| « Configuration à terminer » | `js/firebase-config.js` n'a pas été complété ou n'a pas été renvoyé sur OVH (étape 5). |
| « Email ou mot de passe incorrect » | Vérifiez le compte dans Firebase → Authentication → Utilisateurs. |
| « Ce compte n'est pas autorisé… » | L'email n'est pas dans les règles Firestore, ou les règles n'ont pas été **publiées** (étape 4). |
| Le bouton « Installer » n'apparaît pas | Vérifiez que l'adresse commence par `https://` (étape 6.1). Sur iPhone, utilisez Safari. |
| Les modifications n'apparaissent pas après une mise à jour | Augmentez la version dans `sw.js`, puis fermez/rouvrez l'application. |
