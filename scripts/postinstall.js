#!/usr/bin/env node

/**
 * Post-install script to patch Next.js generate-build-id.js
 * This fixes a bug in Next.js 13.4.5 where config.generateBuildId can be undefined
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'build', 'generate-build-id.js');

try {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  Next.js generate-build-id.js not found. Skipping patch.');
    process.exit(0);
  }

  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if already patched
  if (content.includes('generate ? await generate()')) {
    console.log('✓ Next.js build patch already applied');
    process.exit(0);
  }

  // Apply the patch
  const originalCode = 'async function generateBuildId(generate, fallback) {\n    let buildId = await generate();';
  const patchedCode = 'async function generateBuildId(generate, fallback) {\n    let buildId = generate ? await generate() : null;';

  if (!content.includes(originalCode)) {
    console.log('⚠️  Expected code pattern not found. Next.js version may have changed.');
    process.exit(0);
  }

  content = content.replace(originalCode, patchedCode);

  // Write the patched file
  fs.writeFileSync(filePath, content, 'utf8');

  console.log('✓ Next.js build patch applied successfully');
  process.exit(0);

} catch (error) {
  console.error('❌ Error applying Next.js build patch:', error.message);
  console.log('You may need to apply the patch manually. See README.md for instructions.');
  // Don't fail the install process
  process.exit(0);
}
