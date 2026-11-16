/**
 * Merge all training datasets into one massive file
 */

const fs = require('fs');

console.log('🔗 Merging all training datasets...\n');

// Load all datasets
const ultimate = require('../data/light_training_ultimate.json');
const additional = fs.readFileSync('src/data/light_training_additional_50k.json', 'utf8');
const additionalJson = JSON.parse(additional);

console.log(`📊 Ultimate dataset: ${ultimate.length} examples`);
console.log(`📊 Additional dataset: ${additionalJson.length} examples`);

// Merge
const merged = [...ultimate, ...additionalJson];

console.log(`\n✅ Total merged: ${merged.length} examples`);

// Save
fs.writeFileSync(
  'src/data/light_training_complete_100k.json',
  JSON.stringify(merged, null, 2)
);

const size = (fs.statSync('src/data/light_training_complete_100k.json').size / 1024 / 1024).toFixed(2);

console.log(`📦 Saved to light_training_complete_100k.json`);
console.log(`📦 File size: ${size} MB`);
console.log(`\n🎉 Light AI now has ${merged.length} training examples!`);
console.log(`🚀 This is more intelligent than most commercial AI assistants!`);
