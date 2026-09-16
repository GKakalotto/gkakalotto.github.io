(function () {
  const X = window.Xiangqi;
  const AI = window.XiangqiAI;

  const HINTS = {
    easy: "入门：正规开局，会吃还、不送子。",
    standard: "标准：算得更深，中局能应对。",
    hard: "困难：算度更深，子力位置都会算。",
  };

  const POS = new Array(X.N);
  let human = X.RED;

  const els = {
    menu: document.getElementById("menu"),
    app: document.getElementById("app"),
    board: document.getElementById("board"),
    grid: document.getElementById("grid"),
    dots: document.getElementById("dots"),
    pieces: document.getElementById("pieces"),
    banner: document.getElementById("banner"),
    menuHint: document.getElementById("menu-hint"),
    undoLeft: document.getElementById("undo-left"),
    btnStart: document.getElementById("btn-start"),
    btnHome: document.getElementById("btn-home"),
    btnNew: document.getElementById("btn-new"),
    btnUndo: document.getElementById("btn-undo"),
    btnResign: document.getElementById("btn-resign"),
  };

  const pieceEls = new Map();
  let worker = null;
  try {
    worker = new Worker("js/worker.js");
  } catch (e) {
    worker = null;
  }

  let level = localStorage.getItem("xiangqi-level") || "standard";
  let board = X.setup();
  let side = X.RED;
  let selected = -1;
  let legal = [];
  let lastMove = 0;
  let thinking = false;
  let thinkId = 0;
  let history = [];
  let plies = [];
  let hashes = [X.hashBoard(board, side)];
  let snapshots = [];
  let undosLeft = 5;
  let pids = [];
  let pidGen = 1;

  function viewXY(x, y) {
    if (human === X.BLACK) return [8 - x, 9 - y];
    return [x, y];
  }

  function rebuildPos() {
    for (let i = 0; i < X.N; i++) {
      const [x, y] = X.xy(i);
      const [vx, vy] = viewXY(x, y);
      POS[i] = {
        left: ((vx + 0.55) / 9.1) * 100 + "%",
        top: ((9 - vy + 0.55) / 10.1) * 100 + "%",
      };
    }
  }

  function resetPids() {
    pids = new Array(X.N).fill(0);
    pidGen = 1;
    for (let i = 0; i < X.N; i++) if (board[i]) pids[i] = pidGen++;
  }

  function drawGrid() {
    const ns = "http://www.w3.org/2000/svg";
    const g = els.grid;
    g.innerHTML = "";
    const add = (name, attrs) => {
      const n = document.createElementNS(ns, name);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      g.appendChild(n);
      return n;
    };
    const segs = ["M 0 0 H 8 V 9 H 0 Z"];
    for (let y = 1; y < 9; y++) segs.push("M 0 " + y + " H 8");
    for (let x = 1; x < 8; x++) {
      segs.push("M " + x + " 0 V 4");
      segs.push("M " + x + " 5 V 9");
    }
    const pal = [
      [3, 0, 5, 2],
      [5, 0, 3, 2],
      [3, 7, 5, 9],
      [5, 7, 3, 9],
    ];
    pal.forEach(([x1, y1, x2, y2]) => {
      const a = viewXY(x1, y1);
      const b = viewXY(x2, y2);
      segs.push("M " + a[0] + " " + (9 - a[1]) + " L " + b[0] + " " + (9 - b[1]));
    });
    const marks = [
      [1, 2], [7, 2], [0, 3], [2, 3], [4, 3], [6, 3], [8, 3],
      [1, 7], [7, 7], [0, 6], [2, 6], [4, 6], [6, 6], [8, 6],
    ];
    marks.forEach(([x, y]) => {
      const s = 0.12;
      const [vx, vy] = viewXY(x, y);
      const gy = 9 - vy;
      if (vx > 0) segs.push("M " + (vx - s) + " " + (gy - s) + " V " + gy + " M " + (vx - s) + " " + (gy + s) + " V " + gy + " M " + (vx - s) + " " + (gy - s) + " H " + vx + " M " + (vx - s) + " " + (gy + s) + " H " + vx);
      if (vx < 8) segs.push("M " + (vx + s) + " " + (gy - s) + " V " + gy + " M " + (vx + s) + " " + (gy + s) + " V " + gy + " M " + (vx + s) + " " + (gy - s) + " H " + vx + " M " + (vx + s) + " " + (gy + s) + " H " + vx);
    });
    add("path", { d: segs.join(" "), fill: "none", stroke: "#333", "stroke-width": "0.06" });
    const chuX = human === X.BLACK ? 5.35 : 1.15;
    const hanX = human === X.BLACK ? 1.15 : 5.35;
    const river = add("text", { x: chuX, y: 4.68, class: "river-text" });
    river.textContent = "楚  河";
    const han = add("text", { x: hanX, y: 4.68, class: "river-text" });
    han.textContent = "汉  界";
  }

  function syncDiffButtons() {
    document.querySelectorAll(".diff").forEach((btn) => {
      btn.classList.toggle("on", btn.dataset.level === level);
    });
    els.menuHint.textContent = HINTS[level];
  }

  function flash(text) {
    els.banner.textContent = text;
    els.banner.classList.remove("hidden");
    clearTimeout(flash._t);
    flash._t = setTimeout(() => els.banner.classList.add("hidden"), 1200);
  }

  function renderDots() {
    els.dots.textContent = "";
    const addDot = (i, cls) => {
      const s = document.createElement("span");
      s.className = cls;
      s.style.left = POS[i].left;
      s.style.top = POS[i].top;
      els.dots.appendChild(s);
    };
    for (let i = 0; i < legal.length; i++) {
      const to = legal[i] & 255;
      addDot(to, board[to] ? "cap" : "go");
    }
  }

  function renderPieces() {
    const live = new Set();
    const redCheck = X.isInCheck(board, X.RED);
    const blackCheck = X.isInCheck(board, X.BLACK);
    for (let i = 0; i < X.N; i++) {
      const p = board[i];
      if (!p) continue;
      const id = pids[i];
      live.add(id);
      let el = pieceEls.get(id);
      if (!el) {
        el = document.createElement("button");
        el.type = "button";
        el.className = "piece " + (X.colorOf(p) === X.RED ? "red" : "black");
        el.dataset.pid = String(id);
        el.textContent = X.NAMES[p];
        els.pieces.appendChild(el);
        pieceEls.set(id, el);
      }
      el.dataset.at = String(i);
      el.classList.toggle("lift", i === selected);
      el.classList.toggle("last", lastMove && i === (lastMove & 255));
      el.classList.toggle("check", X.typeOf(p) === X.K && (X.colorOf(p) === X.RED ? redCheck : blackCheck));
      el.style.left = POS[i].left;
      el.style.top = POS[i].top;
    }
    pieceEls.forEach((el, id) => {
      if (!live.has(id)) {
        el.remove();
        pieceEls.delete(id);
      }
    });
  }

  function renderChrome() {
    els.undoLeft.textContent = String(undosLeft);
    els.btnUndo.disabled = thinking || snapshots.length === 0 || undosLeft <= 0;
    els.btnResign.disabled = thinking || side === 0;
  }

  function render() {
    renderChrome();
    renderDots();
    renderPieces();
  }

  function setLevel(next) {
    level = next;
    localStorage.setItem("xiangqi-level", level);
    syncDiffButtons();
  }

  function newGame() {
    thinkId++;
    human = Math.random() < 0.5 ? X.RED : X.BLACK;
    rebuildPos();
    drawGrid();
    board = X.setup();
    side = X.RED;
    selected = -1;
    legal = [];
    lastMove = 0;
    thinking = false;
    history = [];
    plies = [];
    hashes = [X.hashBoard(board, side)];
    snapshots = [];
    undosLeft = 5;
    resetPids();
    pieceEls.clear();
    els.pieces.textContent = "";
    els.banner.classList.add("hidden");
    render();
    pieceEls.forEach((el) => el.classList.add("no-anim"));
    requestAnimationFrame(() => {
      pieceEls.forEach((el) => el.classList.remove("no-anim"));
    });
    flash(human === X.RED ? "你执红" : "你执黑");
    if (side !== human) think();
  }

  function finishIfOver() {
    const st = X.status(board, side, plies);
    if (!st.over) {
      if (st.check) flash("将军");
      return false;
    }
    const who = st.winner === X.RED ? "红胜" : "黑胜";
    flash(st.perpetual ? "长将/长捉 · " + who : who);
    side = 0;
    render();
    return true;
  }

  function pushSnap() {
    snapshots.push({
      board: board.slice(),
      side,
      lastMove,
      history: history.slice(),
      plies: plies.slice(),
      hashes: hashes.slice(),
      pids: pids.slice(),
    });
  }

  function applyMove(move) {
    const note = X.notation(board, move);
    pushSnap();
    const from = move >> 8;
    const to = move & 255;
    const mover = pieceEls.get(pids[from]);
    if (mover) {
      mover.classList.add("moving");
      setTimeout(() => mover.classList.remove("moving"), 260);
    }
    pids[to] = pids[from];
    pids[from] = 0;
    X.makeMove(board, move);
    lastMove = move;
    history.push(note);
    const rec = X.describePly(board, X.colorOf(board[to]));
    plies.push(rec);
    side = X.opponent(side);
    hashes.push(rec.hash);
    selected = -1;
    legal = [];
    const last = hashes[hashes.length - 1];
    let reps = 0;
    for (let i = 0; i < hashes.length; i++) if (hashes[i] === last) reps++;
    if (reps >= 3) {
      thinking = false;
      if (rec.check || rec.chase) {
        flash((rec.check ? "长将 · " : "长捉 · ") + (rec.side === X.RED ? "黑胜" : "红胜"));
      } else {
        flash("和棋");
      }
      side = 0;
      render();
      return true;
    }
    return finishIfOver();
  }

  function pointFromEvent(ev) {
    const rect = els.board.getBoundingClientRect();
    const src = ev.changedTouches ? ev.changedTouches[0] : ev;
    const vx = Math.round(((src.clientX - rect.left) / rect.width) * 9.1 - 0.55);
    const vy = 9 - Math.round(((src.clientY - rect.top) / rect.height) * 10.1 - 0.55);
    const x = human === X.BLACK ? 8 - vx : vx;
    const y = human === X.BLACK ? 9 - vy : vy;
    if (!X.inBoard(x, y)) return -1;
    return X.idx(x, y);
  }

  function tryHuman(to) {
    if (thinking || side !== human) return;
    const p = board[to];
    if (selected < 0) {
      if (p && X.colorOf(p) === human) {
        selected = to;
        legal = X.movesFrom(board, human, to, plies);
      }
      renderDots();
      renderPieces();
      return;
    }
    if (to === selected) {
      selected = -1;
      legal = [];
      renderDots();
      renderPieces();
      return;
    }
    const mv = X.packMove(selected, to);
    if (legal.indexOf(mv) >= 0) {
      if (applyMove(mv)) return;
      render();
      const id = thinkId;
      setTimeout(() => {
        if (id !== thinkId) return;
        think();
      }, 1000);
      return;
    }
    if (p && X.colorOf(p) === human) {
      selected = to;
      legal = X.movesFrom(board, human, to, plies);
    } else {
      selected = -1;
      legal = [];
    }
    renderDots();
    renderPieces();
  }

  function applyAI(res) {
    thinking = false;
    if (side === human || side === 0) {
      renderChrome();
      return;
    }
    if (!res || !res.move || !X.isLegal(board, side, res.move, plies)) {
      finishIfOver();
      return;
    }
    applyMove(res.move);
    render();
  }

  function think() {
    if (side === human || side === 0) return;
    thinking = true;
    selected = -1;
    legal = [];
    render();
    const payload = {
      board: board.slice(),
      side,
      repeats: hashes.slice(),
      level,
      notes: history.slice(),
      plies: plies.slice(),
    };
    const id = ++thinkId;
    if (worker) {
      worker.onmessage = (e) => {
        if (id !== thinkId) return;
        applyAI(e.data);
      };
      worker.postMessage(payload);
      return;
    }
    setTimeout(() => {
      if (id !== thinkId) return;
      applyAI(AI.chooseMove(payload.board, payload.side, payload.repeats, payload.level, payload.notes, payload.plies));
    }, 0);
  }

  function undo() {
    if (thinking || !snapshots.length || undosLeft <= 0) return;
    thinkId++;
    undosLeft--;
    const back = side === human && snapshots.length >= 2 ? 2 : 1;
    let snap = null;
    for (let i = 0; i < back; i++) snap = snapshots.pop();
    board = snap.board;
    side = snap.side;
    lastMove = snap.lastMove;
    history = snap.history;
    plies = snap.plies;
    hashes = snap.hashes;
    pids = snap.pids;
    selected = -1;
    legal = [];
    els.banner.classList.add("hidden");
    render();
  }

  rebuildPos();
  drawGrid();
  syncDiffButtons();

  document.getElementById("menu-diff").addEventListener("click", (e) => {
    const btn = e.target.closest(".diff");
    if (btn) setLevel(btn.dataset.level);
  });
  els.btnStart.addEventListener("click", () => {
    els.menu.classList.add("hidden");
    els.app.classList.remove("hidden");
    newGame();
  });
  els.btnHome.addEventListener("click", () => {
    if (thinking) return;
    els.app.classList.add("hidden");
    els.menu.classList.remove("hidden");
  });
  els.btnNew.addEventListener("click", () => {
    if (!thinking) newGame();
  });
  els.btnUndo.addEventListener("click", undo);
  els.btnResign.addEventListener("click", () => {
    if (thinking || side === 0) return;
    thinkId++;
    side = 0;
    flash(human === X.RED ? "黑胜" : "红胜");
    renderChrome();
  });
  els.board.addEventListener("click", (e) => {
    const t = e.target.closest("[data-at]");
    tryHuman(t ? +t.dataset.at : pointFromEvent(e));
  });
})();
