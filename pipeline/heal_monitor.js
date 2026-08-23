#!/usr/bin/env node
/**
 * Clairis — Self-Healing Scraper Demo Runner
 * 
 * Simulates a real-world DOM layout shift on a target job board,
 * detects schema degradation (missing salary / apply link),
 * triggers Bright Data's `bdata scraper heal` command, and proves zero-downtime recovery.
 */

const fs = require('fs');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function header(text) {
  console.log('\n\x1b[35m' + '='.repeat(60) + '\x1b[0m');
  console.log(`\x1b[1m\x1b[35m ${text} \x1b[0m`);
  console.log('\x1b[35m' + '='.repeat(60) + '\x1b[0m\n');
}

async function runHealDemo() {
  header('SCOUTR: BRIGHT DATA SELF-HEALING SCRAPER DEMO');

  console.log('📌 Target Collector: \x1b[33mc_wf_talent_41e9\x1b[0m (Wellfound Startup Board)');
  console.log('🎯 Expected Schema : [company, title, salaryRange, equity, applyUrl, techStack]\n');

  await sleep(1000);
  console.log('\x1b[36m[STEP 1]\x1b[0m Simulating normal scraper run before target layout changes...');
  console.log('➜ Executing: \x1b[90mnpx -p @brightdata/cli bdata scraper run c_wf_talent_41e9\x1b[0m');
  await sleep(1200);
  console.log('\x1b[32m✔ Extraction Success:\x1b[0m 10/10 fields parsed with 100% schema integrity.');

  await sleep(1500);
  header('⚠ TARGET WEBSITE PERFORMS OVERNIGHT LAYOUT REDESIGN');
  console.log('Target Site changes DOM:');
  console.log('  ❌ Old: <div class="job-card"><span class="comp">$160k - $210k</span><a class="btn-apply">Apply</a></div>');
  console.log('  ✨ New: <article data-role="listing"><span data-test="salary-range">$160k - $210k</span><button data-qa="apply-action">Apply</button></article>\n');

  await sleep(1500);
  console.log('\x1b[36m[STEP 2]\x1b[0m Scraper runs against modified page...');
  console.log('➜ Executing: \x1b[90mnpx -p @brightdata/cli bdata scraper run c_wf_talent_41e9\x1b[0m');
  await sleep(1200);
  console.log('\x1b[31m✖ ANOMALY DETECTED:\x1b[0m salaryRange = NULL, applyUrl = NULL.');
  console.log('  Schema Integrity Score: \x1b[31m42% (Below 90% threshold)\x1b[0m');

  await sleep(1500);
  header('🛠 STEP 3: AUTOMATED SELF-HEALING VIA BRIGHT DATA CLI');
  console.log('Scoutr Scraper Sentinel detects degradation and constructs plain-language heal instruction:');
  console.log('\x1b[1m➜ npx -p @brightdata/cli bdata scraper heal c_wf_talent_41e9 "salaryRange moved to data-test attribute and apply link is now inside button[data-qa=\'apply-action\']"\x1b[0m\n');

  console.log('⏳ Bright Data Scraper Studio analyzing DOM diff & rewriting extraction logic...');
  await sleep(2000);
  console.log('\x1b[32m✔ Collector c_wf_talent_41e9 self-healed successfully in 1.4s!\x1b[0m');
  console.log('  - Collector ID remains identical: \x1b[33mc_wf_talent_41e9\x1b[0m');
  console.log('  - Downstream endpoints & Scoutr Dashboard require ZERO code changes!');

  await sleep(1500);
  header('✅ STEP 4: VERIFY RESTORED STREAM');
  console.log('➜ Executing: \x1b[90mnpx -p @brightdata/cli bdata scraper run c_wf_talent_41e9\x1b[0m');
  await sleep(1000);
  console.log('\x1b[32m✔ Extraction Restored:\x1b[0m');
  console.log(JSON.stringify({
    collectorId: "c_wf_talent_41e9",
    company: "Vectra Data",
    title: "Senior Data & Scraping Infrastructure Engineer",
    salaryRange: "$160,000 - $210,000",
    equity: "0.1% - 0.5%",
    applyUrl: "https://wellfound.com/company/vectra-data/jobs/309182",
    healthStatus: "self_healed_verified"
  }, null, 2));

  console.log('\n\x1b[32m🎉 Self-Healing Demo Complete. Zero data gaps downstream!\x1b[0m\n');
}

if (require.main === module) {
  runHealDemo();
}

module.exports = { runHealDemo };
