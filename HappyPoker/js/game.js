(function () {
  const DDZ = window.DDZ;
  const $ = function (id) { return document.getElementById(id); };

  const state = {
    phase: "menu",
    hands: [[], [], []],
    bottom: [],
    landlord: -1,
    caller: -1,
    callMult: 1,
    callTurn: 0,
    firstPlayer: 0,
    robQueue: [],
    finalRob: false,
    current: 0,
    lastPlay: null,
    passCount: 0,
    selected: new Set(),
    bombs: 0,
    playedOnce: [false, false, false],
    landlordLeads: 0,
    names: ["我", "电脑甲", "电脑乙"],
    scores: [1000, 1000, 1000],
    thinking: false,
  };

  const START_SCORE = 1000;
  const BASE_SCORE = 8;

  let toastTimer = 0;
  let runId = 0;

  function toast(text) {
    const el = $("toast");
    el.textContent = text;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.add("hidden"); }, 1400);
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function lockLandscape() {
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(function () {});
      }
    } catch (e) {}
  }

  function cardHTML(c, extraClass, z) {
    const cls = ["card", c.color, extraClass || ""].join(" ");
    const zAttr = z != null ? ' style="z-index:' + z + '"' : "";
    if (c.joker) {
      return '<div class="' + cls + '" data-id="' + c.id + '"' + zAttr + '><span class="joker-text">JOKER</span></div>';
    }
    const rankCls = c.rank === "10" ? " ten" : "";
    return (
      '<div class="' + cls + rankCls + '" data-id="' + c.id + '"' + zAttr + ">" +
      '<span class="corner"><span class="rank">' + c.rank + "</span><i>" + c.suit + "</i></span>" +
      '<span class="suit-big">' + c.suit + "</span></div>"
    );
  }

  function backHTML() {
    return '<div class="card back"></div>';
  }

  function selectedCards() {
    return state.hands[0].filter(function (c) { return state.selected.has(c.id); });
  }

  function nextPlayer(p) {
    return (p + 2) % 3;
  }

  function isAuction() {
    return state.phase === "call" || state.phase === "rob";
  }

  function gameMult() {
    return (state.callMult || 1) * Math.pow(2, state.bombs);
  }

  function anyoneBroke() {
    return state.scores.some(function (s) { return s < 0; });
  }

  function roleName(p) {
    if (state.landlord < 0) return "";
    return p === state.landlord ? "地主" : "农民";
  }

  function renderMini(p) {
    const el = $("mini-" + p);
    const hand = state.hands[p];
    $("count-" + p).textContent = hand.length + "张";
    const n = Math.min(hand.length, 12);
    let html = "";
    for (let i = 0; i < n; i++) html += '<div class="mini-card"></div>';
    el.innerHTML = html;
  }

  function renderPlayed(p, cards) {
    const el = $("played-" + p);
    el.classList.remove("remain");
    if (!cards || !cards.length) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML = DDZ.layoutPlayed(cards).map(function (c, i) { return cardHTML(c, "", i + 1); }).join("");
  }

  function setCall(p, text) {
    const el = $("played-" + p);
    el.classList.remove("remain");
    if (!text) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML = '<div class="call">' + text + "</div>";
  }

  function revealRemain() {
    for (let p = 1; p <= 2; p++) {
      const rest = DDZ.sortCards(state.hands[p]);
      const el = $("played-" + p);
      if (!rest.length) {
        el.classList.remove("remain");
        continue;
      }
      el.classList.add("remain");
      el.innerHTML = rest.map(function (c, i) { return cardHTML(c, "", i + 1); }).join("");
    }
  }

  function setBubble(p, text) {
    const el = $("bubble-" + p);
    if (!text) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }
    el.textContent = text;
    el.classList.remove("hidden");
  }

  function clearBubbles() {
    for (let i = 0; i < 3; i++) setBubble(i, "");
  }

  function renderBottom(face) {
    const el = $("bottom-cards");
    if (!state.bottom.length) {
      el.innerHTML = "";
      return;
    }
    if (!face) {
      el.innerHTML = backHTML() + backHTML() + backHTML();
      return;
    }
    el.innerHTML = DDZ.sortCards(state.bottom).map(function (c, i) { return cardHTML(c, "", i + 1); }).join("");
  }

  function renderSeats() {
    for (let p = 0; p < 3; p++) {
      const role = roleName(p);
      $("name-" + p).textContent = state.names[p];
      const roleEl = $("role-" + p);
      roleEl.textContent = role;
      roleEl.classList.toggle("hidden", !role);
      if (p > 0) {
        $("avatar-" + p).textContent = role === "地主" ? "地" : role === "农民" ? "农" : (p === 1 ? "甲" : "乙");
        $("avatar-" + p).classList.toggle("landlord", p === state.landlord);
        $("avatar-" + p).classList.toggle("turn", (isAuction() || state.phase === "play") && state.current === p);
        renderMini(p);
      }
      $("score-" + p).textContent = state.scores[p] + "分";
    }
    $("mult").textContent = String(gameMult());
  }

  function renderHand() {
    const hand = DDZ.sortCards(state.hands[0]);
    const el = $("my-hand");
    el.classList.toggle("turn", state.phase === "play" && state.current === 0 && !state.thinking);
    el.innerHTML = hand.map(function (c, i) {
      return cardHTML(c, state.selected.has(c.id) ? "selected" : "", i + 1);
    }).join("");
  }

  function lastPlayFilter() {
    if (!state.lastPlay) return null;
    return {
      type: state.lastPlay.type,
      rank: state.lastPlay.rank,
      len: state.lastPlay.len,
      k: state.lastPlay.k,
    };
  }

  function canBeatLast() {
    return DDZ.findMoves(state.hands[0], lastPlayFilter()).length > 0;
  }

  function renderActions() {
    const box = $("actions");
    if (isAuction() && state.current === 0 && !state.thinking) {
      if (state.phase === "call") {
        box.innerHTML =
          '<button type="button" class="btn danger" data-act="auction-no">不叫</button>' +
          '<button type="button" class="btn primary" data-act="auction-yes">叫地主 ×2</button>';
      } else if (state.finalRob) {
        box.innerHTML =
          '<button type="button" class="btn danger" data-act="auction-no">不抢</button>' +
          '<button type="button" class="btn primary" data-act="auction-yes">我抢 ×2</button>';
      } else {
        box.innerHTML =
          '<button type="button" class="btn danger" data-act="auction-no">不抢</button>' +
          '<button type="button" class="btn primary" data-act="auction-yes">抢地主 ×2</button>';
      }
      return;
    }
    if (state.phase === "play" && state.current === 0 && !state.thinking) {
      const must = !state.lastPlay;
      const beat = canBeatLast();
      let html = '<button type="button" class="btn danger" data-act="pass"' + (must ? " disabled" : "") + ">不出</button>";
      if (beat) {
        html +=
          '<button type="button" class="btn ghost" data-act="hint">提示</button>' +
          '<button type="button" class="btn primary" data-act="play">出牌</button>';
      }
      box.innerHTML = html;
      return;
    }
    box.innerHTML = "";
  }

  function render() {
    if (state.phase === "deal") {
      renderActions();
      renderBottom(false);
      return;
    }
    renderSeats();
    renderHand();
    renderActions();
    renderBottom(state.phase === "play" || state.phase === "over");
  }

  function setMsg(t) { $("msg").textContent = t || ""; }

  function dealTarget(p) {
    if (p === 0) return $("my-hand");
    const mini = $("mini-" + p);
    if (mini.getBoundingClientRect().width > 4) return mini;
    return $("avatar-" + p);
  }

  function flyDealCard(p) {
    const layer = $("deal-layer");
    const deck = $("bottom-cards");
    if (!layer || !deck) return;
    const lr = layer.getBoundingClientRect();
    const from = deck.getBoundingClientRect();
    const to = dealTarget(p).getBoundingClientRect();
    const fly = document.createElement("div");
    fly.className = "card back deal-fly";
    fly.style.left = from.left + from.width / 2 - lr.left - 11 + "px";
    fly.style.top = from.top + from.height / 2 - lr.top - 16 + "px";
    layer.appendChild(fly);
    void fly.offsetWidth;
    requestAnimationFrame(function () {
      fly.style.left = to.left + to.width / 2 - lr.left - 11 + "px";
      fly.style.top = to.top + to.height / 2 - lr.top - 16 + "px";
      fly.style.opacity = "0";
      fly.style.transform = "scale(0.55)";
    });
    setTimeout(function () { if (fly.parentNode) fly.remove(); }, 300);
  }

  function pushMini(p) {
    const el = $("mini-" + p);
    $("count-" + p).textContent = state.hands[p].length + "张";
    if (el.children.length >= 12) return;
    const d = document.createElement("div");
    d.className = "mini-card pop";
    el.appendChild(d);
  }

  async function deal() {
    const id = runId;
    const deck = DDZ.shuffle(DDZ.createDeck());
    const raw = [deck.slice(0, 17), deck.slice(17, 34), deck.slice(34, 51)];
    state.hands = [[], [], []];
    state.bottom = deck.slice(51);
    state.thinking = true;
    state.landlord = -1;
    state.caller = -1;
    state.callMult = 1;
    state.callTurn = 0;
    state.robQueue = [];
    state.finalRob = false;
    state.lastPlay = null;
    state.passCount = 0;
    state.selected = new Set();
    state.bombs = 0;
    state.playedOnce = [false, false, false];
    state.landlordLeads = 0;
    state.phase = "deal";
    state.firstPlayer = Math.floor(Math.random() * 3);
    state.current = state.firstPlayer;
    for (let p = 0; p < 3; p++) {
      renderPlayed(p, []);
      setBubble(p, "");
    }
    const handEl = $("my-hand");
    handEl.innerHTML = "";
    handEl.classList.add("stacked");
    handEl.classList.remove("fanning", "turn");
    $("deal-layer").innerHTML = "";
    renderSeats();
    renderActions();
    renderBottom(false);
    setMsg("发牌中");

    for (let i = 0; i < 17; i++) {
      if (id !== runId) return;
      for (let p = 0; p < 3; p++) {
        state.hands[p].push(raw[p][i]);
        flyDealCard(p);
      }
      handEl.insertAdjacentHTML("beforeend", cardHTML(raw[0][i], "", i + 1));
      pushMini(1);
      pushMini(2);
      await sleep(68);
    }
    if (id !== runId) return;
    $("deal-layer").innerHTML = "";

    for (let i = 0; i < 3; i++) state.hands[i] = DDZ.sortCards(state.hands[i]);
    handEl.innerHTML = state.hands[0].map(function (c, i) {
      return cardHTML(c, "", i + 1);
    }).join("");
    handEl.classList.add("stacked");
    await sleep(50);
    if (id !== runId) return;

    handEl.classList.add("fanning");
    handEl.classList.remove("stacked");
    await sleep(560);
    if (id !== runId) return;

    handEl.classList.remove("fanning");
    state.phase = "call";
    state.thinking = false;
    render();
    setMsg("叫地主");
    nextAuction();
  }

  async function nextAuction() {
    const id = runId;
    if (state.phase === "call") {
      if (state.callTurn >= 3) {
        finishAuction();
        return;
      }
      const p = (state.firstPlayer + 2 * state.callTurn) % 3;
      state.current = p;
      render();
      if (p === 0) {
        setMsg("轮到你叫地主");
        return;
      }
      state.thinking = true;
      renderActions();
      setMsg(state.names[p] + " 思考中...");
      await sleep(500 + Math.random() * 400);
      if (id !== runId) return;
      applyAuction(p, DDZ.chooseCall(state.hands[p]));
      return;
    }
    if (state.phase === "rob") {
      if (state.finalRob) {
        state.current = state.caller;
        render();
        if (state.caller === 0) {
          setMsg("是否抢回来");
          return;
        }
        state.thinking = true;
        renderActions();
        setMsg(state.names[state.caller] + " 思考中...");
        await sleep(500 + Math.random() * 400);
        if (id !== runId) return;
        applyAuction(state.caller, DDZ.chooseRob(state.hands[state.caller], true));
        return;
      }
      if (!state.robQueue.length) {
        finishAuction();
        return;
      }
      const p = state.robQueue[0];
      state.current = p;
      render();
      if (p === 0) {
        setMsg("轮到你抢地主");
        return;
      }
      state.thinking = true;
      renderActions();
      setMsg(state.names[p] + " 思考中...");
      await sleep(500 + Math.random() * 400);
      if (id !== runId) return;
      applyAuction(p, DDZ.chooseRob(state.hands[p], false));
    }
  }

  function startRob(caller) {
    state.phase = "rob";
    state.finalRob = false;
    state.robQueue = [nextPlayer(caller), nextPlayer(nextPlayer(caller))];
    nextAuction();
  }

  function applyAuction(p, yes) {
    if (!isAuction() || p !== state.current) return;
    state.thinking = false;
    if (state.phase === "call") {
      if (yes) {
        setCall(p, "叫地主 ×2");
        state.caller = p;
        state.landlord = p;
        state.callMult = 2;
        startRob(p);
        return;
      }
      setCall(p, "不叫");
      state.callTurn++;
      if (state.callTurn >= 3) finishAuction();
      else nextAuction();
      return;
    }
    if (state.finalRob) {
      if (p !== state.caller) return;
      if (yes) {
        setCall(p, "我抢 ×2");
        state.landlord = p;
        state.callMult *= 2;
      } else {
        setCall(p, "不抢");
      }
      state.finalRob = false;
      finishAuction();
      return;
    }
    if (state.robQueue[0] !== p) return;
    if (yes) {
      setCall(p, "抢地主 ×2");
      state.landlord = p;
      state.callMult *= 2;
      state.robQueue = [];
      state.finalRob = true;
    } else {
      setCall(p, "不抢");
      state.robQueue.shift();
    }
    nextAuction();
  }

  async function finishAuction() {
    const id = runId;
    if (state.landlord < 0) {
      setMsg("无人叫地主，重新发牌");
      await sleep(800);
      if (id !== runId) return;
      deal();
      return;
    }
    state.hands[state.landlord] = DDZ.sortCards(state.hands[state.landlord].concat(state.bottom));
    state.phase = "play";
    state.current = state.landlord;
    state.lastPlay = null;
    state.passCount = 0;
    state.finalRob = false;
    state.robQueue = [];
    state.thinking = true;
    render();
    setMsg(state.names[state.landlord] + " 成为地主");
    await sleep(900);
    if (id !== runId) return;
    state.thinking = false;
    clearBubbles();
    for (let i = 0; i < 3; i++) renderPlayed(i, []);
    nextTurn();
  }

  function ctx() {
    return {
      me: state.current,
      landlord: state.landlord,
      hands: state.hands,
    };
  }

  async function nextTurn() {
    const id = runId;
    if (state.phase !== "play") return;
    render();
    if (state.current === 0) {
      setMsg(canBeatLast() ? "轮到你出牌" : "要不起");
      return;
    }
    state.thinking = true;
    renderActions();
    setMsg(state.names[state.current] + " 思考中...");
    await sleep(450 + Math.random() * 550);
    if (id !== runId) return;
    const last = state.lastPlay ? Object.assign({ player: state.lastPlay.player }, lastPlayFilter()) : null;
    const mv = DDZ.chooseMove(state.hands[state.current], last, ctx());
    state.thinking = false;
    if (!mv) doPass(state.current);
    else doPlay(state.current, mv);
  }

  function removeCards(p, cards) {
    const ids = new Set(cards.map(function (c) { return c.id; }));
    state.hands[p] = state.hands[p].filter(function (c) { return !ids.has(c.id); });
  }

  function doPlay(p, mv) {
    if (state.phase !== "play") return;
    clearBubbles();
    removeCards(p, mv.cards);
    state.playedOnce[p] = true;
    if (mv.type === DDZ.TYPE.BOMB || mv.type === DDZ.TYPE.ROCKET) state.bombs++;
    if (p === state.landlord) state.landlordLeads++;
    state.lastPlay = {
      type: mv.type,
      rank: mv.rank,
      len: mv.len,
      k: mv.k,
      player: p,
      cards: mv.cards,
    };
    state.passCount = 0;
    for (let i = 0; i < 3; i++) {
      if (i === p) renderPlayed(i, mv.cards);
      else renderPlayed(i, []);
    }
    state.selected = new Set();
    render();

    if (state.hands[p].length === 0) {
      endGame(p);
      return;
    }
    state.current = nextPlayer(p);
    nextTurn();
  }

  function doPass(p) {
    if (state.phase !== "play") return;
    let text = "不出";
    if (state.lastPlay && !DDZ.findMoves(state.hands[p], lastPlayFilter()).length) text = "要不起";
    setBubble(p, text);
    state.selected = new Set();
    renderPlayed(p, []);
    state.passCount++;
    if (state.passCount >= 2) {
      state.lastPlay = null;
      state.passCount = 0;
      state.current = nextPlayer(p);
      for (let i = 0; i < 3; i++) renderPlayed(i, []);
      clearBubbles();
    } else {
      state.current = nextPlayer(p);
    }
    render();
    nextTurn();
  }

  function endGame(winner) {
    state.phase = "over";
    const landlordWin = winner === state.landlord;
    const iWin = landlordWin ? state.landlord === 0 : state.landlord !== 0;
    let spring = "";
    if (landlordWin) {
      const peasantsPlayed = state.playedOnce[0] + state.playedOnce[1] + state.playedOnce[2] - state.playedOnce[state.landlord];
      if (!peasantsPlayed) {
        state.bombs++;
        spring = "春天！";
      }
    } else if (state.landlordLeads <= 1) {
      state.bombs++;
      spring = "反春！";
    }
    const mult = gameMult();
    const unit = BASE_SCORE * mult;
    const delta = [0, 0, 0];
    const L = state.landlord;
    for (let p = 0; p < 3; p++) {
      if (landlordWin) delta[p] = p === L ? 2 * unit : -unit;
      else delta[p] = p === L ? -2 * unit : unit;
      state.scores[p] += delta[p];
    }
    const broke = anyoneBroke();
    $("over-title").textContent = broke ? "游戏结束" : (iWin ? "你赢了" : "你输了");
    $("over-sub").textContent =
      (landlordWin ? "地主获胜" : "农民获胜") +
      (spring ? " · " + spring : "") +
      " · 底分 " + BASE_SCORE +
      " · 倍数 ×" + mult +
      (broke ? " · 有人负分" : "");
    const lines = [];
    for (let p = 0; p < 3; p++) {
      const d = delta[p] >= 0 ? "+" + delta[p] : String(delta[p]);
      lines.push("<li>" + state.names[p] + " " + d + "　现有 " + state.scores[p] + "分</li>");
    }
    $("over-scores").innerHTML = lines.join("");
    $("over").classList.remove("hidden");
    $("btn-table-start").classList.add("hidden");
    render();
    revealRemain();
    setMsg(broke ? "游戏结束" : (iWin ? "胜利" : "失败"));
  }

  function closeOver() {
    $("over").classList.add("hidden");
    $("btn-table-start").classList.remove("hidden");
    setMsg("");
  }

  function onAuction(yes) {
    if (!isAuction() || state.current !== 0 || state.thinking) return;
    applyAuction(0, yes);
  }

  function onPlay() {
    if (state.phase !== "play" || state.current !== 0 || state.thinking) return;
    if (!canBeatLast()) return;
    const cards = selectedCards();
    if (!cards.length) {
      toast("请先选牌");
      return;
    }
    const mv = DDZ.analyze(cards);
    if (!mv) {
      toast("牌型不合法");
      return;
    }
    if (!DDZ.beats(mv, state.lastPlay)) {
      toast(state.lastPlay ? "压不住上家" : "牌型不合法");
      return;
    }
    doPlay(0, mv);
  }

  function onPass() {
    if (state.phase !== "play" || state.current !== 0 || state.thinking) return;
    if (!state.lastPlay) {
      toast("必须出牌");
      return;
    }
    doPass(0);
  }

  function onHint() {
    if (state.phase !== "play" || state.current !== 0 || state.thinking) return;
    const last = lastPlayFilter();
    const moves = DDZ.sortHintMoves(state.hands[0], last);
    if (!moves.length) {
      toast("没有能大过的牌");
      state.selected = new Set();
      renderHand();
      return;
    }
    const selKey = selectedCards().map(function (c) { return c.weight; }).sort(function (a, b) { return a - b; }).join(",");
    let idx = -1;
    for (let i = 0; i < moves.length; i++) {
      const k = moves[i].cards.map(function (c) { return c.weight; }).sort(function (a, b) { return a - b; }).join(",");
      if (k === selKey) {
        idx = i;
        break;
      }
    }
    const pick = moves[(idx + 1) % moves.length];
    state.selected = new Set(pick.cards.map(function (c) { return c.id; }));
    renderHand();
  }

  function handCards() {
    return Array.prototype.slice.call($("my-hand").querySelectorAll(".card"));
  }

  function syncSelectedUI() {
    const cards = handCards();
    for (let i = 0; i < cards.length; i++) {
      const id = Number(cards[i].getAttribute("data-id"));
      cards[i].classList.toggle("selected", state.selected.has(id));
    }
  }

  function toggleCard(id) {
    if (state.phase !== "play" || state.current !== 0 || state.thinking) return;
    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);
    syncSelectedUI();
  }

  const swipe = {
    id: null,
    startIdx: -1,
    startX: 0,
    startY: 0,
    active: false,
    moved: false,
    selecting: true,
    snapshot: null,
    timer: 0,
  };

  function applySwipeRange(toIdx) {
    const cards = handCards();
    if (swipe.startIdx < 0 || toIdx < 0) return;
    const a = Math.min(swipe.startIdx, toIdx);
    const b = Math.max(swipe.startIdx, toIdx);
    state.selected = new Set(swipe.snapshot);
    for (let i = a; i <= b; i++) {
      if (i >= cards.length) break;
      const id = Number(cards[i].getAttribute("data-id"));
      if (swipe.selecting) state.selected.add(id);
      else state.selected.delete(id);
    }
    syncSelectedUI();
  }

  function cardIndexFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    const card = el && el.closest ? el.closest("#my-hand .card") : null;
    if (!card) return -1;
    return handCards().indexOf(card);
  }

  function endSwipe(e) {
    if (swipe.id !== null && e && e.pointerId !== swipe.id) return;
    clearTimeout(swipe.timer);
    const wasActive = swipe.active;
    const wasMoved = swipe.moved;
    const startIdx = swipe.startIdx;
    swipe.id = null;
    swipe.active = false;
    swipe.moved = false;
    swipe.timer = 0;
    if (wasActive || wasMoved) return;
    const cards = handCards();
    if (startIdx >= 0 && startIdx < cards.length) {
      toggleCard(Number(cards[startIdx].getAttribute("data-id")));
    }
  }

  function onHandPointerDown(e) {
    if (state.phase !== "play" || state.current !== 0 || state.thinking) return;
    const card = e.target.closest(".card");
    if (!card) return;
    const idx = handCards().indexOf(card);
    if (idx < 0) return;
    e.preventDefault();
    clearTimeout(swipe.timer);
    swipe.id = e.pointerId;
    swipe.startIdx = idx;
    swipe.startX = e.clientX;
    swipe.startY = e.clientY;
    swipe.active = false;
    swipe.moved = false;
    swipe.snapshot = new Set(state.selected);
    swipe.selecting = !state.selected.has(Number(card.getAttribute("data-id")));
    try { card.setPointerCapture(e.pointerId); } catch (err) {}
    swipe.timer = setTimeout(function () {
      if (swipe.id === null) return;
      swipe.active = true;
      applySwipeRange(swipe.startIdx);
    }, 180);
  }

  function onHandPointerMove(e) {
    if (swipe.id !== e.pointerId) return;
    const dx = e.clientX - swipe.startX;
    const dy = e.clientY - swipe.startY;
    if (!swipe.active && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      clearTimeout(swipe.timer);
      swipe.active = true;
      swipe.moved = true;
    }
    if (!swipe.active) return;
    swipe.moved = true;
    const idx = cardIndexFromPoint(e.clientX, e.clientY);
    if (idx >= 0) applySwipeRange(idx);
  }

  function startGame(resetScore) {
    runId++;
    state.thinking = false;
    if (resetScore) state.scores = [START_SCORE, START_SCORE, START_SCORE];
    $("menu").classList.add("hidden");
    $("over").classList.add("hidden");
    $("btn-table-start").classList.add("hidden");
    $("app").classList.remove("hidden");
    lockLandscape();
    deal();
  }

  $("btn-start").addEventListener("click", function () { startGame(true); });
  $("btn-table-start").addEventListener("click", function () {
    startGame(anyoneBroke());
  });
  $("btn-restart").addEventListener("click", function () { startGame(true); });
  $("btn-over-close").addEventListener("click", closeOver);

  $("actions").addEventListener("click", function (e) {
    const btn = e.target.closest("[data-act]");
    if (!btn || btn.disabled) return;
    const act = btn.getAttribute("data-act");
    if (act === "auction-yes") onAuction(true);
    else if (act === "auction-no") onAuction(false);
    else if (act === "play") onPlay();
    else if (act === "pass") onPass();
    else if (act === "hint") onHint();
  });

  const handEl = $("my-hand");
  handEl.addEventListener("pointerdown", onHandPointerDown);
  handEl.addEventListener("pointermove", onHandPointerMove);
  handEl.addEventListener("pointerup", endSwipe);
  handEl.addEventListener("pointercancel", endSwipe);
  handEl.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  document.addEventListener("keydown", function (e) {
    if (isAuction() && state.current === 0) {
      if (e.key === "0" || e.key === "Escape") onAuction(false);
      if (e.key === "1" || e.key === "Enter") onAuction(true);
    }
    if (state.phase === "play" && state.current === 0) {
      if (e.key === "Enter") onPlay();
      if (e.key === " ") { e.preventDefault(); onPass(); }
      if (e.key === "h" || e.key === "H") onHint();
    }
  });

  document.addEventListener("touchmove", function (e) {
    if (e.target.closest && e.target.closest(".modal-card")) return;
    e.preventDefault();
  }, { passive: false });

  lockLandscape();
})();
