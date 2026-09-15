(function () {
  const DDZ = window.DDZ;
  const $ = function (id) { return document.getElementById(id); };

  const state = {
    phase: "menu",
    hands: [[], [], []],
    bottom: [],
    landlord: -1,
    bid: 0,
    bidTurn: 0,
    firstBidder: 0,
    current: 0,
    lastPlay: null,
    passCount: 0,
    selected: new Set(),
    bombs: 0,
    playedOnce: [false, false, false],
    landlordLeads: 0,
    names: ["我", "电脑甲", "电脑乙"],
    scores: [100, 100, 100],
    thinking: false,
  };

  const START_SCORE = 100;

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
      '<span class="corner">' + c.rank + "<i>" + c.suit + "</i></span>" +
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

  function roleName(p) {
    if (state.landlord < 0) return "";
    return p === state.landlord ? "地主" : "农民";
  }

  function renderMini(p) {
    const n = Math.min(state.hands[p].length, 12);
    let html = "";
    for (let i = 0; i < n; i++) html += '<div class="mini-card"></div>';
    $("mini-" + p).innerHTML = html;
    $("count-" + p).textContent = state.hands[p].length + "张";
  }

  function renderPlayed(p, cards) {
    const el = $("played-" + p);
    if (!cards || !cards.length) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML = DDZ.layoutPlayed(cards).map(function (c, i) { return cardHTML(c, "", i + 1); }).join("");
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
    for (let p = 1; p <= 2; p++) {
      $("name-" + p).textContent = state.names[p] + (roleName(p) ? " · " + roleName(p) : "");
      $("avatar-" + p).textContent = roleName(p) === "地主" ? "地" : (p === 1 ? "甲" : "乙");
      $("avatar-" + p).classList.toggle("landlord", p === state.landlord);
      $("avatar-" + p).classList.toggle("turn", state.phase === "play" && state.current === p);
      renderMini(p);
      $("score-" + p).textContent = state.scores[p] + "分";
    }
    $("name-0").textContent = state.names[0];
    $("role-0").textContent = roleName(0);
    $("score-0").textContent = state.scores[0] + "分";
    $("mult").textContent = String((state.bid || 1) * Math.pow(2, state.bombs));
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
    if (state.phase === "bid" && state.current === 0 && !state.thinking) {
      const btns = ['<button type="button" class="btn danger" data-act="bid-0">不叫</button>'];
      for (let i = 1; i <= 3; i++) {
        const dis = i <= state.bid ? " disabled" : "";
        btns.push('<button type="button" class="btn primary" data-act="bid-' + i + '"' + dis + ">" + i + "分</button>");
      }
      box.innerHTML = btns.join("");
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
    renderSeats();
    renderHand();
    renderActions();
    renderBottom(state.phase === "play" || state.phase === "over");
  }

  function setMsg(t) { $("msg").textContent = t || ""; }

  function deal() {
    const deck = DDZ.shuffle(DDZ.createDeck());
    state.hands = [deck.slice(0, 17), deck.slice(17, 34), deck.slice(34, 51)];
    state.bottom = deck.slice(51);
    for (let i = 0; i < 3; i++) state.hands[i] = DDZ.sortCards(state.hands[i]);
    state.thinking = false;
    state.landlord = -1;
    state.bid = 0;
    state.lastPlay = null;
    state.passCount = 0;
    state.selected = new Set();
    state.bombs = 0;
    state.playedOnce = [false, false, false];
    state.landlordLeads = 0;
    state.phase = "bid";
    state.firstBidder = Math.floor(Math.random() * 3);
    state.bidTurn = 0;
    state.current = state.firstBidder;
    for (let p = 0; p < 3; p++) {
      renderPlayed(p, []);
      setBubble(p, "");
    }
    render();
    setMsg("叫分中");
    nextBid();
  }

  function bidText(v) {
    return v === 0 ? "不叫" : v + "分";
  }

  async function nextBid() {
    const id = runId;
    if (state.phase !== "bid") return;
    if (state.bidTurn >= 3) {
      finishBid();
      return;
    }
    const p = (state.firstBidder + 2 * state.bidTurn) % 3;
    state.current = p;
    render();
    if (p === 0) {
      setMsg("轮到你叫分");
      return;
    }
    state.thinking = true;
    renderActions();
    await sleep(500 + Math.random() * 400);
    if (id !== runId) return;
    const v = DDZ.chooseBid(state.hands[p], state.bid);
    applyBid(p, v);
  }

  function applyBid(p, v) {
    if (state.phase !== "bid") return;
    state.thinking = false;
    setBubble(p, bidText(v));
    if (v > state.bid) {
      state.bid = v;
      state.landlord = p;
    }
    state.bidTurn++;
    render();
    if (v === 3) {
      finishBid();
      return;
    }
    if (state.bidTurn >= 3) {
      finishBid();
      return;
    }
    nextBid();
  }

  async function finishBid() {
    const id = runId;
    if (state.landlord < 0) {
      setMsg("无人叫分，重新发牌");
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
    clearBubbles();
    render();
    setMsg(state.names[state.landlord] + " 成为地主");
    await sleep(700);
    if (id !== runId) return;
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
    const unit = (state.bid || 1) * Math.pow(2, state.bombs);
    const delta = [0, 0, 0];
    const L = state.landlord;
    for (let p = 0; p < 3; p++) {
      if (landlordWin) delta[p] = p === L ? 2 * unit : -unit;
      else delta[p] = p === L ? -2 * unit : unit;
      state.scores[p] += delta[p];
    }
    $("over-title").textContent = iWin ? "你赢了" : "你输了";
    $("over-sub").textContent =
      (landlordWin ? "地主获胜" : "农民获胜") +
      (spring ? " · " + spring : "") +
      " · 底分 " + (state.bid || 1) +
      " · 倍数 ×" + (unit / (state.bid || 1));
    const lines = [];
    for (let p = 0; p < 3; p++) {
      const d = delta[p] >= 0 ? "+" + delta[p] : String(delta[p]);
      lines.push("<li>" + state.names[p] + " " + d + "　现有 " + state.scores[p] + "分</li>");
    }
    $("over-scores").innerHTML = lines.join("");
    $("over").classList.remove("hidden");
    render();
    setMsg(iWin ? "胜利" : "失败");
  }

  function onBid(v) {
    if (state.phase !== "bid" || state.current !== 0) return;
    if (v > 0 && v <= state.bid) return;
    applyBid(0, v);
  }

  function onPlay() {
    if (state.phase !== "play" || state.current !== 0) return;
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
    if (state.phase !== "play" || state.current !== 0) return;
    if (!state.lastPlay) {
      toast("必须出牌");
      return;
    }
    doPass(0);
  }

  function onHint() {
    if (state.phase !== "play" || state.current !== 0) return;
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
    if (state.phase !== "play" || state.current !== 0) return;
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
    if (state.phase !== "play" || state.current !== 0) return;
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
    $("app").classList.remove("hidden");
    lockLandscape();
    deal();
  }

  function backMenu() {
    runId++;
    state.thinking = false;
    state.phase = "menu";
    $("app").classList.add("hidden");
    $("over").classList.add("hidden");
    $("menu").classList.remove("hidden");
  }

  $("btn-start").addEventListener("click", function () { startGame(true); });
  $("btn-again").addEventListener("click", function () { startGame(false); });
  $("btn-restart").addEventListener("click", function () { startGame(true); });
  $("btn-menu").addEventListener("click", backMenu);

  $("actions").addEventListener("click", function (e) {
    const btn = e.target.closest("[data-act]");
    if (!btn || btn.disabled) return;
    const act = btn.getAttribute("data-act");
    if (act.indexOf("bid-") === 0) onBid(Number(act.slice(4)));
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
    if (state.phase === "bid" && state.current === 0) {
      if (e.key === "0" || e.key === "Escape") onBid(0);
      if (e.key === "1" || e.key === "2" || e.key === "3") onBid(Number(e.key));
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
