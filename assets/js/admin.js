/* Mini CMS — localStorage + export JSON pour GitHub Pages. Photo unique -> N&B auto via canvas. */
/* LS_CONFIG / LS_ARTICLES déjà définis dans site.js (chargé avant) */
const LS_PASS = "retro50_pass";
const DEFAULT_PASS = "journal1950";

let CONFIG = null, ARTICLES = [];
let photoDataURL = ""; // photo courante du formulaire

const $ = id => document.getElementById(id);
const slugify = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || ("article-" + Date.now());

function alerte(msg) {
  $("alerte").innerHTML = msg ? `<div class="alert">${msg}</div>` : "";
  if (msg) setTimeout(() => { $("alerte").innerHTML = ""; }, 4500);
}
function save() {
  localStorage.setItem(LS_CONFIG, JSON.stringify(CONFIG));
  localStorage.setItem(LS_ARTICLES, JSON.stringify(ARTICLES));
  majEtat();
}
async function charger() {
  const d = await loadData();
  CONFIG = d.config; ARTICLES = d.articles;
}

/* ---------- Photo : couleur -> N&B ---------- */
function fichierVersNB(file, cb) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const MAX = 1400;
    let { width: w, height: h } = img;
    const r = Math.min(1, MAX / Math.max(w, h));
    w = Math.round(w * r); h = Math.round(h * r);
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    try {
      const id = ctx.getImageData(0, 0, w, h);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        // luminance + léger contraste
        let g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        g = (g - 128) * 1.12 + 128; // contraste rétro
        g = Math.max(0, Math.min(255, g));
        // grain subtil
        const grain = (Math.random() - 0.5) * 7;
        g = Math.max(0, Math.min(255, g + grain));
        d[i] = d[i + 1] = d[i + 2] = g;
      }
      ctx.putImageData(id, 0, 0);
    } catch (e) { console.warn("N&B canvas", e); }
    cb(cv.toDataURL("image/jpeg", 0.82)); // compressé, léger pour GitHub
  };
  img.onerror = () => { URL.revokeObjectURL(url); alerte("Image illisible."); };
  img.src = url;
}
function majApercuPhoto() {
  $("apercu").innerHTML = photoDataURL
    ? `<div class="photo-cadre apercu-photo"><figure><div class="img-nb"><img src="${photoDataURL}"></div><figcaption>Prévisualisation N&amp;B — une seule photo conservée<span class="mention-nb">Noir &amp; blanc auto</span></figcaption></figure></div>`
    : `<p style="font-style:italic">Aucune photo. Importez-en une (elle deviendra N&amp;B).</p>`;
}

