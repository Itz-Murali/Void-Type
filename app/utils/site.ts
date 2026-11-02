export const HERO_LOGO_URL = 'https://files.catbox.moe/po4yde.png'
export const LOGO_URL = 'https://files.catbox.moe/52pvkc.png'
export const GITHUB_URL = 'https://github.com/Itz-Murali/Void-Type'

export interface Developer { name: string; handle: string; img: string; github: string }
export const DEVELOPERS: readonly Developer[] = [
  { name: '𝐌 𝐔 𝐑 𝚨 𝐋 𝐈 𓂃ִֶָ⋆.˚', handle: 'Itz-Murali', img: 'https://itz-murali-images.vercel.app/api', github: 'https://github.com/Itz-Murali' },
  { name: '𝜜ɴყꫝㅤ𓆩💗𓆪', handle: 'itz-Anya', img: 'https://random-images-anya.vercel.app/anya', github: 'https://github.com/itz-Anya' }
]

export const ISSUES_URL = `${GITHUB_URL}/issues`
export const LEGAL_UPDATED = '2 November 2026'
export const SITE_YEAR = 2026

export interface LegalSection { id: string; title: string; paras?: string[]; items?: string[] }

export interface NavLink { to: string; label: string }
export const NAV_LINKS: readonly NavLink[] = [
  { to: '/about', label: 'About' },
  { to: '/terms', label: 'Terms' },
  { to: '/license', label: 'License' }
]

export interface TechItem { name: string; role: string; tag: string }
export const TECH_STACK: readonly TechItem[] = [
  { name: 'Nuxt 4', role: 'App framework, routing and static build', tag: 'Framework' },
  { name: 'Vue 3', role: 'Reactive UI, menus, HUD and pages', tag: 'UI' },
  { name: 'TypeScript', role: 'Strict typing across engine and UI', tag: 'Language' },
  { name: 'Three.js', role: 'Live 3D ships, asteroids, lasers and particles', tag: '3D engine' },
  { name: 'Anime.js', role: 'Motion for the About, Terms and License pages', tag: 'Animation' },
  { name: 'Web Audio API', role: 'Procedurally generated sound effects and music', tag: 'Audio' },
  { name: 'PWA + Service Worker', role: 'Installable and playable offline', tag: 'Platform' },
  { name: 'Vercel', role: 'Hosting and deployment', tag: 'Hosting' }
]

export const LICENSE_TEXT = "VOIDTYPE ATTRIBUTION LICENSE\n\nCopyright (c) 2026 Itz-Murali and Itz-Anya\nProject: VOIDTYPE (https://github.com/Itz-Murali/Void-Type)\n\nVOIDTYPE was created by Itz-Murali (https://github.com/Itz-Murali) and\nItz-Anya (https://github.com/itz-Anya).\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated files (the \"Software\"), to use, copy, modify,\nmerge, publish, distribute, sublicense, and/or sell copies of the Software,\nand to permit persons to whom the Software is furnished to do so, subject to\nthe following conditions:\n\n1. CREDIT IS REQUIRED. Anyone who forks, copies, modifies, redistributes, or\n   uses the Software or any substantial part of it, in source or compiled\n   form, for any purpose, must give clear and visible credit to BOTH\n   Itz-Murali and Itz-Anya as the original creators.\n\n2. HOW TO CREDIT. At minimum, the credit must:\n   a. appear in the README (or equivalent main documentation) of the\n      derived project or product, and\n   b. appear in the public-facing page, About screen, or credits section if\n      the derived project or product has one, and\n   c. include the names \"Itz-Murali\" and \"Itz-Anya\" and a link to the\n      original repository: https://github.com/Itz-Murali/Void-Type\n\n   A suitable credit line is:\n   \"Based on VOIDTYPE by Itz-Murali and Itz-Anya -\n   https://github.com/Itz-Murali/Void-Type\"\n\n3. NOTICES MUST BE KEPT. This copyright notice and this license text must be\n   included in all copies and substantial portions of the Software. Credits\n   and author names already present in the Software must not be removed,\n   hidden, or replaced.\n\n4. NO FALSE CLAIMS. You may not claim that you are the original author of the\n   Software, and you may not imply that Itz-Murali or Itz-Anya endorse your\n   derived project or product without their written permission.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE."
