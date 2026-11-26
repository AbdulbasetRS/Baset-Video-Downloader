// Enforces the mandatory BVD design rules on shipped sources/assets.
// Exits non-zero on any violation. Run: npm run scan:ui
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname, relative } from 'node:path'

const root = process.cwd()
const SCAN_DIRS = ['src', 'public', 'scripts']
const TEXT_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.css', '.html', '.json', '.md', '.svg'])
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.avif'])
// The approved BVD brand files (and nothing else) may live in public/brand.
const BRAND_DIR = join('public', 'brand')
// Files that legitimately name the forbidden things in order to detect them.
const SELF = new Set([join('scripts', 'scan-ui-rules.mjs')])

const PLATFORM_WORDS = /\b(youtube|youtu\.be|tiktok|facebook|instagram|twitter|vimeo|dailymotion|twitch)\b/i
const FORBIDDEN_ICON_LIBS = ['react-icons', '@fortawesome', 'font-awesome', '@mui/icons-material', '@heroicons', '@tabler/icons', 'phosphor', 'bootstrap-icons', 'feather-icons', '@iconify']
const emoji = /\p{Extended_Pictographic}/u
const violations = []

function walk(dir) {
  let out = []
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'out') continue
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) out = out.concat(walk(p))
    else out.push(p)
  }
  return out
}

for (const d of SCAN_DIRS) {
  let files
  try { files = walk(join(root, d)) } catch { continue }
  for (const abs of files) {
    const rel = relative(root, abs)
    if (SELF.has(rel)) continue
    const ext = extname(rel).toLowerCase()
    const inBrand = rel.startsWith(BRAND_DIR)

    if (IMAGE_EXT.has(ext) && !inBrand) violations.push(`${rel}: raster image outside public/brand (no decorative or platform imagery allowed)`)
    if (!TEXT_EXT.has(ext)) continue
    const text = readFileSync(abs, 'utf8')

    if (emoji.test(text)) violations.push(`${rel}: contains emoji`)
    // Explicit social/support destinations are allowed in the central external-link registry.
    // The rule still scans the rest of the file and all shipped UI sources for platform branding.
    const platformScanText = rel === join('src', 'shared', 'config.ts')
      ? text.replace(/const EXTERNAL_LINKS[\s\S]*?\n  \]/, '')
      : text
    if (PLATFORM_WORDS.test(platformScanText) && !rel.startsWith(join('src', 'shared', 'url'))) violations.push(`${rel}: names a platform (platform names/logos are not allowed in shipped sources)`)
    // Gradients are forbidden in app styles and markup. Brand SVG logo files are the approved exception.
    if (!inBrand && /(linear|radial|conic|repeating-linear|repeating-radial)-gradient\s*\(/i.test(text)) violations.push(`${rel}: CSS gradient`)
    if (!inBrand && /url\(\s*['"]?(?!data:)[^)'"]+\.(png|jpe?g|gif|webp|svg)/i.test(text) && ext === '.css') violations.push(`${rel}: CSS background/image url()`)
  }
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
for (const lib of FORBIDDEN_ICON_LIBS) if (deps.some((d) => d.includes(lib))) violations.push(`package.json: forbidden icon library "${lib}" (Lucide only)`)
if (!deps.includes('lucide-react')) violations.push('package.json: lucide-react is missing')

if (violations.length) {
  console.error('UI rule violations:\n - ' + violations.join('\n - '))
  process.exit(1)
}
console.log('UI rules OK: no emoji, no gradients, no platform names/images, Lucide-only icons.')