/* ---------- Liste / formulaire ---------- */
function rendreListe() {
  const tri = [...ARTICLES].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  $("compte").textContent = tri.length;
  $("liste").innerHTML = tri.map(a => `
    <div class="item-admin">
      <div><strong>${a.title || "(sans titre)"}</strong><br>
      <span class="meta">${a.date || ""} · ${a.category || "—"} ${a.featured ? "· ★ À la une" : ""}</span></div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span class="badge ${a.status === "published" ? "pub" : "brou"}">${a.status === "published" ? "Publié" : "Brouillon"}</span>
        <span class="petits-btns">
          <a href="article.html?id=${encodeURIComponent(a.id)}" target="_blank">Voir</a>
          <button data-act="edit" data-id="${a.id}">Modifier</button>
          <button data-act="toggle" data-id="${a.id}">${a.status === "published" ? "Dépublier" : "Publier"}</button>
          <button data-act="del" data-id="${a.id}">Supprimer</button>
        </span>
      </div>
    </div>`).join("") || `<div class="vide">Aucun article. Cliquez « + Nouvel article ».</div>`;
  $("liste").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    const { act, id } = b.dataset;
    if (act === "edit") ouvrirEdition(id);
    if (act === "toggle") {
      const a = ARTICLES.find(x => x.id === id);
      a.status = a.status === "published" ? "draft" : "published";
      save(); rendreListe(); alerte(`« ${a.title} » → ${a.status === "published" ? "publié" : "brouillon"}.`);
    }
    if (act === "del" && confirm("Supprimer cet article ?")) {
      ARTICLES = ARTICLES.filter(x => x.id !== id);
      save(); rendreListe();
    }
  }));
}
function ouvrirEdition(id) {
  const a = ARTICLES.find(x => x.id === id);
  goTab("editer");
  if (!a) {
    $("titre-form").textContent = "Nouvel article";
    $("f-id").value = ""; $("f-titre").value = ""; $("f-auteur").value = "";
    $("f-date").value = new Date().toISOString().slice(0, 10);
    $("f-cat").value = ""; $("f-statut").value = "published";
    $("f-vedette").checked = false; $("f-chapeau").value = ""; $("f-contenu").value = "";
    photoDataURL = ""; $("apercu-rendu").innerHTML = "";
  } else {
    $("titre-form").textContent = "Modifier — " + a.title;
    $("f-id").value = a.id; $("f-titre").value = a.title || "";
    $("f-auteur").value = a.author || ""; $("f-date").value = a.date || "";
    $("f-cat").value = a.category || ""; $("f-statut").value = a.status || "published";
    $("f-vedette").checked = !!a.featured;
    $("f-chapeau").value = a.excerpt || ""; $("f-contenu").value = a.content || "";
    photoDataURL = a.photo || ""; $("apercu-rendu").innerHTML = "";
  }
  majApercuPhoto();
}
function sauverArticle() {
  const titre = $("f-titre").value.trim();
  if (!titre) { alerte("Titre obligatoire."); return; }
  const id = $("f-id").value || slugify(titre);
  const vedette = $("f-vedette").checked;
  if (vedette) ARTICLES.forEach(x => x.featured = false); // une seule une
  const obj = {
    id,
    title: titre,
    author: $("f-auteur").value.trim() || "Rédaction",
    date: $("f-date").value || new Date().toISOString().slice(0, 10),
    category: $("f-cat").value.trim(),
    excerpt: $("f-chapeau").value.trim(),
    content: $("f-contenu").value,
    photo: photoDataURL, // unique photo, déjà N&B
    photoCaption: "",
    status: $("f-statut").value,
    featured: vedette
  };
  const cap = prompt("Légende de la photo (optionnel) :", (ARTICLES.find(x => x.id === id) || {}).photoCaption || "");
  if (cap !== null) obj.photoCaption = cap.trim();
  const i = ARTICLES.findIndex(x => x.id === id);
  if (i >= 0) ARTICLES[i] = obj; else ARTICLES.push(obj);
  save(); rendreListe(); goTab("liste");
  alerte(`Article « ${titre} » enregistré (${obj.status === "published" ? "publié" : "brouillon"}). Photo N&amp;B : ${obj.photo ? "oui" : "non"}.`);
}

/* ---------- Réglages ---------- */
function remplirReglages() {
  $("s-titre").value = CONFIG.siteTitle || "";
  $("s-tagline").value = CONFIG.tagline || "";
  $("s-motto").value = CONFIG.motto || "";
  $("s-founded").value = CONFIG.founded || "";
  $("s-about").value = CONFIG.aboutText || "";
  $("s-showabout").checked = CONFIG.showAboutOnHome !== false;
  $("s-footer").value = CONFIG.footerText || "";
  $("s-pass").value = "";
}
function sauverReglages() {
  CONFIG.siteTitle = $("s-titre").value.trim() || "La Gazette du Matin";
  CONFIG.tagline = $("s-tagline").value.trim();
  CONFIG.motto = $("s-motto").value.trim();
  CONFIG.founded = $("s-founded").value.trim();
  CONFIG.aboutText = $("s-about").value.trim();
  CONFIG.showAboutOnHome = $("s-showabout").checked;
  CONFIG.footerText = $("s-footer").value.trim();
  const np = $("s-pass").value.trim();
  if (np) { localStorage.setItem(LS_PASS, np); $("s-pass").value = ""; alerte("Réglages + mot de passe mis à jour."); }
  else alerte("Réglages enregistrés.");
  save();
}

