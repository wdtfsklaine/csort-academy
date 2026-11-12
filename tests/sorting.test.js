import test from 'node:test';
import assert from 'node:assert/strict';
import {sortItems, sortZones, evaluateSorting} from '../src/sortData.js';
test('all sample expense cards have an existing drop zone',()=>{
  const zones=new Set(sortZones.map(x=>x.id));
  for(const item of sortItems)assert.ok(zones.has(item.zone));
});
test('correct drag-and-drop grouping passes',()=>{
  const map=Object.fromEntries(sortItems.map(item=>[item.id,item.zone]));
  assert.equal(evaluateSorting(map).filter(x=>!x.ok).length,0);
});
test('moving petrol to per diem is flagged',()=>{
  const map=Object.fromEntries(sortItems.map(item=>[item.id,item.zone]));
  map.a='daily';
  assert.equal(evaluateSorting(map).filter(x=>!x.ok).length,1);
});
test('unassigned items are not accepted',()=>{
  assert.equal(evaluateSorting({}).filter(x=>x.ok).length,0);
});
