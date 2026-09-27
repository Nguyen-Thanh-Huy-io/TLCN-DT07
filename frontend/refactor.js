const fs = require('fs');

let code = fs.readFileSync('frontend/src/App-Figma.tsx', 'utf-8');

// Replace function declarations with export function
code = code.replace(/^(function [A-Z])/gm, 'export $1');
// Replace const component declarations with export const
code = code.replace(/^(const [A-Z][a-zA-Z0-9_]*\s*=)/gm, 'export $1');
// Replace iconPaths with export const
code = code.replace(/^(const iconPaths)/gm, 'export $1');
// Replace navGroups with export const
code = code.replace(/^(const navGroups)/gm, 'export $1');
// Replace pageMeta with export const
code = code.replace(/^(const pageMeta)/gm, 'export $1');

// Prepend "use client";
code = '"use client";\nimport React from "react";\n' + code;

fs.writeFileSync('frontend/src/components/FigmaUI.tsx', code);
