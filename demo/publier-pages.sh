#!/usr/bin/env bash
# Met à jour la démo publique (branche gh-pages → GitHub Pages).
# Utilisation depuis la racine du dépôt :  bash demo/publier-pages.sh
set -euo pipefail
python3 demo/construire.py
TMP=$(mktemp -d)
git worktree add --force "$TMP" gh-pages
cp demo/autonome/index.html "$TMP/index.html"
touch "$TMP/.nojekyll"
cd "$TMP"
git add -A
git commit -m "Mise à jour de la démo" || echo "Rien de nouveau à publier"
git push origin gh-pages
cd - >/dev/null
git worktree remove --force "$TMP"
