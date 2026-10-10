import fs from 'node:fs';

const MANIFEST = 'figma-capture.manifest.v6.json';
const ids = [
  '406cfca7-43fb-4881-ac9a-b1babc20a33f', // comm2-list
  'b68499e4-c14b-4c7a-bad2-c238e89cd0cf', // comm2-edit
  'f3f290f8-dea4-44a6-8ae8-8441c0ce2c4e', // comm2-pick
  '45479033-ccd3-4ada-81d9-53b4946a3087', // comm2-cat-sheet
  'be6293ca-49f3-4363-b2a0-d8fbe5c4b6a2', // comm2-cat-sheet-noguest
  'e271f5a3-c848-4b30-bda2-f49367b37261', // comm2-assign
  'dfa12b2b-9209-42e0-aa03-fbe978c2f020', // comm2-menu
  'ecf71dc7-0bd2-443c-b16a-b0f89f455919', // comm2-name
  '8c68b9cd-8bdd-44ef-9ff9-2da6c297491d', // comm2-delete
  'ad4d361b-4982-4434-9c92-347a55a15f47', // comm2-unsaved
  '6810aa8d-be9d-4454-a97b-e5eb585418b9', // comm2-override-del
  '649506a9-275e-4fb7-b33d-4418e2200143', // comm2-override-swipe
  '5293f9f6-6792-4e5b-b374-e15793beb62f', // comm2-unassigned
  '8e9fe416-f0f4-48e4-8bb9-2f6eec5c51b2', // comm2-help
  'de15bd24-2a9a-4290-ad13-1bc3e8d733b4', // comm2-rule-help
  'b5140b3b-c64f-4f7c-83f1-80530b72f67d', // comm2-sheet-help-base
  'c1b6cb75-01e1-4ce8-bdfe-88bd4111d78c', // comm2-sheet-help-pick
  '9fb42d95-8d7a-4059-8e18-96daff620f07', // staff-pick
  'f77ddbc6-b783-457a-b104-5b916f31b763', // staff-pick-sheet
  'ff98fe6b-1350-420b-bc6e-2d0264001b4b', // staff-pick-edit
  'b72a210a-dc7a-4957-8ec0-4925fe690227', // staff-pick-avg
  '5c947db4-428b-4fa9-802e-91c9f0a5ec37', // staff-pick-direct
  'd3816624-093a-4711-98b0-ad424c6a5aa0', // staff-pick-sel
];

const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
if (m.screens.length !== ids.length) {
  throw new Error(`screen count ${m.screens.length} != id count ${ids.length}`);
}
m.screens.forEach((s, i) => { s.captureId = ids[i]; });
fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n', 'utf8');
console.log('injected', ids.length, 'captureIds');
m.screens.forEach((s, i) => console.log(String(i + 1).padStart(2), s.capture, '->', s.captureId));
