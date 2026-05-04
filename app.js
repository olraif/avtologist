if (!Element.prototype.replaceChildren) {
  Element.prototype.replaceChildren = function (...nodes) {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
    nodes.forEach((node) => {
      this.appendChild(typeof node === "string" ? document.createTextNode(node) : node);
    });
  };
}

const loads = [
  {
    id: 1,
    from: "Москва",
    to: "Казань",
    title: "Паллеты с бытовой техникой",
    date: "2026-05-03",
    weight: 8,
    volume: 34,
    body: "тент",
    loading: "задняя / боковая / паллеты",
    rate: 82000,
    detour: 18,
    distance: 820,
    reliability: 94,
    loadingHours: 3,
    company: "ТК Восток",
    updated: "12 минут назад",
  },
  {
    id: 2,
    from: "Москва",
    to: "Нижний Новгород",
    title: "Сухие смеси на европаллетах",
    date: "2026-05-03",
    weight: 14,
    volume: 46,
    body: "тент / борт",
    loading: "боковая / верхняя",
    rate: 69000,
    detour: 9,
    distance: 430,
    reliability: 87,
    loadingHours: 5,
    company: "СтройЛогистик",
    updated: "24 минуты назад",
  },
  {
    id: 3,
    from: "Санкт-Петербург",
    to: "Москва",
    title: "Сборный груз в коробах",
    date: "2026-05-04",
    weight: 6,
    volume: 28,
    body: "фургон",
    loading: "задняя / гидроборт",
    rate: 76000,
    detour: 12,
    distance: 720,
    reliability: 91,
    loadingHours: 2,
    company: "Северный склад",
    updated: "35 минут назад",
  },
  {
    id: 4,
    from: "Казань",
    to: "Екатеринбург",
    title: "Металлические комплектующие",
    date: "2026-05-05",
    weight: 18,
    volume: 32,
    body: "тент",
    loading: "верхняя / кран",
    rate: 118000,
    detour: 22,
    distance: 960,
    reliability: 78,
    loadingHours: 6,
    company: "Промдеталь",
    updated: "1 час назад",
  },
  {
    id: 5,
    from: "Ростов-на-Дону",
    to: "Краснодар",
    title: "Овощи в термоупаковке",
    date: "2026-05-03",
    weight: 10,
    volume: 38,
    body: "рефрижератор",
    loading: "задняя / температура",
    rate: 54000,
    detour: 7,
    distance: 280,
    reliability: 96,
    loadingHours: 4,
    company: "ЮгАгро",
    updated: "1 час назад",
  },
  {
    id: 6,
    from: "Самара",
    to: "Уфа",
    title: "Автозапчасти в ящиках",
    date: "2026-05-06",
    weight: 5,
    volume: 22,
    body: "фургон",
    loading: "задняя / паллеты",
    rate: 43000,
    detour: 11,
    distance: 470,
    reliability: 83,
    loadingHours: 3,
    company: "МоторСнаб",
    updated: "2 часа назад",
  },
];

const state = {
  screen: "trip",
  autopilotRan: false,
  saved: readSet("savedLoads"),
  responses: readSet("respondedLoads"),
  acceptedLoadId: readValue("acceptedLoadId"),
  sources: readArray("connectedSources"),
};

