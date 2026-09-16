(function (global) {
  const SUITS = [
    { s: "♠", color: "black" },
    { s: "♥", color: "red" },
    { s: "♦", color: "red" },
    { s: "♣", color: "black" },
  ];
  const RANKS = [
    { r: "3", w: 3 }, { r: "4", w: 4 }, { r: "5", w: 5 }, { r: "6", w: 6 },
    { r: "7", w: 7 }, { r: "8", w: 8 }, { r: "9", w: 9 }, { r: "10", w: 10 },
    { r: "J", w: 11 }, { r: "Q", w: 12 }, { r: "K", w: 13 }, { r: "A", w: 14 },
    { r: "2", w: 15 },
  ];

  const TYPE = {
    SINGLE: "SINGLE",
    PAIR: "PAIR",
    TRIPLE: "TRIPLE",
    TRIPLE_ONE: "TRIPLE_ONE",
    TRIPLE_TWO: "TRIPLE_TWO",
    STRAIGHT: "STRAIGHT",
    LIAN_DUI: "LIAN_DUI",
    PLANE: "PLANE",
    PLANE_ONE: "PLANE_ONE",
    PLANE_TWO: "PLANE_TWO",
    FOUR_TWO: "FOUR_TWO",
    FOUR_TWO_PAIR: "FOUR_TWO_PAIR",
    BOMB: "BOMB",
    ROCKET: "ROCKET",
  };

  function createDeck() {
    const deck = [];
    let id = 0;
    for (const rank of RANKS) {
      for (const suit of SUITS) {
        deck.push({
          id: id++,
          rank: rank.r,
          weight: rank.w,
          suit: suit.s,
          color: suit.color,
          joker: 0,
        });
      }
    }
    deck.push({ id: id++, rank: "小王", weight: 16, suit: "", color: "joker-s", joker: 1 });
    deck.push({ id: id++, rank: "大王", weight: 17, suit: "", color: "joker-b", joker: 2 });
    return deck;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function sortCards(cards) {
    return cards.slice().sort(function (a, b) {
      if (a.weight !== b.weight) return b.weight - a.weight;
      return a.id - b.id;
    });
  }

  function countByWeight(cards) {
    const m = new Map();
    for (let i = 0; i < cards.length; i++) {
      const w = cards[i].weight;
      m.set(w, (m.get(w) || 0) + 1);
    }
    return m;
  }

  function groupByWeight(cards) {
    const m = new Map();
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      if (!m.has(c.weight)) m.set(c.weight, []);
      m.get(c.weight).push(c);
    }
    return m;
  }

  function isSeqWeights(weights) {
    if (!weights.length) return false;
    for (let i = 0; i < weights.length; i++) {
      if (weights[i] < 3 || weights[i] > 14) return false;
    }
    for (let i = 1; i < weights.length; i++) {
      if (weights[i] !== weights[i - 1] + 1) return false;
    }
    return true;
  }

  function consecutiveRuns(sortedUniq, minLen) {
    const runs = [];
    let i = 0;
    while (i < sortedUniq.length) {
      let j = i + 1;
      while (j < sortedUniq.length && sortedUniq[j] === sortedUniq[j - 1] + 1 && sortedUniq[j] <= 14) {
        j++;
      }
      const run = sortedUniq.slice(i, j);
      if (run.length >= minLen && run[0] >= 3 && run[run.length - 1] <= 14) {
        for (let len = minLen; len <= run.length; len++) {
          for (let s = 0; s + len <= run.length; s++) {
            runs.push(run.slice(s, s + len));
          }
        }
      }
      i = j;
    }
    return runs;
  }

  function combinations(arr, k) {
    const res = [];
    if (k < 0 || k > arr.length) return res;
    if (k === 0) return [[]];
    const n = arr.length;
    function rec(start, path) {
      if (path.length === k) {
        res.push(path.slice());
        return;
      }
      const need = k - path.length;
      for (let i = start; i <= n - need; i++) {
        path.push(arr[i]);
        rec(i + 1, path);
        path.pop();
      }
    }
    rec(0, []);
    return res;
  }

  function bothJokers(cards) {
    return cards.length === 2 && cards[0].joker && cards[1].joker;
  }

  function tryPlane(cards) {
    const n = cards.length;
    const cnt = countByWeight(cards);
    const groups = groupByWeight(cards);
    const tripleRanks = [];
    cnt.forEach(function (c, w) {
      if (c >= 3 && w >= 3 && w <= 14) tripleRanks.push(w);
    });
    tripleRanks.sort(function (a, b) { return a - b; });
    const runs = consecutiveRuns(tripleRanks, 2);
    runs.sort(function (a, b) { return b.length - a.length; });

    for (let r = 0; r < runs.length; r++) {
      const run = runs[r];
      const k = run.length;
      const usedIds = new Set();
      const mainCards = [];
      for (let i = 0; i < run.length; i++) {
        const pile = groups.get(run[i]);
        for (let j = 0; j < 3; j++) {
          mainCards.push(pile[j]);
          usedIds.add(pile[j].id);
        }
      }
      const remain = cards.filter(function (c) { return !usedIds.has(c.id); });
      const rank = run[run.length - 1];
      if (remain.length === 0) {
        return { type: TYPE.PLANE, rank: rank, cards: cards, len: n, k: k };
      }
      if (remain.length === k) {
        if (k === 2 && bothJokers(remain)) continue;
        return { type: TYPE.PLANE_ONE, rank: rank, cards: cards, len: n, k: k };
      }
      if (remain.length === 2 * k) {
        const rc = countByWeight(remain);
        let allPairs = true;
        rc.forEach(function (c, w) {
          if (c !== 2 || w >= 16) allPairs = false;
        });
        if (allPairs && rc.size === k) {
          return { type: TYPE.PLANE_TWO, rank: rank, cards: cards, len: n, k: k };
        }
      }
    }
    return null;
  }

  function analyze(cards) {
    if (!cards || !cards.length) return null;
    const n = cards.length;
    const cnt = countByWeight(cards);
    const uniq = [];
    cnt.forEach(function (c, w) { uniq.push([w, c]); });
    uniq.sort(function (a, b) { return a[0] - b[0]; });
    let maxc = 0;
    cnt.forEach(function (c) { if (c > maxc) maxc = c; });

    const jokers = cards.filter(function (c) { return c.joker; });
    if (n === 2 && jokers.length === 2) {
      return { type: TYPE.ROCKET, rank: 17, cards: cards, len: 2 };
    }

    if (uniq.length === 1) {
      const w = uniq[0][0];
      if (n === 1) return { type: TYPE.SINGLE, rank: w, cards: cards, len: 1 };
      if (n === 2) return { type: TYPE.PAIR, rank: w, cards: cards, len: 2 };
      if (n === 3) return { type: TYPE.TRIPLE, rank: w, cards: cards, len: 3 };
      if (n === 4) return { type: TYPE.BOMB, rank: w, cards: cards, len: 4 };
      return null;
    }

    if (n >= 5 && maxc === 1) {
      const ws = uniq.map(function (x) { return x[0]; });
      if (isSeqWeights(ws)) {
        return { type: TYPE.STRAIGHT, rank: ws[ws.length - 1], cards: cards, len: n };
      }
    }

    if (n >= 6 && n % 2 === 0) {
      let allPairs = true;
      const ws = [];
      cnt.forEach(function (c, w) {
        if (c !== 2) allPairs = false;
        ws.push(w);
      });
      ws.sort(function (a, b) { return a - b; });
      if (allPairs && isSeqWeights(ws)) {
        return { type: TYPE.LIAN_DUI, rank: ws[ws.length - 1], cards: cards, len: n, k: ws.length };
      }
    }

    if (n >= 6 && n % 3 === 0) {
      let allTriples = true;
      const ws = [];
      cnt.forEach(function (c, w) {
        if (c !== 3) allTriples = false;
        ws.push(w);
      });
      ws.sort(function (a, b) { return a - b; });
      if (allTriples && isSeqWeights(ws)) {
        return { type: TYPE.PLANE, rank: ws[ws.length - 1], cards: cards, len: n, k: ws.length };
      }
    }

    if (n === 4 && maxc === 3) {
      const main = uniq.find(function (x) { return x[1] === 3; })[0];
      return { type: TYPE.TRIPLE_ONE, rank: main, cards: cards, len: 4 };
    }

    if (n === 5 && maxc === 3) {
      const vals = [];
      cnt.forEach(function (c) { vals.push(c); });
      if (vals.indexOf(2) !== -1) {
        const main = uniq.find(function (x) { return x[1] === 3; })[0];
        return { type: TYPE.TRIPLE_TWO, rank: main, cards: cards, len: 5 };
      }
    }

    if (n === 6 && maxc === 4) {
      const main = uniq.find(function (x) { return x[1] === 4; })[0];
      const rest = cards.filter(function (c) { return c.weight !== main; });
      if (rest.length === 2 && !bothJokers(rest)) {
        return { type: TYPE.FOUR_TWO, rank: main, cards: cards, len: 6 };
      }
    }

    if (n === 8 && maxc === 4) {
      const fours = uniq.filter(function (x) { return x[1] === 4; });
      const pairs = uniq.filter(function (x) { return x[1] === 2; });
      if (fours.length === 1 && pairs.length === 2) {
        const pw = [pairs[0][0], pairs[1][0]];
        if (pw[0] < 16 && pw[1] < 16) {
          return { type: TYPE.FOUR_TWO_PAIR, rank: fours[0][0], cards: cards, len: 8 };
        }
      }
    }

    return tryPlane(cards);
  }

  function beats(play, last) {
    if (!play) return false;
    if (!last) return true;
    if (play.type === TYPE.ROCKET) return true;
    if (last.type === TYPE.ROCKET) return false;
    if (play.type === TYPE.BOMB) {
      if (last.type === TYPE.BOMB) return play.rank > last.rank;
      return true;
    }
    if (play.type !== last.type) return false;
    if (play.len !== last.len) return false;
    return play.rank > last.rank;
  }

  function take(groups, weight, n) {
    const pile = groups.get(weight);
    if (!pile || pile.length < n) return null;
    return pile.slice(0, n);
  }

  function remainingCards(groups, used) {
    const ids = new Set(used.map(function (c) { return c.id; }));
    const rest = [];
    groups.forEach(function (pile) {
      for (let i = 0; i < pile.length; i++) {
        if (!ids.has(pile[i].id)) rest.push(pile[i]);
      }
    });
    return rest;
  }

  function pushMove(moves, type, rank, cards, extra) {
    const m = { type: type, rank: rank, cards: cards, len: cards.length };
    if (extra) {
      for (const k in extra) m[k] = extra[k];
    }
    moves.push(m);
  }

  function findBombsAndRocket(groups) {
    const moves = [];
    groups.forEach(function (pile, w) {
      if (pile.length === 4) pushMove(moves, TYPE.BOMB, w, pile.slice());
    });
    const sj = groups.get(16);
    const bj = groups.get(17);
    if (sj && sj.length && bj && bj.length) {
      pushMove(moves, TYPE.ROCKET, 17, [sj[0], bj[0]]);
    }
    return moves;
  }

  function findSingles(groups, minRank) {
    const moves = [];
    groups.forEach(function (pile, w) {
      if (w > minRank) pushMove(moves, TYPE.SINGLE, w, [pile[0]]);
    });
    return moves;
  }

  function findNOfAKind(groups, n, type, minRank) {
    const moves = [];
    groups.forEach(function (pile, w) {
      if (pile.length >= n && w > minRank) pushMove(moves, type, w, pile.slice(0, n));
    });
    return moves;
  }

  function findSeq(groups, len, needPer, type, minRank) {
    const moves = [];
    for (let start = 3; start + len - 1 <= 14; start++) {
      const end = start + len - 1;
      if (end <= minRank) continue;
      const cards = [];
      let ok = true;
      for (let w = start; w <= end; w++) {
        const part = take(groups, w, needPer);
        if (!part) { ok = false; break; }
        for (let i = 0; i < part.length; i++) cards.push(part[i]);
      }
      if (ok) pushMove(moves, type, end, cards, { k: len });
    }
    return moves;
  }

  function findTripleKick(groups, kickerIsPair, type, minRank) {
    const moves = [];
    groups.forEach(function (pile, w) {
      if (pile.length < 3 || w <= minRank) return;
      const main = pile.slice(0, 3);
      const rest = remainingCards(groups, main);
      if (kickerIsPair) {
        const rc = groupByWeight(rest);
        rc.forEach(function (p, rw) {
          if (p.length >= 2 && rw !== w) {
            pushMove(moves, type, w, main.concat(p.slice(0, 2)));
          }
        });
      } else {
        for (let i = 0; i < rest.length; i++) {
          pushMove(moves, type, w, main.concat([rest[i]]));
        }
      }
    });
    return moves;
  }

  function findFourKick(groups, pairKickers, minRank) {
    const moves = [];
    const type = pairKickers ? TYPE.FOUR_TWO_PAIR : TYPE.FOUR_TWO;
    groups.forEach(function (pile, w) {
      if (pile.length < 4 || w <= minRank) return;
      const main = pile.slice(0, 4);
      const rest = remainingCards(groups, main);
      if (pairKickers) {
        const pairRanks = [];
        const rc = groupByWeight(rest);
        rc.forEach(function (p, rw) {
          if (p.length >= 2 && rw < 16) pairRanks.push(rw);
        });
        const combos = combinations(pairRanks, 2);
        for (let i = 0; i < combos.length; i++) {
          const a = take(groupByWeight(rest), combos[i][0], 2);
          const b = take(groupByWeight(rest), combos[i][1], 2);
          pushMove(moves, type, w, main.concat(a, b));
        }
      } else {
        const combos = combinations(rest, 2);
        for (let i = 0; i < combos.length; i++) {
          if (bothJokers(combos[i])) continue;
          pushMove(moves, type, w, main.concat(combos[i]));
        }
      }
    });
    return moves;
  }

  function findPlanes(groups, k, wing, minRank) {
    const moves = [];
    const tripleRanks = [];
    groups.forEach(function (pile, w) {
      if (pile.length >= 3 && w >= 3 && w <= 14) tripleRanks.push(w);
    });
    tripleRanks.sort(function (a, b) { return a - b; });
    const runs = consecutiveRuns(tripleRanks, k).filter(function (r) { return r.length === k; });

    for (let r = 0; r < runs.length; r++) {
      const run = runs[r];
      const rank = run[run.length - 1];
      if (rank <= minRank) continue;
      const main = [];
      for (let i = 0; i < run.length; i++) {
        const part = take(groups, run[i], 3);
        for (let j = 0; j < part.length; j++) main.push(part[j]);
      }
      const rest = remainingCards(groups, main);
      if (wing === 0) {
        pushMove(moves, TYPE.PLANE, rank, main, { k: k });
      } else if (wing === 1) {
        const combos = combinations(rest, k);
        const seen = new Set();
        for (let i = 0; i < combos.length; i++) {
          if (k === 2 && bothJokers(combos[i])) continue;
          const key = combos[i].map(function (c) { return c.id; }).sort().join(",");
          if (seen.has(key)) continue;
          seen.add(key);
          pushMove(moves, TYPE.PLANE_ONE, rank, main.concat(combos[i]), { k: k });
        }
      } else if (wing === 2) {
        const pairRanks = [];
        const rc = groupByWeight(rest);
        rc.forEach(function (p, rw) {
          if (p.length >= 2 && rw < 16) pairRanks.push(rw);
        });
        const combos = combinations(pairRanks, k);
        for (let i = 0; i < combos.length; i++) {
          let cards = main.slice();
          let ok = true;
          for (let j = 0; j < combos[i].length; j++) {
            const p = take(rc, combos[i][j], 2);
            if (!p) { ok = false; break; }
            cards = cards.concat(p);
          }
          if (ok) pushMove(moves, TYPE.PLANE_TWO, rank, cards, { k: k });
        }
      }
    }
    return moves;
  }

  function uniqueMoves(moves) {
    const seen = new Set();
    const out = [];
    for (let i = 0; i < moves.length; i++) {
      const key = moves[i].type + ":" + moves[i].cards.map(function (c) { return c.id; }).sort(function (a, b) { return a - b; }).join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(moves[i]);
    }
    return out;
  }

  function findMoves(hand, last) {
    const groups = groupByWeight(hand);
    const bombs = findBombsAndRocket(groups);
    if (!last) {
      const all = [];
      all.push.apply(all, findSingles(groups, 0));
      all.push.apply(all, findNOfAKind(groups, 2, TYPE.PAIR, 0));
      all.push.apply(all, findNOfAKind(groups, 3, TYPE.TRIPLE, 0));
      all.push.apply(all, findTripleKick(groups, false, TYPE.TRIPLE_ONE, 0));
      all.push.apply(all, findTripleKick(groups, true, TYPE.TRIPLE_TWO, 0));
      for (let len = 5; len <= 12; len++) all.push.apply(all, findSeq(groups, len, 1, TYPE.STRAIGHT, 0));
      for (let len = 3; len <= 10; len++) all.push.apply(all, findSeq(groups, len, 2, TYPE.LIAN_DUI, 0));
      for (let k = 2; k <= 6; k++) {
        all.push.apply(all, findPlanes(groups, k, 0, 0));
        all.push.apply(all, findPlanes(groups, k, 1, 0));
        all.push.apply(all, findPlanes(groups, k, 2, 0));
      }
      all.push.apply(all, findFourKick(groups, false, 0));
      all.push.apply(all, findFourKick(groups, true, 0));
      all.push.apply(all, bombs);
      return uniqueMoves(all);
    }

    if (last.type === TYPE.ROCKET) return [];
    let moves = [];
    const min = last.rank;
    switch (last.type) {
      case TYPE.SINGLE: moves = findSingles(groups, min); break;
      case TYPE.PAIR: moves = findNOfAKind(groups, 2, TYPE.PAIR, min); break;
      case TYPE.TRIPLE: moves = findNOfAKind(groups, 3, TYPE.TRIPLE, min); break;
      case TYPE.TRIPLE_ONE: moves = findTripleKick(groups, false, TYPE.TRIPLE_ONE, min); break;
      case TYPE.TRIPLE_TWO: moves = findTripleKick(groups, true, TYPE.TRIPLE_TWO, min); break;
      case TYPE.STRAIGHT: moves = findSeq(groups, last.len, 1, TYPE.STRAIGHT, min); break;
      case TYPE.LIAN_DUI: moves = findSeq(groups, last.k || last.len / 2, 2, TYPE.LIAN_DUI, min); break;
      case TYPE.PLANE: moves = findPlanes(groups, last.k || last.len / 3, 0, min); break;
      case TYPE.PLANE_ONE: moves = findPlanes(groups, last.k || last.len / 4, 1, min); break;
      case TYPE.PLANE_TWO: moves = findPlanes(groups, last.k || last.len / 5, 2, min); break;
      case TYPE.FOUR_TWO: moves = findFourKick(groups, false, min); break;
      case TYPE.FOUR_TWO_PAIR: moves = findFourKick(groups, true, min); break;
      case TYPE.BOMB: return uniqueMoves(bombs.filter(function (m) { return m.type === TYPE.ROCKET || m.rank > min; }));
      default: break;
    }
    if (last.type !== TYPE.BOMB) moves.push.apply(moves, bombs);
    return uniqueMoves(moves);
  }

  function handStrength(cards) {
    const cnt = countByWeight(cards);
    let s = 0;
    if ((cnt.get(16) || 0) && (cnt.get(17) || 0)) s += 8;
    else {
      if (cnt.get(16)) s += 3;
      if (cnt.get(17)) s += 4;
    }
    cnt.forEach(function (c, w) {
      if (c === 4) s += 6;
      if (w === 15) s += c * 2.5;
      if (w === 14) s += c * 1.2;
    });
    const moves = findMoves(cards, null);
    for (let i = 0; i < moves.length; i++) {
      const t = moves[i].type;
      if (t === TYPE.STRAIGHT && moves[i].len >= 6) s += 1.5;
      if (t === TYPE.LIAN_DUI) s += 1;
      if (t === TYPE.PLANE || t === TYPE.PLANE_ONE) s += 1.2;
    }
    return s;
  }

  function canPlayAll(hand, last) {
    const a = analyze(hand);
    return !!(a && beats(a, last));
  }

  function layoutPlayed(cards) {
    const mv = analyze(cards);
    if (!mv) return sortCards(cards);
    const groups = groupByWeight(cards);
    function takeW(w, n) {
      return sortCards(groups.get(w) || []).slice(0, n);
    }
    function leftover(used) {
      const ids = new Set(used.map(function (c) { return c.id; }));
      return sortCards(cards.filter(function (c) { return !ids.has(c.id); }));
    }
    const t = mv.type;
    if (t === TYPE.TRIPLE_ONE || t === TYPE.TRIPLE_TWO) {
      const main = takeW(mv.rank, 3);
      return main.concat(leftover(main));
    }
    if (t === TYPE.FOUR_TWO || t === TYPE.FOUR_TWO_PAIR) {
      const main = takeW(mv.rank, 4);
      return main.concat(leftover(main));
    }
    if (t === TYPE.PLANE || t === TYPE.PLANE_ONE || t === TYPE.PLANE_TWO) {
      const k = mv.k || 2;
      const ws = [];
      for (let i = k - 1; i >= 0; i--) ws.push(mv.rank - i);
      ws.sort(function (a, b) { return b - a; });
      const main = [];
      for (let i = 0; i < ws.length; i++) {
        const part = takeW(ws[i], 3);
        for (let j = 0; j < part.length; j++) main.push(part[j]);
      }
      return main.concat(leftover(main));
    }
    return sortCards(cards);
  }

  global.DDZ = {
    TYPE: TYPE,
    createDeck: createDeck,
    shuffle: shuffle,
    sortCards: sortCards,
    layoutPlayed: layoutPlayed,
    analyze: analyze,
    beats: beats,
    findMoves: findMoves,
    handStrength: handStrength,
    canPlayAll: canPlayAll,
    countByWeight: countByWeight,
  };
})(typeof window !== "undefined" ? window : globalThis);
