#!/usr/bin/env node
/**
 * The web client has no build step, so nothing would otherwise catch a page
 * pointing at an asset that does not exist. This walks every page, collects
 * the local files it references, and fails if any are missing.
 */
const fs = require('fs');
const path = require('path');

const WEB = path.join(__dirname, '..', 'web');
const problems = [];

/**
 * Only markup is checked. Inline scripts build markup from template literals,
 * so their src="${...}" values are expressions rather than paths and would
 * otherwise be reported as missing files.
 */
const markupOnly = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, '');

const pages = fs.readdirSync(WEB).filter((f) => f.endsWith('.html'));
if (!pages.length) problems.push('no HTML pages found in web/');

for (const page of pages) {
  const html = fs.readFileSync(path.join(WEB, page), 'utf8');

  const refs = [...markupOnly(html).matchAll(/(?:src|href)="([^"#?]+)"/g)]
    .map((m) => m[1])
    .filter((r) =>
      !/^(https?:)?\/\//.test(r) &&
      !r.startsWith('data:') &&
      !r.startsWith('mailto:') &&
      !r.includes('${'));

  for (const ref of refs) {
    if (!fs.existsSync(path.join(WEB, ref))) problems.push(`${page} -> missing ${ref}`);
  }

  // Every page should set the theme before paint, or it flashes the wrong one.
  if (!html.includes('ce_theme')) problems.push(`${page} -> no theme guard before first paint`);

  // The API base has to stay a single source of truth.
  if (html.includes('assets/api.js') && !html.includes('assets/config.js')) {
    problems.push(`${page} -> loads api.js without config.js`);
  }
}

if (!fs.existsSync(path.join(WEB, 'assets', 'config.js'))) {
  problems.push('web/assets/config.js is missing');
}

if (problems.length) {
  console.error('Web client problems:\n  ' + problems.join('\n  '));
  process.exit(1);
}

console.log(`Checked ${pages.length} pages: every referenced asset exists.`);
