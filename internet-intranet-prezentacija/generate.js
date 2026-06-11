const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaGlobe, FaLock, FaUsers, FaShieldAlt, FaExclamationTriangle,
  FaCheckCircle, FaTimesCircle, FaServer,
  FaGraduationCap, FaShoppingCart, FaEnvelope, FaComments, FaBug,
  FaUserSecret, FaClock, FaWifi, FaBuilding, FaFolderOpen,
  FaTools, FaCog, FaRegLightbulb
} = require("react-icons/fa");

function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// ------------------------------------------------------------
// Design system — soft "aesthetic" lavender + rose
// ------------------------------------------------------------
const C = {
  deepPlum:  "3D2E5C",  // text / dark accents
  plum:      "6B5B95",  // primary deep lavender
  lavender:  "9B8ACC",  // primary lavender
  lilac:     "C7BCE0",  // soft lavender
  rose:      "D896B3",  // dusty rose / pink accent
  blush:     "F5D5E0",  // light blush
  cream:     "FAF6FB",  // background panel
  bgSoft:    "F4EEF7",  // softer background
  white:     "FFFFFF",
  ink:       "3A3050",  // body text
  muted:     "8B7AA8",  // muted text
  line:      "E5DCEE",  // borders
  gold:      "C9A66B",  // subtle warm accent
  green:     "8FAE8E",  // soft sage (for pros)
  coral:     "D87A8C",  // soft coral (for cons - softer than red)
};

const FONT_TITLE = "Trebuchet MS";
const FONT_BODY  = "Calibri";

const TOTAL_SLIDES = 13;

function addContentHeader(slide, title, slideNum) {
  // Top accent strip
  slide.addShape("rect", {
    x: 0, y: 0, w: 10, h: 0.06,
    fill: { color: C.lavender }, line: { type: "none" }
  });

  // Title
  slide.addText(title, {
    x: 0.55, y: 0.32, w: 7.5, h: 0.7,
    fontFace: FONT_TITLE, fontSize: 26, bold: true,
    color: C.deepPlum, align: "left", valign: "middle",
    margin: 0
  });

  // Slide number — soft rounded pill
  slide.addShape("roundRect", {
    x: 8.7, y: 0.35, w: 1.0, h: 0.38,
    fill: { color: C.cream }, line: { color: C.lilac, width: 0.75 },
    rectRadius: 0.19
  });
  slide.addText(`${slideNum} / ${TOTAL_SLIDES}`, {
    x: 8.7, y: 0.35, w: 1.0, h: 0.38,
    fontFace: FONT_BODY, fontSize: 10.5, color: C.plum,
    align: "center", valign: "middle", margin: 0
  });

  // Footer
  slide.addText("Internet i Intranet", {
    x: 0.5, y: 5.32, w: 5, h: 0.25,
    fontFace: FONT_BODY, fontSize: 9, color: C.muted,
    align: "left", valign: "middle", margin: 0
  });
  slide.addShape("rect", {
    x: 0, y: 5.58, w: 10, h: 0.05,
    fill: { color: C.lilac }, line: { type: "none" }
  });
}

function setSoftBg(slide) {
  slide.background = { color: C.white };
  // Very subtle cream/lavender wash on the body area
  slide.addShape("rect", {
    x: 0, y: 1.18, w: 10, h: 4.1,
    fill: { color: C.cream }, line: { type: "none" }
  });
}

