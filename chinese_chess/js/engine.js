(function (global) {
  const W = 9;
  const H = 10;
  const N = 90;

  const RED = 8;
  const BLACK = 16;
  const SIDE = 24;

  const K = 1;
  const A = 2;
  const E = 3;
  const HOS = 4;
  const R = 5;
  const C = 6;
  const P = 7;

  const TYPE = 7;
  const DIRS4 = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const DIAG = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  const HORSE = [
    [1, 2],
    [1, -2],
    [-1, 2],
    [-1, -2],
    [2, 1],
    [2, -1],
    [-2, 1],
    [-2, -1],
  ];
  const ELEPH = [
    [2, 2],
    [2, -2],
    [-2, 2],
    [-2, -2],
  ];

  const NAMES = {
    [RED | K]: "帅",
    [RED | A]: "仕",
    [RED | E]: "相",
    [RED | HOS]: "马",
    [RED | R]: "车",
    [RED | C]: "炮",
    [RED | P]: "兵",
    [BLACK | K]: "将",
    [BLACK | A]: "士",
    [BLACK | E]: "象",
    [BLACK | HOS]: "马",
    [BLACK | R]: "车",
    [BLACK | C]: "炮",
    [BLACK | P]: "卒",
  };

  const CN_NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

  function idx(x, y) {
    return y * W + x;
  }

  function xy(i) {
    return [i % W, (i / W) | 0];
  }

  function inBoard(x, y) {
    return x >= 0 && x < W && y >= 0 && y < H;
  }

  function typeOf(p) {
    return p & TYPE;
  }

  function colorOf(p) {
    return p & SIDE;
  }

  function opponent(side) {
    return side === RED ? BLACK : RED;
  }

  function inPalace(x, y, side) {
    if (x < 3 || x > 5) return false;
    return side === RED ? y <= 2 : y >= 7;
  }

  function crossedRiver(y, side) {
    return side === RED ? y >= 5 : y <= 4;
  }

  function emptyBoard() {
    return new Array(N).fill(0);
  }

  function setup() {
    const b = emptyBoard();
    const back = [R, HOS, E, A, K, A, E, HOS, R];
    for (let x = 0; x < 9; x++) {
      b[idx(x, 0)] = RED | back[x];
      b[idx(x, 9)] = BLACK | back[x];
    }
    b[idx(1, 2)] = RED | C;
    b[idx(7, 2)] = RED | C;
    b[idx(1, 7)] = BLACK | C;
    b[idx(7, 7)] = BLACK | C;
    for (const x of [0, 2, 4, 6, 8]) {
      b[idx(x, 3)] = RED | P;
      b[idx(x, 6)] = BLACK | P;
    }
    return b;
  }

  function findKing(board, side) {
    const want = side | K;
    for (let i = 0; i < N; i++) if (board[i] === want) return i;
    return -1;
  }

  function pathClear(board, x1, y1, x2, y2) {
    const dx = Math.sign(x2 - x1);
    const dy = Math.sign(y2 - y1);
    let x = x1 + dx;
    let y = y1 + dy;
    while (x !== x2 || y !== y2) {
      if (board[idx(x, y)]) return false;
      x += dx;
      y += dy;
    }
    return true;
  }

  function countBetween(board, x1, y1, x2, y2) {
    const dx = Math.sign(x2 - x1);
    const dy = Math.sign(y2 - y1);
    let n = 0;
    let x = x1 + dx;
    let y = y1 + dy;
    while (x !== x2 || y !== y2) {
      if (board[idx(x, y)]) n++;
      x += dx;
      y += dy;
    }
    return n;
  }

  function pieceAttacks(board, from, tx, ty) {
    const p = board[from];
    if (!p) return false;
    const [fx, fy] = xy(from);
    if (fx === tx && fy === ty) return false;
    const t = typeOf(p);
    const side = colorOf(p);
    const dx = tx - fx;
    const dy = ty - fy;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    if (t === K) {
      if (adx + ady === 1 && inPalace(tx, ty, side)) return true;
      if (adx === 0 && typeOf(board[idx(tx, ty)]) === K && pathClear(board, fx, fy, tx, ty)) {
        return true;
      }
      return false;
    }
    if (t === A) return adx === 1 && ady === 1 && inPalace(tx, ty, side);
    if (t === E) {
      if (adx !== 2 || ady !== 2) return false;
      if (side === RED ? ty > 4 : ty < 5) return false;
      return !board[idx(fx + dx / 2, fy + dy / 2)];
    }
    if (t === HOS) {
      if (!((adx === 1 && ady === 2) || (adx === 2 && ady === 1))) return false;
      const bx = adx === 2 ? fx + Math.sign(dx) : fx;
      const by = ady === 2 ? fy + Math.sign(dy) : fy;
      return !board[idx(bx, by)];
    }
    if (t === R) {
      if (dx && dy) return false;
      return pathClear(board, fx, fy, tx, ty);
    }
    if (t === C) {
      if (dx && dy) return false;
      const mid = countBetween(board, fx, fy, tx, ty);
      return board[idx(tx, ty)] ? mid === 1 : mid === 0;
    }
    if (t === P) {
      const fwd = side === RED ? 1 : -1;
      if (dx === 0 && dy === fwd) return true;
      return crossedRiver(fy, side) && adx === 1 && dy === 0;
    }
    return false;
  }

  function isAttacked(board, square, bySide) {
    const [tx, ty] = xy(square);
    for (let i = 0; i < N; i++) {
      if (colorOf(board[i]) === bySide && pieceAttacks(board, i, tx, ty)) return true;
    }
    return false;
  }

  function isInCheck(board, side) {
    const k = findKing(board, side);
    if (k < 0) return true;
    return isAttacked(board, k, opponent(side));
  }

  function pushMove(moves, board, from, x, y, side) {
    if (!inBoard(x, y)) return;
    const to = idx(x, y);
    const dest = board[to];
    if (dest && colorOf(dest) === side) return;
    moves.push((from << 8) | to);
  }

  function genPseudo(board, side, moves, onlyFrom) {
    const a = onlyFrom == null ? 0 : onlyFrom;
    const b = onlyFrom == null ? N : onlyFrom + 1;
    for (let from = a; from < b; from++) {
      const p = board[from];
      if (!p || colorOf(p) !== side) continue;
      const [x, y] = xy(from);
      const t = typeOf(p);

      if (t === K) {
        for (const [dx, dy] of DIRS4) {
          const nx = x + dx;
          const ny = y + dy;
          if (inPalace(nx, ny, side)) pushMove(moves, board, from, nx, ny, side);
        }
      } else if (t === A) {
        for (const [dx, dy] of DIAG) {
          const nx = x + dx;
          const ny = y + dy;
          if (inPalace(nx, ny, side)) pushMove(moves, board, from, nx, ny, side);
        }
      } else if (t === E) {
        for (const [dx, dy] of ELEPH) {
          const nx = x + dx;
          const ny = y + dy;
          if (!inBoard(nx, ny)) continue;
          if (side === RED ? ny > 4 : ny < 5) continue;
          if (board[idx(x + dx / 2, y + dy / 2)]) continue;
          pushMove(moves, board, from, nx, ny, side);
        }
      } else if (t === HOS) {
        for (const [dx, dy] of HORSE) {
          const bx = Math.abs(dx) === 2 ? x + Math.sign(dx) : x;
          const by = Math.abs(dy) === 2 ? y + Math.sign(dy) : y;
          if (board[idx(bx, by)]) continue;
          pushMove(moves, board, from, x + dx, y + dy, side);
        }
      } else if (t === R || t === C) {
        for (const [dx, dy] of DIRS4) {
          let nx = x + dx;
          let ny = y + dy;
          let jumped = false;
          while (inBoard(nx, ny)) {
            const dest = board[idx(nx, ny)];
            if (!jumped) {
              if (!dest) pushMove(moves, board, from, nx, ny, side);
              else if (t === C) jumped = true;
              else {
                if (colorOf(dest) !== side) pushMove(moves, board, from, nx, ny, side);
                break;
              }
            } else {
              if (dest) {
                if (colorOf(dest) !== side) pushMove(moves, board, from, nx, ny, side);
                break;
              }
            }
            nx += dx;
            ny += dy;
          }
        }
      } else if (t === P) {
        const fwd = side === RED ? 1 : -1;
        pushMove(moves, board, from, x, y + fwd, side);
        if (crossedRiver(y, side)) {
          pushMove(moves, board, from, x - 1, y, side);
          pushMove(moves, board, from, x + 1, y, side);
        }
      }
    }
    return moves;
  }

  function makeMove(board, move) {
    const from = move >> 8;
    const to = move & 255;
    const cap = board[to];
    board[to] = board[from];
    board[from] = 0;
    return cap;
  }

  function unmakeMove(board, move, cap) {
    const from = move >> 8;
    const to = move & 255;
    board[from] = board[to];
    board[to] = cap;
  }

  const MAT = [0, 0, 20, 20, 40, 90, 45, 10];

  function isChase(board, side) {
    const opp = opponent(side);
    if (isInCheck(board, opp)) return false;
    for (let from = 0; from < N; from++) {
      const p = board[from];
      if (!p || colorOf(p) !== side) continue;
      const at = typeOf(p);
      if (at === K) continue;
      for (let to = 0; to < N; to++) {
        const q = board[to];
        if (!q || colorOf(q) !== opp || typeOf(q) === K) continue;
        const [tx, ty] = xy(to);
        if (!pieceAttacks(board, from, tx, ty)) continue;
        const defended = isAttacked(board, to, opp);
        if (!defended || MAT[at] < MAT[typeOf(q)]) return true;
      }
    }
    return false;
  }

  function describePly(board, mover) {
    const check = isInCheck(board, opponent(mover));
    return {
      side: mover,
      check,
      chase: !check && isChase(board, mover),
      hash: hashBoard(board, opponent(mover)),
    };
  }

  function cycleCount(plies, mover, hash, kind) {
    let n = 0;
    for (let i = 0; i < plies.length; i++) {
      const p = plies[i];
      if (p.side === mover && p.hash === hash && p[kind]) n++;
    }
    return n;
  }

  function isForbiddenPly(plies, rec) {
    if (!plies || plies.length < 4) return 0;
    if (rec.check && cycleCount(plies, rec.side, rec.hash, "check") >= 2) return 1;
    if (rec.chase && cycleCount(plies, rec.side, rec.hash, "chase") >= 2) return 2;
    return 0;
  }

  function keepLegal(board, side, mv, plies) {
    const cap = makeMove(board, mv);
    const ok = !isInCheck(board, side) && !isForbiddenPly(plies, describePly(board, side));
    unmakeMove(board, mv, cap);
    return ok;
  }

  function legalMoves(board, side, plies) {
    const raw = [];
    genPseudo(board, side, raw);
    const out = [];
    for (let i = 0; i < raw.length; i++) {
      if (keepLegal(board, side, raw[i], plies)) out.push(raw[i]);
    }
    return out;
  }

  function movesFrom(board, side, from, plies) {
    const raw = [];
    genPseudo(board, side, raw, from);
    const out = [];
    for (let i = 0; i < raw.length; i++) {
      if (keepLegal(board, side, raw[i], plies)) out.push(raw[i]);
    }
    return out;
  }

  function isLegal(board, side, move, plies) {
    return legalMoves(board, side, plies).indexOf(move) >= 0;
  }

  function packMove(from, to) {
    return (from << 8) | to;
  }

  function fileLabel(x, side) {
    return side === RED ? CN_NUM[8 - x] : CN_NUM[x];
  }

  function sameTypeOnFile(board, from) {
    const p = board[from];
    const [x] = xy(from);
    const t = typeOf(p);
    const side = colorOf(p);
    const ys = [];
    for (let y = 0; y < H; y++) {
      const q = board[idx(x, y)];
      if (q && colorOf(q) === side && typeOf(q) === t) ys.push(y);
    }
    return ys;
  }

  function notation(board, move) {
    const from = move >> 8;
    const to = move & 255;
    const p = board[from];
    const [fx, fy] = xy(from);
    const [tx, ty] = xy(to);
    const side = colorOf(p);
    const t = typeOf(p);
    let name = NAMES[p];
    const twins = sameTypeOnFile(board, from);
    if (twins.length >= 2) {
      twins.sort((a, b) => (side === RED ? b - a : a - b));
      const pos = twins.indexOf(fy);
      name = (pos === 0 ? "前" : pos === twins.length - 1 ? "后" : CN_NUM[pos]) + name;
    } else {
      name += fileLabel(fx, side);
    }
    const dy = ty - fy;
    const toward = side === RED ? dy > 0 : dy < 0;
    let verb;
    let dest;
    if (dy === 0) {
      verb = "平";
      dest = fileLabel(tx, side);
    } else if (t === HOS || t === A || t === E) {
      verb = toward ? "进" : "退";
      dest = fileLabel(tx, side);
    } else {
      verb = toward ? "进" : "退";
      dest = CN_NUM[Math.abs(dy) - 1];
    }
    return name + verb + dest;
  }

  function status(board, side, plies) {
    const moves = legalMoves(board, side, plies);
    const check = isInCheck(board, side);
    if (moves.length === 0) {
      const raw = [];
      genPseudo(board, side, raw);
      let real = 0;
      for (let i = 0; i < raw.length; i++) {
        const cap = makeMove(board, raw[i]);
        if (!isInCheck(board, side)) real++;
        unmakeMove(board, raw[i], cap);
      }
      const perpetual = !check && real > 0;
      return {
        over: true,
        winner: opponent(side),
        check,
        mate: check,
        stalemate: !check && !perpetual,
        perpetual,
        moves,
      };
    }
    return { over: false, winner: 0, check, mate: false, stalemate: false, perpetual: false, moves };
  }

  const Z_PIECE = [];
  const Z_SIDE = (Math.random() * 0x100000000) >>> 0;
  (function initZobrist() {
    for (let i = 0; i < N; i++) {
      Z_PIECE[i] = [];
      for (let k = 0; k < 32; k++) Z_PIECE[i][k] = (Math.random() * 0x100000000) >>> 0;
    }
  })();

  function hashBoard(board, side) {
    let h = side === BLACK ? Z_SIDE : 0;
    for (let i = 0; i < N; i++) if (board[i]) h ^= Z_PIECE[i][board[i]];
    return h;
  }

  const api = {
    N,
    RED,
    BLACK,
    K,
    C,
    P,
    NAMES,
    idx,
    xy,
    inBoard,
    typeOf,
    colorOf,
    opponent,
    setup,
    isInCheck,
    isAttacked,
    makeMove,
    unmakeMove,
    legalMoves,
    movesFrom,
    isLegal,
    packMove,
    notation,
    status,
    hashBoard,
    describePly,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.Xiangqi = api;
})(typeof window !== "undefined" ? window : globalThis);
