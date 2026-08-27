const state = {
  heroSides: 6,
  averageSides: 6,
  dice: [4, 6],
  target: 10,
  mode: "any",
};

const byId = (id) => document.getElementById(id);
let oddsChart;

function rollExplodingDie(sides) {
  const rolls = [];
  let roll;

  do {
    roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
  } while (roll === sides && rolls.length < 100);

  return { rolls, total: rolls.reduce((sum, value) => sum + value, 0) };
}

function singleDieSuccess(sides, target) {
  if (target <= 1) return 1;
  const explosionsNeeded = Math.floor((target - 1) / sides);
  const finalRemainder = (target - 1) % sides;
  return Math.pow(1 / sides, explosionsNeeded) * (1 - finalRemainder / sides);
}

function anyDieSuccess(dice, target) {
  return 1 - dice.reduce((allFail, sides) => allFail * (1 - singleDieSuccess(sides, target)), 1);
}

function dieProbabilitiesBelow(sides, target) {
  const probabilities = new Float64Array(target);

  for (let outcome = 1; outcome < target; outcome += 1) {
    const remainder = outcome % sides;
    if (remainder === 0) continue;

    const explosionCount = Math.floor(outcome / sides);
    probabilities[outcome] = Math.pow(1 / sides, explosionCount + 1);
  }

  return probabilities;
}

function summedDiceSuccess(dice, target) {
  if (target <= dice.length) return 1;

  let totals = new Float64Array(target);
  totals[0] = 1;

  for (const sides of dice) {
    const die = dieProbabilitiesBelow(sides, target);
    const nextTotals = new Float64Array(target);

    for (let previous = 0; previous < target; previous += 1) {
      if (totals[previous] === 0) continue;
      for (let outcome = 1; previous + outcome < target; outcome += 1) {
        if (die[outcome] !== 0) {
          nextTotals[previous + outcome] += totals[previous] * die[outcome];
        }
      }
    }

    totals = nextTotals;
  }

  const failureProbability = totals.reduce((sum, probability) => sum + probability, 0);
  return Math.max(0, Math.min(1, 1 - failureProbability));
}

function explodingAverage(sides) {
  return (sides * (sides + 1)) / (2 * (sides - 1));
}

function formatPercent(probability) {
  const percent = probability * 100;
  if (percent === 0 || percent === 100) return `${percent.toFixed(0)}%`;
  if (percent < 0.01) return `${percent.toPrecision(2)}%`;
  if (percent < 1) return `${percent.toFixed(2)}%`;
  return `${percent.toFixed(1)}%`;
}

function renderOddsChart() {
  if (typeof Chart === "undefined") return;

  const maxTarget = Math.max(24, Math.min(60, state.target + 6));
  const labels = Array.from({ length: maxTarget }, (_, index) => index + 1);
  const probabilities = labels.map((target) => {
    const value = state.mode === "any"
      ? anyDieSuccess(state.dice, target)
      : summedDiceSuccess(state.dice, target);
    return value * 100;
  });

  byId("chart-caption").textContent = state.mode === "any"
    ? "Any die meets the target"
    : "Added total meets the target";

  const pointRadius = labels.map((target) => target === state.target ? 5 : 0);
  const pointBorderWidth = labels.map((target) => target === state.target ? 3 : 0);
  const data = {
    labels,
    datasets: [{
      label: "Success chance",
      data: probabilities,
      borderColor: "#ff624a",
      backgroundColor: "rgba(255, 98, 74, 0.14)",
      borderWidth: 3,
      fill: true,
      tension: 0.16,
      pointRadius,
      pointHoverRadius: 5,
      pointBackgroundColor: "#ffd541",
      pointBorderColor: "#16182f",
      pointBorderWidth,
    }],
  };

  if (oddsChart) {
    oddsChart.data = data;
    oddsChart.update("none");
    return;
  }

  oddsChart = new Chart(byId("odds-chart"), {
    type: "line",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      animation: { duration: 240 },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            title: (items) => `Target ${items[0].label}`,
            label: (item) => `${item.formattedValue}% chance of success`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Target number", color: "rgba(22, 24, 47, 0.55)", font: { weight: 700 } },
          grid: { display: false },
          ticks: { color: "rgba(22, 24, 47, 0.52)", maxTicksLimit: 10 },
          border: { color: "rgba(22, 24, 47, 0.18)" },
        },
        y: {
          min: 0,
          max: 100,
          ticks: { color: "rgba(22, 24, 47, 0.52)", callback: (value) => `${value}%`, maxTicksLimit: 5 },
          grid: { color: "rgba(22, 24, 47, 0.09)" },
          border: { display: false },
        },
      },
    },
  });
}

function renderHeroRoll(result) {
  const face = result.rolls[result.rolls.length - 1];
  const die = byId("hero-die");
  byId("hero-face-value").textContent = face;
  byId("hero-total").textContent = result.total;
  byId("hero-chain").innerHTML = result.rolls
    .map((value, index) => {
      const exploded = value === state.heroSides ? " class=\"exploded\"" : "";
      const plus = index < result.rolls.length - 1 ? "<b>+</b>" : "";
      return `<span${exploded}>${value}</span>${plus}`;
    })
    .join("");
  byId("hero-burst").classList.toggle("is-visible", result.rolls.some((value) => value === state.heroSides));
  die.classList.remove("is-rolling");
  void die.offsetWidth;
  die.classList.add("is-rolling");
}

function setSelectedButton(container, matchingAttribute, value) {
  container.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset[matchingAttribute] === String(value));
  });
}

