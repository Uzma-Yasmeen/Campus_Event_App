#!/usr/bin/env node
/**
 * Fails the build if anything credential-shaped is committed.
 *
 * GitHub's own scanner matches on shape, not on whether a value is real, so a
 * placeholder written in the form of a live connection string trips it. This
 * catches that before it is pushed.
 */
const { execSync } = require('child_process');

const PATTERNS = [
  // A connection string carrying an actual password
  { name: 'MongoDB URI with credentials', re: /mongodb(\+srv)?:\/\/[^\s"'/]+:[^\s"'@]+@/ },
  { name: 'AWS access key id', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'GitHub token', re: /gh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: 'OpenAI-style key', re: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { name: 'Private key block', re: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: 'Assigned JWT secret', re: /JWT_SECRET\s*=\s*(?!replace_this|your_|<)[A-Za-z0-9_\-]{12,}/ }
];

// Values that are obviously stand-ins rather than real credentials.
const PLACEHOLDER = /(USERNAME|PASSWORD|CLUSTER|YOUR[_-]?|<[a-z]+>|example|changeme|replace_this)/i;

const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
const findings = [];

for (const file of files) {
  if (/\.(png|jpe?g|webp|gif|ico|pdf|zip|lock)$/i.test(file)) continue;
  if (file === 'scripts/check-secrets.js') continue;

  let content;
  try {
    content = execSync(`git show HEAD:"${file}"`, { encoding: 'utf8', maxBuffer: 20e6 });
  } catch {
    continue;
  }

  content.split('\n').forEach((line, i) => {
    for (const { name, re } of PATTERNS) {
      if (re.test(line) && !PLACEHOLDER.test(line)) {
        findings.push(`${file}:${i + 1}  ${name}`);
      }
    }
  });
}

if (findings.length) {
  console.error('Credential-shaped strings found:\n  ' + findings.join('\n  '));
  console.error('\nIf these are placeholders, rewrite them so they do not read as real values.');
  process.exit(1);
}

console.log(`Scanned ${files.length} tracked files: nothing credential-shaped.`);
