const astriteEl = document.getElementById("astrite");
const coralEl = document.getElementById("coral");
const tidesEl = document.getElementById("tides");
const tideTypeEl = document.getElementById("tideType");
const disableCoralEl = document.getElementById("disableCoral");

const tideIcon = document.getElementById("tideIcon");

const resultSection = document.getElementById("resultSection");
const pullResult = document.getElementById("pullResult");
const coralResult = document.getElementById("coralResult");

const formulaBtn = document.getElementById("formulaBtn");
const formulaPopup = document.getElementById("formulaPopup");
const closePopup = document.getElementById("closePopup");

let stored = {
    astrite: "",
    coral: "",
    radiant: "",
    forging: "",
    type: "radiant",
    disable: false
};

function updateIcon() {
    tideIcon.src = tideTypeEl.value === "radiant" ?
        "icons/radiant.png" :
        "icons/forging.png";
}

/* switch tides input depending on selected type */
function syncTideInput() {
    const type = tideTypeEl.value;
    tidesEl.value = stored[type] || "";
}

/* save current state */
function save() {
    const type = tideTypeEl.value;

    stored.astrite = astriteEl.value;
    stored.coral = coralEl.value;
    stored[type] = tidesEl.value; // store separately
    stored.type = type;
    stored.disable = disableCoralEl.checked;

    localStorage.setItem("pullCalc", JSON.stringify(stored));
}

/* load state */
function load() {
    const data = JSON.parse(localStorage.getItem("pullCalc"));
    if (!data) return;

    stored = data;

    astriteEl.value = stored.astrite || "";
    coralEl.value = stored.coral || "";
    tideTypeEl.value = stored.type || "radiant";
    disableCoralEl.checked = stored.disable || false;

    syncTideInput();
    updateIcon();
}

/* handle switching tide types */
tideTypeEl.addEventListener("change", () => {
    // save current input before switching
    stored[tideTypeEl.value === "radiant" ? "forging" :
        "radiant"] = tidesEl.value;

    syncTideInput();
    updateIcon();
    save();
});

document.getElementById("calc").onclick = () => {
    const astrite = Number(astriteEl.value);
    const coral = Number(coralEl.value);
    const tides = Number(tidesEl.value);
    const type = tideTypeEl.value;
    const disabled = disableCoralEl.checked;

    if (!astrite && astrite !== 0) return;
    if (!tides && tides !== 0) return;
    if (!disabled && (!coral && coral !== 0)) return;

    let base = (tides + (astrite / 160));
    let value = Math.floor(base);
    let rate = coral + (base * (type === "radiant" ? 1.2 : 0.75));

    if (!disabled) value += rate / 8;

    const finalPulls = Math.floor(value);

    save();
    resultSection.style.display = "block";

    pullResult.innerHTML = `
	  <img src="icons/${type}.png">
	  ${disabled ? finalPulls : `~${finalPulls}`} pulls
	`;

    if (disabled) {
        coralResult.innerHTML = `
      <img src="icons/coral.png">
      ~${rate.toFixed(1)} coral
    `;
    } else {
        coralResult.innerHTML = "";
    }
};

formulaBtn.addEventListener("click", () => {
    formulaPopup.style.display = "flex";
});

closePopup.addEventListener("click", () => {
    formulaPopup.style.display = "none";
});

// optional: click outside to close
window.addEventListener("click", (e) => {
    if (e.target === formulaPopup) {
        formulaPopup.style.display = "none";
    }
});

load();
