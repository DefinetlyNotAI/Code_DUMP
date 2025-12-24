// =====================
// Grade mapping
// =====================
const GRADES = {
  "A*": 97,
  A: 95,
  B: 85,
  C: 75,
  D: 65,
  E: 55,
}

const O_LEVEL_GRADE_OPTIONS = ["A*", "A", "B", "C", "D"]
const A_LEVEL_GRADE_OPTIONS = ["A*", "A", "B", "C", "D", "E"]

let subjectCounter = 0

// =====================
// Init
// =====================
window.addEventListener("DOMContentLoaded", () => {
  for (let i = 0; i < 6; i++) addSubject("olevel")
  for (let i = 0; i < 2; i++) addSubject("alevel")
})

// =====================
// Weight slider
// =====================
function updateWeighting() {
  const slider = document.getElementById("weight-slider")
  const o = Number(slider.value)
  document.getElementById("olevel-weight").textContent = o
  document.getElementById("alevel-weight").textContent = 100 - o
}

// =====================
// Subject adders
// =====================
function addSubject(type) {
  if (type === "aslevel") {
    addASPair()
    return
  }

  const container = document.getElementById(`${type}-container`)
  const id = `subject-${type}-${subjectCounter++}`

  const row = document.createElement("div")
  row.className = "subject-row"
  row.id = id

  const options = type === "olevel" ? O_LEVEL_GRADE_OPTIONS : A_LEVEL_GRADE_OPTIONS

  row.innerHTML = `
    <select>
      <option value="">Select Grade</option>
      ${options.map((g) => `<option value="${g}">${g}</option>`).join("")}
    </select>
    <div class="checkbox-container">
      <input type="checkbox">
      <label>Confirmed</label>
    </div>
    <button class="btn-remove" onclick="removeSubject('${id}')">Remove</button>
  `

  container.appendChild(row)
}

// =====================
// AS pair adder (CSS SAFE)
// =====================
function addASPair() {
  const container = document.getElementById("aslevel-container")
  const pairId = `as-pair-${subjectCounter++}`

  const pairWrapper = document.createElement("div")
  pairWrapper.className = "as-pair"
  pairWrapper.dataset.pair = pairId

  for (let i = 0; i < 2; i++) {
    const row = document.createElement("div")
    row.className = "subject-row"

    row.innerHTML = `
      <select>
        <option value="">Select Grade</option>
        ${A_LEVEL_GRADE_OPTIONS.map((g) => `<option value="${g}">${g}</option>`).join("")}
      </select>
      <div class="checkbox-container">
        <input type="checkbox">
        <label>Confirmed</label>
      </div>
    `
    pairWrapper.appendChild(row)
  }

  const removeBtn = document.createElement("button")
  removeBtn.className = "btn-remove"
  removeBtn.textContent = "Remove AS Pair"
  removeBtn.onclick = () => pairWrapper.remove()

  pairWrapper.appendChild(removeBtn)
  container.appendChild(pairWrapper)
}

// =====================
// Removal
// =====================
function removeSubject(id) {
  document.getElementById(id)?.remove()
}

// =====================
// Collect subjects
// =====================
function getSubjects() {
  const out = { olevel: [], alevel: [], aslevel: [] }

  ;["olevel", "alevel"].forEach((t) => {
    document.querySelectorAll(`#${t}-container .subject-row`).forEach((r) => {
      const grade = r.querySelector("select").value
      const confirmed = r.querySelector("input").checked
      if (grade) out[t].push({ grade, confirmed })
    })
  })

  document.querySelectorAll(".as-pair").forEach((pair) => {
    const rows = pair.querySelectorAll(".subject-row")
    const g1 = rows[0].querySelector("select").value
    const g2 = rows[1].querySelector("select").value
    const c1 = rows[0].querySelector("input").checked
    const c2 = rows[1].querySelector("input").checked

    if (g1 && g2) {
      out.aslevel.push({
        grades: [g1, g2],
        confirmed: c1 && c2,
      })
    }
  })

  return out
}