const elements = {
  list: document.querySelector("#loadsList"),
  responsesList: document.querySelector("#responsesList"),
  responsesMeta: document.querySelector("#responsesMeta"),
  total: document.querySelector("#totalLoads"),
  resultMeta: document.querySelector("#resultMeta"),
  viewTitle: document.querySelector("#viewTitle"),
  from: document.querySelector("#fromInput"),
  to: document.querySelector("#toInput"),
  date: document.querySelector("#dateInput"),
  weight: document.querySelector("#weightInput"),
  sort: document.querySelector("#sortSelect"),
  body: document.querySelector("#bodyInput"),
  loading: document.querySelector("#loadingInput"),
  capacity: document.querySelector("#capacityInput"),
  cost: document.querySelector("#costInput"),
  margin: document.querySelector("#marginInput"),
  fillTarget: document.querySelector("#fillTargetInput"),
  maxStops: document.querySelector("#maxStopsInput"),
  idleCost: document.querySelector("#idleCostInput"),
  clear: document.querySelector("#clearFilters"),
  routeFrom: document.querySelector("#routeFrom"),
  routeTo: document.querySelector("#routeTo"),
  avgRate: document.querySelector("#avgRate"),
  bestDetour: document.querySelector("#bestDetour"),
  focusText: document.querySelector("#focusText"),
  replyText: document.querySelector("#replyText"),
  agentText: document.querySelector("#agentText"),
  autopilotPanel: document.querySelector("#autopilotPanel"),
  autopilotStatus: document.querySelector("#autopilotStatus"),
  bestLoadName: document.querySelector("#bestLoadName"),
  fillRate: document.querySelector("#fillRate"),
  bestProfit: document.querySelector("#bestProfit"),
  dealChance: document.querySelector("#dealChance"),
  riskLevel: document.querySelector("#riskLevel"),
  stopCount: document.querySelector("#stopCount"),
  ratePerKm: document.querySelector("#ratePerKm"),
  idleHours: document.querySelector("#idleHours"),
  bundleTitle: document.querySelector("#bundleTitle"),
  bundlePlan: document.querySelector("#bundlePlan"),
  coverageScore: document.querySelector("#coverageScore"),
  regionStrip: document.querySelector("#regionStrip"),
  sourceType: document.querySelector("#sourceTypeInput"),
  exchange: document.querySelector("#exchangeInput"),
  sourceName: document.querySelector("#sourceNameInput"),
  addSource: document.querySelector("#addSource"),
  connectedCount: document.querySelector("#connectedCount"),
  connectedSources: document.querySelector("#connectedSources"),
  planSteps: document.querySelector("#planSteps"),
  documentChecklist: document.querySelector("#documentChecklist"),
  negotiationScript: document.querySelector("#negotiationScript"),
  timelineList: document.querySelector("#timelineList"),
  runAutopilot: document.querySelector("#runAutopilot"),
  acceptBest: document.querySelector("#acceptBest"),
  addDemoLoad: document.querySelector("#addDemoLoad"),
  template: document.querySelector("#loadCardTemplate"),
};

elements.total.textContent = loads.length;

document.querySelectorAll(".nav-item").forEach((button) => {
  bindTap(button, () => {
    state.screen = button.dataset.screen;
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    updateScreens();
    render();
  });
});

[
  elements.from,
  elements.to,
  elements.date,
  elements.weight,
  elements.sort,
  elements.body,
  elements.loading,
  elements.capacity,
  elements.cost,
  elements.margin,
  elements.fillTarget,
  elements.maxStops,
  elements.idleCost,
].forEach((input) => input.addEventListener("input", render));

elements.clear.addEventListener("click", () => {
  elements.from.value = "";
  elements.to.value = "";
  elements.date.value = "";
  elements.weight.value = "";
  render();
});

elements.addSource.addEventListener("click", () => {
  const exchangeName = elements.sourceType.value === "Биржа/API" ? elements.exchange.value : "";
  const name = elements.sourceName.value.trim() || exchangeName || elements.sourceType.value;
  state.sources.unshift({
    id: Date.now(),
    name,
    type: elements.sourceType.value,
    exchange: exchangeName,
    status: "активен",
    sync: getSyncLabel(elements.sourceType.value),
  });
  elements.sourceName.value = "";
  writeArray("connectedSources", state.sources);
  render();
});

bindTap(elements.runAutopilot, runAutopilot);

elements.acceptBest.addEventListener("click", () => {
  const [best] = getMatchingLoads();
  if (!best) return;
  state.acceptedLoadId = String(best.id);
  state.saved.add(String(best.id));
  state.responses.add(String(best.id));
  writeSet("savedLoads", state.saved);
  writeSet("respondedLoads", state.responses);
  writeValue("acceptedLoadId", state.acceptedLoadId);
  render();
});

