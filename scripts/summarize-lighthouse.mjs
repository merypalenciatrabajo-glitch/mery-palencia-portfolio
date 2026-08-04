import { readFile } from 'node:fs/promises';

const file = process.argv[2];
if (!file) throw new Error('Usage: node scripts/summarize-lighthouse.mjs <report.json>');

const report = JSON.parse(await readFile(file, 'utf8'));
const score = (id) => Math.round((report.categories[id]?.score ?? 0) * 100);
const metric = (id) => report.audits[id]?.displayValue ?? null;
const failingAudits = (categoryId) => (report.categories[categoryId]?.auditRefs ?? [])
  .filter((reference) => reference.weight > 0 && (report.audits[reference.id]?.score ?? 1) < 1)
  .map((reference) => ({
    id: reference.id,
    title: report.audits[reference.id]?.title,
    score: report.audits[reference.id]?.score,
    value: report.audits[reference.id]?.displayValue ?? null,
  }));

console.log(JSON.stringify({
  finalUrl: report.finalUrl,
  fetchTime: report.fetchTime,
  scores: {
    performance: score('performance'),
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
    seo: score('seo'),
  },
  metrics: {
    firstContentfulPaint: metric('first-contentful-paint'),
    largestContentfulPaint: metric('largest-contentful-paint'),
    totalBlockingTime: metric('total-blocking-time'),
    cumulativeLayoutShift: metric('cumulative-layout-shift'),
    speedIndex: metric('speed-index'),
  },
  failingAudits: {
    performance: failingAudits('performance'),
    accessibility: failingAudits('accessibility'),
    bestPractices: failingAudits('best-practices'),
    seo: failingAudits('seo'),
  },
}, null, 2));
