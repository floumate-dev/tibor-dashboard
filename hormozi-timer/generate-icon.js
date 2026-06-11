// Generates assets/icon.png and assets/icon@2x.png — simple clock template image
// Run once: `node generate-icon.js`
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function makeClock(size) {
  const W = size;
  const H = size;
  const pixels = [];
  const cx = W / 2;
  const cy = H / 2;
  const radius = W * 0.42;
  const thickness = Math.max(1.4, W / 12);

  for (let y = 0; y < H; y++) {
    pixels.push(0); // PNG scanline filter byte
    for (let x = 0; x < W; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let alpha = 0;
      const value = 0; // black

      // Clock face outline
      if (dist <= radius && dist >= radius - thickness) {
        alpha = 255;
      }
      // Vertical hand (up)
      if (dist < radius - thickness * 0.8) {
        if (Math.abs(dx) < thickness / 2 && dy < 0 && dy > -radius * 0.75) {
          alpha = 255;
        }
        // Horizontal hand (right)
        if (Math.abs(dy) < thickness / 2 && dx > 0 && dx < radius * 0.55) {
          alpha = 255;
        }
      }

      pixels.push(value, alpha);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 4; // color type: grayscale + alpha
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idatRaw = Buffer.from(pixels);
  const idat = zlib.deflateSync(idatRaw);

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const assets = path.join(__dirname, 'assets');
if (!fs.existsSync(assets)) fs.mkdirSync(assets, { recursive: true });

fs.writeFileSync(path.join(assets, 'icon.png'), makeClock(22));
fs.writeFileSync(path.join(assets, 'icon@2x.png'), makeClock(44));
console.log('Generated assets/icon.png (22x22) and assets/icon@2x.png (44x44)');
