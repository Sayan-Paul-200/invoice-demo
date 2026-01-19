import { generateKeyPair, exportJWK } from 'jose';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

console.log('[!] Warning: This script will overwrite existing keys in the keys directory invalidating any active login sessions.');

// Polyfill for __dirname to ensure compatibility across Node versions/environments
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Calculate project root relative to this script's location
const projectRoot = join(__dirname, '..'); // Go up one level from scripts/ to project root

if (!process.argv.includes('--overwrite-keys')) {
  console.log('Exiting without changes. To proceed, run the script with "--overwrite-keys" flag.');
  process.exit(0);
}

// Main generation function
async function generate() {
  try {
    // Generate RSA key pair for JWT signing
    // extractable: true allows exporting as JWK
    const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });

    // Export keys as JWK
    const publicJWK = await exportJWK(publicKey);
    const privateJWK = await exportJWK(privateKey);

    // Add key ID (kid) for better JWT handling
    // You might want to use a UUID here in production for rotation support
    publicJWK.kid = 'iam-public-key';
    privateJWK.kid = 'iam-private-key';

    // Ensure output directory exists (relative to project root)
    const outputDir = join(projectRoot, 'keys');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Save to files
    writeFileSync(join(outputDir, 'public.jwk.json'), JSON.stringify(publicJWK, null, 2));
    writeFileSync(join(outputDir, 'private.jwk.json'), JSON.stringify(privateJWK, null, 2));

    console.log(`✅ JWK pair successfully generated and saved to "${outputDir}"`);
  } catch (error) {
    console.error('Failed to generate keys:', error);
    process.exit(1);
  }
}

generate();