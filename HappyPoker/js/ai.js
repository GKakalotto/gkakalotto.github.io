(function (global) {
  const TYPE = global.DDZ.TYPE;

  function isBombLike(m) {
    return m.type === TYPE.BOMB || m.type === TYPE.ROCKET;
  }

  function breakPenalty(move, hand) {
    const cnt = global.DDZ.countByWeight(hand);
    let p = 0;
    const used = global.DDZ.countByWeight(move.cards);
    used.forEach(function (c, w) {
      const have = cnt.get(w) || 0;
      if (have === 4 && move.type !== TYPE.BOMB && move.type !== TYPE.FOUR_TWO && move.type !== TYPE.FOUR_TWO_PAIR) p += 90;
      if (have === 3 && c < 3 && move.type !== TYPE.TRIPLE && move.type.indexOf("PLANE") !== 0 && move.type.indexOf("TRIPLE") !== 0) p += 12;
      if ((w === 16 || w === 17) && move.type === TYPE.SINGLE && (cnt.get(16) && cnt.get(17))) p += 50;
    });
    return p;
  }

  function smallest(moves) {
    return moves.slice().sort(function (a, b) {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.len !== b.len) return a.len - b.len;
      return a.cards[0].id - b.cards[0].id;
    })[0];
  }

  function chooseBid(hand, currentBid) {
    const s = global.DDZ.handStrength(hand);
    let want = 0;
    if (s >= 10) want = 3;
    else if (s >= 7) want = 2;
    else if (s >= 4.5) want = 1;
    if (want <= currentBid) return 0;
    return want;
  }

  function chooseMove(hand, last, ctx) {
    if (global.DDZ.canPlayAll(hand, last)) {
      return global.DDZ.analyze(hand);
    }

    const moves = global.DDZ.findMoves(hand, last);
    if (!moves.length) return null;

    const me = ctx.me;
    const landlord = ctx.landlord;
    const hands = ctx.hands;
    const lastPlayer = last ? last.player : -1;
    const partner = (me !== landlord)
      ? [0, 1, 2].find(function (p) { return p !== me && p !== landlord; })
      : -1;

    function oppMin() {
      let m = 99;
      for (let p = 0; p < 3; p++) {
        if (p === me) continue;
        if (me === landlord) {
          if (hands[p].length < m) m = hands[p].length;
        } else if (p === landlord) {
          if (hands[p].length < m) m = hands[p].length;
        }
      }
      return m;
    }

    if (!last) {
      let best = null;
      let bestScore = -1e9;
      for (let i = 0; i < moves.length; i++) {
        const mv = moves[i];
        if (mv.cards.length === hand.length) return mv;
        let s = mv.len * 8 - mv.rank;
        if (mv.type === TYPE.STRAIGHT || mv.type === TYPE.LIAN_DUI || mv.type === TYPE.PLANE) s += 40 + mv.len;
        if (mv.type === TYPE.PLANE_ONE || mv.type === TYPE.PLANE_TWO) s += 24;
        if (mv.type === TYPE.TRIPLE_ONE || mv.type === TYPE.TRIPLE_TWO) s += 10;
        if (isBombLike(mv)) s -= 400;
        if (mv.rank >= 15 && mv.type === TYPE.SINGLE && hand.length > 3) s -= 20;
        s -= breakPenalty(mv, hand);
        if (hand.length - mv.len <= 2 && !isBombLike(mv)) s += 30;
        if (s > bestScore) {
          bestScore = s;
          best = mv;
        }
      }
      return best;
    }

    const normal = moves.filter(function (m) { return !isBombLike(m); });
    const bombs = moves.filter(isBombLike);
    const enemyFew = oppMin() <= 2;
    const partnerFew = partner >= 0 && hands[partner].length <= 2;

    if (partner >= 0 && lastPlayer === partner) {
      if (hands[partner].length <= 2) return null;
      if (last.rank >= 14) return null;
      if (!normal.length) return null;
      const cheap = normal.filter(function (m) { return m.rank <= 11 && breakPenalty(m, hand) < 20; });
      if (!cheap.length) return null;
      return smallest(cheap);
    }

    if (normal.length) {
      if (partnerFew && lastPlayer === landlord) {
        return smallest(normal);
      }
      const cheap = normal.filter(function (m) { return breakPenalty(m, hand) < 40; });
      const pool = cheap.length ? cheap : normal;
      if (lastPlayer === landlord || me === landlord || enemyFew) {
        return smallest(pool);
      }
      const small = pool.filter(function (m) { return m.rank <= last.rank + 4 || m.rank <= 12; });
      if (small.length) return smallest(small);
      if (hand.length <= 6) return smallest(pool);
      return null;
    }

    if (bombs.length) {
      if (enemyFew || hand.length <= 4 || (partnerFew && lastPlayer === landlord) || hands[landlord].length <= 2) {
        return smallest(bombs);
      }
    }
    return null;
  }

  function typePri(t) {
    if (t === TYPE.STRAIGHT || t === TYPE.LIAN_DUI || t === TYPE.PLANE) return 0;
    if (t === TYPE.PLANE_ONE || t === TYPE.PLANE_TWO) return 8;
    if (t === TYPE.TRIPLE_ONE || t === TYPE.TRIPLE_TWO) return 18;
    if (t === TYPE.TRIPLE) return 28;
    if (t === TYPE.PAIR) return 48;
    if (t === TYPE.FOUR_TWO || t === TYPE.FOUR_TWO_PAIR) return 58;
    if (t === TYPE.SINGLE) return 70;
    if (t === TYPE.BOMB) return 5000;
    if (t === TYPE.ROCKET) return 6000;
    return 40;
  }

  function shapeKey(m) {
    const ws = m.cards.map(function (c) { return c.weight; }).sort(function (a, b) { return a - b; });
    return m.type + ":" + ws.join(",");
  }

  function uniqueShapes(moves) {
    const seen = new Set();
    const out = [];
    for (let i = 0; i < moves.length; i++) {
      const k = shapeKey(moves[i]);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(moves[i]);
    }
    return out;
  }

  function hintScore(move, hand) {
    const cnt = global.DDZ.countByWeight(hand);
    const used = global.DDZ.countByWeight(move.cards);
    let s = typePri(move.type) + move.rank * 8 + (move.len || 0);
    used.forEach(function (c, w) {
      const have = cnt.get(w) || 0;
      s += w * c;
      if (have === 4 && move.type !== TYPE.BOMB && move.type !== TYPE.FOUR_TWO && move.type !== TYPE.FOUR_TWO_PAIR) s += 800;
      if (have === 2 && c === 1) s += 90;
      if (have === 3 && c < 3) s += 140;
      if (w === 15 && c < have && move.type !== TYPE.PAIR && move.type !== TYPE.TRIPLE && move.type !== TYPE.BOMB) s += 40;
      if ((w === 16 || w === 17) && move.type !== TYPE.SINGLE && move.type !== TYPE.ROCKET) s += 220;
    });
    return s;
  }

  function sortHintMoves(hand, last) {
    const moves = uniqueShapes(global.DDZ.findMoves(hand, last));
    moves.sort(function (a, b) {
      const sa = hintScore(a, hand);
      const sb = hintScore(b, hand);
      if (sa !== sb) return sa - sb;
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.cards[0].id - b.cards[0].id;
    });
    return moves;
  }

  global.DDZ.chooseBid = chooseBid;
  global.DDZ.chooseMove = chooseMove;
  global.DDZ.sortHintMoves = sortHintMoves;
})(typeof window !== "undefined" ? window : globalThis);
