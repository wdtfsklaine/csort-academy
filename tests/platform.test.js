import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSemicolonCsv,calcDateRange,buildFilename,percent,hasRequiredProfile,courseCompletion} from '../src/logic.js';

test('15-day range includes end date and weekends',()=>{
 const result=calcDateRange('2026-11-01','2026-11-15');
 assert.equal(result.days,15);
 assert.equal(result.weekends.length,5);
 assert.equal(result.weekdays,10);
});
test('inverted, blank, invalid and very long ranges do not return false days',()=>{
 assert.equal(calcDateRange('2026-11-20','2026-11-02'),null);
 assert.equal(calcDateRange('','2026-11-02'),null);
 assert.equal(calcDateRange('2026-01-01','2027-12-31'),null);
});
test('document names include department, dates, type and no illegal characters',()=>{
 assert.equal(buildFilename('Табель','ОП Самара','01.11-15.11.2026'),'Табель_ОП Самара_01.11-15.11.2026.xlsx');
 assert.equal(buildFilename('Подотчёт','Бухгалтерия','ноябрь','Иванов И.И.','Барнаул').includes('Иванов И.И.'),true);
 assert.equal(buildFilename('Чек','ОП: Самара','20/11','Иванов И.И.','Барнаул').includes('/'),false);
});
test('only configured and active people are eligible',()=>{
 const active={status:'active',department:'Продажи',job_title:'Менеджер',job_family:'sales'};
 assert.equal(hasRequiredProfile(active),true);
 assert.equal(hasRequiredProfile({...active,status:'pending'}),false);
 assert.equal(hasRequiredProfile({...active,status:'suspended'}),false);
 assert.equal(hasRequiredProfile({...active,job_family:''}),false);
 assert.equal(hasRequiredProfile({...active,department:''}),false);
});
test('course progress is per lesson, not per catalog',()=>{
 const lessons=[{id:'one',course_id:'sales',published:true},{id:'two',course_id:'sales',published:true},{id:'three',course_id:'other',published:true},{id:'hidden',course_id:'sales',published:false}];
 const p=[{lesson_id:'one'},{lesson_id:'three'}];
 assert.deepEqual(courseCompletion('sales',lessons,p),{total:2,done:1,rate:50,finished:false});
 assert.equal(courseCompletion('empty',lessons,p).finished,false);
 assert.equal(percent(0,0),0);
});


test('CSV parser reads Excel semicolon headers and quoted fields',()=>{
 const rows=parseSemicolonCsv('\uFEFFФИО;Подразделение;Должность\r\n"Иванов; Пётр";Снабжение;"Менеджер ""ОП"""\r\n');
 assert.deepEqual(rows,[['ФИО','Подразделение','Должность'],['Иванов; Пётр','Снабжение','Менеджер "ОП"']]);
});
