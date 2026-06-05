// One-off generator for the iOS app icon: the "2am" wordmark (peach,
// Outfit Black) centered on the midnight background. The Xcode asset
// catalog uses the modern single-size format (one 1024x1024 universal
// icon; Xcode downscales the rest), so we only emit the 1024 master.
//
// Run from the repo root:  node scripts/gen-app-icon.mjs
// Requires sharp (installed transiently with `npm i --no-save sharp`).
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const SIZE = 1024;
const BG = "#0D1628"; // midnight
const PEACH = "#F8C8A8";

// The "2am" wordmark glyph paths, lifted verbatim from public/wordmark.svg
// (viewBox 0 0 2033 734). Embedding the vectors keeps the text razor-sharp
// at any size and avoids depending on the Outfit font being installed.
const WORDMARK_VIEWBOX = "0 0 2033 734";
const WORDMARK_PATH =
  "M7 617 291 331Q308 314 318.5 299.5Q329 285 333.5 272.0Q338 259 338 245Q338 210 315.5 189.5Q293 169 255 169Q221 169 192.0 189.5Q163 210 130 259L0 142Q44 72 113.5 36.0Q183 0 272 0Q353 0 411.5 28.5Q470 57 501.5 110.0Q533 163 533 236Q533 277 522.0 313.0Q511 349 487.0 383.5Q463 418 425 454L246 624ZM7 724V617L173 560H548V724Z M826 734Q757 734 704.0 701.0Q651 668 621.0 610.5Q591 553 591 478Q591 403 621.0 345.0Q651 287 704.0 254.5Q757 222 826 222Q869 222 905.5 236.5Q942 251 966.5 277.0Q991 303 998 337V619Q991 653 966.5 679.0Q942 705 905.5 719.5Q869 734 826 734ZM870 562Q907 562 929.5 538.5Q952 515 952 478Q952 453 942.0 434.5Q932 416 913.5 405.0Q895 394 871 394Q847 394 828.5 405.0Q810 416 799.0 435.0Q788 454 788 478Q788 502 798.5 521.0Q809 540 828.0 551.0Q847 562 870 562ZM946 724V592L973 472L946 353V232H1137V724Z M1231 724V232H1427V724ZM1534 724V442Q1534 417 1519.0 402.5Q1504 388 1481 388Q1465 388 1452.5 394.5Q1440 401 1433.5 413.0Q1427 425 1427 442L1351 414Q1351 354 1377.5 311.0Q1404 268 1449.0 245.0Q1494 222 1551 222Q1601 222 1641.5 246.0Q1682 270 1706.0 312.5Q1730 355 1730 413V724ZM1837 724V442Q1837 417 1822.0 402.5Q1807 388 1784 388Q1768 388 1755.5 394.5Q1743 401 1736.5 413.0Q1730 425 1730 442L1615 443Q1615 374 1642.5 324.5Q1670 275 1719.0 248.5Q1768 222 1831 222Q1890 222 1935.5 247.0Q1981 272 2007.0 319.0Q2033 366 2033 432V724Z";

// Wordmark sized to 75% of the canvas width, centered. The aspect ratio
// (2033:734) gives the height; generous top/bottom space keeps the mark
// clear of the rounded-icon mask.
const markW = Math.round(SIZE * 0.75); // 768
const markH = Math.round((markW * 734) / 2033); // ~277
const markX = Math.round((SIZE - markW) / 2);
const markY = Math.round((SIZE - markH) / 2);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${BG}"/>
  <svg x="${markX}" y="${markY}" width="${markW}" height="${markH}" viewBox="${WORDMARK_VIEWBOX}" preserveAspectRatio="xMidYMid meet">
    <path fill="${PEACH}" d="${WORDMARK_PATH}"/>
  </svg>
</svg>`;

const out = process.argv[2];
if (!out) {
  console.error("usage: node scripts/gen-app-icon.mjs <output.png>");
  process.exit(1);
}

// Flatten onto the midnight background to strip the alpha channel — the
// App Store rejects icons that contain transparency.
const png = await sharp(Buffer.from(svg))
  .flatten({ background: BG })
  .png()
  .toBuffer();
writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes)`);
