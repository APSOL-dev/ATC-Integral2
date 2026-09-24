const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlPath = path.resolve(__dirname, 'guia-operativa-vendedores.html');
const pdfPath = path.resolve(__dirname, 'guia-operativa-vendedores.pdf');

console.log('Generating PDF...');
execFileSync(edgePath, [
  '--headless',
  '--disable-gpu',
  '--no-pdf-header-footer',
  '--print-to-pdf=' + pdfPath,
  'file:///' + htmlPath.replace(/\\/g, '/')
]);

if (fs.existsSync(pdfPath)) {
  console.log('PDF Generated Successfully! Size:', fs.statSync(pdfPath).size, 'bytes');
} else {
  console.error('PDF file was not created.');
}
