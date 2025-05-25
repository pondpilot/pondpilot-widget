/**
 * Build script for PondPilot widget
 * Creates minified version and prepares for CDN distribution
 */

const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

async function build() {
  try {
    const sourceCode = fs.readFileSync(path.join(__dirname, "src", "pondpilot-widget.js"), "utf8");

    const result = await minify(sourceCode, {
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: true,
        pure_funcs: ["console.log"],
      },
      mangle: {
        reserved: ["PondPilot", "duckdb"], // Don't mangle these names
      },
      format: {
        comments: false,
      },
    });

    // Add banner
    const banner = `/**
 * PondPilot Widget v1.0.0
 * Transform static SQL code blocks into interactive snippets
 * https://github.com/pondpilot/pondpilot-widget
 * (c) 2025 PondPilot - MIT License
 */
`;

    const minifiedCode = banner + result.code;

    if (!fs.existsSync(path.join(__dirname, "dist"))) {
      fs.mkdirSync(path.join(__dirname, "dist"));
    }

    fs.writeFileSync(path.join(__dirname, "dist", "pondpilot-widget.min.js"), minifiedCode);

    fs.copyFileSync(path.join(__dirname, "src", "pondpilot-widget.js"), path.join(__dirname, "dist", "pondpilot-widget.js"));

    const unminifiedSize = sourceCode.length;
    const minifiedSize = minifiedCode.length;

    console.log("✅ Build completed successfully!");
    console.log(`📦 Original size: ${(sourceCode.length / 1024).toFixed(2)} KB`);
    console.log(`📦 Minified size: ${(minifiedCode.length / 1024).toFixed(2)} KB`);
    console.log(`📦 Compression ratio: ${((1 - minifiedCode.length / sourceCode.length) * 100).toFixed(2)}%`);
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  build();
}
