const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, "public", "icons");
const svgPath = path.join(__dirname, "public", "icon.svg");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const svgBuffer = fs.readFileSync(svgPath);

Promise.all(
  sizes.map((size) =>
    sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}.png`))
      .then(() => console.log(`Generated icon-${size}.png`))
  )
).then(() => console.log("All icons generated!")).catch(console.error);
