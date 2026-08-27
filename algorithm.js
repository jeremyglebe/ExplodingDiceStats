const slides = [...document.querySelectorAll(".algo-slide")];
const previousButton = document.getElementById("previous-slide");
const nextButton = document.getElementById("next-slide");
const currentLabel = document.getElementById("current-slide");
const totalLabel = document.getElementById("total-slides");
const progressBar = document.getElementById("progress-bar");
const populationCanvas = document.getElementById("population-canvas");
const replayPopulation = document.getElementById("replay-population");
let current = 0;
let touchStartX = null;
let populationAnimation;

function combinations(dice) {
  if (dice.length === 0) return [[]];
  const [die, ...rest] = dice;
  return Array.from({ length: die }, (_, index) => index + 1)
    .flatMap((roll) => combinations(rest).map((tail) => [roll, ...tail]));
}

function buildPopulationTree() {
  const nodes = [{ id: 0, parent: null, depth: 0, total: 0, active: [4, 6], rolledDice: [], rolls: [], status: "open", probability: 1, probabilityDenominator: 1, termination: "no — continue" }];
  const queue = [nodes[0]];

  while (queue.length) {
    const parent = queue.shift();
    const outcomes = combinations(parent.active);

    outcomes.forEach((rolls) => {
      const total = parent.total + rolls.reduce((sum, value) => sum + value, 0);
      const active = parent.active.filter((die, index) => rolls[index] === die);
      const status = total >= 10 ? "success" : active.length ? "open" : "failure";
      const child = {
        id: nodes.length,
        parent: parent.id,
        depth: parent.depth + 1,
        total,
        active,
        rolledDice: [...parent.active],
        rolls,
        status,
        probability: parent.probability / outcomes.length,
        probabilityDenominator: parent.probabilityDenominator * outcomes.length,
        termination: status === "success"
          ? "target reached"
          : status === "failure"
            ? "no explosions in this node"
            : "no — continue",
      };
      nodes.push(child);
      if (status === "open") queue.push(child);
    });
  }

  return nodes;
}

const populationNodes = buildPopulationTree();

function animatePopulation() {
  if (!populationCanvas) return;
  cancelAnimationFrame(populationAnimation);
  const context = populationCanvas.getContext("2d");
  const bounds = populationCanvas.getBoundingClientRect();
  const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
  populationCanvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
  populationCanvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const width = bounds.width;
  const height = bounds.height;
  const levels = new Map();
  populationNodes.forEach((node) => {
    if (!levels.has(node.depth)) levels.set(node.depth, []);
    levels.get(node.depth).push(node);
  });
  const maxDepth = Math.max(...levels.keys());
  levels.forEach((levelNodes, depth) => {
    levelNodes.forEach((node, index) => {
      node.x = 42 + (depth / maxDepth) * (width - 84);
      node.y = 24 + ((index + 0.5) / levelNodes.length) * (height - 48);
    });
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = performance.now();
  const interval = reducedMotion ? 0 : 22;

  function draw(timestamp) {
    const visibleCount = interval === 0
      ? populationNodes.length
      : Math.min(populationNodes.length, Math.max(1, Math.floor((timestamp - start - 250) / interval)));
    context.clearRect(0, 0, width, height);
    const visible = populationNodes.slice(0, visibleCount);
    const visibleIds = new Set(visible.map((node) => node.id));

    context.lineWidth = 1;
    visible.forEach((node) => {
      if (node.parent === null || !visibleIds.has(node.parent)) return;
      const parent = populationNodes[node.parent];
      context.beginPath();
      context.moveTo(parent.x, parent.y);
      context.lineTo(node.x, node.y);
      context.strokeStyle = "rgba(255,255,255,.15)";
      context.stroke();
    });

    const counts = { open: 0, success: 0, failure: 0 };
    visible.forEach((node, index) => {
      counts[node.status] += 1;
      const justBorn = index === visibleCount - 1 && visibleCount < populationNodes.length;
      const radius = node.id === 0 ? 7 : node.status === "open" ? 5 : 3.5;
      context.beginPath();
      context.arc(node.x, node.y, justBorn ? radius * 1.8 : radius, 0, Math.PI * 2);
      context.fillStyle = node.id === 0
        ? "#ff624a"
        : node.status === "open"
          ? "#ffd541"
          : node.status === "success"
            ? "#a9e8ce"
            : "#858797";
      context.fill();
    });

    document.getElementById("open-node-count").textContent = counts.open;
    document.getElementById("success-node-count").textContent = counts.success;
    document.getElementById("failure-node-count").textContent = counts.failure;

    const latest = visible[visible.length - 1];
    document.getElementById("live-node-label").textContent = latest.id === 0 ? "SYNTHETIC ROOT" : `CURRENT NODE ${latest.id}`;
    document.getElementById("live-node-dice").textContent = latest.rolledDice.length ? `[${latest.rolledDice.map((die) => `d${die}`).join(", ")}]` : "all dice";
    document.getElementById("live-node-results").textContent = latest.rolls.length ? `[${latest.rolls.join(", ")}]` : "—";
    document.getElementById("live-node-probability").textContent = latest.probabilityDenominator === 1 ? "1" : `1 / ${latest.probabilityDenominator}`;
    document.getElementById("live-node-total").textContent = latest.total;
    document.getElementById("live-node-beats").textContent = latest.total >= 10 ? "true" : "false";
    document.getElementById("live-node-termination").textContent = latest.termination;

    if (visibleCount < populationNodes.length) populationAnimation = requestAnimationFrame(draw);
  }

  populationAnimation = requestAnimationFrame(draw);
}

function slideFromHash() {
  const match = window.location.hash.match(/^#slide-(\d+)$/);
  if (!match) return 0;
  return Math.max(0, Math.min(slides.length - 1, Number(match[1]) - 1));
}

function showSlide(index, updateHash = true) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((slide, slideIndex) => {
    const active = slideIndex === current;
    slide.classList.toggle("is-active", active);
    slide.setAttribute("aria-hidden", String(!active));
    if (active) slide.scrollTop = 0;
  });

  currentLabel.textContent = current + 1;
  totalLabel.textContent = slides.length;
  progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
  previousButton.disabled = current === 0;
  nextButton.disabled = current === slides.length - 1;
  nextButton.innerHTML = current === slides.length - 1
    ? "Finished"
    : "Next <span aria-hidden=\"true\">→</span>";

  if (updateHash) history.replaceState(null, "", `#slide-${current + 1}`);
  document.title = `${current + 1}/${slides.length} — The Exploding Dice Graph Algorithm`;
  if (slides[current].contains(populationCanvas)) requestAnimationFrame(animatePopulation);
}

previousButton.addEventListener("click", () => showSlide(current - 1));
nextButton.addEventListener("click", () => showSlide(current + 1));
replayPopulation.addEventListener("click", animatePopulation);

window.addEventListener("keydown", (event) => {
  if (["ArrowRight", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    showSlide(current + 1);
  }
  if (["ArrowLeft", "PageUp"].includes(event.key)) {
    event.preventDefault();
    showSlide(current - 1);
  }
  if (event.key === "Home") showSlide(0);
  if (event.key === "End") showSlide(slides.length - 1);
});

window.addEventListener("hashchange", () => showSlide(slideFromHash(), false));

document.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

document.addEventListener("touchend", (event) => {
  if (touchStartX === null) return;
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) > 65) showSlide(current + (distance < 0 ? 1 : -1));
  touchStartX = null;
}, { passive: true });

showSlide(slideFromHash(), false);