elements.addDemoLoad.addEventListener("click", () => {
  const id = loads.length + 1;
  loads.unshift({
    id,
    from: elements.from.value.trim() || "Москва",
    to: elements.to.value.trim() || "Воронеж",
    title: "Новая срочная заявка",
    date: elements.date.value || "2026-05-07",
    weight: Number(elements.weight.value) || 12,
    volume: 40,
    body: "тент",
    loading: elements.loading.value || "задняя / боковая",
    rate: 73000,
    detour: 14,
    distance: 520,
    reliability: 89,
    loadingHours: 2,
    company: "Прямой заказчик",
    updated: "только что",
  });
  elements.total.textContent = loads.length;
  render();
});

function render() {
  const matchingLoads = getMatchingLoads();
  updateViewCopy(matchingLoads.length);
  updateRoutePanel(matchingLoads);
  updateAutopilot(matchingLoads);
  updateCoverage(matchingLoads);
  renderSources();
  renderResponses(matchingLoads);
  elements.list.replaceChildren();

  if (!matchingLoads.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Подходящих грузов пока нет. Попробуйте расширить маршрут, дату или вес.";
    elements.list.append(empty);
    return;
  }

  matchingLoads.forEach((load) => elements.list.append(createLoadCard(load)));
}

function updateScreens() {
  document.querySelectorAll(".app-screen").forEach((screen) => {
    screen.classList.toggle("active-screen", screen.dataset.screenPanel === state.screen);
  });
}

function renderResponses(items) {
  const responded = items.filter((load) => state.responses.has(String(load.id)));
  elements.responsesList.replaceChildren();
  elements.responsesMeta.textContent = `${responded.length} ${plural(responded.length, "отклик", "отклика", "откликов")} в работе`;

  if (!responded.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Откликов пока нет. Примите лучший рейс или откликнитесь на груз.";
    elements.responsesList.append(empty);
    return;
  }

  responded.forEach((load) => elements.responsesList.append(createLoadCard(load)));
}

function updateCoverage(items) {
  const regions = ["ЦФО", "ПФО", "ЮФО", "СЗФО", "Урал", "Сибирь", "Дальний Восток"];
  const coverage = Math.min(96, 48 + items.length * 6 + state.sources.length * 9);
  elements.coverageScore.textContent = `${coverage}%`;
  elements.regionStrip.replaceChildren();

  regions.forEach((region, index) => {
    const pill = document.createElement("span");
    pill.className = "region-pill";
    pill.textContent = `${region}: ${Math.max(12, coverage - index * 7)}%`;
    elements.regionStrip.append(pill);
  });
}