byId("hero-die-picker").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-sides]");
  if (!button) return;
  state.heroSides = Number(button.dataset.sides);
  setSelectedButton(byId("hero-die-picker"), "sides", state.heroSides);
  byId("hero-roll").textContent = `Roll the d${state.heroSides}`;
  renderHeroRoll(rollExplodingDie(state.heroSides));
});

byId("hero-roll").addEventListener("click", () => renderHeroRoll(rollExplodingDie(state.heroSides)));

function renderAverage() {
  const sides = state.averageSides;
  const normal = (sides + 1) / 2;
  const exploding = explodingAverage(sides);
  const scale = sides * 0.72;

  byId("average-die-label").textContent = `d${sides}`;
  byId("average-value").textContent = exploding.toFixed(2);
  byId("normal-average").textContent = normal.toFixed(2);
  byId("exploding-average").textContent = exploding.toFixed(2);
  byId("normal-bar").style.width = `${Math.min(100, (normal / scale) * 100)}%`;
  byId("exploding-bar").style.width = `${Math.min(100, (exploding / scale) * 100)}%`;
  setSelectedButton(byId("average-picker"), "sides", sides);
}

byId("average-picker").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-sides]");
  if (!button) return;
  state.averageSides = Number(button.dataset.sides);
  renderAverage();
});

function renderDicePool() {
  byId("dice-pool").innerHTML = state.dice
    .map((sides, index) => `<button class="pool-die" type="button" data-remove-index="${index}" aria-label="Remove d${sides}">d${sides}</button>`)
    .join("");
  byId("dice-count").textContent = `${state.dice.length} ${state.dice.length === 1 ? "die" : "dice"}`;
}

function renderOdds() {
  const probability = state.mode === "any"
    ? anyDieSuccess(state.dice, state.target)
    : summedDiceSuccess(state.dice, state.target);
  const percent = probability * 100;
  const ringStop = Math.max(0, Math.min(100, percent));
  const label = formatPercent(probability);

  byId("probability-value").textContent = label;
  byId("probability-ring").style.background = `conic-gradient(var(--yellow) 0 ${ringStop}%, rgba(255, 255, 255, 0.12) ${ringStop}% 100%)`;

  if (probability === 0) {
    byId("odds-line").textContent = "Effectively impossible";
  } else if (probability === 1) {
    byId("odds-line").textContent = "Certain success";
  } else {
    const oneIn = 1 / probability;
    byId("odds-line").textContent = `About 1 in ${oneIn < 10 ? oneIn.toFixed(1) : Math.round(oneIn)} attempts`;
  }

  if (state.mode === "any") {
    const individual = state.dice.map((sides) => `d${sides}: ${formatPercent(singleDieSuccess(sides, state.target))}`).join(" · ");
    byId("calculation-note").textContent = `Individual chances — ${individual}`;
  } else {
    const mean = state.dice.reduce((sum, sides) => sum + explodingAverage(sides), 0);
    byId("calculation-note").textContent = `This pool’s average total is ${mean.toFixed(2)}.`;
  }

  renderOddsChart();
}

function updateLab() {
  renderDicePool();
  renderOdds();
  byId("pool-roll-result").hidden = true;
}

document.querySelectorAll("[data-add-die]").forEach((button) => {
  button.addEventListener("click", () => {
    if (state.dice.length >= 6) return;
    state.dice.push(Number(button.dataset.addDie));
    updateLab();
  });
});

byId("dice-pool").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-index]");
  if (!button || state.dice.length === 1) return;
  state.dice.splice(Number(button.dataset.removeIndex), 1);
  updateLab();
});

function setTarget(value) {
  state.target = Math.max(1, Math.min(60, Math.round(Number(value) || 1)));
  byId("target-input").value = state.target;
  byId("target-range").value = Math.min(40, state.target);
  renderOdds();
  byId("pool-roll-result").hidden = true;
}

byId("target-input").addEventListener("input", (event) => setTarget(event.target.value));
byId("target-range").addEventListener("input", (event) => setTarget(event.target.value));
byId("target-down").addEventListener("click", () => setTarget(state.target - 1));
byId("target-up").addEventListener("click", () => setTarget(state.target + 1));

byId("mode-picker").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-mode]");
  if (!button) return;
  state.mode = button.dataset.mode;
  setSelectedButton(byId("mode-picker"), "mode", state.mode);
  byId("mode-help").textContent = state.mode === "any"
    ? "Success if at least one die meets the target."
    : "Success if the dice total meets the target.";
  renderOdds();
  byId("pool-roll-result").hidden = true;
});

byId("pool-roll").addEventListener("click", () => {
  const results = state.dice.map((sides) => ({ sides, ...rollExplodingDie(sides) }));
  const total = results.reduce((sum, result) => sum + result.total, 0);
  const success = state.mode === "any"
    ? results.some((result) => result.total >= state.target)
    : total >= state.target;
  const resultText = results
    .map((result) => `d${result.sides}: ${result.rolls.join("+")} = ${result.total}`)
    .join(" · ");
  const output = byId("pool-roll-result");
  output.innerHTML = `<strong>${success ? "Success!" : "Not this time."}</strong><br>${resultText}${state.mode === "sum" ? ` · Total: ${total}` : ""}`;
  output.hidden = false;
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll(".chapter-link").forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
    });
  });
}, { rootMargin: "-40% 0px -45% 0px" });

document.querySelectorAll("[data-chapter]").forEach((section) => observer.observe(section));

renderAverage();
updateLab();
