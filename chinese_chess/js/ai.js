(function (global) {
  const X = () => global.Xiangqi;

  const VAL = [0, 10000, 110, 110, 270, 600, 285, 30];

  const PST = {
    1: [
      [0, 0, 0, 8, 10, 8, 0, 0, 0],
      [0, 0, 0, 6, 8, 6, 0, 0, 0],
      [0, 0, 0, 4, 6, 4, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    2: [
      [0, 0, 0, 12, 0, 12, 0, 0, 0],
      [0, 0, 0, 0, 14, 0, 0, 0, 0],
      [0, 0, 0, 10, 0, 10, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    3: [
      [0, 0, 10, 0, 0, 0, 10, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [8, 0, 0, 0, 18, 0, 0, 0, 8],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 12, 0, 0, 0, 12, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    4: [
      [2, 4, 8, 10, 8, 10, 8, 4, 2],
      [4, 12, 16, 18, 20, 18, 16, 12, 4],
      [8, 16, 22, 24, 26, 24, 22, 16, 8],
      [10, 18, 26, 28, 30, 28, 26, 18, 10],
      [10, 20, 28, 30, 32, 30, 28, 20, 10],
      [8, 16, 24, 26, 28, 26, 24, 16, 8],
      [6, 12, 18, 20, 22, 20, 18, 12, 6],
      [4, 8, 12, 14, 16, 14, 12, 8, 4],
      [2, 6, 8, 10, 12, 10, 8, 6, 2],
      [0, 2, 4, 6, 8, 6, 4, 2, 0],
    ],
    5: [
      [8, 10, 12, 14, 16, 14, 12, 10, 8],
      [16, 18, 20, 24, 26, 24, 20, 18, 16],
      [12, 14, 16, 18, 20, 18, 16, 14, 12],
      [12, 16, 18, 20, 22, 20, 18, 16, 12],
      [14, 18, 20, 22, 24, 22, 20, 18, 14],
      [14, 18, 20, 22, 24, 22, 20, 18, 14],
      [12, 16, 18, 20, 22, 20, 18, 16, 12],
      [10, 12, 14, 16, 18, 16, 14, 12, 10],
      [8, 10, 12, 14, 16, 14, 12, 10, 8],
      [6, 8, 10, 12, 14, 12, 10, 8, 6],
    ],
    6: [
      [8, 10, 12, 14, 16, 14, 12, 10, 8],
      [10, 12, 16, 18, 20, 18, 16, 12, 10],
      [12, 16, 18, 22, 24, 22, 18, 16, 12],
      [12, 16, 20, 22, 24, 22, 20, 16, 12],
      [14, 18, 22, 24, 26, 24, 22, 18, 14],
      [12, 16, 20, 22, 24, 22, 20, 16, 12],
      [10, 14, 16, 18, 20, 18, 16, 14, 10],
      [10, 12, 14, 16, 18, 16, 14, 12, 10],
      [8, 10, 12, 14, 16, 14, 12, 10, 8],
      [6, 8, 10, 12, 14, 12, 10, 8, 6],
    ],
    7: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [6, 0, 8, 0, 12, 0, 8, 0, 6],
      [10, 12, 16, 18, 20, 18, 16, 12, 10],
      [18, 22, 26, 30, 34, 30, 26, 22, 18],
      [22, 28, 34, 40, 46, 40, 34, 28, 22],
      [26, 32, 40, 48, 56, 48, 40, 32, 26],
      [18, 22, 26, 30, 18, 30, 26, 22, 18],
      [12, 16, 14, 10, 8, 10, 14, 16, 12],
    ],
  };

  function pst(type, x, y, side, Xq) {
    const table = PST[type];
    if (!table) return 0;
    const ry = side === Xq.RED ? y : 9 - y;
    const rx = side === Xq.RED ? x : 8 - x;
    return table[ry][rx];
  }

  function pawnExtra(y, side, Xq) {
    if (side === Xq.RED) {
      if (y >= 7) return 50;
      if (y >= 5) return 22;
    } else {
      if (y <= 2) return 50;
      if (y <= 4) return 22;
    }
    return 0;
  }

  function evaluate(board, side) {
    const Xq = global.Xiangqi;
    let score = 0;
    let redKing = -1;
    let blackKing = -1;
    for (let i = 0; i < Xq.N; i++) {
      const p = board[i];
      if (!p) continue;
      const t = Xq.typeOf(p);
      const c = Xq.colorOf(p);
      const [x, y] = Xq.xy(i);
      let v = VAL[t] + pst(t, x, y, c, Xq);
      if (t === Xq.P) v += pawnExtra(y, c, Xq);
      score += c === Xq.RED ? v : -v;
      if (t === Xq.K) {
        if (c === Xq.RED) redKing = i;
        else blackKing = i;
      }
    }
    if (redKing >= 0 && blackKing >= 0) {
      const [rx] = Xq.xy(redKing);
      const [bx] = Xq.xy(blackKing);
      if (rx === bx) score += side === Xq.RED ? 8 : -8;
    }
    if (Xq.isInCheck(board, Xq.RED)) score -= 18;
    if (Xq.isInCheck(board, Xq.BLACK)) score += 18;
    for (let i = 0; i < Xq.N; i++) {
      const p = board[i];
      if (!p) continue;
      const t = Xq.typeOf(p);
      if (t === Xq.K) continue;
      const c = Xq.colorOf(p);
      const opp = Xq.opponent(c);
      if (Xq.isAttacked(board, i, opp) && !Xq.isAttacked(board, i, c)) {
        const hang = (VAL[t] * 3) >> 2;
        score += c === Xq.RED ? -hang : hang;
      }
    }
    return side === Xq.RED ? score : -score;
  }

  function qsearch(board, toMove, Xq) {
    let best = evaluate(board, toMove);
    const moves = Xq.legalMoves(board, toMove);
    for (let i = 0; i < moves.length; i++) {
      const mv = moves[i];
      if (!board[mv & 255]) continue;
      const cap = Xq.makeMove(board, mv);
      const sc = -evaluate(board, Xq.opponent(toMove));
      Xq.unmakeMove(board, mv, cap);
      if (sc > best) best = sc;
    }
    return best;
  }

  function mvvLva(board, move, Xq) {
    const cap = board[move & 255];
    const from = board[move >> 8];
    if (!cap) return Xq.typeOf(from) === Xq.C ? 2 : 0;
    return VAL[Xq.typeOf(cap)] * 16 - VAL[Xq.typeOf(from)];
  }

  function orderMoves(board, moves, Xq, hashMove) {
    return moves
      .map((m, i) => ({
        m,
        s: (m === hashMove ? 8000 : 0) + mvvLva(board, m, Xq) - i * 0.01,
      }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.m);
  }

  const LEVELS = {
    easy: { depth: 2, time: 90 },
    standard: { depth: 3, time: 180 },
    hard: { depth: 4, time: 420 },
  };

  function search(board, side, repeats, level, plies, notes) {
    const Xq = X();
    const cfg = LEVELS[level] || LEVELS.standard;
    let rootMoves = Xq.legalMoves(board, side, plies);
    if (!rootMoves.length) return { move: 0, score: -20000, nodes: 0 };
    if ((notes || []).length < 6) {
      const safe = rootMoves.filter((mv) => !/炮[一二三四五六七八九]进七/.test(Xq.notation(board, mv)));
      if (safe.length) rootMoves = safe;
    }

    const start = Date.now();
    let nodes = 0;
    let abort = false;
    const tt = new Map();

    function repeatCount(h) {
      let n = 0;
      for (let i = 0; i < repeats.length; i++) if (repeats[i] === h) n++;
      return n;
    }

    function negamax(depth, alpha, beta, toMove, ply) {
      if (abort) return 0;
      if ((nodes & 511) === 0 && Date.now() - start > cfg.time) {
        abort = true;
        return 0;
      }
      nodes++;
      const h = Xq.hashBoard(board, toMove);
      if (ply > 0 && repeatCount(h) >= 3) return 0;
      if (depth <= 0) return qsearch(board, toMove, Xq);

      const moves0 = Xq.legalMoves(board, toMove);
      if (!moves0.length) return -12000 + ply;

      const cached = tt.get(h);
      if (cached && cached.depth >= depth) {
        if (cached.flag === 0) return cached.score;
        if (cached.flag === 1 && cached.score <= alpha) return cached.score;
        if (cached.flag === 2 && cached.score >= beta) return cached.score;
      }

      const moves = orderMoves(board, moves0, Xq, cached && cached.move);
      let best = -30000;
      let bestMove = moves[0];
      const a0 = alpha;
      for (let i = 0; i < moves.length; i++) {
        const mv = moves[i];
        const cap = Xq.makeMove(board, mv);
        repeats.push(Xq.hashBoard(board, Xq.opponent(toMove)));
        let sc;
        if (i === 0 || depth < 3) {
          sc = -negamax(depth - 1, -beta, -alpha, Xq.opponent(toMove), ply + 1);
        } else {
          sc = -negamax(depth - 1, -alpha - 1, -alpha, Xq.opponent(toMove), ply + 1);
          if (sc > alpha && sc < beta) {
            sc = -negamax(depth - 1, -beta, -alpha, Xq.opponent(toMove), ply + 1);
          }
        }
        repeats.pop();
        Xq.unmakeMove(board, mv, cap);
        if (abort) break;
        if (sc > best) {
          best = sc;
          bestMove = mv;
        }
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      if (!abort) {
        const flag = best <= a0 ? 1 : best >= beta ? 2 : 0;
        tt.set(h, { depth, score: best, move: bestMove, flag });
      }
      return best;
    }

    let bestMove = rootMoves[0];
    let bestScore = -30000;
    const maxD = cfg.depth;
    for (let d = 1; d <= maxD; d++) {
      abort = false;
      const scored = [];
      const ordered = orderMoves(board, rootMoves, Xq, bestMove);
      let alpha = -30000;
      const beta = 30000;
      for (let i = 0; i < ordered.length; i++) {
        const mv = ordered[i];
        const cap = Xq.makeMove(board, mv);
        repeats.push(Xq.hashBoard(board, Xq.opponent(side)));
        const sc = -negamax(d - 1, -beta, -alpha, Xq.opponent(side), 1);
        repeats.pop();
        Xq.unmakeMove(board, mv, cap);
        if (abort && d > 1) break;
        scored.push({ mv, sc });
        if (sc > alpha) alpha = sc;
      }
      if (abort && d > 1 && bestScore > -30000) break;
      scored.sort((a, b) => b.sc - a.sc);
      bestMove = scored[0].mv;
      bestScore = scored[0].sc;
      if (Date.now() - start > cfg.time) break;
    }

    return { move: bestMove, score: bestScore, nodes };
  }

  const BOOK = {
    "": ["炮二平五", "马二进三", "兵七进一"],
    炮二平五: ["炮八平五", "马八进七", "马二进三"],
    炮八平五: ["炮二平五", "马二进三", "马八进七"],
    马二进三: ["炮八平五", "马八进七", "卒七进一"],
    马八进七: ["炮二平五", "马二进三", "卒三进一"],
    兵七进一: ["卒三进一", "炮八平五", "马八进七"],
    兵三进一: ["卒七进一", "炮二平五", "马二进三"],
    相三进五: ["炮八平五", "马八进七"],
    相七进五: ["炮二平五", "马二进三"],
    炮二平五炮八平五: ["马八进七", "马二进三"],
    炮二平五马八进七: ["炮二平五", "马二进三"],
    炮二平五马二进三: ["马八进七", "炮八平五"],
    马二进三炮八平五: ["马八进七", "炮二平五"],
    马二进三马八进七: ["炮二平五", "兵七进一"],
    炮二平五炮八平五马八进七: ["马二进三", "卒七进一"],
    炮二平五马八进七炮二平五: ["马二进三", "仕四进五"],
  };

  function bookMove(board, side, notes) {
    const key = (notes || []).join("");
    const opts = BOOK[key];
    if (!opts) return 0;
    const Xq = X();
    const legal = Xq.legalMoves(board, side);
    const hit = [];
    for (let i = 0; i < legal.length; i++) {
      const note = Xq.notation(board, legal[i]);
      if (opts.indexOf(note) >= 0) hit.push(legal[i]);
    }
    if (!hit.length) return 0;
    return hit[(Math.random() * hit.length) | 0];
  }

  function chooseMove(board, side, repeats, level, notes, plies) {
    const booked = bookMove(board, side, notes || []);
    if (booked) return { move: booked, score: 0, nodes: 0, book: true };
    const work = board.slice();
    return search(work, side, repeats.slice(), level, plies, notes);
  }

  const api = { chooseMove };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.XiangqiAI = api;
})(typeof window !== "undefined" ? window : globalThis);