// =====================
// Predictor
// =====================
function predictMinimumGrades() {
  const subjects = getSubjects()
  const target = Number(document.getElementById("target-percentage").value)
  const oW = Number(document.getElementById("weight-slider").value) / 100
  const aW = 1 - oW

  const confirmedCount =
    subjects.olevel.filter((s) => s.confirmed).length +
    subjects.alevel.filter((s) => s.confirmed).length +
    subjects.aslevel.filter((s) => s.confirmed).length

  const unconfirmedCount =
    subjects.olevel.filter((s) => !s.confirmed).length +
    subjects.alevel.filter((s) => !s.confirmed).length +
    subjects.aslevel.filter((s) => !s.confirmed).length

  if (confirmedCount === 0) {
    showResult("Error: At least one confirmed valid mark is required.", "error")
    return
  }

  if (unconfirmedCount === 0) {
    showResult("Error: At least one unconfirmed slot is required.", "error")
    return
  }

  let confirmedSum = 0
  let confirmedWeight = 0

  subjects.olevel.filter((s) => s.confirmed).forEach((s) => {
    confirmedSum += GRADES[s.grade] * oW
    confirmedWeight += oW
  })

  subjects.alevel.filter((s) => s.confirmed).forEach((s) => {
    confirmedSum += GRADES[s.grade] * aW
    confirmedWeight += aW
  })

  subjects.aslevel.filter((s) => s.confirmed).forEach((s) => {
    confirmedSum += ((GRADES[s.grades[0]] + GRADES[s.grades[1]]) / 2) * aW
    confirmedWeight += aW
  })

  const slots = []

  subjects.olevel.filter((s) => !s.confirmed).forEach(() =>
    slots.push({ weight: oW, values: [65, 75, 85, 95, 97], names: ["D", "C", "B", "A", "A*"] })
  )

  subjects.alevel.filter((s) => !s.confirmed).forEach(() =>
    slots.push({ weight: aW, values: [55, 65, 75, 85, 95, 97], names: ["E", "D", "C", "B", "A", "A*"] })
  )

  subjects.aslevel.filter((s) => !s.confirmed).forEach(() =>
    slots.push({
      weight: aW,
      values: [55, 65, 75, 85, 95, 97],
      names: ["E", "D", "C", "B", "A", "A*"],
      isAS: true,
    })
  )

  const totalWeight = confirmedWeight + slots.reduce((s, x) => s + x.weight, 0)
  const required = target * totalWeight - confirmedSum

  const results = []

  function dfs(i, g, sum) {
    if (i === slots.length) {
      results.push({ grades: [...g], sum })
      return
    }
    slots[i].values.forEach((v, idx) => {
      g[i] = { name: slots[i].names[idx], isAS: slots[i].isAS }
      dfs(i + 1, g, sum + v * slots[i].weight)
    })
  }

  dfs(0, [], 0)

  const exact = results.filter((r) => Math.abs(r.sum - required) < 1e-9)

  let final = exact
  if (final.length === 0) {
    const above = results.filter((r) => r.sum > required)
    if (above.length === 0) {
      showResult("Error: No achievable result meets or exceeds the target.", "error")
      return
    }
    const min = Math.min(...above.map((r) => r.sum))
    final = above.filter((r) => r.sum === min)
  }
  const { oAvg, aAvg } = calculateAverages(subjects)

  let html = `
  <h3>Valid grade combinations (≥ ${target}%)</h3>
  <div class="result-details">
    <strong>Current O Level Average:</strong> ${oAvg.toFixed(2)}<br>
    <strong>Current A Level Average:</strong> ${aAvg.toFixed(2)}
  </div>
`

  final.slice(0, 10).forEach((r, i) => {
    html += `<div><strong>Option ${i + 1}:</strong> ${
      r.grades.map((g) => (g.isAS ? `${g.name},${g.name}` : g.name)).join(" | ")
    }</div>`
  })

  showResult(html, "success")
}

function calculateAverages(subjects) {
  let oSum = 0
  let oCount = 0

  subjects.olevel.forEach((s) => {
    oSum += GRADES[s.grade]
    oCount++
  })

  let aSum = 0
  let aCount = 0

  subjects.alevel.forEach((s) => {
    aSum += GRADES[s.grade]
    aCount++
  })

  subjects.aslevel.forEach((s) => {
    aSum += (GRADES[s.grades[0]] + GRADES[s.grades[1]]) / 2
    aCount++
  })

  return {
    oAvg: oCount ? oSum / oCount : 0,
    aAvg: aCount ? aSum / aCount : 0,
  }
}

function calculateMuadala() {
  const subjects = getSubjects()
  const oW = Number(document.getElementById("weight-slider").value) / 100
  const aW = 1 - oW

  let weightedSum = 0
  let totalWeight = 0

  subjects.olevel.forEach((s) => {
    weightedSum += GRADES[s.grade] * oW
    totalWeight += oW
  })

  subjects.alevel.forEach((s) => {
    weightedSum += GRADES[s.grade] * aW
    totalWeight += aW
  })

  subjects.aslevel.forEach((s) => {
    weightedSum += ((GRADES[s.grades[0]] + GRADES[s.grades[1]]) / 2) * aW
    totalWeight += aW
  })

  const muadala = weightedSum / totalWeight
  const { oAvg, aAvg } = calculateAverages(subjects)

  showResult(
    `
    <h3>Mu'adala Score: ${muadala.toFixed(2)}%</h3>
    <div class="result-details">
      <strong>O Level Average:</strong> ${oAvg.toFixed(2)}<br>
      <strong>A Level Average:</strong> ${aAvg.toFixed(2)}
    </div>
    `,
    "success",
  )
}

// =====================
// Result display
// =====================
function showResult(msg, type) {
  const r = document.getElementById("result")
  r.innerHTML = msg
  r.className = `result show ${type}`
  r.scrollIntoView({ behavior: "smooth", block: "nearest" })
}
