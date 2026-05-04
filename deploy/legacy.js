(function () {
  if (window.__autologistReady) return;

  var loads = [
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
      phone: "+7 900 100-10-10",
      pickup: "Москва, склад Технопарк",
      dropoff: "Казань, распределительный центр",
      comment: "Оплата после выгрузки, нужна заявка",
      updated: "12 минут назад"
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
      phone: "+7 900 200-20-20",
      pickup: "Москва, промзона Южная",
      dropoff: "Нижний Новгород, склад получателя",
      comment: "Погрузка по записи",
      updated: "24 минуты назад"
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
      phone: "+7 900 500-50-50",
      pickup: "Ростов-на-Дону, овощная база",
      dropoff: "Краснодар, РЦ",
      comment: "Температурный режим, документы на месте",
      updated: "1 час назад"
    }
  ];

  var saved = readSet("savedLoads");
  var responses = readSet("respondedLoads");
  var sources = readSet("connectedSources");
  var manualLoads = readSet("manualLoads");
  var tripStatuses = readObject("tripStatuses");
  var truckProfile = readObject("truckProfile");
  var currentScreen = "trip";
  var lastBestLoad = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    var element = byId(id);
    if (element) element.textContent = value;
  }

  function money(value) {
    return Math.round(value).toLocaleString("ru-RU") + " ₽";
  }

  function rubKm(value) {
    return Math.round(value).toLocaleString("ru-RU") + " ₽/км";
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function readSet(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
      return [];
    }
  }

  function writeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function readObject(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch (error) {
      return {};
    }
  }

  function writeObject(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function setInput(id, value) {
    var element = byId(id);
    if (element && value !== undefined && value !== null && value !== "") element.value = value;
  }

  function applyTruckProfile() {
    setInput("bodyInput", truckProfile.body);
    setInput("loadingInput", truckProfile.loading);
    setInput("capacityInput", truckProfile.capacity);
    setInput("costInput", truckProfile.cost);
    setInput("marginInput", truckProfile.margin);
    setInput("fillTargetInput", truckProfile.fillTarget);
    setInput("maxStopsInput", truckProfile.maxStops);
    setInput("idleCostInput", truckProfile.idleCost);
    if (truckProfile.savedAt) setText("profileStatus", "Машина сохранена");
  }

  function saveTruckProfile() {
    truckProfile = {
      body: (byId("bodyInput") || {}).value || "",
      loading: (byId("loadingInput") || {}).value || "",
      capacity: (byId("capacityInput") || {}).value || "20",
      cost: (byId("costInput") || {}).value || "55",
      margin: (byId("marginInput") || {}).value || "25000",
      fillTarget: (byId("fillTargetInput") || {}).value || "90",
      maxStops: (byId("maxStopsInput") || {}).value || "2",
      idleCost: (byId("idleCostInput") || {}).value || "2500",
      savedAt: new Date().toISOString()
    };
    writeObject("truckProfile", truckProfile);
    setText("profileStatus", "Машина сохранена");
    runAutopilot();
  }

  function has(list, id) {
    return list.indexOf(String(id)) !== -1;
  }

  function addOnce(list, id) {
    id = String(id);
    if (list.indexOf(id) === -1) list.push(id);
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function enrich(load) {
    var costPerKm = Number((byId("costInput") || {}).value) || 55;
    var idleCost = Number((byId("idleCostInput") || {}).value) || 2500;
    var minMargin = Number((byId("marginInput") || {}).value) || 25000;
    var cost = (load.distance + load.detour) * costPerKm + idleCost * 2;
    var margin = load.rate - cost;
    var minRate = cost + minMargin;
    var reserve = load.rate - minRate;
    var riskPenalty = 0;
    if (load.reliability < 90) riskPenalty += 18;
    if (load.loadingHours > 4) riskPenalty += 12;
    if (load.detour > 15) riskPenalty += 10;
    if (reserve < 0) riskPenalty += 22;
    var score = Math.max(30, Math.min(96, Math.round(margin / 1500 + load.reliability / 2 - load.detour)));
    var riskScore = Math.min(95, Math.max(5, 100 - load.reliability + riskPenalty));
    var action = margin < minMargin ? "Торговаться" : "Брать";

    return {
      id: load.id,
      from: load.from,
      to: load.to,
      title: load.title,
      date: load.date,
      weight: load.weight,
      volume: load.volume,
      body: load.body,
      loading: load.loading,
      rate: load.rate,
      detour: load.detour,
      distance: load.distance,
      reliability: load.reliability,
      company: load.company,
      phone: load.phone || "не указан",
      pickup: load.pickup || load.from,
      dropoff: load.dropoff || load.to,
      comment: load.comment || "без комментария",
      updated: load.updated,
      margin: margin,
      minRate: minRate,
      reserve: reserve,
      riskScore: riskScore,
      score: score,
      action: action
    };
  }

  function getLoads() {
    var allLoads = loads.concat(manualLoads);
    var from = normalize((byId("fromInput") || {}).value);
    var to = normalize((byId("toInput") || {}).value);
    var body = normalize((byId("bodyInput") || {}).value);
    var loading = normalize((byId("loadingInput") || {}).value);
    var maxWeight = Number((byId("weightInput") || {}).value) || Number((byId("capacityInput") || {}).value) || 20;
    var result = [];

    for (var i = 0; i < allLoads.length; i += 1) {
      var load = allLoads[i];
      if (from && normalize(load.from).indexOf(from) === -1) continue;
      if (to && normalize(load.to).indexOf(to) === -1) continue;
      if (body && normalize(load.body).indexOf(body) === -1) continue;
      if (loading && normalize(load.loading).indexOf(loading) === -1) continue;
      if (load.weight > maxWeight) continue;
      result.push(enrich(load));
    }

    result.sort(function (a, b) {
      return b.score - a.score;
    });
    return result;
  }

  function makeCard(load) {
    var status = tripStatuses[String(load.id)] || (has(responses, load.id) ? "Отклик отправлен" : "Отклик отправлен");
    var statusSelect =
      '<select data-load-status="' +
      load.id +
      '"><option' +
      selected(status, "Отклик отправлен") +
      '>Отклик отправлен</option><option' +
      selected(status, "Ставка согласована") +
      '>Ставка согласована</option><option' +
      selected(status, "На погрузке") +
      '>На погрузке</option><option' +
      selected(status, "В пути") +
      '>В пути</option><option' +
      selected(status, "Выгружен") +
      '>Выгружен</option><option' +
      selected(status, "Оплата") +
      '>Оплата</option></select>';
    var card = document.createElement("article");
    card.className = "load-card";
    card.innerHTML =
      '<div class="card-top"><div><span class="decision">' +
      load.action +
      '</span><p class="route">' +
      load.from +
      " → " +
      load.to +
      "</p><h3>" +
      load.title +
      '</h3></div><button class="icon-button save-button" type="button">★</button></div>' +
      '<div class="chips"><span class="chip">' +
      load.weight +
      ' т</span><span class="chip">' +
      load.volume +
      ' м3</span><span class="chip">' +
      load.body +
      '</span><span class="chip">' +
      load.loading +
      '</span></div><div class="metrics"><span class="metric rate">Маржа: <strong>' +
      money(load.margin) +
      '</strong></span><span class="metric score">Балл: <strong>' +
      load.score +
      '/100</strong></span><span class="metric detour">Крюк: <strong>' +
      load.detour +
      ' км</strong></span></div><div class="reason-list"><span class="reason-item">Ставка за км: ' +
      rubKm(load.rate / (load.distance + load.detour)) +
      '</span><span class="reason-item">Минимум для торга: ' +
      money(load.minRate) +
      '</span><span class="reason-item">Запас по ставке: ' +
      money(load.reserve) +
      '</span><span class="reason-item">Риск рейса: ' +
      riskLabel(load.riskScore) +
      '</span><span class="reason-item">Надежность заказчика: ' +
      load.reliability +
      '%</span></div><div class="contact-box"><span><strong>Телефон:</strong> ' +
      load.phone +
      '</span><span><strong>Погрузка:</strong> ' +
      load.pickup +
      '</span><span><strong>Выгрузка:</strong> ' +
      load.dropoff +
      '</span><span><strong>Комментарий:</strong> ' +
      load.comment +
      '</span></div><div class="status-row">' +
      statusSelect +
      '<div class="next-action">' +
      nextAction(status) +
      '</div></div><div class="card-footer"><div><span class="company">' +
      load.company +
      '</span><small class="updated">' +
      load.updated +
      '</small></div><button class="respond-button" type="button">Откликнуться</button></div>';

    card.querySelector(".save-button").onclick = function () {
      addOnce(saved, load.id);
      writeSet("savedLoads", saved);
    };
    card.querySelector(".respond-button").onclick = function () {
      addOnce(responses, load.id);
      tripStatuses[String(load.id)] = "Отклик отправлен";
      writeSet("respondedLoads", responses);
      writeObject("tripStatuses", tripStatuses);
      this.textContent = "Отклик отправлен";
      this.className += " responded";
      renderResponses();
    };
    var statusNode = card.querySelector("[data-load-status]");
    if (statusNode) {
      statusNode.onchange = function () {
        tripStatuses[String(load.id)] = this.value;
        writeObject("tripStatuses", tripStatuses);
        renderResponses();
      };
    }
    return card;
  }

  function selected(current, value) {
    return current === value ? " selected" : "";
  }

  function riskLabel(score) {
    if (score >= 60) return "высокий";
    if (score >= 35) return "средний";
    return "низкий";
  }

  function renderList(id, items, ordered) {
    var target = byId(id);
    var tag = ordered ? "ol" : "ul";
    var node;
    var li;
    if (!target) return;
    clear(target);
    for (var i = 0; i < items.length; i += 1) {
      li = document.createElement("li");
      li.textContent = items[i];
      target.appendChild(li);
    }
    node = target.tagName ? target.tagName.toLowerCase() : "";
    if (node !== tag) return;
  }

  function renderTimeline(items) {
    var target = byId("timelineList");
    var item;
    if (!target) return;
    clear(target);
    for (var i = 0; i < items.length; i += 1) {
      item = document.createElement("div");
      item.className = "timeline-item";
      item.innerHTML = "<span>" + items[i].label + "</span><strong>" + items[i].value + "</strong>";
      target.appendChild(item);
    }
  }

  function testServerConnection() {
    var status = byId("serverStatus");
    var details = byId("serverDetails");
    if (status) status.textContent = "Проверяю Supabase...";
    if (!window.AutologistServer || !window.AutologistServer.ping) {
      if (status) status.textContent = "Клиент Supabase не загружен";
      return;
    }
    window.AutologistServer.ping().then(function (result) {
      if (status) status.textContent = result.message;
      if (details) {
        details.textContent =
          "Project URL: https://xxlnnhrwsxiwbhzjxxqi.supabase.co. Статус проверки: " +
          (result.status || "нет ответа") +
          ".";
      }
    });
  }

  function renderProfessionalOps(best) {
    var askRate = Math.max(best.rate, best.minRate);
    var reserveText = best.reserve >= 0 ? "+" + money(best.reserve) : "не хватает " + money(Math.abs(best.reserve));
    var control = best.action === "Торговаться" ? "звонок по ставке" : "подтвердить погрузку";

    setText("minNegotiationRate", money(askRate));
    setText("rateReserve", reserveText);
    setText("tripRisk", riskLabel(best.riskScore));
    setText("nextControl", control);
    setText(
      "negotiationScript",
      "Здравствуйте. Машина подходит: " +
        best.body +
        ", " +
        best.weight +
        " т. По экономике рейса минимально нужна ставка " +
        money(askRate) +
        ". Подтвердите, пожалуйста, форму оплаты, адрес погрузки, время окна и пакет документов."
    );

    renderList(
      "planSteps",
      [
        "Проверить, что ставка не ниже " + money(askRate) + " и нет скрытого простоя.",
        "Подтвердить точные адреса: " + best.pickup + " → " + best.dropoff + ".",
        "Согласовать окно погрузки, контакт склада и время ожидания.",
        "После подтверждения отправить данные машины и водителя."
      ],
      true
    );
    renderList(
      "documentChecklist",
      [
        "Договор-заявка со ставкой и сроком оплаты",
        "ТТН / УПД / доверенность при необходимости",
        "Паспорт водителя, СТС, права",
        "Контакт ответственного на погрузке и выгрузке",
        "Условия простоя, перегруза и отмены заявки"
      ],
      false
    );
    renderTimeline([
      { label: "Сейчас", value: "торг и проверка" },
      { label: "До погрузки", value: "документы" },
      { label: "На складе", value: "отметки" },
      { label: "После выгрузки", value: "оплата" }
    ]);
  }

  function nextAction(status) {
    if (status === "Отклик отправлен") return "Следующее действие: позвонить заказчику и подтвердить ставку.";
    if (status === "Ставка согласована") return "Следующее действие: отправить данные машины и запросить адрес погрузки.";
    if (status === "На погрузке") return "Следующее действие: проконтролировать документы и время выезда.";
    if (status === "В пути") return "Следующее действие: предупредить получателя о прибытии.";
    if (status === "Выгружен") return "Следующее действие: получить отметки в документах.";
    if (status === "Оплата") return "Следующее действие: проверить оплату по рейсу.";
    return "Следующее действие: оценить груз и отправить отклик.";
  }

  function splitImportLine(line) {
    if (line.indexOf(";") !== -1) return line.split(";");
    if (line.indexOf("\t") !== -1) return line.split("\t");
    return line.split(",");
  }

  function cleanCell(value) {
    return String(value || "").replace(/^"|"$/g, "").trim();
  }

  function numberCell(value, fallback) {
    var text = cleanCell(value).replace(/\s/g, "").replace(",", ".");
    var number = Number(text);
    return number > 0 ? number : fallback;
  }

  function isHeaderRow(cells) {
    var joined = normalize(cells.join(" "));
    return joined.indexOf("откуда") !== -1 || joined.indexOf("город") !== -1 || joined.indexOf("ставка") !== -1;
  }

  function makeImportedLoad(cells, index) {
    return {
      id: new Date().getTime() + index,
      from: cleanCell(cells[0]) || "Москва",
      to: cleanCell(cells[1]) || "Казань",
      title: cleanCell(cells[2]) || "Импортированный груз",
      date: "2026-05-04",
      weight: numberCell(cells[3], 10),
      volume: numberCell(cells[4], 40),
      body: cleanCell(cells[5]) || "тент",
      loading: cleanCell(cells[6]) || "задняя / боковая",
      rate: numberCell(cells[7], 75000),
      detour: 10,
      distance: 600,
      reliability: 88,
      loadingHours: 3,
      company: cleanCell(cells[8]) || "Источник из таблицы",
      phone: cleanCell(cells[9]) || "не указан",
      pickup: cleanCell(cells[0]) || "адрес погрузки не указан",
      dropoff: cleanCell(cells[1]) || "адрес выгрузки не указан",
      comment: "Импорт из таблицы",
      updated: "только что"
    };
  }

  function importCsvLoads() {
    var input = byId("csvInput");
    var status = byId("importStatus");
    var text = input ? input.value : "";
    var rows = text.split(/\r?\n/);
    var imported = 0;

    for (var i = 0; i < rows.length; i += 1) {
      var row = rows[i].trim();
      var cells;
      if (!row) continue;
      cells = splitImportLine(row);
      if (isHeaderRow(cells)) continue;
      manualLoads.unshift(makeImportedLoad(cells, i));
      imported += 1;
    }

    if (!imported) {
      if (status) status.textContent = "Не нашел строк для импорта. Проверьте формат.";
      return;
    }

    writeSet("manualLoads", manualLoads);
    if (input) input.value = "";
    if (status) status.textContent = "Импортировано заявок: " + imported;
    runAutopilot();
    switchScreen("loads");
    renderLoads(getLoads());
  }

  function pasteImportExample() {
    var input = byId("csvInput");
    if (!input) return;
    input.value =
      "Москва; Казань; Паллеты с бытовой техникой; 8; 34; тент; задняя; 82000; ТК Восток; +7 900 100-10-10\n" +
      "Нижний Новгород; Самара; Сухие смеси; 14; 46; тент; боковая; 69000; СтройЛогистик; +7 900 200-20-20";
    setText("importStatus", "Пример вставлен. Нажмите импорт.");
  }

  function findFirstNumber(text, patterns, fallback) {
    var match;
    for (var i = 0; i < patterns.length; i += 1) {
      match = text.match(patterns[i]);
      if (match && match[1]) return numberCell(match[1], fallback);
    }
    return fallback;
  }

  function findPhone(text) {
    var match = text.match(/(\+?\d[\d\s()\-]{8,}\d)/);
    return match ? cleanCell(match[1]) : "не указан";
  }

  function findBody(text) {
    var value = normalize(text);
    if (value.indexOf("реф") !== -1 || value.indexOf("температур") !== -1) return "рефрижератор";
    if (value.indexOf("борт") !== -1) return "борт";
    if (value.indexOf("фург") !== -1) return "фургон";
    if (value.indexOf("тент") !== -1) return "тент";
    return "тент";
  }

  function findLoading(text) {
    var value = normalize(text);
    var result = [];
    if (value.indexOf("зад") !== -1) result.push("задняя");
    if (value.indexOf("бок") !== -1) result.push("боковая");
    if (value.indexOf("верх") !== -1) result.push("верхняя");
    if (value.indexOf("паллет") !== -1) result.push("паллеты");
    if (value.indexOf("температур") !== -1) result.push("температура");
    return result.length ? result.join(" / ") : "задняя / боковая";
  }

  function parseRoute(text) {
    var match = text.match(/([А-Яа-яA-Za-zЁё\-\s]+?)\s*(?:→|->|-|—)\s*([А-Яа-яA-Za-zЁё\-\s]+?)(?:[.,;\n]|$)/);
    if (!match) return { from: "Москва", to: "Казань" };
    return {
      from: cleanCell(match[1]) || "Москва",
      to: cleanCell(match[2]) || "Казань"
    };
  }

  function parseTitle(text) {
    var match = text.match(/(?:груз|товар)\s*[:\-]?\s*([^.,;\n]+)/i);
    if (match && match[1]) return cleanCell(match[1]);
    return "Заявка из сообщения";
  }

  function parseMessageLoad() {
    var input = byId("messageInput");
    var status = byId("messageImportStatus");
    var text = input ? input.value : "";
    var route;
    var load;

    if (!text.trim()) {
      if (status) status.textContent = "Вставьте текст заявки.";
      return;
    }

    route = parseRoute(text);
    load = {
      id: new Date().getTime(),
      from: route.from,
      to: route.to,
      title: parseTitle(text),
      date: "2026-05-04",
      weight: findFirstNumber(text, [/(\d+(?:[,.]\d+)?)\s*т\b/i, /вес\s*[:\-]?\s*(\d+(?:[,.]\d+)?)/i], 10),
      volume: findFirstNumber(text, [/(\d+(?:[,.]\d+)?)\s*м3/i, /объем\s*[:\-]?\s*(\d+(?:[,.]\d+)?)/i], 40),
      body: findBody(text),
      loading: findLoading(text),
      rate: findFirstNumber(text, [/ставк[аеи]?\s*[:\-]?\s*(\d[\d\s]*)/i, /(\d[\d\s]*)\s*(?:руб|₽)/i], 75000),
      detour: 10,
      distance: 600,
      reliability: 86,
      loadingHours: 3,
      company: "Заявка из сообщения",
      phone: findPhone(text),
      pickup: route.from,
      dropoff: route.to,
      comment: "Импорт из Telegram/почты",
      updated: "только что"
    };

    manualLoads.unshift(load);
    writeSet("manualLoads", manualLoads);
    if (input) input.value = "";
    if (status) status.textContent = "Создан груз: " + load.from + " → " + load.to + ", ставка " + money(load.rate);
    runAutopilot();
    switchScreen("loads");
    renderLoads(getLoads());
  }

  function pasteMessageExample() {
    var input = byId("messageInput");
    if (!input) return;
    input.value = "Москва - Казань. Груз: паллеты с бытовой техникой, 8 т, 34 м3, тент, задняя погрузка. Ставка 82000 руб. Телефон +7 900 100-10-10";
    setText("messageImportStatus", "Пример вставлен. Нажмите создание груза.");
  }

  function runAutopilot() {
    var list = getLoads();
    var best = list[0];
    if (!best) {
      setText("autopilotStatus", "Нет рейса под текущие ограничения");
      return;
    }
    lastBestLoad = best;

    setText("autopilotStatus", "Подбор выполнен");
    setText("fillRate", Math.min(100, Math.round((best.weight / (Number((byId("capacityInput") || {}).value) || 20)) * 100)) + "%");
    setText("bestProfit", money(best.margin));
    setText("stopCount", "1");
    setText("ratePerKm", rubKm(best.rate / (best.distance + best.detour)));
    setText("bundleTitle", best.to);
    setText("bundlePlan", "Найден лучший груз: " + best.title + ". Маржа " + money(best.margin) + ", крюк " + best.detour + " км. Минимальная ставка для торга " + money(best.minRate) + ".");
    setText("avgRate", money(best.margin));
    setText("bestDetour", best.score + "/100");
    setText("idleHours", "2 ч");
    setText("focusText", best.action);
    setText("replyText", "Здравствуйте. Машина подходит под груз. Готовы забрать по ставке от " + money(Math.max(best.rate, best.minRate)) + ". Подтвердите оплату, адреса и окно погрузки.");
    renderProfessionalOps(best);
    renderLoads(list);

    var panel = byId("autopilotPanel");
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function acceptBestLoad() {
    var list = getLoads();
    var best = lastBestLoad || list[0];
    if (!best) {
      setText("autopilotStatus", "Нет рейса для принятия");
      return;
    }
    addOnce(saved, best.id);
    addOnce(responses, best.id);
    tripStatuses[String(best.id)] = "Отклик отправлен";
    writeSet("savedLoads", saved);
    writeSet("respondedLoads", responses);
    writeObject("tripStatuses", tripStatuses);
    setText("autopilotStatus", "Рейс принят в работу");
    setText("bundlePlan", "Рейс принят: " + best.from + " → " + best.to + ", " + best.title + ". Проверьте раздел “Отклики”.");
    renderResponses();
    switchScreen("responses");
  }

  function renderLoads(list) {
    var target = byId("loadsList");
    clear(target);
    if (!target) return;
    if (!list.length) {
      target.innerHTML = '<div class="empty-state">Подходящих грузов пока нет.</div>';
      return;
    }
    for (var i = 0; i < list.length; i += 1) {
      target.appendChild(makeCard(list[i]));
    }
    setText("resultMeta", list.length + " заявка найдено");
  }

  function renderResponses() {
    var target = byId("responsesList");
    clear(target);
    if (!target) return;
    var list = getLoads();
    var count = 0;
    for (var i = 0; i < list.length; i += 1) {
      if (has(responses, list[i].id)) {
        target.appendChild(makeCard(list[i]));
        count += 1;
      }
    }
    if (!count) target.innerHTML = '<div class="empty-state">Откликов пока нет.</div>';
    setText("responsesMeta", count + " откликов в работе");
  }

  function renderSources() {
    var count = byId("connectedCount");
    var list = byId("connectedSources");
    if (count) count.textContent = sources.length;
    clear(list);
    if (!list) return;
    if (!sources.length) {
      list.innerHTML = '<div class="empty-state">Пока источников нет. Подключите биржу или канал заявок.</div>';
      return;
    }
    for (var i = 0; i < sources.length; i += 1) {
      var item = document.createElement("div");
      item.className = "connected-source";
      item.innerHTML =
        '<div><strong>' +
        sources[i].name +
        '</strong><span>' +
        sources[i].type +
        ' · активен</span></div><span class="status-pill">активен</span>';
      list.appendChild(item);
    }
  }

  function switchScreen(screen) {
    currentScreen = screen;
    var panels = document.querySelectorAll(".app-screen");
    var buttons = document.querySelectorAll(".nav-item");
    var target = null;
    var isDesktop = window.matchMedia && window.matchMedia("(min-width: 721px)").matches;
    for (var i = 0; i < panels.length; i += 1) {
      if (panels[i].getAttribute("data-screen-panel") === screen) {
        target = panels[i];
        panels[i].style.display = "block";
        if (panels[i].className.indexOf("active-screen") === -1) panels[i].className += " active-screen";
      } else {
        panels[i].style.display = isDesktop ? "none" : "block";
        panels[i].className = panels[i].className.replace(" active-screen", "");
      }
    }
    for (var j = 0; j < buttons.length; j += 1) {
      buttons[j].className = buttons[j].className.replace(" active", "");
      if (buttons[j].getAttribute("data-screen") === screen) buttons[j].className += " active";
    }
    if (target && !isDesktop) target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (isDesktop) window.scrollTo(0, 0);
  }

  function init() {
    var debugPanel = byId("debugPanel");
    if (debugPanel) debugPanel.hidden = true;
    applyTruckProfile();
    var run = byId("runAutopilot");
    if (run) {
      run.onclick = runAutopilot;
      run.ontouchend = function (event) {
        event.preventDefault();
        runAutopilot();
      };
    }
    var accept = byId("acceptBest");
    if (accept) {
      accept.onclick = acceptBestLoad;
      accept.ontouchend = function (event) {
        event.preventDefault();
        acceptBestLoad();
      };
    }
    var nav = document.querySelectorAll(".nav-item");
    for (var i = 0; i < nav.length; i += 1) {
      nav[i].onclick = function () {
        switchScreen(this.getAttribute("data-screen"));
        if (currentScreen === "loads") renderLoads(getLoads());
        if (currentScreen === "responses") renderResponses();
        if (currentScreen === "sources") renderSources();
      };
      nav[i].ontouchend = function (event) {
        event.preventDefault();
        switchScreen(this.getAttribute("data-screen"));
        if (currentScreen === "loads") renderLoads(getLoads());
        if (currentScreen === "responses") renderResponses();
        if (currentScreen === "sources") renderSources();
      };
    }
    var addSource = byId("addSource");
    if (addSource) {
      addSource.onclick = function () {
        var type = (byId("sourceTypeInput") || {}).value || "Биржа/API";
        var exchange = (byId("exchangeInput") || {}).value || "";
        var name = (byId("sourceNameInput") || {}).value || exchange || type;
        sources.unshift({ name: name, type: exchange || type });
        writeSet("connectedSources", sources);
        renderSources();
      };
      addSource.ontouchend = function (event) {
        event.preventDefault();
        addSource.onclick();
      };
    }
    var saveProfile = byId("saveProfile");
    if (saveProfile) {
      saveProfile.onclick = saveTruckProfile;
      saveProfile.ontouchend = function (event) {
        event.preventDefault();
        saveTruckProfile();
      };
    }
    var saveManualLoad = byId("saveManualLoad");
    if (saveManualLoad) {
      saveManualLoad.onclick = function () {
        var id = new Date().getTime();
        var load = {
          id: id,
          from: (byId("manualFromInput") || {}).value || "Москва",
          to: (byId("manualToInput") || {}).value || "Казань",
          title: (byId("manualTitleInput") || {}).value || "Ручная заявка",
          date: "2026-05-04",
          weight: Number((byId("manualWeightInput") || {}).value) || 10,
          volume: Number((byId("manualVolumeInput") || {}).value) || 40,
          body: (byId("manualBodyInput") || {}).value || "тент",
          loading: (byId("manualLoadingInput") || {}).value || "задняя / боковая",
          rate: Number((byId("manualRateInput") || {}).value) || 75000,
          detour: 10,
          distance: 600,
          reliability: 90,
          loadingHours: 3,
          company: (byId("manualCompanyInput") || {}).value || "Прямой заказчик",
          phone: (byId("manualPhoneInput") || {}).value || "не указан",
          pickup: (byId("manualPickupInput") || {}).value || "адрес погрузки не указан",
          dropoff: (byId("manualDropoffInput") || {}).value || "адрес выгрузки не указан",
          comment: (byId("manualCommentInput") || {}).value || "без комментария",
          updated: "только что"
        };
        manualLoads.unshift(load);
        writeSet("manualLoads", manualLoads);
        runAutopilot();
        switchScreen("loads");
        renderLoads(getLoads());
      };
      saveManualLoad.ontouchend = function (event) {
        event.preventDefault();
        saveManualLoad.onclick();
      };
    }
    var importCsv = byId("importCsvLoads");
    if (importCsv) {
      importCsv.onclick = importCsvLoads;
      importCsv.ontouchend = function (event) {
        event.preventDefault();
        importCsvLoads();
      };
    }
    var pasteExample = byId("pasteExample");
    if (pasteExample) {
      pasteExample.onclick = pasteImportExample;
      pasteExample.ontouchend = function (event) {
        event.preventDefault();
        pasteImportExample();
      };
    }
    var parseMessage = byId("parseMessageLoad");
    if (parseMessage) {
      parseMessage.onclick = parseMessageLoad;
      parseMessage.ontouchend = function (event) {
        event.preventDefault();
        parseMessageLoad();
      };
    }
    var pasteMessage = byId("pasteMessageExample");
    if (pasteMessage) {
      pasteMessage.onclick = pasteMessageExample;
      pasteMessage.ontouchend = function (event) {
        event.preventDefault();
        pasteMessageExample();
      };
    }
    var testServer = byId("testServer");
    if (testServer) {
      testServer.onclick = testServerConnection;
      testServer.ontouchend = function (event) {
        event.preventDefault();
        testServerConnection();
      };
    }
    var inputs = document.querySelectorAll("input, select");
    for (var j = 0; j < inputs.length; j += 1) {
      inputs[j].onchange = function () {
        runAutopilot();
      };
    }
    switchScreen("trip");
    runAutopilot();
    renderSources();
    window.__autologistReady = true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
