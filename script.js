(function () {
  "use strict";

  var attendedInput = document.getElementById("attended");
  var totalInput = document.getElementById("total");
  var reqGroup = document.getElementById("reqGroup");
  var verdictBox = document.getElementById("verdictBox");
  var verdictSub = verdictBox.querySelector(".verdict-sub");
  var verdictMain = document.getElementById("verdictMain");
  var currentPctEl = document.getElementById("currentPct");
  var shareBtn = document.getElementById("shareBtn");
  var canvas = document.getElementById("shareCanvas");

  var requiredPct = 75;
  var EPS = 1e-9;

  var lastResult = null;

  reqGroup.addEventListener("click", function (e) {
    var btn = e.target.closest(".pill");
    if (!btn) return;
    reqGroup.querySelectorAll(".pill").forEach(function (p) {
      p.classList.remove("active");
    });
    btn.classList.add("active");
    requiredPct = parseFloat(btn.dataset.val);
    update();
  });

  attendedInput.addEventListener("input", update);
  totalInput.addEventListener("input", update);

  function calculate(attended, total, req) {
    if (total === null || attended === null) {
      return { state: "empty" };
    }
    if (total === 0) {
      return { state: "empty" };
    }
    if (attended < 0 || total < 0) {
      return { state: "error", message: "negative classes? bro this isn't crypto, numbers can't go below zero 📉" };
    }
    if (attended > total) {
      return { state: "error", message: "you attended MORE classes than were held? nice try 😂 fix your numbers" };
    }

    var currentPercent = (attended / total) * 100;

    if (currentPercent >= req - EPS) {
      var maxTotal = Math.floor((attended * 100) / req + EPS);
      var n = maxTotal - total;
      if (n < 0) n = 0;
      return { state: "safe", n: n, currentPercent: currentPercent };
    } else {
      var numerator = (req / 100) * total - attended;
      var denominator = 1 - req / 100;
      var xRaw = numerator / denominator;
      var x = Math.ceil(xRaw - EPS);
      if (x < 0) x = 0;
      return { state: "short", x: x, currentPercent: currentPercent };
    }
  }

  function fmtPct(p) {
    return (Math.round(p * 10) / 10).toString();
  }

  function render(result) {
    verdictMain.classList.remove("safe", "danger", "neutral", "error");

    if (result.state === "empty") {
      verdictSub.textContent = "waiting on you";
      verdictMain.textContent = "punch in your numbers up there ☝️";
      verdictMain.classList.add("neutral");
      currentPctEl.textContent = "";
      shareBtn.disabled = true;
      return;
    }

    if (result.state === "error") {
      verdictSub.textContent = "hold up";
      verdictMain.textContent = result.message;
      verdictMain.classList.add("error");
      currentPctEl.textContent = "";
      shareBtn.disabled = true;
      return;
    }

    shareBtn.disabled = false;
    var pctStr = fmtPct(result.currentPercent);

    if (result.state === "safe") {
      verdictSub.textContent = "verdict";
      if (result.n === 0) {
        verdictMain.textContent = "you're sitting exactly at " + requiredPct + "% — zero bunks left in the tank 😬";
      } else {
        verdictMain.textContent = "you can safely bunk " + result.n + " more class" + (result.n === 1 ? "" : "es") + " 😎";
      }
      verdictMain.classList.add("safe");
      currentPctEl.innerHTML = "current attendance: <span class='num'>" + pctStr + "%</span>";
    } else {
      verdictSub.textContent = "verdict";
      verdictMain.textContent = "attend the next " + result.x + " class" + (result.x === 1 ? "" : "es") + " in a row to get back to " + requiredPct + "% 💀";
      verdictMain.classList.add("danger");
      currentPctEl.innerHTML = "current attendance: <span class='num'>" + pctStr + "%</span>";
    }
  }

  function update() {
    var attendedRaw = attendedInput.value.trim();
    var totalRaw = totalInput.value.trim();

    var attended = attendedRaw === "" ? null : Number(attendedRaw);
    var total = totalRaw === "" ? null : Number(totalRaw);

    var result = calculate(attended, total, requiredPct);
    lastResult = result;
    render(result);
  }

  function verdictText(result) {
    if (result.state === "safe") {
      if (result.n === 0) {
        return "I'm exactly at " + requiredPct + "% attendance — zero bunks left 😬";
      }
      return "I can safely bunk " + result.n + " more class" + (result.n === 1 ? "" : "es") + " and stay above " + requiredPct + "% 😎";
    }
    if (result.state === "short") {
      return "I gotta attend the next " + result.x + " class" + (result.x === 1 ? "" : "es") + " in a row to get back to " + requiredPct + "% 💀";
    }
    return "check your attendance odds";
  }

  function wrapText(ctx, text, maxWidth) {
    var words = text.split(" ");
    var lines = [];
    var current = "";
    for (var i = 0; i < words.length; i++) {
      var test = current ? current + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = words[i];
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function drawShareCard(result) {
    var ctx = canvas.getContext("2d");
    var W = canvas.width;
    var H = canvas.height;

    var isSafe = result.state === "safe";
    var bgTop = isSafe ? "#0f2a1e" : "#2a0f18";
    var bgBottom = "#0d0f14";
    var accent = isSafe ? "#37e08c" : "#ff5c7a";

    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, bgTop);
    grad.addColorStop(1, bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";

    ctx.font = "700 42px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#9aa1b2";
    ctx.fillText("BUNK CALCULATOR", W / 2, 150);

    ctx.font = "800 64px -apple-system, Arial, sans-serif";
    ctx.fillStyle = accent;
    var mainLine = isSafe
      ? (result.n === 0 ? "EXACTLY AT " + requiredPct + "%" : "BUNK " + result.n + " MORE")
      : "ATTEND " + result.x + " STRAIGHT";
    ctx.fillText(mainLine, W / 2, 420);

    ctx.font = "600 40px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#eef0f5";
    var lines = wrapText(ctx, verdictText(result), 880);
    var startY = 540;
    lines.forEach(function (line, idx) {
      ctx.fillText(line, W / 2, startY + idx * 56);
    });

    var afterTextY = startY + lines.length * 56 + 70;
    ctx.font = "700 46px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(fmtPct(result.currentPercent) + "% ATTENDANCE", W / 2, afterTextY);

    ctx.font = "500 34px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#9aa1b2";
    ctx.fillText(window.location.host || "bunk-calculator.vercel.app", W / 2, H - 90);
  }

  function downloadCanvas() {
    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "bunk-calculator-verdict.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 2000);
    }, "image/png");
  }

  shareBtn.addEventListener("click", function () {
    if (!lastResult || lastResult.state === "empty" || lastResult.state === "error") return;

    drawShareCard(lastResult);
    downloadCanvas();

    var text = verdictText(lastResult) + " — check yours at " + window.location.href;
    var waUrl = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(waUrl, "_blank", "noopener");
  });

  update();
})();