// Reusable soft shadow (returns a fresh object each call — see pptxgenjs pitfall #7)
const softShadow = () => ({
  type: "outer", color: "000000", blur: 10, offset: 1, angle: 90, opacity: 0.06
});

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------
(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Učenica";
  pres.title  = "Internet i Intranet";

  const iconCache = {};
  async function ico(IconComp, color) {
    const key = IconComp.name + "_" + color;
    if (!iconCache[key]) iconCache[key] = await iconToBase64Png(IconComp, color, 256);
    return iconCache[key];
  }

  // ============================================================
  // SLIDE 1 — Naslovni (Title)
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };

    // Big soft lavender blob on the right
    s.addShape("ellipse", {
      x: 6.2, y: -1.5, w: 6.5, h: 6.5,
      fill: { color: C.lilac, transparency: 40 }, line: { type: "none" }
    });
    // Smaller rose blob, layered
    s.addShape("ellipse", {
      x: 7.3, y: 2.2, w: 3.5, h: 3.5,
      fill: { color: C.blush, transparency: 25 }, line: { type: "none" }
    });
    // Globe icon — soft lavender, in the blob
    s.addImage({ data: await ico(FaGlobe, "#" + C.plum), x: 7.4, y: 1.4, w: 2.2, h: 2.2, transparency: 25 });

    // Main title
    s.addText("Internet", {
      x: 0.7, y: 1.7, w: 7, h: 0.95,
      fontFace: FONT_TITLE, fontSize: 54, bold: true,
      color: C.deepPlum, align: "left", valign: "middle", margin: 0
    });
    s.addText("i Intranet", {
      x: 0.7, y: 2.6, w: 7, h: 0.95,
      fontFace: FONT_TITLE, fontSize: 54, bold: true,
      color: C.lavender, align: "left", valign: "middle", margin: 0
    });

    // Author info block
    s.addText([
      { text: "Jana Kocić 1-4", options: { fontSize: 20, color: C.deepPlum, bold: true, breakLine: true } },
      { text: "10.5.2026.", options: { fontSize: 14, color: C.muted } },
    ], { x: 0.7, y: 3.95, w: 6, h: 1.2, fontFace: FONT_BODY, valign: "top", margin: 0, paraSpaceAfter: 5 });

    // Footer
    s.addShape("rect", { x: 0, y: 5.52, w: 10, h: 0.1, fill: { color: C.lavender }, line: { type: "none" } });
  }

  // ============================================================
  // SLIDE 2 — Uvod / Sadržaj
  // ============================================================
  {
    const s = pres.addSlide();
    setSoftBg(s);
    addContentHeader(s, "O čemu ćemo pričati?", 2);

    const items = [
      { n: "1", t: "Šta je internet",          c: C.lavender },
      { n: "2", t: "Šta je intranet",          c: C.rose     },
      { n: "3", t: "Razlike između njih",      c: C.plum     },
      { n: "4", t: "Prednosti i mane",         c: C.gold     },
      { n: "5", t: "Primeri upotrebe",         c: C.green    },
    ];

    // Single column of 5 items on the left
    const startX = 0.6, startY = 1.4;
    const cardW = 5.5, cardH = 0.6, gapY = 0.13;

    items.forEach((it, i) => {
      const y = startY + i * (cardH + gapY);

      s.addShape("roundRect", {
        x: startX, y, w: cardW, h: cardH,
        fill: { color: C.white },
        line: { color: C.line, width: 0.75 },
        rectRadius: 0.1,
        shadow: softShadow()
      });

      s.addShape("ellipse", {
        x: startX + 0.18, y: y + 0.13, w: 0.34, h: 0.34,
        fill: { color: it.c, transparency: 15 }, line: { type: "none" }
      });
      s.addText(it.n, {
        x: startX + 0.18, y: y + 0.13, w: 0.34, h: 0.34,
        fontFace: FONT_TITLE, fontSize: 13, bold: true,
        color: C.white, align: "center", valign: "middle", margin: 0
      });

      s.addText(it.t, {
        x: startX + 0.7, y: y, w: cardW - 0.8, h: cardH,
        fontFace: FONT_BODY, fontSize: 15, color: C.ink,
        bold: true, valign: "middle", margin: 0
      });
    });

    // Right-side photo
    s.addImage({
      path: "images/meeting.jpg",
      x: 6.55, y: 1.85, w: 3.1, h: 2.4,
      sizing: { type: "cover", w: 3.1, h: 2.4 }
    });
  }

  // ============================================================
  // SLIDE 3 — Šta je Internet?
  // ============================================================
  {
    const s = pres.addSlide();
    setSoftBg(s);
    addContentHeader(s, "Šta je internet?", 3);

    // Definition card (left)
    s.addShape("roundRect", {
      x: 0.55, y: 1.35, w: 5.5, h: 1.5,
      fill: { color: C.white }, line: { color: C.line, width: 0.75 },
      rectRadius: 0.12, shadow: softShadow()
    });
    // Soft left accent strip (rounded too, slim)
    s.addShape("roundRect", {
      x: 0.55, y: 1.55, w: 0.08, h: 1.1,
      fill: { color: C.lavender }, line: { type: "none" }, rectRadius: 0.04
    });
    s.addText("Internet je globalna mreža koja povezuje milione računara širom sveta i omogućava razmenu informacija i komunikaciju među korisnicima.", {
      x: 0.85, y: 1.45, w: 5.05, h: 1.3,
      fontFace: FONT_BODY, fontSize: 14, color: C.ink,
      valign: "middle", margin: 0
    });

    const bullets = [
      "Dostupan je svima",
      "Koristi se svakodnevno",
      "Omogućava brz pristup podacima",
    ];
    s.addText(
      bullets.map((t, i) => ({
        text: t,
        options: { bullet: true, breakLine: i < bullets.length - 1 },
      })),
      {
        x: 0.6, y: 3.0, w: 5.5, h: 1.8,
        fontFace: FONT_BODY, fontSize: 14, color: C.ink,
        valign: "top", margin: 0, paraSpaceAfter: 8,
      }
    );

    // Right photo — Earth from space (network/global theme)
    s.addImage({
      path: "images/network.jpg",
      x: 6.4, y: 1.55, w: 3.2, h: 2.1,
      sizing: { type: "cover", w: 3.2, h: 2.1 }
    });
  }

  // ============================================================
  // SLIDE 4 — Upotreba Interneta
  // ============================================================
  {
    const s = pres.addSlide();
    setSoftBg(s);
    addContentHeader(s, "Čemu služi internet?", 4);

    s.addText("Internet se koristi za komunikaciju, obrazovanje, zabavu i pronalaženje različitih informacija.", {
      x: 0.55, y: 1.3, w: 9, h: 0.55,
      fontFace: FONT_BODY, fontSize: 13, color: C.muted, italic: true,
      valign: "middle", margin: 0
    });

    const usage = [
      "Društvene mreže",
      "Online nastava",
      "Kupovina preko interneta",
      "Slanje poruka i mejlova",
    ];

    const cardW = 4.3, cardH = 1.45, startX = 0.6, startY = 2.0, gapX = 0.2, gapY = 0.2;
    for (let i = 0; i < usage.length; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      s.addShape("roundRect", {
        x, y, w: cardW, h: cardH,
        fill: { color: C.white }, line: { color: C.line, width: 0.75 },
        rectRadius: 0.12, shadow: softShadow()
      });

      s.addText(usage[i], {
        x: x + 0.3, y: y, w: cardW - 0.6, h: cardH,
        fontFace: FONT_BODY, fontSize: 17, bold: true, color: C.ink,
        align: "center", valign: "middle", margin: 0
      });
    }
  }

  // ============================================================
  // SLIDE 5 — Prednosti Interneta
  // ============================================================
  {
    const s = pres.addSlide();
    setSoftBg(s);
    addContentHeader(s, "Prednosti interneta", 5);

    s.addText("Internet je veoma važan jer ljudima omogućava brz pristup informacijama i lakšu komunikaciju.", {
      x: 0.55, y: 1.3, w: 9, h: 0.55,
      fontFace: FONT_BODY, fontSize: 13, color: C.muted, italic: true,
      valign: "middle", margin: 0
    });

    const items = [
      "Učenje na daljinu",
      "Brza razmena informacija",
      "Online poslovanje",
      "Zabava i informisanje",
    ];

    for (let i = 0; i < items.length; i++) {
      const y = 2.0 + i * 0.7;
      s.addShape("roundRect", {
        x: 0.6, y, w: 5.8, h: 0.6,
        fill: { color: C.white }, line: { color: C.line, width: 0.75 },
        rectRadius: 0.1
      });
      s.addShape("roundRect", {
        x: 0.6, y: y + 0.08, w: 0.08, h: 0.44,
        fill: { color: C.green }, line: { type: "none" }, rectRadius: 0.04
      });

      s.addText(items[i], {
        x: 0.9, y, w: 4.8, h: 0.6,
        fontFace: FONT_BODY, fontSize: 15, color: C.ink, bold: true,
        valign: "middle", margin: 0
      });
    }

    // Right photo — learning theme
    s.addImage({
      path: "images/learning.jpg",
      x: 6.7, y: 2.1, w: 2.9, h: 2.0,
      sizing: { type: "cover", w: 2.9, h: 2.0 }
    });
  }

  // ============================================================
  // SLIDE 6 — Mane Interneta
  // ============================================================
  {
    const s = pres.addSlide();
    setSoftBg(s);
    addContentHeader(s, "Mane interneta", 6);

    s.addText("Pored brojnih prednosti, internet može imati i negativne strane ako se ne koristi pravilno.", {
      x: 0.55, y: 1.3, w: 9, h: 0.55,
      fontFace: FONT_BODY, fontSize: 13, color: C.muted, italic: true,
      valign: "middle", margin: 0
    });

    const items = [
      "Virusi i hakerski napadi",
      "Lažne informacije",
      "Gubitak privatnosti",
      "Zavisnost od interneta",
    ];

    for (let i = 0; i < items.length; i++) {
      const y = 2.0 + i * 0.7;
      s.addShape("roundRect", {
        x: 0.6, y, w: 5.8, h: 0.6,
        fill: { color: C.white }, line: { color: C.line, width: 0.75 },
        rectRadius: 0.1
      });
      s.addShape("roundRect", {
        x: 0.6, y: y + 0.08, w: 0.08, h: 0.44,
        fill: { color: C.coral }, line: { type: "none" }, rectRadius: 0.04
      });

      s.addText(items[i], {
        x: 0.9, y, w: 4.8, h: 0.6,
        fontFace: FONT_BODY, fontSize: 15, color: C.ink, bold: true,
        valign: "middle", margin: 0
      });
    }

    // Right photo — tech/circuit (cyber threats)
    s.addImage({
      path: "images/security.jpg",
      x: 6.7, y: 2.1, w: 2.9, h: 1.95,
      sizing: { type: "cover", w: 2.9, h: 1.95 }
    });
  }

  // ============================================================
  // SLIDE 7 — Šta je Intranet?
  // ============================================================
  {
    const s = pres.addSlide();
    setSoftBg(s);
    addContentHeader(s, "Šta je intranet?", 7);

    s.addShape("roundRect", {
      x: 0.55, y: 1.35, w: 5.5, h: 1.6,
      fill: { color: C.white }, line: { color: C.line, width: 0.75 },
      rectRadius: 0.12, shadow: softShadow()
    });
    s.addShape("roundRect", {
      x: 0.55, y: 1.55, w: 0.08, h: 1.2,
      fill: { color: C.rose }, line: { type: "none" }, rectRadius: 0.04
    });
    s.addText("Intranet je privatna mreža koja se koristi unutar škole, firme ili organizacije i dostupna je samo određenim korisnicima.", {
      x: 0.85, y: 1.45, w: 5.05, h: 1.4,
      fontFace: FONT_BODY, fontSize: 14, color: C.ink,
      valign: "middle", margin: 0
    });

    const bullets = [
      "Omogućava internu komunikaciju",
      "Koristi se za deljenje podataka",
      "Sigurniji je od interneta",
    ];
    s.addText(
      bullets.map((t, i) => ({
        text: t,
        options: { bullet: true, breakLine: i < bullets.length - 1 },
      })),
      {
        x: 0.6, y: 3.1, w: 5.5, h: 1.8,
        fontFace: FONT_BODY, fontSize: 14, color: C.ink,
        valign: "top", margin: 0, paraSpaceAfter: 8,
      }
    );

    // Right photo — office/intranet theme
    s.addImage({
      path: "images/office.jpg",
      x: 6.4, y: 1.55, w: 3.2, h: 2.15,
      sizing: { type: "cover", w: 3.2, h: 2.15 }
    });
  }

  // ============================================================
  // SLIDE 8 — Upotreba Intraneta
  // ============================================================
  {
    const s = pres.addSlide();
    setSoftBg(s);
    addContentHeader(s, "Gde se koristi intranet?", 8);

    s.addText("Intranet pomaže zaposlenima da lakše razmenjuju informacije i organizuju posao.", {
      x: 0.55, y: 1.3, w: 9, h: 0.55,
      fontFace: FONT_BODY, fontSize: 13, color: C.muted, italic: true,
      valign: "middle", margin: 0
    });

    const usage = [
      "Deljenje dokumenata",
      "Komunikacija zaposlenih",
      "Organizacija rada",
      "Čuvanje važnih podataka",
    ];

    const cardW = 4.3, cardH = 1.45, startX = 0.6, startY = 2.0, gapX = 0.2, gapY = 0.2;
    for (let i = 0; i < usage.length; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);

      s.addShape("roundRect", {
        x, y, w: cardW, h: cardH,
        fill: { color: C.white }, line: { color: C.line, width: 0.75 },
        rectRadius: 0.12, shadow: softShadow()
      });
      s.addText(usage[i], {
        x: x + 0.3, y: y, w: cardW - 0.6, h: cardH,
        fontFace: FONT_BODY, fontSize: 17, bold: true, color: C.ink,
        align: "center", valign: "middle", margin: 0
      });
    }
  }

  // ============================================================
  // SLIDE 9 — Prednosti Intraneta
  // ============================================================
  {
    const s = pres.addSlide();
    setSoftBg(s);
    addContentHeader(s, "Prednosti intraneta", 9);

    s.addText("Intranet omogućava sigurniji i brži rad unutar organizacije.", {
      x: 0.55, y: 1.3, w: 9, h: 0.55,
      fontFace: FONT_BODY, fontSize: 13, color: C.muted, italic: true,
      valign: "middle", margin: 0
    });

    const items = [
      "Veća sigurnost podataka",
      "Lak pristup dokumentima",
      "Bolja organizacija rada",
      "Štedi vreme zaposlenima",
    ];

    for (let i = 0; i < items.length; i++) {
      const y = 2.0 + i * 0.7;
      s.addShape("roundRect", {
        x: 0.6, y, w: 5.8, h: 0.6,
        fill: { color: C.white }, line: { color: C.line, width: 0.75 },
        rectRadius: 0.1
      });
      s.addShape("roundRect", {
        x: 0.6, y: y + 0.08, w: 0.08, h: 0.44,
        fill: { color: C.green }, line: { type: "none" }, rectRadius: 0.04
      });
      s.addText(items[i], {
        x: 0.9, y, w: 4.8, h: 0.6,
        fontFace: FONT_BODY, fontSize: 15, color: C.ink, bold: true,
        valign: "middle", margin: 0
      });
    }

    // Right photo — server room (data security)
    s.addImage({
      path: "images/server.jpg",
      x: 6.7, y: 2.1, w: 2.9, h: 2.05,
      sizing: { type: "cover", w: 2.9, h: 2.05 }
    });
  }

  // ============================================================
  // SLIDE 10 — Mane Intraneta
  // ============================================================
  {
    const s = pres.addSlide();
    setSoftBg(s);
    addContentHeader(s, "Mane intraneta", 10);

    s.addText("Iako je veoma koristan, intranet zahteva održavanje i tehničku podršku.", {
      x: 0.55, y: 1.3, w: 9, h: 0.55,
      fontFace: FONT_BODY, fontSize: 13, color: C.muted, italic: true,
      valign: "middle", margin: 0
    });

    const items = [
      "Troškovi instalacije",
      "Potrebno održavanje",
      "Ograničen pristup",
      "Problemi pri kvaru mreže",
    ];

    for (let i = 0; i < items.length; i++) {
      const y = 2.0 + i * 0.7;
      s.addShape("roundRect", {
        x: 0.6, y, w: 5.8, h: 0.6,
        fill: { color: C.white }, line: { color: C.line, width: 0.75 },
        rectRadius: 0.1
      });
      s.addShape("roundRect", {
        x: 0.6, y: y + 0.08, w: 0.08, h: 0.44,
        fill: { color: C.coral }, line: { type: "none" }, rectRadius: 0.04
      });
      s.addText(items[i], {
        x: 0.9, y, w: 4.8, h: 0.6,
        fontFace: FONT_BODY, fontSize: 15, color: C.ink, bold: true,
        valign: "middle", margin: 0
      });
    }

    // Right photo — hardware/tech maintenance
    s.addImage({
      path: "images/tools.jpg",
      x: 6.7, y: 2.1, w: 2.9, h: 1.95,
      sizing: { type: "cover", w: 2.9, h: 1.95 }
    });
  }

  // ============================================================
  // SLIDE 11 — Razlike (comparison)
  // ============================================================
  {
    const s = pres.addSlide();
    setSoftBg(s);
    addContentHeader(s, "Internet i intranet — razlike", 11);

    s.addText("Internet je javna mreža dostupna svima, dok je intranet privatna mreža namenjena određenoj grupi korisnika.", {
      x: 0.55, y: 1.3, w: 9, h: 0.55,
      fontFace: FONT_BODY, fontSize: 12, color: C.muted, italic: true,
      align: "center", valign: "middle", margin: 0
    });

    const colW = 4.3, colH = 3.0, startY = 2.0;
    const leftX = 0.6, rightX = 5.1;

    // LEFT — INTERNET
    s.addShape("roundRect", {
      x: leftX, y: startY, w: colW, h: colH,
      fill: { color: C.white }, line: { color: C.line, width: 0.75 },
      rectRadius: 0.14, shadow: softShadow()
    });
    s.addShape("roundRect", {
      x: leftX, y: startY, w: colW, h: 0.62,
      fill: { color: C.lavender }, line: { type: "none" }, rectRadius: 0.14
    });
    // Cover bottom corners of the title band so only top is rounded
    s.addShape("rect", {
      x: leftX, y: startY + 0.45, w: colW, h: 0.17,
      fill: { color: C.lavender }, line: { type: "none" }
    });
    s.addText("Internet", {
      x: leftX, y: startY, w: colW, h: 0.62,
      fontFace: FONT_TITLE, fontSize: 17, bold: true, color: C.white,
      align: "center", valign: "middle", margin: 0
    });
    s.addText([
      { text: "Povezuje ceo svet",   options: { bullet: true, breakLine: true } },
      { text: "Više korisnika",       options: { bullet: true, breakLine: true } },
      { text: "Javno dostupna mreža", options: { bullet: true, breakLine: true } },
      { text: "Veće mogućnosti",      options: { bullet: true } },
    ], {
      x: leftX + 0.35, y: startY + 0.8, w: colW - 0.5, h: colH - 1.0,
      fontFace: FONT_BODY, fontSize: 14, color: C.ink,
      paraSpaceAfter: 6, valign: "top", margin: 0
    });

    // RIGHT — INTRANET
    s.addShape("roundRect", {
      x: rightX, y: startY, w: colW, h: colH,
      fill: { color: C.white }, line: { color: C.line, width: 0.75 },
      rectRadius: 0.14, shadow: softShadow()
    });
    s.addShape("roundRect", {
      x: rightX, y: startY, w: colW, h: 0.62,
      fill: { color: C.rose }, line: { type: "none" }, rectRadius: 0.14
    });
    s.addShape("rect", {
      x: rightX, y: startY + 0.45, w: colW, h: 0.17,
      fill: { color: C.rose }, line: { type: "none" }
    });
    s.addText("Intranet", {
      x: rightX, y: startY, w: colW, h: 0.62,
      fontFace: FONT_TITLE, fontSize: 17, bold: true, color: C.white,
      align: "center", valign: "middle", margin: 0
    });
    s.addText([
      { text: "Koriste firme i škole", options: { bullet: true, breakLine: true } },
      { text: "Manji broj korisnika",   options: { bullet: true, breakLine: true } },
      { text: "Privatna mreža",         options: { bullet: true, breakLine: true } },
      { text: "Sigurniji od interneta", options: { bullet: true } },
    ], {
      x: rightX + 0.35, y: startY + 0.8, w: colW - 0.5, h: colH - 1.0,
      fontFace: FONT_BODY, fontSize: 14, color: C.ink,
      paraSpaceAfter: 6, valign: "top", margin: 0
    });

  }

  // ============================================================
  // SLIDE 12 — Zaključak
  // ============================================================
  {
    const s = pres.addSlide();
    setSoftBg(s);
    addContentHeader(s, "Zaključak", 12);

    // Main statement — soft lavender card instead of dark navy
    s.addShape("roundRect", {
      x: 0.6, y: 1.35, w: 8.8, h: 1.15,
      fill: { color: C.lavender }, line: { type: "none" },
      rectRadius: 0.14
    });
    s.addShape("roundRect", {
      x: 0.6, y: 1.55, w: 0.1, h: 0.75,
      fill: { color: C.white }, line: { type: "none" }, rectRadius: 0.05
    });
    s.addText("Internet i intranet imaju važnu ulogu u savremenom društvu.", {
      x: 0.95, y: 1.45, w: 8.3, h: 0.95,
      fontFace: FONT_TITLE, fontSize: 17, bold: true, color: C.white,
      valign: "middle", margin: 0
    });

    const items = [
      { title: "Internet", desc: "Služi za globalnu komunikaciju i razmenu informacija širom sveta.", c: C.lavender },
      { title: "Intranet", desc: "Omogućava siguran rad i komunikaciju unutar organizacija.",         c: C.rose     },
    ];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const x = 0.6 + i * 4.5;
      const y = 2.75;
      s.addShape("roundRect", {
        x, y, w: 4.3, h: 2.3,
        fill: { color: C.white }, line: { color: C.line, width: 0.75 },
        rectRadius: 0.14, shadow: softShadow()
      });
      s.addText(it.title, {
        x, y: y + 0.45, w: 4.3, h: 0.55,
        fontFace: FONT_TITLE, fontSize: 22, bold: true, color: it.c,
        align: "center", valign: "middle", margin: 0
      });
      s.addText(it.desc, {
        x: x + 0.3, y: y + 1.1, w: 3.7, h: 1.0,
        fontFace: FONT_BODY, fontSize: 13, color: C.ink,
        align: "center", valign: "top", margin: 0
      });
    }

    // Hyperlink — "Saznaj više" with arrow
    s.addText([
      { text: "Saznaj više: ", options: { color: C.muted } },
      {
        text: "sr.wikipedia.org/wiki/Internet",
        options: { color: C.plum, hyperlink: { url: "https://sr.wikipedia.org/wiki/Internet" } }
      },
    ], {
      x: 0.5, y: 5.07, w: 9, h: 0.22,
      fontFace: FONT_BODY, fontSize: 10,
      align: "center", valign: "middle", margin: 0
    });
  }

  // ============================================================
  // SLIDE 13 — Kraj
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.cream };

    // Soft lavender blob bottom-left
    s.addShape("ellipse", {
      x: -2, y: 3.5, w: 5.5, h: 5.5,
      fill: { color: C.lilac, transparency: 35 }, line: { type: "none" }
    });
    // Rose blob top-right
    s.addShape("ellipse", {
      x: 6.5, y: -2, w: 5.5, h: 5.5,
      fill: { color: C.blush, transparency: 30 }, line: { type: "none" }
    });
    // "Hvala" — centered
    s.addText("Hvala na pažnji!", {
      x: 0.5, y: 2.0, w: 9, h: 1.5,
      fontFace: FONT_TITLE, fontSize: 54, bold: true, color: C.deepPlum,
      align: "center", valign: "middle", margin: 0
    });

    // Footer
    s.addShape("rect", { x: 0, y: 5.52, w: 10, h: 0.1, fill: { color: C.lavender }, line: { type: "none" } });
  }

  await pres.writeFile({ fileName: "Internet-i-Intranet.pptx" });
  console.log("✓ Prezentacija sačuvana: Internet-i-Intranet.pptx");
})();
