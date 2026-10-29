import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateExpenses,normalizeMoney,hasReceipt,normalizeDate} from '../src/validation.js';
const example=[
 {date:'01.10.2026',received:'8000',spent:'2450,70',goods:'бензин',note:'ч.',project:'Сервис',owner:'Иванов И.И.'},
 {date:'02.10.2026',received:'',spent:'760',goods:'дорога',note:'ч.',project:'Сервис',owner:'Иванов И.И.'}
];
test('заполненная форма с бензином и дорогой должна пройти ВСЕ проверки',()=>{
 assert.deepEqual(evaluateExpenses(example).map(x=>x.ok),[true,true,true,true,true,true]);
});
test('принимает разные денежные разделители и копейки',()=>{
 for(const value of ['2450,70','2450.70','2 450,70','2\u00a0450,70','2\u202f450,70'])assert.equal(normalizeMoney(value),2450.70);
});
test('гибко распознает ГСМ и платный проезд независимо от порядка',()=>{
 const rows=[{...example[1],goods:'платный проезд',spent:'760,00'},{...example[0],goods:'ГСМ, АИ-95',spent:'2 450.70'}];
 assert.ok(evaluateExpenses(rows).every(x=>x.ok));
});
test('пустая дополнительная строка не считается ошибкой',()=>{
 const blank={date:'',received:'',spent:'',goods:'',note:'',project:'',owner:''};
 assert.ok(evaluateExpenses([...example,blank]).every(x=>x.ok));
});
test('без чека не равно чеку',()=>{
 assert.equal(hasReceipt('б.ч.'),false);
 assert.equal(hasReceipt('ч.'),true);
 assert.equal(hasReceipt('чек есть'),true);
});
test('неверная сумма подсвечивается отдельно, название не исчезает',()=>{
 const r=evaluateExpenses([{...example[0],spent:'2450'},example[1]]);
 assert.equal(r[0].ok,true);assert.equal(r[3].ok,false);assert.equal(r[4].ok,true);
});
test('поддерживает даты с пропущенным ведущим нулем',()=>{
 assert.equal(normalizeDate('1.10.2026'),'01.10.2026');
 assert.equal(normalizeDate('2026-10-01'),'01.10.2026');
});
