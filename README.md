# 📰 La Gazette du Matin — blog minimaliste rétro N&B (années 50)

Blog statique, sans framework ni build. Esprit **journal papier des années 50** : papier crème, filets doubles, serif, lettrine, colonnes, grain. **Une seule photo par article, convertie automatiquement en noir & blanc.**

## Contenu du dossier

```
index.html          → Une + dépêches
article.html?id=…   → Lecture d'un article
admin.html          → Mini CMS (mot de passe par défaut : journal1950)
assets/css/style.css
assets/js/site.js   → rendu public
assets/js/admin.js  → CMS : N&B auto, statuts, export
data/config.json    → titre, devise, pied de page…
data/articles.json  → articles (photo stockée en base64 N&B)
404.html, .nojekyll
```

## Utilisation locale

```bash
cd blog-retro
python3 -m http.server 8000
# → http://localhost:8000/
# → CMS : http://localhost:8000/admin.html
```

## Le mini CMS permet

- Paramétrer tout le site : titre, sous-titre, devise, « depuis », à-propos, pied de page.
- Créer / modifier / publier / dépublier / supprimer des articles.
- **Une seule photo par article** : import couleur accepté → conversion auto N&B (canvas : luminance + contraste + grain, redimensionné max 1400 px, JPEG 0.82). Le CSS `grayscale(1)` verrouille le rendu.
- Prévisualisation, statuts **Publié / Brouillon**, un seul article **À la une**.
- Stockage navigateur (localStorage) + **Export config.json / articles.json** à commiter.

## Publier sur GitHub Pages (statique)

1. Créez un dépôt GitHub, poussez ce dossier :
   ```bash
   cd blog-retro
   git init -b main
   git add . && git commit -m "ma gazette"
   git remote add origin https://github.com/VOTRE-PSEUDO/ma-gazette.git
   git push -u origin main
   ```
2. GitHub → `Settings → Pages → Deploy from a branch → main / (root)`.
3. URL : `https://VOTRE-PSEUDO.github.io/ma-gazette/`
4. Après chaque retouche CMS : `admin.html → Publier → Exporter` → écrasez `data/*.json` dans le dépôt → commit → Pages republie seul (1-2 min).

> Sécurité : le mot de passe admin (`journal1950` par défaut, changeable dans Réglages) est une simple porte, pas une vraie authentification — normal pour un site statique. Ne mettez rien de secret dans le CMS.

## Écrire un article

Titre, auteur, date, rubrique, chapeau, texte en mini-markdown (`##`, `**gras**`, `*italique*`, `> citation`, `- liste`), une photo. Bouton **Publier**.

## Personnaliser le rétro

Tout est dans `assets/css/style.css` : variables `--papier`, `--encre`, polices Playfair / Old Standard / Special Elite, `.photo-cadre img { filter: grayscale(1) … }`, colonnes, lettrine.
