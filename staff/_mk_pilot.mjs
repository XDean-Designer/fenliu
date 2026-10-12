import fs from 'node:fs';
const main = JSON.parse(fs.readFileSync('figma-capture.manifest.json', 'utf8'));
const hub = main.screens.find((s) => s.capture === 'hub');
if (!hub) { console.error('no hub'); process.exit(1); }
const pilot = {
  ...main,
  screens: [{ ...hub, captureId: 'c6f12af4-fae7-4bba-b6d5-a392ca32c100' }]
};
fs.writeFileSync('_pilot.manifest.json', JSON.stringify(pilot, null, 2));
console.log('pilot manifest ok, screens:', pilot.screens.length);
