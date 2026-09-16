importScripts("engine.js", "ai.js");

self.onmessage = function (e) {
  const d = e.data;
  self.postMessage(XiangqiAI.chooseMove(d.board, d.side, d.repeats, d.level, d.notes, d.plies));
};
