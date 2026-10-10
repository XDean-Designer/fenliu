import fs from 'node:fs';
const p = 'figma-capture.manifest.json';
const m = JSON.parse(fs.readFileSync(p, 'utf8'));
const ids = [
  // S1..S18 全屏
  'd80dd99b-3d92-4976-aa41-e2a564de15d0','70afc51e-d68b-41c7-9206-abbac04c8d62','bb430faf-24b6-45bd-b297-d18e1f9ea259','4eff675c-d5c1-44c3-8c8b-accb9bc77918',
  '086fd7a9-1ace-4eae-83e5-a18bbe5e483c','4e3be8c1-9fe8-4ad3-a0b1-44dbba346f27','66be77ab-8cd6-4aac-86bc-2bd73ad8fede','12a0c70b-0847-432b-9ecf-8051d7d010c3',
  '749435af-ffd2-4a99-a828-0db14e7dc368','4696f5e0-4464-44c5-a1c5-5ac1a1eb9c5b','99b12169-74a6-4033-89dd-13e0e2b597f5','c0153e07-047d-4bac-8f9f-33ba4ab7da91',
  '0b7a3f1f-692f-44bf-8845-33d071a53d1c','777f384b-b002-4c41-988c-3ed9d81df04c','8734aba0-f54a-44fb-b5ee-c5c1eaf452e8','89b98b2f-4e07-41c5-bf2e-57aabd1df51d',
  'c830460f-df36-4c23-b764-7d1c9a77a40d','69de143b-adc5-45e3-96e2-512335427535',
  // P1..P8 提成设置弹层
  '1fcdb8f5-fd30-4af1-bdb6-1cccca7e31b0','5fe50f77-c567-49e1-aac8-67f79a72d5b5','c8ceae8a-4935-4d75-98c8-88ff01e82f80','40b2bf11-1412-4062-9ed1-5319fb8bea08',
  '00c533f3-bb65-4d76-a1d2-24c04bba51c2','da454c26-caef-4093-b816-5523a5290559','731bd18b-ce8e-4a03-a478-0f87979b92d6','73424d8a-5dcf-44a1-9142-4dc3801c0e25',
  // P9..P21 员工与薪资弹层
  '3df1bfd0-bffb-43f2-b149-894534cda023','b27f172f-a571-41ea-a699-41c02c93feed','f0acb71b-31a3-4427-a701-b5af4f320af2','500c70ed-e5b5-46f3-b184-0ac923fe2a50',
  'c2adb2ae-877c-4710-ac8e-512d276acc40','37fa9cb6-0d3d-4977-87a8-cb8924512c91','7dd24320-f681-4593-9d6f-68afe26e7226','669b7f72-8984-46fb-aa70-04a2eb5ed633',
  '25bfb1f8-0175-4b2d-ae10-5af8eb582ae9','d69e71f8-c7a9-4910-b630-6790b5cd6889','c78870ad-00e2-4b86-a4f9-5fb4c72f0c1c','b0c4e43a-3a3e-4164-b7b2-6dca53e4fa3d',
  'be2115c7-1caf-40b3-bc8f-3eb4bcd72089'
];
if (ids.length !== m.screens.length) { console.error('length mismatch', ids.length, m.screens.length); process.exit(1); }
m.screens.forEach((s, i) => { s.captureId = ids[i]; });
fs.writeFileSync(p, JSON.stringify(m, null, 2));
console.log('filled', m.screens.length, 'captureIds');
for (const s of m.screens) console.log(s.capture.padEnd(22), s.name.padEnd(20), s.captureId);