/* ---------- Export / import ---------- */
function telecharger(nom, texte) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([texte], { type: "application/json" }));
  a.download = nom; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function majEtat() {
  const el = $("etat-stockage");
  if (!el) return;
  const a = (localStorage.getItem(LS_ARTICLES) || "").length;
  const c = (localStorage.getItem(LS_CONFIG) || "").length;
  el.textContent = `Stockage local : ${ARTICLES.length} article(s). Poids approx. navigateur : ${(a + c) / 1024 < 1024 ? ((a + c) / 1024).toFixed(0) + " Ko" : ((a + c) / 1048576).toFixed(2) + " Mo"} (photos incluses en base64). Pensez à exporter après chaque séance.`;
}

/* ---------- Onglets / login ---------- */
function goTab(nom) {
  document.querySelectorAll(".onglets button").forEach(b => b.classList.toggle("actif", b.dataset.tab === nom));
  ["liste", "editer", "reglages", "publier"].forEach(t => $("tab-" + t).style.display = t === nom ? "" : "none");
  if (nom === "publier") majEtat();
}
async function init() {
  $("date-jour").textContent = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  await charger();
  document.querySelectorAll(".onglets button").forEach(b => b.addEventListener("click", () => goTab(b.dataset.tab)));
  const tryLogin = () => {
    const saved = localStorage.getItem(LS_PASS) || DEFAULT_PASS;
    if ($("pass").value === saved) {
      $("gate").style.display = "none"; $("cms").style.display = "";
      rendreListe(); remplirReglages(); majEtat(); ouvrirEdition(null); goTab("liste");
    } else $("login-err").textContent = "Mot de passe incorrect.";
  };
  $("btn-login").addEventListener("click", tryLogin);
  $("pass").addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });

  $("btn-nouveau").addEventListener("click", () => ouvrirEdition(null));
  $("btn-annuler").addEventListener("click", () => goTab("liste"));
  $("btn-sauver").addEventListener("click", sauverArticle);
  $("btn-sauver-reglages").addEventListener("click", sauverReglages);
  $("f-photo").addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { alerte("Photo trop lourde (> 8 Mo)."); return; }
    fichierVersNB(f, url => { photoDataURL = url; majApercuPhoto(); alerte("Photo convertie en noir &amp; blanc ✓"); });
  });
  $("btn-suppr-photo").addEventListener("click", () => { photoDataURL = ""; $("f-photo").value = ""; majApercuPhoto(); });
  $("btn-apercu-art").addEventListener("click", () => {
    $("apercu-rendu").innerHTML = `<div class="article-entete"><span class="cat">${$("f-cat").value || "Rubrique"}</span><h2>${$("f-titre").value || "Sans titre"}</h2><p class="chapeau">${$("f-chapeau").value || ""}</p></div>${photoDataURL ? `<div class="photo-cadre"><figure><div class="img-nb"><img src="${photoDataURL}"></div></figure></div>` : ""}<div class="colonnes">${md($("f-contenu").value || "_Rien à prévisualiser…_")}</div>`;
  });
  $("btn-export-config").addEventListener("click", () => telecharger("config.json", JSON.stringify(CONFIG, null, 2)));
  $("btn-export-articles").addEventListener("click", () => telecharger("articles.json", JSON.stringify(ARTICLES, null, 2)));
  $("btn-import").addEventListener("click", () => $("file-import").click());
  $("file-import").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result);
        if (Array.isArray(j)) { ARTICLES = j; save(); rendreListe(); alerte("articles.json importé."); }
        else if (j.siteTitle) { CONFIG = { ...CONFIG, ...j }; save(); remplirReglages(); alerte("config.json importé."); }
        else alerte("JSON non reconnu.");
      } catch { alerte("Fichier JSON invalide."); }
    };
    r.readAsText(f);
  });
  $("btn-reset").addEventListener("click", () => {
    if (confirm("Effacer les modifications locales et revenir à la démo ?")) {
      localStorage.removeItem(LS_CONFIG); localStorage.removeItem(LS_ARTICLES);
      location.reload();
    }
  });
}
document.addEventListener("DOMContentLoaded", init);
