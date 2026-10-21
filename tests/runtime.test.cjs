const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function app() {
  const input = {value:''};
  const context = vm.createContext({document: {documentElement: {lang:'en'}, addEventListener() {}, getElementById: () => input}});
  for (const file of ['color-utils', 'app']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file + '.js'), 'utf8'), context);
  context.updateFromHex = value => context.result = value.toUpperCase();
  context.showToast = value => context.error = value;
  return {context, input};
}
test('CMYK primary colors and black/white convert correctly', () => {
  const {context:c, input} = app();
  for (const [value, expected] of [
    ['0%, 100%, 100%, 0%', '#FF0000'], ['100%, 0%, 100%, 0%', '#00FF00'],
    ['100%, 100%, 0%, 0%', '#0000FF'], ['0%, 0%, 0%, 0%', '#FFFFFF'], ['0%, 0%, 0%, 100%', '#000000'],
  ]) { input.value = `cmyk(${value})`; c.parseInput('val-cmyk'); assert.equal(c.result, expected); }
});
test('invalid percentages and trailing garbage do not update color', () => {
  const {context:c, input} = app();
  for (const [id, value] of [['val-hsl','hsl(0, 999%, 50%)'], ['val-cmyk','cmyk(101%, 0%, 0%, 0%)'], ['val-rgb','rgb(0, 0, 0)junk']]) {
    input.value=value; c.parseInput(id); assert.equal(c.result, undefined); assert.match(c.error, /Invalid format/);
  }
});
test('negative and wrapped hue values normalize', () => {
  const {context:c} = app();
  assert.deepEqual(c.hslToRgb(-60,100,50), c.hslToRgb(300,100,50));
  assert.deepEqual(c.hsvToRgb(720,100,100), c.hsvToRgb(0,100,100));
});
