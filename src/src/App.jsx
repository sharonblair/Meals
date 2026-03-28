import { useState, useEffect } from “react”;

const STORAGE_KEY = “meal-rotation-data”;

const DEFAULT_MEALS = [
{
id: “1”,
name: “Kip Tandoori”,
tags: [“kip”, “oven”],
prepTime: “25 min”,
ingredients: [“500g kipfilet”, “150g Griekse yoghurt”, “2 tl tandoorikruiden”, “1 tl kurkuma”, “2 knoflookteentjes”, “1 citroen”, “naanbrood of rijst”, “komkommer”, “munt”],
recipe: “Marineer kip 30 min in yoghurt + kruiden. Grill of bak op hoog vuur 6-7 min per kant. Serveer met naanbrood en komkommersalade.”,
groceryNote: “Controleer: yoghurt, tandoorikruiden”
},
{
id: “2”,
name: “Pasta Alfredo met Kip & Broccoli”,
tags: [“pasta”, “kip”],
prepTime: “25 min”,
ingredients: [“400g tagliatelle”, “300g kipfilet”, “300g broccoli”, “200ml slagroom”, “50g Parmezaan”, “2 knoflookteentjes”, “boter”, “zout, peper, nootmuskaat”],
recipe: “Kook pasta al dente. Bak kip + knoflook in boter. Blancheer broccoli. Maak saus van room + Parmezaan op laag vuur. Meng alles door elkaar.”,
groceryNote: “Verse Parmezaan loont hier”
},
{
id: “3”,
name: “Poke Bowl Zalm”,
tags: [“vis”, “gezond”, “no-cook”],
prepTime: “20 min”,
ingredients: [“300g zalmfilet (vers of gerookt)”, “200g sushirijst”, “1 avocado”, “100g edamame”, “1 komkommer”, “3 el sojasaus”, “1 tl sesamolie”, “sesam”, “ingelegde gember”],
recipe: “Kook rijst. Snijd zalm in blokjes, marineer 10 min in soja + sesamolie. Leg alles in een bowl op rijst. Garneer met sesam.”,
groceryNote: “Edamame diepvries is prima”
}
];

const CARD_COLORS = [”#FFE5D0”,”#D4F0E0”,”#D0E8FF”,”#F5D0FF”,”#FFF3CC”,”#FFD6D6”,”#D0FFF5”,”#EDD0FF”,”#E0F5D0”,”#FFE0D0”];
const getColor = (id) => CARD_COLORS[parseInt(id || “0”) % CARD_COLORS.length];

const parseFromNotes = (text) => {
const lines = text.split(”\n”).map(l => l.trim()).filter(Boolean);
const meal = { id: Date.now().toString(), name: “”, tags: [], prepTime: “”, ingredients: [], recipe: “”, groceryNote: “” };
let currentSection = null;
const recipeLines = [];
lines.forEach((line, i) => {
const lower = line.toLowerCase();
if (i === 0 && !lower.startsWith(“naam:”) && !lower.startsWith(“recept:”)) { meal.name = line; return; }
if (lower.startsWith(“naam:”)) { meal.name = line.replace(/^naam:\s*/i, “”); return; }
if (lower.startsWith(“bereidingstijd:”) || lower.startsWith(“tijd:”)) { meal.prepTime = line.replace(/^(bereidingstijd|tijd):\s*/i, “”); return; }
if (lower.startsWith(“tags:”)) { meal.tags = line.replace(/^tags:\s*/i, “”).split(”,”).map(t => t.trim()); return; }
if (lower.startsWith(“ingrediënten:”) || lower.startsWith(“ingredienten:”)) { currentSection = “ingredients”; return; }
if (lower.startsWith(“bereiding:”) || lower.startsWith(“recept:”)) { currentSection = “recipe”; return; }
if (lower.startsWith(“notitie:”) || lower.startsWith(“tip:”)) { meal.groceryNote = line.replace(/^(notitie|tip):\s*/i, “”); currentSection = null; return; }
if (currentSection === “ingredients”) meal.ingredients.push(line.replace(/^[-•*]\s*/, “”));
else if (currentSection === “recipe”) recipeLines.push(line);
});
meal.recipe = recipeLines.join(” “);
if (!meal.name) meal.name = “Nieuw gerecht”;
return meal;
};

export default function MealRotationApp() {
const [meals, setMeals] = useState([]);
const [view, setView] = useState(“home”);
const [selected, setSelected] = useState(null);
const [editing, setEditing] = useState(null);
const [parseMode, setParseMode] = useState(“paste”);
const [toast, setToast] = useState(””);
const [rolling, setRolling] = useState(false);
const [rolledMeal, setRolledMeal] = useState(null);
const [search, setSearch] = useState(””);
const [confirmDelete, setConfirmDelete] = useState(null);

useEffect(() => {
try {
const stored = localStorage.getItem(STORAGE_KEY);
setMeals(stored ? JSON.parse(stored) : DEFAULT_MEALS);
} catch { setMeals(DEFAULT_MEALS); }
}, []);

const save = (updated) => {
setMeals(updated);
try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
};

const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(””), 2500); };

