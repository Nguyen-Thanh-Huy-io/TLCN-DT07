const fs = require('fs');
const code = fs.readFileSync('src/App-Figma.tsx', 'utf-8');

const components = [
  'Icon', 'Badge', 'Avatar', 'Logo', 'Sidebar', 'Topbar', 
  'StatCard', 'ActionMenu', 'Dashboard', 'QuickAction', 
  'ContentCell', 'UserCell', 'ManagementPage', 'FormPage', 
  'Field', 'SelectField', 'LessonEditor', 'ReviewModal', 
  'ReviewPage', 'EventModal', 'ConfirmDeleteModal', 'SimplePage'
];

let extracted = `import React, { useMemo, useState } from "react";\n\n`;
extracted += code; // Just output the whole thing to a shared file first to make it easy.

fs.writeFileSync('src/components/AllInOne.tsx', extracted);
console.log('Done');
