(function () {
  var store = window.WealthStore;
  if (!store) return;

  var TOTAL_LESSONS = 13;

  /* ——— existing nav ——— */
  var navToggle = document.querySelector(".nav-toggle");
  var topNav = document.querySelector(".top-nav");
  var lessonLinks = Array.from(document.querySelectorAll(".lesson-nav a"));
  var lessons = Array.from(document.querySelectorAll(".lesson[id]"));
  var printBtn = document.getElementById("print-dash");

  if (navToggle && topNav) {
    navToggle.addEventListener("click", function () {
      var open = topNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "关闭课节目录" : "打开课节目录");
    });
    topNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        topNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "打开课节目录");
      });
    });
  }

  function setActiveLesson() {
    if (!lessons.length || !lessonLinks.length) return;
    var offset = 120;
    var currentId = lessons[0].id;
    for (var i = 0; i < lessons.length; i++) {
      var rect = lessons[i].getBoundingClientRect();
      if (rect.top - offset <= 0) currentId = lessons[i].id;
    }
    lessonLinks.forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var id = href.replace("#", "");
      link.classList.toggle("active", id === currentId);
    });
  }

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        setActiveLesson();
        ticking = false;
      });
    },
    { passive: true }
  );
  setActiveLesson();

  if (printBtn) {
    printBtn.addEventListener("click", function () {
      window.print();
    });
  }

  /* ——— S2.2 progress ——— */
  function loadProgress() {
    return store.read("progress", { lessons: {}, updatedAt: null });
  }

  function saveProgress(state) {
    state.updatedAt = new Date().toISOString();
    store.write("progress", state);
  }

  function countDone(progress) {
    var n = 0;
    for (var k in progress.lessons) {
      if (progress.lessons[k]) n++;
    }
    return n;
  }

  function initProgress() {
    var main = document.querySelector(".lessons-main .section-head");
    if (!main) return;
    var progress = loadProgress();

    var panel = document.createElement("div");
    panel.className = "progress-panel";
    panel.innerHTML =
      '<div class="progress-meta">' +
      "<span>学习进度</span>" +
      '<span class="progress-count"><span id="progress-done">0</span> / ' +
      TOTAL_LESSONS +
      "</span></div>" +
      '<div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="' +
      TOTAL_LESSONS +
      '" aria-valuenow="0" id="progress-bar">' +
      '<div class="progress-fill" id="progress-fill"></div></div>';
    main.insertAdjacentElement("afterend", panel);

    lessons.forEach(function (lesson) {
      var id = (lesson.id || "").replace("lesson-", "");
      var head = lesson.querySelector(".lesson-head");
      if (!head) return;
      var label = document.createElement("label");
      label.className = "lesson-done";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.className = "lesson-done-input";
      input.setAttribute("data-lesson", id);
      input.checked = !!progress.lessons[id];
      var span = document.createElement("span");
      span.textContent = "标记完成";
      label.appendChild(input);
      label.appendChild(span);
      head.appendChild(label);

      if (input.checked) lesson.classList.add("is-done");

      input.addEventListener("change", function () {
        progress.lessons[id] = input.checked;
        lesson.classList.toggle("is-done", input.checked);
        saveProgress(progress);
        renderProgress(progress);
      });
    });

    renderProgress(progress);
  }

  function renderProgress(progress) {
    var done = countDone(progress);
    var doneEl = document.getElementById("progress-done");
    var bar = document.getElementById("progress-bar");
    var fill = document.getElementById("progress-fill");
    if (doneEl) doneEl.textContent = String(done);
    if (bar) bar.setAttribute("aria-valuenow", String(done));
    if (fill) fill.style.width = (done / TOTAL_LESSONS) * 100 + "%";
    lessonLinks.forEach(function (link) {
      var id = (link.getAttribute("href") || "").replace("#lesson-", "");
      link.classList.toggle("is-done", !!progress.lessons[id]);
    });
  }

  /* ——— S2.3 probes ——— */
  var PROBES = {
    "l0-map": {
      lesson: "lesson-0",
      question: "一个国家的经济变好，到底是什么意思？GDP 增长了，为什么身边的人可能还是觉得日子不好过？",
      answerHtml:
        "<p>GDP 变好，通常指总产出/总收入增加。但「变好」不一定平均落到每个人：收入结构、就业质量、资产价格、债务负担和公共服务感受可能不同步。GDP 是总量地图，不是你的钱包。</p>",
    },
    "l1-thrift": {
      lesson: "lesson-1",
      question: "为什么一个人少花钱是理性的，但所有人同时少花钱，整个经济可能反而更差？",
      answerHtml:
        "<p>个人少花钱能增加自己的安全垫；若很多人同时减少消费，企业收入下降 → 投资与招聘减少 → 收入预期变差 → 更不敢消费。这是<strong>节俭悖论</strong>：个体理性加总后可能放大衰退。</p>",
    },
    "l3-bubble": {
      lesson: "lesson-3",
      question: "房价上涨，更像收入/人口/租金等基本面变化，还是「相信继续涨所以借钱买」的信用扩张？",
      answerHtml:
        "<p>先问上涨由谁推动：真实使用需求与支付能力，还是杠杆与预期自我强化。若主要靠借钱追涨，价格对信贷和情绪更敏感，下跌时也更容易出现被迫卖出。</p>",
    },
    "l7-observe": {
      lesson: "lesson-7",
      type: "checks",
      question: "观察你所在的行业（可勾选）",
      items: [
        "公司最近是在扩张还是收缩？",
        "招聘人数增加还是减少？",
        "客户是在增加预算还是压缩预算？",
        "哪些岗位最容易被削减？",
        "哪些技能依然有人愿意花钱？",
      ],
    },
    "l8-wait": {
      lesson: "lesson-8",
      question: "危机时期，你家更接近「高杠杆可能被迫卖出」，还是「低杠杆 + 现金 + 稳定收入」的等待能力路径？",
      answerHtml:
        "<p>重点不是谁更聪明，而是<strong>谁没有被迫出局</strong>。检查：负债率、现金月数、收入是否单一。等待能力来自资产负债表，而不是预测能力。</p>",
    },
  };

  function initProbes() {
    var probesState = store.read("probes", {});
    var saveProbes = store.debounce(function (state) {
      store.write("probes", state);
    }, 400);

    Object.keys(PROBES).forEach(function (probeId) {
      var conf = PROBES[probeId];
      var lesson = document.getElementById(conf.lesson);
      if (!lesson) return;
      var body = lesson.querySelector(".lesson-body");
      if (!body) return;

      var saved = probesState[probeId] || {};
      var el = document.createElement("div");
      el.className = "probe";
      el.setAttribute("data-probe", probeId);

      var q = document.createElement("p");
      q.className = "probe-q";
      q.textContent = conf.question;
      el.appendChild(q);

      if (conf.type === "checks") {
        var list = document.createElement("ul");
        list.className = "probe-checks";
        conf.items.forEach(function (item, idx) {
          var li = document.createElement("li");
          var lab = document.createElement("label");
          var cb = document.createElement("input");
          cb.type = "checkbox";
          cb.checked = !!(saved.checks && saved.checks[idx]);
          cb.addEventListener("change", function () {
            if (!probesState[probeId]) probesState[probeId] = {};
            if (!probesState[probeId].checks) probesState[probeId].checks = {};
            probesState[probeId].checks[idx] = cb.checked;
            store.write("probes", probesState);
          });
          lab.appendChild(cb);
          lab.appendChild(document.createTextNode(item));
          li.appendChild(lab);
          list.appendChild(li);
        });
        el.appendChild(list);
      } else {
        var wrap = document.createElement("label");
        wrap.className = "probe-input-label";
        wrap.textContent = "先写你的想法（可选）";
        var ta = document.createElement("textarea");
        ta.className = "probe-input";
        ta.rows = 3;
        ta.placeholder = "用自己的话写 1–3 句";
        ta.value = saved.note || "";
        ta.addEventListener("input", function () {
          if (!probesState[probeId]) probesState[probeId] = {};
          probesState[probeId].note = ta.value;
          saveProbes(probesState);
        });
        wrap.appendChild(ta);
        el.appendChild(wrap);

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-ghost probe-reveal";
        btn.setAttribute("aria-expanded", saved.revealed ? "true" : "false");
        btn.textContent = saved.revealed ? "收起参考思路" : "对照参考思路";

        var answer = document.createElement("div");
        answer.className = "probe-answer";
        answer.hidden = !saved.revealed;
        answer.innerHTML =
          '<p class="probe-answer-label">参考思路</p>' + conf.answerHtml;

        btn.addEventListener("click", function () {
          var open = answer.hidden;
          answer.hidden = !open;
          btn.setAttribute("aria-expanded", open ? "true" : "false");
          btn.textContent = open ? "收起参考思路" : "对照参考思路";
          if (!probesState[probeId]) probesState[probeId] = {};
          probesState[probeId].revealed = open;
          store.write("probes", probesState);
        });

        el.appendChild(btn);
        el.appendChild(answer);
      }

      body.appendChild(el);
    });
  }

  /* ——— S2.4 runway calculator ——— */
  function initRunway() {
    var host = document.getElementById("runway-calc");
    if (!host) return;
    var saved = store.read("runway", {
      cash: 0,
      assets: 0,
      expense: 0,
      income: 0,
      dropPct: 30,
    });

    host.innerHTML =
      '<div class="runway-grid">' +
      '<label>现金及存款<input type="number" min="0" step="1000" id="rw-cash" inputmode="decimal" /></label>' +
      '<label>其他可变现资产<input type="number" min="0" step="1000" id="rw-assets" inputmode="decimal" /></label>' +
      '<label>月固定支出<input type="number" min="0" step="100" id="rw-expense" inputmode="decimal" /></label>' +
      '<label>月稳定收入<input type="number" min="0" step="100" id="rw-income" inputmode="decimal" /></label>' +
      "</div>" +
      '<label class="runway-slider-label">收入下降比例 <strong id="rw-drop-label">30%</strong>' +
      '<input type="range" id="rw-drop" min="0" max="70" step="5" /></label>' +
      '<div class="runway-result" id="rw-result" aria-live="polite">' +
      '<p class="runway-months">可撑 <strong id="rw-months">—</strong></p>' +
      '<p class="runway-note" id="rw-note">填入数字后即时计算。数据只留在本机浏览器。</p>' +
      "</div>";

    var cash = document.getElementById("rw-cash");
    var assets = document.getElementById("rw-assets");
    var expense = document.getElementById("rw-expense");
    var income = document.getElementById("rw-income");
    var drop = document.getElementById("rw-drop");
    var dropLabel = document.getElementById("rw-drop-label");
    var monthsEl = document.getElementById("rw-months");
    var noteEl = document.getElementById("rw-note");

    function num(el) {
      var v = parseFloat(el.value);
      return isFinite(v) && v >= 0 ? v : 0;
    }

    function persist() {
      store.write("runway", {
        cash: num(cash),
        assets: num(assets),
        expense: num(expense),
        income: num(income),
        dropPct: parseFloat(drop.value) || 0,
      });
    }

    function compute() {
      var liquid = num(cash) + num(assets);
      var exp = num(expense);
      var inc = num(income);
      var pct = parseFloat(drop.value) || 0;
      var newIncome = inc * (1 - pct / 100);
      var surplus = newIncome - exp;
      dropLabel.textContent = pct + "%";

      if (inc === 0 && exp === 0 && liquid === 0) {
        monthsEl.textContent = "—";
        noteEl.textContent = "填入数字后即时计算。数据只留在本机浏览器。";
        noteEl.className = "runway-note";
        return;
      }

      if (surplus >= 0) {
        monthsEl.textContent = "现金流可覆盖";
        noteEl.textContent =
          "收入下降 " + pct + "% 后仍可覆盖支出，账面盈余 " + Math.round(surplus) + "。继续维持现金缓冲。";
        noteEl.className = "runway-note is-ok";
        return;
      }

      var months = liquid / Math.abs(surplus);
      var rounded = Math.round(months * 10) / 10;
      monthsEl.textContent = rounded + " 个月";

      if (months < 3) {
        noteEl.textContent =
          "高风险：缓冲不足 3 个月。优先压缩非必要支出、降低刚性负债，或尽快增加收入来源。";
        noteEl.className = "runway-note is-risk";
      } else if (months < 6) {
        noteEl.textContent =
          "偏紧：缓冲在 3–6 个月。避免新增高杠杆，把「现金月数」当作家庭仪表盘核心指标。";
        noteEl.className = "runway-note is-tight";
      } else if (months < 12) {
        noteEl.textContent =
          "较稳：可撑约 " + rounded + " 个月。保持纪律，不要因为焦虑做超出能力的资产决策。";
        noteEl.className = "runway-note is-ok";
      } else {
        noteEl.textContent =
          "缓冲充足（" + rounded + " 个月）。等待能力本身就是竞争力；不必急于「抄底」。";
        noteEl.className = "runway-note is-ok";
      }
    }

    cash.value = saved.cash || "";
    assets.value = saved.assets || "";
    expense.value = saved.expense || "";
    income.value = saved.income || "";
    drop.value = saved.dropPct != null ? saved.dropPct : 30;

    [cash, assets, expense, income, drop].forEach(function (el) {
      el.addEventListener("input", function () {
        compute();
        persist();
      });
    });
    compute();
  }

  /* ——— S2.5 logic chains ——— */
  function initChains() {
    document.querySelectorAll(".logic-chain").forEach(function (chain, index) {
      if (chain.classList.contains("vertical") && chain.querySelector("span")) {
        /* still support */
      }
      var spans = Array.from(chain.querySelectorAll(":scope > span"));
      if (spans.length < 2) return;

      chain.classList.add("is-stepped");
      spans.forEach(function (s) {
        s.classList.add("chain-step");
      });

      var id = chain.getAttribute("data-chain") || "chain-" + index;
      chain.setAttribute("data-chain", id);

      var step = 0;
      var controls = document.createElement("div");
      controls.className = "chain-controls";
      var nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "btn btn-ghost chain-next";
      nextBtn.textContent = "下一步";
      var resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "btn btn-ghost chain-reset";
      resetBtn.textContent = "重置";
      resetBtn.hidden = true;
      controls.appendChild(nextBtn);
      controls.appendChild(resetBtn);
      chain.insertAdjacentElement("afterend", controls);

      function paint() {
        spans.forEach(function (s, i) {
          s.classList.toggle("is-lit", i < step);
        });
        if (step >= spans.length) {
          nextBtn.hidden = true;
          resetBtn.hidden = false;
        } else {
          nextBtn.hidden = false;
          resetBtn.hidden = true;
          nextBtn.textContent =
            step === 0 ? "点亮第一步" : "下一步（" + step + "/" + spans.length + "）";
        }
      }

      nextBtn.addEventListener("click", function () {
        if (step < spans.length) {
          step += 1;
          paint();
        }
      });
      resetBtn.addEventListener("click", function () {
        step = 0;
        paint();
      });
      paint();
    });
  }

  /* ——— S2.6 dashboard ——— */
  var DASH_ROWS = [
    { id: "hire", label: "招聘" },
    { id: "wage", label: "工资" },
    { id: "biz", label: "企业" },
    { id: "consume", label: "消费" },
    { id: "realestate", label: "房地产" },
    { id: "credit", label: "信贷" },
    { id: "cpi", label: "物价" },
    { id: "rate", label: "利率" },
    { id: "self", label: "自己" },
  ];

  function initDashboard() {
    var table = document.querySelector("#dash-print .simple-table");
    if (!table) return;
    var state = store.read("dashboard", { month: "", rows: {} });
    var monthInput = document.getElementById("dash-month");
    var nameInput = document.getElementById("dash-name");
    var clearBtn = document.getElementById("dash-clear");

    if (monthInput) {
      monthInput.value = state.month || "";
      monthInput.addEventListener("change", function () {
        state.month = monthInput.value;
        store.write("dashboard", state);
      });
    }
    if (nameInput) {
      nameInput.value = state.name || "";
      nameInput.addEventListener("input", function () {
        state.name = nameInput.value;
        store.write("dashboard", state);
      });
    }

    var tbody = table.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    DASH_ROWS.forEach(function (row) {
      var saved = state.rows[row.id] || { call: "", note: "" };
      var tr = document.createElement("tr");
      tr.setAttribute("data-dash-row", row.id);
      tr.innerHTML =
        "<td>" +
        row.label +
        "</td><td class=\"dash-observe\"></td>" +
        '<td><input type="text" class="dash-input dash-call" aria-label="' +
        row.label +
        ' 本月判断" /></td>' +
        '<td><input type="text" class="dash-input dash-note" aria-label="' +
        row.label +
        ' 证据备注" /></td>';

      /* keep observe text from original table order */
      var OBSERVE = {
        hire: "岗位增加还是减少",
        wage: "是否还在上涨",
        biz: "利润和投资是否改善",
        consume: "消费者是否更谨慎",
        realestate: "成交是否活跃",
        credit: "企业和居民是否愿意借钱",
        cpi: "通胀还是通缩压力",
        rate: "资金成本变化",
        self: "现金流和负债是否安全",
      };
      tr.querySelector(".dash-observe").textContent = OBSERVE[row.id] || "";
      var call = tr.querySelector(".dash-call");
      var note = tr.querySelector(".dash-note");
      call.value = saved.call || "";
      note.value = saved.note || "";
      call.addEventListener("input", function () {
        if (!state.rows[row.id]) state.rows[row.id] = {};
        state.rows[row.id].call = call.value;
        store.write("dashboard", state);
      });
      note.addEventListener("input", function () {
        if (!state.rows[row.id]) state.rows[row.id] = {};
        state.rows[row.id].note = note.value;
        store.write("dashboard", state);
      });
      tbody.appendChild(tr);
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (!window.confirm("清空本月仪表盘填写内容？此操作不可撤销。")) return;
        state = { month: monthInput ? monthInput.value : "", name: nameInput ? nameInput.value : "", rows: {} };
        store.write("dashboard", state);
        tbody.querySelectorAll("input").forEach(function (input) {
          input.value = "";
        });
      });
    }
  }

  initProgress();
  initProbes();
  initRunway();
  initChains();
  initDashboard();
})();
