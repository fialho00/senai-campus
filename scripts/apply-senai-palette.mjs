// One-time, idempotent migration of the visual tokens to SENAI's blue/orange family.
// Reference: Manual de Marcas 2024, SENAI (blue #1A4B9F, orange #EF5E31).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const palette = new Map();
function map(oldColors, next) {
  for (const old of oldColors.split(' ')) palette.set(old.toLowerCase(), next);
}

map('#22183f', '#142D55');
map('#24203a #35249f', '#123D81');
map('#4934c4', '#1A4B9F');
map('#604bf0', '#EF5E31');
map('#d9ff66 #d6ff66', '#FFBF91');
map('#725ef0', '#4D7FBF');
map('#b1d353', '#DE955F');
map('#34216f', '#1A3D70');
map('#6f5fe7', '#4272B0');
map('#26135a', '#1B3965');
map('#271442', '#25446D');
map('#110a2a', '#0A2342');
map('#170f33', '#0E2D53');
map('#e95447', '#EF5E31');
map('#f39b35', '#F38B40');

map('#605289 #635d71 #676276 #696073 #797385 #7f758d #87808f #878092', '#607088');
map('#928b9a #938c9e #9b95a7 #a098a9 #aaa2b8', '#8A99AB');
map('#8375d2 #8474da #988beb', '#7FA8D7');
map('#b4a8d4 #b6a9e6 #c8c2dc', '#B5CBE5');
map('#bcb1ff', '#B9D1EE');
map('#c7c2d9 #ccc6dd #d6d0e1 #d8d1e8 #d8d0ff #d8d1f2 #ddd7e9', '#CCD9EA');
map('#c9c1fa #cdc5ff #d1c8ff #d4caff #d5cdff #ddd5ff', '#D9E9FC');
map('#ded7fb #e0dbe7 #e2deeb #e4ddff #e4dff7 #e4e0e9 #e5e0ea #e5e1eb #e5e1ec #e5e2ed #e6e2ec #e6e2ee #e7e3ed #e8e4ed #e8e4ef #e9e5f0 #e9e6f1 #eae7f0', '#E4EDF8');
map('#ece8e3 #ece8f0 #ece8ff #edeaf2 #eeeaf2 #eeeaff #eeebf1 #eeebf7 #eeebff #efedf2 #eff0ff', '#EDF4FC');
map('#f0edfb #f0edff #f1edff #f1eeff #f1effa #f2f0f6 #f4f1fd #f5f2ff #f6f5fb #f8f6fc #f9f8fe #fbfaff', '#F4F8FD');
map('#fbfaf6', '#FCFDFE');
map('#fff3df', '#FFF0E8');

for (const name of ['style.css', 'campus.css']) {
  const path = resolve(root, name);
  const oldText = readFileSync(path, 'utf8');
  const newText = oldText.replace(/#[0-9a-f]{6}(?:[0-9a-f]{2})?/gi, match => {
    const rgb = match.slice(0, 7).toLowerCase();
    return (palette.get(rgb) ?? match.slice(0, 7)) + match.slice(7).toUpperCase();
  });
  writeFileSync(path, newText);
  console.log(name, oldText === newText ? 'unchanged' : 'updated');
}
