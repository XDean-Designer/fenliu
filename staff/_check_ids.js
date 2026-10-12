const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
function where(s) { return html.indexOf(s); }
const frame = where('id="frame"');
const targets = [
  'id="comm2CatSheetMask"', 'id="empCommDateMask"', 'id="empRoleMask"',
  'id="empMonthMask"', 'id="empSchemePickMask"', 'id="amountKeypadMask"',
  'id="empPermMask"', 'id="empStatusMask"', 'id="empCommLineEditMask"',
  'id="empRewardStaffMask"', 'id="empStaffFieldMask"', 'id="empDetailStatusMask"',
  'id="comm2MenuMask"', 'id="comm2UnsavedMask"', 'id="comm2DeleteMask"',
  'id="comm2OverrideDelMask"', 'id="empRoleNameMask"', 'id="empPermHelpMask"',
  'id="comm2NameMask"', 'id="comm2HelpMask"', 'id="comm2MigrateDiffMask"'
];
console.log('frame@', frame);
for (const t of targets) {
  const i = where(t);
  console.log(i > frame ? 'IN-FRAME' : 'OUTSIDE', '@' + i, t);
}
// print a small window to see the container nesting of the first mask
const first = where('id="comm2CatSheetMask"');
console.log('\n--- container context for first mask ---');
console.log(html.slice(frame, first).split('\n').filter(l => /id="(frame|phone|comm2-edit)"|class="(phone|screen)/.test(l)).slice(-6).join('\n'));
