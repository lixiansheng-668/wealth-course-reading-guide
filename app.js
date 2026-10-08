(function () {
  /* ——— share mode (?share=N) ——— */
  var shareAttr = document.documentElement.getAttribute("data-share");
  var shareLessonId = null;
  if (shareAttr !== null) {
    var shareTarget = document.getElementById("lesson-" + shareAttr);
    if (shareTarget) {
      shareLessonId = shareTarget.id;
      shareTarget.classList.add("share-target");
      var shareH3 = shareTarget.querySelector("h3");
      if (shareH3) {
        document.title = "第 " + parseInt(shareAttr, 10) + " 课 · " + shareH3.textContent.trim() + " | 财富课";
      }
      var brandLink = document.querySelector(".brand");
      if (brandLink) brandLink.setAttribute("href", "index.html");
    } else {
      document.documentElement.classList.remove("share-mode");
      document.documentElement.removeAttribute("data-share");
    }
  }

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
    if (bar) {
      bar.setAttribute("aria-valuenow", String(done));
      bar.setAttribute("aria-valuetext", "已完成 " + done + " / " + TOTAL_LESSONS + " 课");
    }
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
    "l2-runway": {
      lesson: "lesson-2",
      question:
        "用跑道公式看自己：如果下个月收入中断，你家能撑几个月？算的时候，分母用的是「现在的开销」，还是「压缩后的刚性支出」？",
      answerHtml:
        "<p>跑道 = 存款 ÷ 压缩后的刚性月支出（月供照付 + 基本生活）。两个常见发现：一、第一次认真算，多数人会发现跑道比自己以为的短——因为分母该用危机时的基本盘，不是现在的生活水平；二、同样的存款，刚性支出差一倍，跑道就差一倍——所以「压负债」和「存钱」是同一件事的两面（第 11 课的前两层）。跑道不足 6 个月时，补跑道优先于任何投资。</p>",
    },
    "l3-bubble": {
      lesson: "lesson-3",
      question: "房价上涨，更像收入/人口/租金等基本面变化，还是「相信继续涨所以借钱买」的信用扩张？",
      answerHtml:
        "<p>先问上涨由谁推动：真实使用需求与支付能力，还是杠杆与预期自我强化。若主要靠借钱追涨，价格对信贷和情绪更敏感，下跌时也更容易出现被迫卖出。</p>",
    },
    "l4-bankrun": {
      lesson: "lesson-4",
      question: "银行 A：存款 100、其中 90 已放贷、自有资本 10。为什么只是 30 位储户要取走 40，它就可能倒下？",
      answerHtml:
        "<p>死穴是「短存长贷」：90 的贷款还没到期收不回来，只能打折卖（比如只卖 70），加上资本 10 也兑不上 100 的存款——「只能拿回八折」的消息一出，本来不动的人也来挤兑，预言自我实现。挤兑可怕的不在亏损本身，而在恐慌会传染。现代体系用存款保险终结它：让「不用跑」成为共识，恐慌就断了燃料——1933 年后美国再无大规模挤兑。</p>",
    },
    "l5-repay": {
      lesson: "lesson-5",
      question: "一家资产 10 亿、负债 6 亿、每年利润 0.5 亿的好公司，泡沫破后资产跌到 7 亿。为什么它明明还在赚钱，却停止扩张、冻结招聘？",
      answerHtml:
        "<p>因为它的目标从「赚更多」切换成了「修复资产负债表」：净资产只剩 1 亿，再波动一次就是资不抵债——于是每年 0.5 亿利润全部拿去还债，6 亿要还 12 年。这不是管理层糊涂，是理性：先活到能扩张的那天。当全国企业同时这么做，就是「资产负债表衰退」：借款人集体消失，利率降到零也没人借，只能靠政府举债接漏。</p>",
    },
    "l6-credit": {
      lesson: "lesson-6",
      question: "2008 年，绝大多数普通人没有碰过任何金融衍生品，为什么还是被危机击中？",
      answerHtml:
        "<p>因为金融是现代社会的血液循环——凝血发生在心脏，疼的是四肢：银行互不信任 → 同业拆借冻结 → 实体企业借不到周转钱 → 裁员；房价下跌同时把一批家庭变成「负资产」，养老金账户腰斩。工资、房价、退休金三条线，把不投资的人也拉进危机。这就是「系统性风险」的含义：没有人能退出这个系统。</p>",
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
    "l9-land": {
      lesson: "lesson-9",
      question: "中国地方政府为什么这么依赖卖地和土地抵押？这套模式的天才和命门分别是什么？",
      answerHtml:
        "<p>起点是 1994 年分税制：税收大头归中央，支出责任留在地方，地方「钱少事多」，只能经营手里唯一的资产——城市土地。天才：拿未来的地价收益，今天就把路、地铁、园区建起来，这是基建奇迹的融资引擎。命门：整台机器建立在「土地必须一直涨」上——城市化放缓、人口见顶后，卖地收入下滑、城投承压，正反馈反转成负反馈，债务与化债由此而来。</p>",
    },
    "l10-flow": {
      lesson: "lesson-10",
      question: "用「水的流向」审一遍自己的钱包：过去一年，你的支出里哪些在收缩，哪些在扩张？收缩掉的钱，最后流去了哪里？",
      answerHtml:
        "<p>典型的收缩侧：可选消费、面子消费、高溢价品牌；典型的扩张侧：性价比、维修翻新、低价娱乐、为确定性付的钱。总量上你在「消费降级」，结构上你其实在重新分配自己的需求。个体这样选，宏观上就是第 10 课那张改道图——看得懂水的去向，选行业、练技能、做投资用的是同一张地图。</p>",
    },
    "l11-stress": {
      lesson: "lesson-11",
      question: "给自家做一次压力测试：收入砍四成、半年找不到新工作，你家会怎样？四层防线（现金、负债、收入、技能）里，哪一层最薄？",
      answerHtml:
        "<p>算法：刚性支出（月供 + 最低生活）× 6，和存款比一比，得出跑道月数；再看月供占收入是否在四成以内、家里是否只有一份收入、你的技能离开现公司还值不值钱。结果通常指向一层最短板——先补它：防御体系看的是下限，不是平均分。第 11 课的老陈家，就是从最薄的车贷和单一收入开始修的。</p>",
    },
    "l12-dashboard": {
      lesson: "lesson-12",
      question: "试着填第一份监测记录：这个月，你身边能观察到的招聘、信贷（问一位做小生意的朋友）、消费情绪，各是什么方向？",
      answerHtml:
        "<p>不需要专业数据：招聘看招聘 App 的岗位数和 HR 回复速度；信贷问小生意老板「这个月银行松不松」；消费看商场客流和外卖满减的力度。三个方向同向才算信号，单一涨跌只是噪音；最后记上「自己」那一行——跑道月数。连续记三个月，你手里就有第一张属于自己的趋势图。终点是动作，不是预测。</p>",
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

  /* ——— share buttons ——— */
  function legacyCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return legacyCopy(text); }
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  function shareUrlFor(id) {
    var url = new URL(window.location.href);
    url.search = "?share=" + id;
    url.hash = "";
    return url.toString();
  }

  function initShareButtons() {
    if (shareLessonId) return;
    lessons.forEach(function (lesson) {
      var id = (lesson.id || "").replace("lesson-", "");
      var head = lesson.querySelector(".lesson-head");
      if (!head) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lesson-share";
      btn.textContent = "分享本课";
      btn.addEventListener("click", function () {
        var href = shareUrlFor(id);
        btn.dataset.shareUrl = href;
        copyText(href).then(function (ok) {
          if (ok) {
            btn.textContent = "链接已复制";
            btn.classList.add("is-copied");
            setTimeout(function () {
              btn.textContent = "分享本课";
              btn.classList.remove("is-copied");
            }, 2200);
          } else {
            window.open(href, "_blank", "noopener");
          }
        });
      });
      head.appendChild(btn);
    });
  }

  if (!shareLessonId) {
    initProgress();
    initDashboard();
  }
  initProbes();
  initRunway();
  initChains();
  initShareButtons();
})();
