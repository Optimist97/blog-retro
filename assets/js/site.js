/* Site public : charge config + articles (fichiers JSON, surchargés par CMS localStorage) */
const LS_CONFIG = "retro50_config";
const LS_ARTICLES = "retro50_articles";

async function loadData() {
  let config = null, articles = [];
  try {
    const [c, a] = await Promise.all([
      fetch("data/config.json").then(r => r.json()),
      fetch("data/articles.json").then(r => r.json())
    ]);
    config = c; articles = a;
  } catch (e) { console.warn("JSON non chargé", e); }

  try {
    const lc = localStorage.getItem(LS_CONFIG);
    const la = localStorage.getItem(LS_ARTICLES);
    if (lc) config = { ...config, ...JSON.parse(lc) };
    if (la) articles = JSON.parse(la);
  } catch (e) { console.warn("localStorage illisible", e); }

  if (!config) config = { siteTitle: "La Gazette du Matin", tagline: "", motto: "", founded: "", footerText: "" };
  return { config, articles: Array.isArray(articles) ? articles : [] };
}

function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
}
function dateDuJour() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/* Mini-markdown : ##, **gras**, *italique*, > citation, - listes, paragraphes. Échappe le HTML. */
function md(src = "") {
  let t = String(src).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = t.split("\n");
  let html = "", inList = false;
  const inline = s => s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|\W)\*(.+?)\*(?=\W|$)/g, "$1<em>$2</em>");
  for (const line of lines) {
    const l = line.trim();
    if (l.startsWith("## ")) { if (inList) { html += "</ul>"; inList = false; } html += `<h2>${inline(l.slice(3))}</h2>`; }
    else if (l.startsWith("&gt; ") || l.startsWith("> ")) { if (inList) { html += "</ul>"; inList = false; } html += `<blockquote>${inline(l.replace(/^&gt; |^> /, ""))}</blockquote>`; }
    else if (l.startsWith("- ") || l.startsWith("* ")) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${inline(l.slice(2))}</li>`; }
    else if (l === "") { if (inList) { html += "</ul>"; inList = false; } }
    else { if (inList) { html += "</ul>"; inList = false; } html += `<p>${inline(l)}</p>`; }
  }
  if (inList) html += "</ul>";
  return html;
}

function photoHTML(article, cls = "") {
  if (!article.photo) return "";
  const cap = article.photoCaption ? `<figcaption>${article.photoCaption}<span class="mention-nb">— Photo N&amp;B · chambre noire auto</span></figcaption>` : `<figcaption><span class="mention-nb">Photo N&amp;B · chambre noire auto</span></figcaption>`;
  return `<div class="photo-cadre ${cls}"><figure><div class="img-nb"><img src="${article.photo}" alt="" loading="lazy"></div>${cap}</figure></div>`;
}

function applyConfig(config) {
  document.querySelectorAll("[data-config]").forEach(el => {
    const k = el.getAttribute("data-config");
    if (config[k] != null) el.textContent = config[k];
  });
  const t = document.querySelector("title[data-config-title]");
  if (t && config.siteTitle) t.textContent = config.siteTitle + " — " + (config.tagline || "Journal");
  const j = document.getElementById("date-jour");
  if (j) j.textContent = dateDuJour();
}

function publishedOnly(articles) {
  return articles.filter(a => (a.status || "published") === "published");
}

async function renderHome() {
  const { config, articles } = await loadData();
  applyConfig(config);
  const pub = publishedOnly(articles).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const uneZone = document.getElementById("une");
  const grille = document.getElementById("grille");
  const about = document.getElementById("bloc-apropos");
  if (about) {
    if (config.showAboutOnHome === false) about.style.display = "none";
    else { const p = about.querySelector("p"); if (p && config.aboutText) p.textContent = config.aboutText; }
  }
  // catégories nav
  const navCat = document.getElementById("nav-cats");
  if (navCat) {
    const cats = [...new Set(pub.map(a => a.category).filter(Boolean))].slice(0, 6);
    navCat.innerHTML = cats.map(c => `<a href="#" data-cat="${c}">${c}</a>`).join("");
    navCat.querySelectorAll("a").forEach(a => a.addEventListener("click", e => {
      e.preventDefault();
      const c = a.getAttribute("data-cat");
      document.querySelectorAll("#grille .carte").forEach(card => {
        card.style.display = (!c || card.dataset.cat === c) ? "" : "none";
      });
      navCat.querySelectorAll("a").forEach(x => x.classList.remove("actif"));
      a.classList.add("actif");
    }));
  }
  if (!pub.length) {
    if (uneZone) uneZone.innerHTML = `<div class="vide">Aucun article publié pour l'instant. Rendez-vous dans l'administration.</div>`;
    if (grille) grille.innerHTML = "";
    return;
  }
  const une = pub.find(a => a.featured) || pub[0];
  const reste = pub.filter(a => a !== une).slice(0, config.itemsPerPage || 9);
  if (uneZone) {
    uneZone.innerHTML = `
      <div class="une-label">À la une</div>
      <article class="une">
        <div>${photoHTML(une) || `<div class="vide">Sans photo — une seule image suffit.</div>`}</div>
        <div>
          ${une.category ? `<span class="cat">${une.category}</span>` : ""}
          <h2><a href="article.html?id=${encodeURIComponent(une.id)}">${une.title}</a></h2>
          <p class="chapeau">${une.excerpt || ""}</p>
          <div class="meta">Par ${une.author || "Rédaction"} · ${fmtDate(une.date)}</div>
          <a class="btn plein" href="article.html?id=${encodeURIComponent(une.id)}">Lire l'article</a>
        </div>
      </article>`;
  }
  if (grille) {
    grille.innerHTML = reste.map(a => `
      <article class="carte" data-cat="${a.category || ""}">
        ${photoHTML(a)}
        <div class="carte-corps">
          ${a.category ? `<span class="cat">${a.category}</span>` : ""}
          <h3><a href="article.html?id=${encodeURIComponent(a.id)}">${a.title}</a></h3>
          <p>${a.excerpt || ""}</p>
          <div class="meta">Par ${a.author || "Rédaction"} · ${fmtDate(a.date)}</div>
        </div>
      </article>`).join("") || `<div class="vide">Un seul article à la une. Ajoutez-en d'autres depuis le CMS.</div>`;
  }
  const foot = document.querySelector("[data-config='footerText']");
  void foot;
}

async function renderArticle() {
  const { config, articles } = await loadData();
  applyConfig(config);
  const id = new URLSearchParams(location.search).get("id");
  const box = document.getElementById("article-box");
  const a = articles.find(x => String(x.id) === String(id)) || publishedOnly(articles)[0];
  if (!a) { if (box) box.innerHTML = `<div class="vide">Article introuvable.</div>`; return; }
  document.title = a.title + " — " + config.siteTitle;
  if (box) {
    box.innerHTML = `
      <div class="article-entete">
        ${a.category ? `<span class="cat">${a.category}</span>` : ""}
        <h2>${a.title}</h2>
        <p class="chapeau">${a.excerpt || ""}</p>
        <div class="meta">Par ${a.author || "Rédaction"} · ${fmtDate(a.date)}</div>
      </div>
      <div class="article-photo">${photoHTML(a)}</div>
      <div class="colonnes">${md(a.content || "")}</div>
      <div class="filet-fin">❦ ❦ ❦</div>
      <div style="text-align:center" class="no-print">
        <a class="btn" href="index.html">← Retour à la une</a>
        <button class="btn" onclick="window.print()">Imprimer la page</button>
      </div>`;
  }
}
