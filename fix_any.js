const fs = require('fs');
const files = [
  { file: 'Projects.tsx', type: 'Project' },
  { file: 'Sustainability.tsx', type: 'SustainabilityRecord' },
  { file: 'WasteManagement.tsx', type: 'WasteRecord' },
  { file: 'Lettings.tsx', type: 'LettingUnit' },
  { file: 'PermissionsManager.tsx', type: 'Permission' },
  { file: 'Prequalification.tsx', type: 'PrequalificationRecord' },
  { file: 'Tenders.tsx', type: 'Record<string, any>' },
  { file: 'Training.tsx', type: 'TrainingRecord' }
];

files.forEach(({file, type}) => {
  let path = 'src/components/modules/' + file;
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  
  // Best effort replace for arrays
  code = code.replace(/useState<any\[\]>\(\[\]\)/g, 'useState<'+type+'[]>([])');
  
  // Best effort replace for items
  let itemMatch = code.match(/interface ([A-Z][a-zA-Z0-9]+)/);
  let interfaceName = itemMatch ? itemMatch[1] : type;
  
  code = code.replace(/\(v: any\)/g, '(v: ' + interfaceName + ')');
  code = code.replace(/\(item: any\)/g, '(item: ' + interfaceName + ')');
  code = code.replace(/\(record: any\)/g, '(record: ' + interfaceName + ')');
  code = code.replace(/\(d: any\)/g, '(d: ' + interfaceName + ')');
  code = code.replace(/\(t: any\)/g, '(t: ' + interfaceName + ')');
  code = code.replace(/\(p: any\)/g, '(p: ' + interfaceName + ')');
  code = code.replace(/\(unit: any\)/g, '(unit: ' + interfaceName + ')');
  code = code.replace(/\(req: any\)/g, '(req: ' + interfaceName + ')');
  
  // Add some specific explicit array casting
  code = code.replace(/as any\[\]/g, 'as ' + interfaceName + '[]');
  
  fs.writeFileSync(path, code);
});
console.log('Done');