const rollMeal = () => {
if (meals.length === 0) return;
setRolling(true);
let count = 0;
const interval = setInterval(() => {
setRolledMeal(meals[Math.floor(Math.random() * meals.length)]);
count++;
if (count > 14) {
clearInterval(interval);
setRolledMeal(meals[Math.floor(Math.random() * meals.length)]);
setRolling(false);
}
}, 75);
};

const handleDelete = (id) => {
save(meals.filter(m => m.id !== id));
setConfirmDelete(null);
setView(“home”);
showToast(“Verwijderd”);
};

const startEdit = (meal) => { setEditing({ …meal, ingredients: […meal.ingredients] }); setParseMode(“manual”); setView(“add”); };
const startNew = () => { setEditing({ id: Date.now().toString(), name: “”, tags: [], prepTime: “”, ingredients: [], recipe: “”, groceryNote: “” }); setParseMode(“paste”); setView(“add”); };

const filtered = meals.filter(m =>
m.name.toLowerCase().includes(search.toLowerCase()) ||
m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
);

const css = `
@import url(‘https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap’);
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #FFF8F2; }
.app { font-family: ‘Nunito’, sans-serif; min-height: 100vh; background: #FFF8F2; color: #2D2A26; }

```
.topbar { background: #FF7043; padding: 16px 20px 20px; border-radius: 0 0 24px 24px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
.topbar-title { font-size: 22px; font-weight: 900; color: white; }
.topbar-sub { font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; margin-top: 1px; }
.topbar-badge { background: rgba(255,255,255,0.22); color: white; font-size: 13px; font-weight: 800; padding: 5px 12px; border-radius: 20px; }
.topbar-back { background: rgba(255,255,255,0.2); border: none; color: white; font-size: 20px; font-weight: 900; padding: 6px 11px; border-radius: 14px; cursor: pointer; font-family: 'Nunito', sans-serif; }
.topbar-close { background: rgba(255,255,255,0.2); border: none; color: white; font-size: 18px; font-weight: 900; padding: 6px 10px; border-radius: 14px; cursor: pointer; }

.main { padding: 16px; max-width: 480px; margin: 0 auto; padding-bottom: 90px; }

/* Kies-blok */
.kies-block { background: white; border-radius: 26px; border: 3px solid #FFD0B8; padding: 22px 20px 20px; margin-bottom: 16px; text-align: center; position: relative; overflow: hidden; }
.kies-deco1 { position: absolute; top: -18px; right: -18px; width: 70px; height: 70px; background: #FFE8DC; border-radius: 50%; pointer-events: none; }
.kies-deco2 { position: absolute; bottom: -12px; left: -12px; width: 50px; height: 50px; background: #FFF3EE; border-radius: 50%; pointer-events: none; }
.kies-eyebrow { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #FF7043; margin-bottom: 10px; position: relative; z-index: 1; }
.kies-result { font-size: 23px; font-weight: 900; min-height: 34px; margin-bottom: 18px; color: #2D2A26; line-height: 1.25; position: relative; z-index: 1; transition: opacity 0.06s; }
.kies-result.spinning { opacity: 0.35; }
.kies-result.placeholder { color: #D0C8C0; font-size: 16px; font-weight: 700; }
.kies-row { display: flex; gap: 10px; justify-content: center; position: relative; z-index: 1; }
.kies-main-btn { background: #FF7043; color: white; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 15px; padding: 12px 26px; border-radius: 20px; border: none; cursor: pointer; box-shadow: 0 4px 0 #C84F28; transition: all 0.12s; }
.kies-main-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #C84F28; }
.kies-main-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 #C84F28; }
.kies-main-btn.busy { opacity: 0.5; pointer-events: none; }
.kies-sub-btn { background: #FFF0E8; color: #FF7043; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 14px; padding: 11px 18px; border-radius: 18px; border: 2.5px solid #FFD0B8; cursor: pointer; transition: all 0.12s; }
.kies-sub-btn:hover { background: #FFE4D8; }

/* Search */
.search-wrap { display: flex; align-items: center; gap: 8px; background: white; border: 2.5px solid #EDE5DC; border-radius: 18px; padding: 0 14px; margin-bottom: 14px; transition: border-color 0.15s; }
.search-wrap:focus-within { border-color: #FF7043; }
.search-wrap input { flex: 1; border: none; outline: none; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 600; padding: 11px 0; background: transparent; color: #2D2A26; }
.search-wrap input::placeholder { color: #C8BFB5; }
.search-clear { background: none; border: none; cursor: pointer; color: #C8BFB5; font-size: 20px; font-weight: 900; line-height: 1; }

.section-lbl { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #B8AFA5; margin-bottom: 10px; }

/* Meal cards */
.meal-card { border-radius: 22px; padding: 16px 18px; margin-bottom: 10px; cursor: pointer; border: 2.5px solid transparent; display: flex; align-items: center; justify-content: space-between; transition: all 0.15s; }
.meal-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.09); border-color: #FF7043; }
.meal-card:active { transform: translateY(0); }
.meal-name { font-size: 16px; font-weight: 800; margin-bottom: 5px; }
.meal-meta { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.chip { display: inline-block; background: rgba(255,255,255,0.65); color: #6A5A4A; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 12px; border: 1.5px solid rgba(0,0,0,0.07); }
.time-tag { font-size: 11px; font-weight: 700; color: #8A7A6A; }
.card-arrow { font-size: 22px; color: rgba(0,0,0,0.18); font-weight: 900; }

/* Detail */
.detail-hero-box { padding: 16px 16px 0; }
.detail-hero-inner { border-radius: 24px; padding: 22px; }
.detail-name { font-size: 26px; font-weight: 900; line-height: 1.2; margin-bottom: 8px; }
.detail-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.detail-chip { background: rgba(255,255,255,0.6); border: 2px solid rgba(0,0,0,0.07); color: #5A4A3A; font-size: 12px; font-weight: 700; padding: 4px 11px; border-radius: 12px; }
.detail-body { padding: 14px 16px 8px; }
.block { background: white; border-radius: 20px; border: 2.5px solid #F0E8DF; padding: 16px 18px; margin-bottom: 14px; }
.block-title { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #FF7043; margin-bottom: 12px; }
.ing-item { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; font-weight: 600; padding: 6px 0; border-bottom: 1.5px solid #F8F4F0; }
.ing-item:last-child { border-bottom: none; }
.ing-dot { color: #FF7043; font-size: 18px; line-height: 1.3; }
.recipe-txt { font-size: 14px; font-weight: 600; line-height: 1.85; color: #4A3A2A; }
.note-txt { font-size: 13px; font-weight: 600; color: #9A8A7A; margin-top: 10px; font-style: italic; }
.detail-actions { display: flex; gap: 10px; padding: 0 16px 28px; }

/* Buttons */
.btn { cursor: pointer; border: none; font-family: 'Nunito', sans-serif; font-weight: 800; border-radius: 16px; transition: all 0.15s; }
.btn-outline { background: white; color: #2D2A26; padding: 11px 18px; font-size: 14px; border: 2.5px solid #E8E0D8; }
.btn-outline:hover { background: #FFF0E8; border-color: #FF7043; color: #FF7043; }
.btn-danger { background: #FFE8E8; color: #CC2222; padding: 11px 18px; font-size: 14px; border: 2px solid #FFBEBE; border-radius: 16px; }
.btn-danger:hover { background: #FFCECE; }
.btn-save { background: #FF7043; color: white; padding: 13px 20px; font-size: 15px; width: 100%; border-radius: 18px; box-shadow: 0 3px 0 #C84F28; }
.btn-save:hover { transform: translateY(-1px); box-shadow: 0 5px 0 #C84F28; }
.btn-inlezen { background: #FF7043; color: white; padding: 12px; font-size: 14px; width: 100%; border-radius: 16px; box-shadow: 0 3px 0 #C84F28; }

/* FAB */
.fab { position: fixed; bottom: 24px; right: 20px; background: #FF7043; color: white; width: 56px; height: 56px; border-radius: 50%; font-size: 28px; font-weight: 900; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; box-shadow: 0 4px 0 #C84F28, 0 8px 20px rgba(255,112,67,0.35); transition: all 0.15s; line-height: 1; }
.fab:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #C84F28, 0 12px 28px rgba(255,112,67,0.4); }

/* Form */
.form-main { padding: 16px; max-width: 480px; margin: 0 auto; padding-bottom: 80px; }
.tab-row { display: flex; background: white; border-radius: 18px; border: 2.5px solid #EDE5DC; padding: 4px; margin-bottom: 16px; gap: 4px; }
.tab { flex: 1; text-align: center; padding: 10px; font-size: 13px; font-weight: 800; cursor: pointer; color: #B8AFA5; border-radius: 14px; transition: all 0.14s; }
.tab.active { background: #FF7043; color: white; }
.paste-area { background: #FFF8F4; border: 2.5px dashed #FFD0B8; border-radius: 20px; padding: 16px; margin-bottom: 14px; }
.paste-hint { font-size: 12px; font-weight: 600; color: #B8AFA5; margin-top: 10px; line-height: 1.6; }
.fg { margin-bottom: 14px; }
.fl { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #B8AFA5; margin-bottom: 6px; display: block; }
.fi { width: 100%; border: 2.5px solid #E8E0D8; border-radius: 14px; padding: 11px 14px; font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 600; outline: none; transition: border-color 0.15s; background: white; color: #2D2A26; }
.fi:focus { border-color: #FF7043; }
.fi-ta { min-height: 90px; resize: vertical; }
.ing-ed .ir { display: flex; gap: 6px; margin-bottom: 7px; }
.ing-rm { background: #FFE8E8; color: #CC2222; border: 2px solid #FFBEBE; border-radius: 11px; width: 36px; font-size: 18px; font-weight: 900; cursor: pointer; font-family: 'Nunito', sans-serif; }

/* Empty */
.empty { text-align: center; padding: 36px 20px; }
.empty-e { font-size: 42px; margin-bottom: 10px; }
.empty-t { font-size: 16px; font-weight: 800; color: #B8AFA5; }
.empty-s { font-size: 13px; font-weight: 600; color: #C8BFB5; margin-top: 4px; }

/* Toast */
.toast { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: #2D2A26; color: white; padding: 11px 22px; border-radius: 22px; font-size: 14px; font-weight: 700; z-index: 100; white-space: nowrap; box-shadow: 0 4px 20px rgba(0,0,0,0.2); animation: fup 0.2s ease; }
@keyframes fup { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

/* Modal */
.mo { position: fixed; inset: 0; background: rgba(45,42,38,0.5); z-index: 50; display: flex; align-items: flex-end; justify-content: center; }
.mo-box { background: white; border-radius: 26px 26px 0 0; padding: 24px 20px 32px; width: 100%; max-width: 480px; }
.mo-title { font-size: 20px; font-weight: 900; margin-bottom: 6px; }
.mo-body { font-size: 14px; font-weight: 600; color: #8A7A6A; }
.mo-actions { display: flex; gap: 10px; margin-top: 20px; }

::-webkit-scrollbar { display: none; }
```

`;

const DetailView = ({ meal }) => {
const col = getColor(meal.id);
return (
<div>
<div className="topbar">
<button className=“topbar-back” onClick={() => setView(“home”)}>←</button>
<div style={{ color: “white”, fontWeight: 900, fontSize: 16, flex: 1, marginLeft: 12 }}>{meal.name}</div>
</div>
<div className="detail-hero-box">
<div className=“detail-hero-inner” style={{ background: col }}>
<div className="detail-name">{meal.name}</div>
<div className="detail-chips">
{meal.prepTime && <span className="detail-chip">⏱ {meal.prepTime}</span>}
{meal.tags.map(t => <span key={t} className="detail-chip">{t}</span>)}
</div>
</div>
</div>
<div className="detail-body">
{meal.ingredients.length > 0 && (
<div className="block">
<div className="block-title">🛒 Boodschappenlijst</div>
{meal.ingredients.map((ing, i) => (
<div key={i} className="ing-item"><span className="ing-dot">·</span><span>{ing}</span></div>
))}
{meal.groceryNote && <div className="note-txt">💡 {meal.groceryNote}</div>}
</div>
)}
{meal.recipe && (
<div className="block">
<div className="block-title">👩‍🍳 Bereiding</div>
<div className="recipe-txt">{meal.recipe}</div>
</div>
)}
</div>
<div className="detail-actions">
<button className=“btn btn-outline” style={{ flex: 1 }} onClick={() => startEdit(meal)}>Bewerken</button>
<button className=“btn btn-danger” style={{ flex: 1 }} onClick={() => setConfirmDelete(meal.id)}>Verwijderen</button>
</div>
</div>
);
};

const AddView = () => {
const [local, setLocal] = useState(editing || { id: Date.now().toString(), name: “”, tags: [], prepTime: “”, ingredients: [], recipe: “”, groceryNote: “” });
const [tagsStr, setTagsStr] = useState((editing?.tags || []).join(”, “));
const [newIng, setNewIng] = useState(””);
const [localPaste, setLocalPaste] = useState(””);
const [mode, setMode] = useState(parseMode);

```
const doParse = () => {
  if (!localPaste.trim()) return;
  const parsed = parseFromNotes(localPaste);
  setLocal({ ...parsed, id: editing?.id || parsed.id });
  setTagsStr(parsed.tags.join(", "));
  setMode("manual");
  showToast("Ingelezen — check de velden");
};

const addIng = () => { if (!newIng.trim()) return; setLocal({ ...local, ingredients: [...local.ingredients, newIng.trim()] }); setNewIng(""); };
const removeIng = (i) => setLocal({ ...local, ingredients: local.ingredients.filter((_, idx) => idx !== i) });

const doSave = () => {
  const final = { ...local, tags: tagsStr.split(",").map(t => t.trim()).filter(Boolean) };
  if (!final.name.trim()) { showToast("Naam is verplicht"); return; }
  const exists = meals.find(m => m.id === final.id);
  save(exists ? meals.map(m => m.id === final.id ? final : m) : [...meals, final]);
  showToast(exists ? "Opgeslagen ✓" : "Toegevoegd! 🎉");
  setEditing(null);
  setView("home");
};

const isEditing = editing && meals.find(m => m.id === editing.id);

return (
  <div>
    <div className="topbar">
      <div style={{ color: "white", fontWeight: 900, fontSize: 20 }}>{isEditing ? "Bewerken" : "Nieuw gerecht"}</div>
      <button className="topbar-close" onClick={() => { setView("home"); setEditing(null); }}>✕</button>
    </div>
    <div className="form-main">
      <div className="tab-row">
        <div className={`tab ${mode === "paste" ? "active" : ""}`} onClick={() => setMode("paste")}>📋 Plakken</div>
        <div className={`tab ${mode === "manual" ? "active" : ""}`} onClick={() => setMode("manual")}>✏️ Handmatig</div>
      </div>

      {mode === "paste" && (
        <div>
          <div className="paste-area">
            <label className="fl">Plak je recept hier</label>
            <textarea className="fi fi-ta" style={{ background: "transparent", border: "none", padding: 0, minHeight: 160 }}
              placeholder={"Kip Tandoori\nBereidingstijd: 25 min\nTags: kip, oven\n\nIngrediënten:\n- 500g kipfilet\n\nBereiding:\nMarineer de kip..."}
              value={localPaste} onChange={e => setLocalPaste(e.target.value)} />
            <div className="paste-hint">Naam bovenaan, dan optioneel "Bereidingstijd:", "Tags:", "Ingrediënten:" en "Bereiding:".</div>
          </div>
          <button className="btn btn-inlezen" onClick={doParse} disabled={!localPaste.trim()}>Inlezen →</button>
        </div>
      )}

      {mode === "manual" && (
        <div>
          <div className="fg">
            <label className="fl">Naam *</label>
            <input className="fi" value={local.name} onChange={e => setLocal({ ...local, name: e.target.value })} placeholder="Bijv. Kip Tandoori" />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="fg" style={{ flex: 1 }}>
              <label className="fl">Tijd</label>
              <input className="fi" value={local.prepTime} onChange={e => setLocal({ ...local, prepTime: e.target.value })} placeholder="25 min" />
            </div>
            <div className="fg" style={{ flex: 2 }}>
              <label className="fl">Tags</label>
              <input className="fi" value={tagsStr} onChange={e => setTagsStr(e.target.value)} placeholder="kip, pasta, snel" />
            </div>
          </div>
          <div className="fg">
            <label className="fl">Ingrediënten</label>
            <div className="ing-ed">
              {local.ingredients.map((ing, i) => (
                <div key={i} className="ir">
                  <input className="fi" style={{ flex: 1 }} value={ing} onChange={e => { const u = [...local.ingredients]; u[i] = e.target.value; setLocal({ ...local, ingredients: u }); }} />
                  <button className="ing-rm" onClick={() => removeIng(i)}>×</button>
                </div>
              ))}
              <div className="ir">
                <input className="fi" style={{ flex: 1 }} value={newIng} onChange={e => setNewIng(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addIng()} placeholder="+ toevoegen (Enter)" />
                <button className="btn" style={{ background: "#FF7043", color: "white", padding: "10px 14px", borderRadius: 12, fontWeight: 900 }} onClick={addIng}>+</button>
              </div>
            </div>
          </div>
          <div className="fg">
            <label className="fl">Bereiding</label>
            <textarea className="fi fi-ta" value={local.recipe} onChange={e => setLocal({ ...local, recipe: e.target.value })} placeholder="Beschrijf de bereiding..." />
          </div>
          <div className="fg">
            <label className="fl">Tip</label>
            <input className="fi" value={local.groceryNote} onChange={e => setLocal({ ...local, groceryNote: e.target.value })} placeholder="Bijv. verse Parmezaan loont hier" />
          </div>
          <button className="btn btn-save" onClick={doSave}>Opslaan in rotatie</button>
        </div>
      )}
    </div>
  </div>
);
```

};

const HomeView = () => (
<div>
<div className="topbar">
<div>
<div className="topbar-title">🍽 Maaltijdrotatie</div>
<div className="topbar-sub">Alfred · Keuken</div>
</div>
<span className="topbar-badge">{meals.length} gerechten</span>
</div>
<div className="main">
<div className="kies-block">
<div className="kies-deco1" /><div className="kies-deco2" />
<div className="kies-eyebrow">Geen inspiratie?</div>
<div className={`kies-result ${rolling ? "spinning" : ""} ${!rolledMeal ? "placeholder" : ""}`}>
{rolledMeal ? rolledMeal.name : “Druk op kies maaltijd ↓”}
</div>
<div className="kies-row">
<button className={`kies-main-btn ${rolling ? "busy" : ""}`} onClick={rollMeal}>
{rolling ? “🎲 …” : “🎲 Kies maaltijd”}
</button>
{rolledMeal && !rolling && (
<button className=“kies-sub-btn” onClick={() => { setSelected(rolledMeal); setView(“detail”); }}>Recept →</button>
)}
</div>
</div>

```
    <div className="search-wrap">
      <span style={{ color: "#C8BFB5", fontSize: 16 }}>🔍</span>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Zoek op naam of tag..." />
      {search && <button className="search-clear" onClick={() => setSearch("")}>×</button>}
    </div>

    {filtered.length === 0 ? (
      <div className="empty">
        <div className="empty-e">🍽</div>
        <div className="empty-t">Geen gerechten gevonden</div>
        <div className="empty-s">Tap + om je eerste recept toe te voegen</div>
      </div>
    ) : (
      <>
        <div className="section-lbl">{filtered.length} gerecht{filtered.length !== 1 ? "en" : ""}</div>
        {filtered.map(meal => (
          <div key={meal.id} className="meal-card" style={{ background: getColor(meal.id) }}
            onClick={() => { setSelected(meal); setView("detail"); }}>
            <div>
              <div className="meal-name">{meal.name}</div>
              <div className="meal-meta">
                {meal.prepTime && <span className="time-tag">⏱ {meal.prepTime} &nbsp;</span>}
                {meal.tags.map(t => <span key={t} className="chip">{t}</span>)}
              </div>
            </div>
            <span className="card-arrow">›</span>
          </div>
        ))}
      </>
    )}
  </div>
  <button className="fab" onClick={startNew}>+</button>
</div>
```

);

return (
<>
<style>{css}</style>
<div className="app">
{view === “home” && <HomeView />}
{view === “detail” && selected && <DetailView meal={selected} />}
{view === “add” && <AddView />}
{toast && <div className="toast">{toast}</div>}
{confirmDelete && (
<div className=“mo” onClick={() => setConfirmDelete(null)}>
<div className=“mo-box” onClick={e => e.stopPropagation()}>
<div className="mo-title">Gerecht verwijderen?</div>
<div className="mo-body">Dit kan niet ongedaan worden gemaakt.</div>
<div className="mo-actions">
<button className=“btn btn-outline” style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Annuleren</button>
<button className=“btn btn-danger” style={{ flex: 1 }} onClick={() => handleDelete(confirmDelete)}>Verwijderen</button>
</div>
</div>
</div>
)}
</div>
</>
);
}
