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
- Stockage navigateur (localStorage), export JSON et publication directe facultative vers GitHub avec un jeton finement limité.

## Publier sur GitHub Pages (statique)

Le dépôt `Optimist97/blog-retro` doit être publié depuis `main / (root)` dans GitHub → `Settings → Pages`. L'adresse du journal est `https://optimist97.github.io/blog-retro/` et celle du CMS est **`https://optimist97.github.io/blog-retro/admin.html`**. Gardez le chemin `/blog-retro/` : un site de projet GitHub Pages n'est pas publié à la racine du domaine.

Après chaque retouche CMS, vous pouvez publier directement les deux JSON depuis l'onglet **Publier sur GitHub**. Pour cela, créez un jeton personnel finement limité (fine-grained) pour le seul dépôt `Optimist97/blog-retro`, accordez `Contents: Read and write`, puis collez-le dans le formulaire. Le jeton est utilisé en mémoire pour cet envoi et n'est pas conservé par le navigateur. La publication crée un commit sur `main` et GitHub Pages republie le site. Vous pouvez aussi exporter puis commiter les deux fichiers manuellement.

> Limites : le CMS est statique. Le mot de passe (`journal1950` initialement) et les brouillons sont conservés uniquement dans le stockage local du navigateur. Ils ne sont pas partagés entre appareils et le mot de passe n'est pas une authentification sécurisée. L'export JSON ne publie rien automatiquement. Utilisez le même navigateur, autorisez les données du site et évitez le mode privé.

## Écrire un article

Titre, auteur, date, rubrique, chapeau, texte en mini-markdown (`##`, `**gras**`, `*italique*`, `> citation`, `- liste`), une photo. Bouton **Publier**.

## Personnaliser le rétro

Tout est dans `assets/css/style.css` : variables `--papier`, `--encre`, polices Playfair / Old Standard / Special Elite, `.photo-cadre img { filter: grayscale(1) … }`, colonnes, lettrine.
