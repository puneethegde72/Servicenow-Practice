const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext([
  'var Class = { create: function() { return function() {}; } };',
  'var global = { AbstractAjaxProcessor: function() {} };',
  'Object.extendsObject = function(parent, methods) { return methods; };'
].join('\n'), context);
vm.runInContext(fs.readFileSync(path.join(__dirname,
  'source/script-includes/PracticeTimeEntryAjaxV2.js'), 'utf8'), context);
const service = new context.PracticeTimeEntryAjaxV2();
const date = '2030-01-15';
const slots = ['09_10', '10_11', '11_12', '12_13'].map(value => ({ value, label: value }));
const plain = value => JSON.parse(JSON.stringify(value));

test('fills a partial slot before distributing a three-hour entry', () => {
  const result = plain(service._allocateDuration('09_10', 10800, date, slots,
    { [date + '|09_10']: 1800 }));
  assert.equal(result.success, true);
  assert.deepEqual(result.records.map(row => row.seconds), [1800, 3600, 3600, 1800]);
  assert.equal(result.records.reduce((sum, row) => sum + row.seconds, 0), 10800);
});
test('database and staged usage both consume capacity', () => {
  const usage = service._mergeUsageMaps(
    { [date + '|09_10']: 1800 }, { [date + '|09_10']: 900 });
  const result = plain(service._allocateDuration('09_10', 1800, date, slots, usage));
  assert.deepEqual(result.records.map(row => row.seconds), [900, 900]);
});
test('skips a full slot and uses the next consecutive slot', () => {
  const result = plain(service._allocateDuration('09_10', 3600, date, slots,
    { [date + '|09_10']: 3600 }));
  assert.equal(result.success, true);
  assert.deepEqual(result.records.map(row => row.value), ['10_11']);
});
test('rejects a gap between slots', () => {
  const result = service._allocateDuration('09_10', 7200, date, [slots[0], slots[2]], {});
  assert.equal(result.success, false);
  assert.match(result.message, /not consecutive/);
});
test('rejects duration beyond the remaining slots', () => {
  const result = plain(service._allocateDuration('09_10', 18000, date, slots, {}));
  assert.equal(result.success, false);
  assert.deepEqual(result.records, []);
});
test('rejects an unknown start slot and zero duration', () => {
  assert.equal(service._allocateDuration('08_09', 3600, date, slots, {}).success, false);
  assert.equal(service._allocateDuration('09_10', 0, date, slots, {}).success, false);
});
