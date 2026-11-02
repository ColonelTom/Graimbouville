#!/usr/bin/env python3
"""
Assemble la version de démonstration de Graimbouville en UN SEUL fichier HTML
(demo/graimbouville-demo.html), avec de fausses données et sans Firebase.

Utilisation (depuis la racine du dépôt) :  python3 demo/construire.py
"""
import base64
import re
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SITE = RACINE / "site"
DEMO = RACINE / "demo"


def data_uri(chemin: Path) -> str:
    return "data:image/png;base64," + base64.b64encode(chemin.read_bytes()).decode()


# 1) Le contenu du <body> de la vraie page
index = (SITE / "index.html").read_text(encoding="utf-8")
corps = re.search(r"<body>(.*)</body>", index, re.S).group(1)
corps = corps.replace("icons/icon-192.png", data_uri(SITE / "icons" / "icon-192.png"))

# 2) Le script de l'application, sans les imports Firebase ni le service worker
app = (SITE / "js" / "app.js").read_text(encoding="utf-8")
app, nb_imports = re.subn(r'import\s*\{[^}]*\}\s*from\s*"[^"]+";\s*', "", app)
assert nb_imports == 4, f"imports attendus : 4, trouvés : {nb_imports}"
app, nb_sw = re.subn(r'if \("serviceWorker" in navigator\) \{.*?\n\}\n', "", app, flags=re.S)
assert nb_sw == 1, "bloc service worker introuvable"

faux_firebase = (DEMO / "demo-firebase.js").read_text(encoding="utf-8")

# 3) Styles : ceux de l'application + quelques ajouts propres à la démo
styles = (SITE / "css" / "style.css").read_text(encoding="utf-8")
styles += """
/* ---------- Ajouts de la démo ---------- */
.bandeau-demo {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 8px max(16px, env(safe-area-inset-left, 0px)) 8px max(16px, env(safe-area-inset-right, 0px));
  background: var(--primaire-clair); color: var(--texte); font-size: 13px;
}
.bandeau-demo > span { flex: 1 1 200px; min-width: 0; }
.aide-demo { margin: 0; font-size: 14px; color: var(--primaire); font-weight: 600; }
"""

page = f"""<title>Graimbouville</title>
<meta name="theme-color" content="#f2f2f5">
<style>
{styles}
</style>
{corps}
<script type="module">
{faux_firebase}

// ===================== Application (copie de site/js/app.js) =====================
{app}
</script>
"""

sortie = DEMO / "graimbouville-demo.html"
sortie.write_text(page, encoding="utf-8")
print(f"Démo générée : {sortie} ({len(page) // 1024} Ko)")
