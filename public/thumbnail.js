/* Story Studio thumbnails (1280x720). One drawing, used by the website (to pick one) and by the video maker
   (to send exactly that picture to YouTube). spec = { style, title, hook, badge, sub } */
(function (root) {
  var W = 1280, H = 720, SUN = "#f5b700", INK = "#3a2a00";
  var FONT = "ThumbFredoka, Fredoka, 'Arial Rounded MT Bold', 'Helvetica Neue', sans-serif";
  var FONT_FILES = { 500: "fredoka-500.woff2", 600: "fredoka-600.woff2", 700: "fredoka-700.woff2" };
  // load the font the thumbnails use (base = where the font files are, e.g. "/fonts/" or data URLs)
  function loadFonts(src) {
    if (typeof FontFace === "undefined" || !root.document) return Promise.resolve();
    return Promise.all(Object.keys(FONT_FILES).map(function (w) {
      var f = new FontFace("ThumbFredoka", "url(" + src(FONT_FILES[w]) + ")", { weight: w });
      return f.load().then(function (ff) { root.document.fonts.add(ff); }).catch(function () {});
    }));
  }
  var STYLES = { big: "Big title", badge: "Time badge", promise: "Sleep promise", clean: "Clean & soft" };

  function cover(g, img) {
    var s = Math.max(W / img.width, H / img.height), w = img.width * s, h = img.height * s;
    g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }
  function font(g, weight, size) { g.font = weight + " " + size + "px " + FONT; }
  function width(g, t) { return g.measureText(t).width; }
  // split text into 1 or 2 lines and find the biggest size (<= max) that fits maxW
  function layout(g, text, weight, max, maxW) {
    var words = text.split(/\s+/).filter(Boolean), best = null;
    for (var s = max; s >= 28; s -= 4) {
      font(g, weight, s);
      if (width(g, text) <= maxW) return { size: s, lines: [text] };
      if (!best && words.length > 1) {
        var bi = 1, bw = 1e9;
        for (var i = 1; i < words.length; i++) {
          var a = words.slice(0, i).join(" "), b = words.slice(i).join(" "), m = Math.max(width(g, a), width(g, b));
          if (m < bw) { bw = m; bi = i; }
        }
        var l1 = words.slice(0, bi).join(" "), l2 = words.slice(bi).join(" ");
        if (Math.max(width(g, l1), width(g, l2)) <= maxW && s <= max * 0.85) return { size: s, lines: [l1, l2] };
      }
    }
    return { size: 28, lines: [text] };
  }
  function glowText(g, t, x, y, blur) {
    g.save(); g.shadowColor = "rgba(0,0,0,.6)"; g.shadowBlur = blur; g.shadowOffsetY = Math.round(blur / 5);
    g.fillText(t, x, y); g.restore();
  }
  function rr(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function pill(g, text, x, y, size, align) {     // yellow label, y = its vertical centre
    font(g, 700, size); var w = width(g, text) + size * 1.3, h = size * 1.75, x0 = align === "center" ? x - w / 2 : x;
    g.save(); g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 18; g.shadowOffsetY = 4;
    rr(g, x0, y - h / 2, w, h, h / 2); g.fillStyle = SUN; g.fill(); g.restore();
    g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, x0 + w / 2, y + size * 0.04);
    g.textBaseline = "alphabetic";
  }
  function backdrop(g, cx, cy, rw, rh, a) {     // soft dark glow behind centred text, so it reads on snow or bright sky
    g.save(); g.translate(cx, cy); g.scale(1, rh / rw);
    var b = g.createRadialGradient(0, 0, 0, 0, 0, rw); b.addColorStop(0, "rgba(0,0,0," + a + ")"); b.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = b; g.beginPath(); g.arc(0, 0, rw, 0, Math.PI * 2); g.fill(); g.restore();
  }
  function darkPill(g, text, x, y, size) {
    font(g, 500, size); var w = width(g, text) + size * 1.4, h = size * 1.8;
    rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fillStyle = "rgba(10,14,28,.55)"; g.fill();
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, x, y + size * 0.04); g.textBaseline = "alphabetic";
  }
  function spaced(g, px) { if ("letterSpacing" in g) g.letterSpacing = px + "px"; }
  function vignette(g, strength) {
    var v = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.72);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0," + strength + ")");
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  function draw(g, img, spec) {
    spec = spec || {};
    var st = STYLES[spec.style] ? spec.style : "big";
    var title = (spec.title || "Nature Sounds").trim(), hook = (spec.hook || "").trim() || title;
    var badge = (spec.badge || "").trim(), sub = (spec.sub || "Sleep · Study · Relax").trim();
    g.save(); g.clearRect(0, 0, W, H);
    g.filter = "saturate(1.22) contrast(1.06) brightness(1.04)";
    if (img) cover(g, img); else { g.fillStyle = "#24324f"; g.fillRect(0, 0, W, H); }
    g.filter = "none"; g.fillStyle = "#fff"; g.textBaseline = "alphabetic"; spaced(g, 0);

    if (st === "big") {
      var gr = g.createLinearGradient(0, H * 0.3, 0, H);
      gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.62)");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      var L = layout(g, title.toUpperCase(), 700, 176, W * 0.88);
      font(g, 700, L.size); g.fillStyle = "#fff"; g.textAlign = "left";
      var y = H - 150 - (L.lines.length - 1) * L.size * 0.98;
      for (var i = 0; i < L.lines.length; i++) glowText(g, L.lines[i], 64, y + i * L.size * 0.98, 30);
      pill(g, (badge ? badge + "  ·  " : "") + sub.toUpperCase(), 64, H - 92, 34, "left");
    } else if (st === "badge") {
      var gb = g.createLinearGradient(0, H * 0.5, 0, H);
      gb.addColorStop(0, "rgba(0,0,0,0)"); gb.addColorStop(1, "rgba(0,0,0,.68)");
      g.fillStyle = gb; g.fillRect(0, 0, W, H);
      var parts = (badge || "").split(" "), num = parts[0] || "", unit = (parts.slice(1).join(" ") || "").toUpperCase();
      if (num) {
        font(g, 700, 150); var nw = Math.max(width(g, num), 150); font(g, 700, 44); nw = Math.max(nw, width(g, unit));
        var bw = nw + 90, bh = 250, bx = W - 64 - bw, by = 54;
        g.save(); g.shadowColor = "rgba(0,0,0,.4)"; g.shadowBlur = 30; g.shadowOffsetY = 8; rr(g, bx, by, bw, bh, 44);
        g.fillStyle = SUN; g.fill(); g.restore();
        g.fillStyle = INK; g.textAlign = "center"; font(g, 700, 150); g.fillText(num, bx + bw / 2, by + 158);
        font(g, 700, 44); spaced(g, 4); g.fillText(unit, bx + bw / 2, by + 214); spaced(g, 0);
      }
      var T = layout(g, title, 700, 118, W * 0.66);
      font(g, 700, T.size); g.fillStyle = "#fff"; g.textAlign = "left";
      var ty = H - 104 - (T.lines.length - 1) * T.size;
      for (var j = 0; j < T.lines.length; j++) glowText(g, T.lines[j], 64, ty + j * T.size, 26);
      font(g, 600, 36); g.globalAlpha = .95; glowText(g, sub, 66, H - 54, 14); g.globalAlpha = 1;
    } else if (st === "promise") {
      g.fillStyle = "rgba(0,0,0,.18)"; g.fillRect(0, 0, W, H); vignette(g, .6);
      var P = layout(g, hook, 700, 132, W * 0.84);
      var py = H * 0.5 - (P.lines.length - 1) * P.size * 0.5 + P.size * 0.3;
      backdrop(g, W / 2, H * 0.5, W * 0.48, H * 0.36, .5);
      font(g, 700, P.size); g.fillStyle = "#fff"; g.textAlign = "center";
      for (var k = 0; k < P.lines.length; k++) glowText(g, P.lines[k], W / 2, py + k * P.size, 34);
      var line = (title + (badge ? "  ·  " + badge : "")).toUpperCase();
      pill(g, line, W / 2, py + (P.lines.length - 1) * P.size + 78, 34, "center");
    } else {   // clean
      vignette(g, .5);
      var C = layout(g, title.toUpperCase(), 600, 104, W * 0.8);
      backdrop(g, W / 2, H * 0.52, W * 0.46, H * 0.32, .45);
      font(g, 600, C.size); spaced(g, Math.round(C.size * 0.08)); g.fillStyle = "#fff"; g.textAlign = "center";
      var cy = H * 0.5 - (C.lines.length - 1) * C.size * 0.5 + C.size * 0.3;
      for (var m = 0; m < C.lines.length; m++) glowText(g, C.lines[m], W / 2, cy + m * C.size, 28);
      spaced(g, 0);
      var ly = cy + (C.lines.length - 1) * C.size + 44;
      g.fillStyle = SUN; rr(g, W / 2 - 70, ly, 140, 7, 3.5); g.fill();
      darkPill(g, ((badge ? badge + "  ·  " : "") + sub).toUpperCase(), W / 2, ly + 64, 30);
    }
    g.restore();
  }

  root.StoryThumb = { W: W, H: H, STYLES: STYLES, draw: draw, loadFonts: loadFonts, FONT_FILES: FONT_FILES };
})(typeof window !== "undefined" ? window : globalThis);
