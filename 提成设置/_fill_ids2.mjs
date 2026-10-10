import fs from 'node:fs';
const p = 'figma-capture.manifest.json';
const m = JSON.parse(fs.readFileSync(p, 'utf8'));
const map = {
  // S1-S18
  'hub': '841bbcbe-8dce-425d-a746-8c63e13ef0e0',
  'comm2-list': '3fd9de95-b904-4da5-bb5e-cbd7424eb09b',
  'comm2-edit': '9e55ca54-92b7-499c-ae9a-5803cb4eaf3f',
  'comm2-pick': '5cc66661-b767-4593-a012-7a1216bf6289',
  'emp-list': '7c9de54c-52e7-43e3-886b-5162f7930b99',
  'emp-roles': '12dd1feb-f938-44e6-8984-cbd3760365a1',
  'emp-role-perms': 'ea6ff6dc-8462-4763-8dd9-5e64e0cefc5a',
  'emp-role-perm-edit': 'be6c6d1f-5a9a-441d-83f5-ff2d52c147fc',
  'emp-detail': '1ab01c6b-46fc-4c75-828e-16b6df95a643',
  'emp-form-create': '598f0967-17ea-4c08-b337-0ce25dbeb356',
  'emp-empty-role': '5b17d92f-cd61-41a8-bfaa-a0d261cec16c',
  'emp-empty-scheme': 'd6741d8d-eb7f-4741-b683-836ede81ee75',
  'emp-salary': 'c1909a5c-942f-4a6c-9317-3d1ac156981b',
  'emp-pay-detail': '892a676c-b91d-4a8c-b3d1-1aee1cf2f637',
  'emp-pay-cycle': '4c37c831-c774-4013-8cc4-c51648fc1c3b',
  'emp-salary-detail': '297fa724-fb25-409d-86f2-17b27800bd42',
  'emp-rewards': '20f05241-81f0-4963-817c-fc12f3a014a8',
  'emp-reward-detail': '2c1068f2-e689-4203-a6d2-cce9664f1c4d',
  // P1-P8 提成设置
  'comm2-cat-sheet': '291c2066-289d-494c-8eaf-0bf222132438',
  'comm2-assign': '49286449-1cb0-4c2d-a8d2-6edf3887e594',
  'comm2-menu': 'e1732adb-bf17-4e5c-ab38-15b7251b922b',
  'comm2-name': 'eb780ef4-26b0-48a4-b54b-9594c4e63183',
  'comm2-delete': 'e0974417-d52b-434a-8a03-fadab6be7e58',
  'comm2-unsaved': '2c14b547-a609-46fc-887a-3dfc9f399972',
  'comm2-override-del': 'a82337e8-765b-4420-ad09-c96ed07cc90c',
  'comm2-help': '72504ee7-9170-4608-a9e2-8039fe37c5e0',
  // P9-P21 员工与薪资
  'emp-role-pick': '6d7ed9a7-0c81-4dc0-a7ec-dedef4c62712',
  'emp-role-name': 'd36dc61a-20f7-4626-8e2b-13ab05c1d4ee',
  'emp-perm-pick': 'bb589526-e207-4bda-adaa-eac3ebc17c7e',
  'emp-perm-help': '40de9962-3460-479b-a744-bf1fc20e6deb',
  'emp-status': 'b90215d4-8338-4d08-8678-44ee879090c4',
  'emp-detail-status': 'e2aea4e3-f495-45c4-9bf3-cd09f3de83e6',
  'emp-staff-field': '315a6a0a-6593-4daa-a8bb-8d36a4b46f35',
  'emp-month': '8cca9139-55d5-4935-a9d6-37cb6ad8befd',
  'emp-comm-date': 'a795bfb7-ce6e-4faf-a334-14ce2a3eff1c',
  'emp-line-edit': 'f8446dd7-077e-42b7-90ce-a52a8696cfcd',
  'emp-keypad': '3e6ccd5d-2fec-4c8d-bcf3-0c3424db8285',
  'emp-scheme-pick': '5710b393-4f8d-4fbe-9333-f546617dba63',
  'emp-reward-staff': 'bdb528d1-face-4ef2-95a2-e5a17914cda9'
};
const missingKeys = m.screens.filter((s) => !map[s.capture]).map((s) => s.capture);
if (missingKeys.length) { console.error('missing captureId for:', missingKeys.join(', ')); process.exit(1); }
m.screens.forEach((s) => { s.captureId = map[s.capture]; });
fs.writeFileSync(p, JSON.stringify(m, null, 2));
console.log('filled', m.screens.length, 'captureIds, no duplicates:', new Set(Object.values(map)).size === m.screens.length);