function renderSources() {
  elements.connectedCount.textContent = state.sources.length;
  elements.connectedSources.replaceChildren();

  if (!state.sources.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state compact-empty";
    empty.textContent = "Пока источников нет. Подключите биржу, таблицу или канал заявок.";
    elements.connectedSources.append(empty);
    return;
  }

  state.sources.forEach((source) => {
    const item = document.createElement("div");
    item.className = "connected-source";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(source.name)}</strong>
        <span>${escapeHtml(source.exchange || source.type)} · ${escapeHtml(source.sync)}</span>
      </div>
      <span class="status-pill">${escapeHtml(source.status)}</span>
    `;
    elements.connectedSources.append(item);
  });
}

function getMatchingLoads() {
  const from = normalize(elements.from.value);
  const to = normalize(elements.to.value);
  const maxWeight = Number(elements.weight.value) || Number(elements.capacity.value);
  const selectedBody = normalize(elements.body.value);
  const selectedLoading = normalize(elements.loading.value);

  let filtered = loads.filter((load) => {
    const routeMatches =
      (!from || normalize(load.from).includes(from)) && (!to || normalize(load.to).includes(to));
    const dateMatches = !elements.date.value || load.date >= elements.date.value;
    const weightMatches = !maxWeight || load.weight <= maxWeight;
    const bodyMatches = !selectedBody || normalize(load.body).includes(selectedBody);
    const loadingMatches = !selectedLoading || normalize(load.loading).includes(selectedLoading);
    return routeMatches && dateMatches && weightMatches && bodyMatches && loadingMatches;
  });

  filtered = filtered.map(enrichLoad);
  filtered = filtered.sort((a, b) => {
    if (elements.sort.value === "date") return a.date.localeCompare(b.date);
    if (elements.sort.value === "distance") return a.detour - b.detour;
    if (elements.sort.value === "profit") return b.margin - a.margin;
    return b.score - a.score;
  });

  return filtered;
}

function createLoadCard(load) {
  const fragment = elements.template.content.cloneNode(true);
  const card = fragment.querySelector(".load-card");
  const saveButton = fragment.querySelector(".save-button");
  const respondButton = fragment.querySelector(".respond-button");
  const saved = state.saved.has(String(load.id));
  const responded = state.responses.has(String(load.id));

  const decision = fragment.querySelector(".decision");
  decision.textContent = load.decision;
  decision.classList.toggle("negotiate", load.action === "negotiate");
  decision.classList.toggle("skip", load.action === "skip");
  fragment.querySelector(".route").textContent = `${load.from} → ${load.to}`;
  fragment.querySelector("h3").textContent = load.title;
  fragment.querySelector(".company").textContent = load.company;
  fragment.querySelector(".updated").textContent = load.updated;
  if (state.acceptedLoadId === String(load.id)) {
    decision.textContent = "В работе";
  }

  saveButton.textContent = saved ? "★" : "☆";
  saveButton.classList.toggle("saved", saved);
  saveButton.addEventListener("click", () => {
    toggleSetValue(state.saved, load.id);
    writeSet("savedLoads", state.saved);
    render();
  });

  respondButton.textContent = responded ? "Отклик отправлен" : "Откликнуться";
  respondButton.classList.toggle("responded", responded);
  respondButton.addEventListener("click", () => {
    state.responses.add(String(load.id));
    writeSet("respondedLoads", state.responses);
    render();
  });

  const chips = fragment.querySelector(".chips");
  [
    formatDate(load.date),
    `${load.weight} т`,
    `${load.volume} м3`,
    load.body,
    load.loading,
  ].forEach((label) => chips.append(makeChip(label)));

  const metrics = fragment.querySelector(".metrics");
  metrics.append(makeMetric("Маржа", formatMoney(load.margin), "rate"));
  metrics.append(makeMetric("Балл", `${load.score}/100`, "score"));
  metrics.append(makeMetric("Крюк", `${load.detour} км`, "detour"));
  metrics.append(makeMetric("Риск", `${100 - load.reliability}%`, ""));

  const reasons = fragment.querySelector(".reason-list");
  getReasons(load).forEach((reason) => {
    const item = document.createElement("span");
    item.className = "reason-item";
    item.textContent = reason;
    reasons.append(item);
  });

  card.dataset.id = load.id;
  return fragment;
}

function updateViewCopy(count) {
  elements.viewTitle.textContent = "Рекомендации автологиста";
  elements.resultMeta.textContent = `${count} ${plural(count, "заявка", "заявки", "заявок")} найдено`;
}

function updateRoutePanel(items) {
  elements.routeFrom.textContent = elements.from.value.trim() || "Откуда";
  elements.routeTo.textContent = elements.to.value.trim() || "Куда";

  if (!items.length) {
    elements.avgRate.textContent = "—";
    elements.bestDetour.textContent = "—";
    elements.idleHours.textContent = "—";
    elements.focusText.textContent = "Расширьте поиск";
    elements.replyText.textContent = "Подходящих заявок нет. Снизьте минимальную маржу или расширьте тип кузова.";
    elements.agentText.textContent = "Автологист ждет маршрут и параметры машины.";
    return;
  }

  const avgMargin = Math.round(items.reduce((sum, item) => sum + item.margin, 0) / items.length);
  const best = items[0];

  elements.avgRate.textContent = formatMoney(avgMargin);
  elements.bestDetour.textContent = `${best.score}/100`;
  elements.idleHours.textContent = `${estimateIdleHours(best, 1)} ч`;
  elements.focusText.textContent = best.decision;
  elements.replyText.textContent = makeReply(best);
  elements.agentText.textContent = `Лучший вариант: ${best.company}, чистая прибыль ${formatMoney(best.margin)}, контроль загрузки через ${best.loadingHours} ч.`;
}

function updateAutopilot(items) {
  const bundle = buildBestBundle(items);
  const best = bundle.loads[0];

  if (!best) {
    elements.autopilotStatus.textContent = "Нет рейса под текущие ограничения";
    if (elements.bestLoadName) elements.bestLoadName.textContent = "—";
    elements.fillRate.textContent = "—";
    elements.bestProfit.textContent = "—";
    if (elements.dealChance) elements.dealChance.textContent = "—";
    if (elements.riskLevel) elements.riskLevel.textContent = "—";
    elements.stopCount.textContent = "—";
    elements.ratePerKm.textContent = "—";
    elements.idleHours.textContent = "—";
    elements.bundleTitle.textContent = "Нет плана";
    elements.bundlePlan.textContent = "Под текущие ограничения не получается собрать прибыльную загрузку.";
    renderList(elements.planSteps, ["Расширить радиус поиска", "Проверить другой тип кузова", "Снизить минимальную маржу"]);
    renderList(elements.documentChecklist, ["Паспорт водителя", "СТС и права", "Договор-заявка"], "li");
    elements.negotiationScript.textContent = "Автологист не нашел безопасную и прибыльную заявку.";
    elements.timelineList.replaceChildren();
    return;
  }

  const accepted = state.acceptedLoadId === String(best.id);
  const chance = Math.max(42, Math.min(96, best.reliability - best.detour + Math.round(bundle.margin / 12000)));
  const risk = 100 - best.reliability + Math.round(bundle.detour / 4);

  elements.autopilotStatus.textContent = accepted
    ? "Рейс принят в работу"
    : state.autopilotRan
      ? "Подбор выполнен"
      : "Собран план полной загрузки";
  if (elements.bestLoadName) elements.bestLoadName.textContent = best.title;
  elements.fillRate.textContent = `${bundle.fillRate}%`;
  elements.bestProfit.textContent = formatMoney(bundle.margin);
  if (elements.dealChance) elements.dealChance.textContent = `${chance}%`;
  if (elements.riskLevel) elements.riskLevel.textContent = risk < 12 ? "низкий" : risk < 24 ? "средний" : "высокий";
  elements.stopCount.textContent = `${bundle.loads.length}`;
  elements.ratePerKm.textContent = formatRubPerKm(bundle.ratePerKm);
  elements.idleHours.textContent = `${bundle.idleHours} ч`;
  elements.bundleTitle.textContent = bundle.loads.map((load) => load.to).join(" + ");
  elements.bundlePlan.textContent = makeBundleSummary(bundle);

  renderList(elements.planSteps, [
    `Взять ${bundle.loads.length} ${plural(bundle.loads.length, "груз", "груза", "грузов")} вместо холостого рейса`,
    `Держать загрузку ${bundle.fillRate}% при лимите ${elements.maxStops.value} погрузки`,
    bundle.needsNegotiation ? `Поднять слабые ставки: цель ${formatMoney(best.targetRate)}` : `Подтвердить ставку ${formatRubPerKm(bundle.ratePerKm)}`,
    `Не допустить простой дольше ${bundle.idleHours} ч`,
  ]);

  renderList(elements.documentChecklist, [
    "Договор-заявка с точной ставкой",
    "Данные водителя и машины",
    "Адреса загрузки и выгрузки",
    "Контакты склада и получателя",
  ], "li");

  elements.negotiationScript.textContent = makeBundleScript(bundle);
  renderTimeline(best);
}

function buildBestBundle(items) {
  const capacity = Number(elements.capacity.value) || 20;
  const maxStops = Number(elements.maxStops.value) || 2;
  const targetFill = Number(elements.fillTarget.value) || 90;
  const ranked = [...items].filter((load) => load.action !== "skip").sort((a, b) => b.score - a.score);
  const picked = [];
  let totalWeight = 0;

  for (const load of ranked) {
    if (picked.length >= maxStops) break;
    if (totalWeight + load.weight > capacity) continue;
    picked.push(load);
    totalWeight += load.weight;
    if ((totalWeight / capacity) * 100 >= targetFill) break;
  }

  if (!picked.length && items[0]) picked.push(items[0]);

  const revenue = picked.reduce((sum, load) => sum + load.rate, 0);
  const cost = picked.reduce((sum, load) => sum + load.cost, 0);
  const detour = picked.reduce((sum, load) => sum + load.detour, 0);
  const distance = Math.max(...picked.map((load) => load.distance || 1), 1) + detour;
  const idleHours = picked.reduce((sum, load) => sum + estimateIdleHours(load, picked.length), 0);
  const idleCost = idleHours * (Number(elements.idleCost.value) || 2500);
  const margin = revenue - cost - idleCost;
  const fillRate = Math.min(100, Math.round((totalWeight / capacity) * 100));

  return {
    loads: picked,
    revenue,
    cost,
    margin,
    detour,
    distance,
    idleHours,
    fillRate,
    ratePerKm: Math.round(revenue / distance),
    needsNegotiation: picked.some((load) => load.action === "negotiate") || fillRate < targetFill,
  };
}

function makeBundleSummary(bundle) {
  if (!bundle.loads.length) return "Нет подходящих грузов под параметры машины.";
  const stopsText = plural(bundle.loads.length, "погрузка", "погрузки", "погрузок");
  return `План: ${bundle.fillRate}% загрузки, ${bundle.loads.length} ${stopsText}, ${formatRubPerKm(bundle.ratePerKm)}, простой ${bundle.idleHours} ч, чистыми ${formatMoney(bundle.margin)}.`;
}

function makeBundleScript(bundle) {
  const names = bundle.loads.map((load) => `${load.from} — ${load.to}`).join("; ");
  if (bundle.needsNegotiation) {
    return `Автологист: беру маршрут ${names}, но для полной загрузки и без простоя нужна ставка не ниже ${formatRubPerKm(bundle.ratePerKm + 8)}. Готовы подтвердить сегодня?`;
  }
  return `Автологист: машина подходит, маршрут ${names}. Готовы ехать при подтверждении адресов, времени погрузки и оплаты без задержек.`;
}

function enrichLoad(load) {
  const costPerKm = Number(elements.cost.value) || 55;
  const minMargin = Number(elements.margin.value) || 0;
  const cost = (load.distance + load.detour) * costPerKm + estimateIdleHours(load, 1) * (Number(elements.idleCost.value) || 2500);
  const margin = load.rate - cost;
  const marginScore = Math.min(45, Math.max(0, Math.round((margin / 90000) * 45)));
  const detourScore = Math.max(0, 25 - Math.round(load.detour * 0.8));
  const trustScore = Math.round(load.reliability * 0.2);
  const speedScore = Math.max(0, 10 - load.loadingHours);
  const score = Math.max(0, Math.min(100, marginScore + detourScore + trustScore + speedScore));
  let action = "take";
  let decision = "Брать";
  const targetRate = load.rate + Math.max(5000, Math.round(load.rate * 0.08));

  if (margin < minMargin || score < 45) {
    action = "skip";
    decision = "Пропустить";
  } else if (load.reliability < 85 || margin < minMargin * 1.35) {
    action = "negotiate";
    decision = "Торговаться";
  }

  return {
    ...load,
    cost,
    margin,
    score,
    action,
    decision,
    targetRate,
  };
}

function makeReply(load) {
  if (load.action === "skip") {
    return `Не рекомендую отклик: маржа ${formatMoney(load.margin)}, риск ${100 - load.reliability}%, крюк ${load.detour} км.`;
  }

  if (load.action === "negotiate") {
    const target = load.rate + Math.max(5000, Math.round(load.rate * 0.08));
    return `Здравствуйте. Готовы взять ${load.title.toLowerCase()} по маршруту ${load.from} — ${load.to}. С учетом крюка и загрузки можем ехать за ${formatMoney(target)}.`;
  }

  return `Здравствуйте. Машина подходит под груз ${load.weight} т, ${load.body}. Готовы забрать ${formatDate(load.date)} по ставке ${formatMoney(load.rate)}.`;
}

function getReasons(load) {
  const reasons = [
    `Чистая прибыль после дороги: ${formatMoney(load.margin)}`,
    `Ставка за км: ${formatRubPerKm(Math.round(load.rate / (load.distance + load.detour)))}`,
    `Совместимость с кузовом: ${load.body}`,
    `Погрузка: ${load.loading}`,
    `Надежность заказчика: ${load.reliability}%`,
  ];

  if (load.action === "skip") reasons.unshift("Автологист не рекомендует брать без изменения условий");
  if (load.action === "negotiate") reasons.unshift(`Нужна ставка около ${formatMoney(load.targetRate)}`);
  if (load.action === "take") reasons.unshift("Можно брать без ручной проверки логиста");

  return reasons;
}

function estimateIdleHours(load, stopCount) {
  return Math.max(1, Math.round(load.loadingHours * 0.45 + (stopCount - 1) * 1.5));
}

function renderList(target, items) {
  target.replaceChildren();
  items.forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    target.append(item);
  });
}

function renderTimeline(load) {
  const points = [
    ["Сейчас", "отклик и ставка"],
    ["30 мин", "подтвердить контакты"],
    [`${load.loadingHours} ч`, "контроль загрузки"],
    ["После ТТН", "контроль оплаты"],
  ];

  elements.timelineList.replaceChildren();
  points.forEach(([time, title]) => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `<span>${time}</span><strong>${title}</strong>`;
    elements.timelineList.append(item);
  });
}

function makeChip(text) {
  const chip = document.createElement("span");
  chip.className = "chip";
  chip.textContent = text;
  return chip;
}

function makeMetric(label, value, className) {
  const metric = document.createElement("span");
  metric.className = `metric ${className}`.trim();
  metric.innerHTML = `${label}: <strong>${value}</strong>`;
  return metric;
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatRubPerKm(value) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)} ₽/км`;
}

function plural(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function readSet(key) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
  } catch {
    return new Set();
  }
}

function readArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function writeArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // App remains usable without browser persistence.
  }
}

function writeSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // App remains usable without browser persistence.
  }
}

function readValue(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // App remains usable without browser persistence.
  }
}

function runAutopilot() {
  state.autopilotRan = true;
  state.screen = "trip";
  elements.sort.value = "score";
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.screen === "trip");
  });
  updateScreens();
  render();
  elements.autopilotPanel.classList.remove("pulse-panel");
  void elements.autopilotPanel.offsetWidth;
  elements.autopilotPanel.classList.add("pulse-panel");
  elements.autopilotPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function bindTap(element, handler) {
  let touched = false;
  element.addEventListener("touchend", (event) => {
    touched = true;
    event.preventDefault();
    handler();
    window.setTimeout(() => {
      touched = false;
    }, 400);
  });
  element.addEventListener("click", () => {
    if (!touched) handler();
  });
}

function toggleSetValue(set, id) {
  const value = String(id);
  if (set.has(value)) {
    set.delete(value);
  } else {
    set.add(value);
  }
}

function getSyncLabel(type) {
  const labels = {
    "Биржа/API": "обновление каждые 5 мин",
    "Таблица": "синхронизация по ссылке",
    "Мессенджер": "разбор заявок из чата",
    "Прямой заказчик": "личный поток заявок",
    "Ручной импорт": "загрузка файлом",
  };
  return labels[type] || "ручная проверка";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

updateScreens();
render();
window.__autologistReady = true;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
