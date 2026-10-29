// Pure, independently testable validation rules for the educational expense form.
// These are NOT accounting postings or a replacement for a human review.
export function normalizeMoney(value){
  const raw=String(value??'').replace(/[\s\u00a0\u202f₽]/g,'').replace(',','.');
  return raw===''?NaN:Number(raw);
}
export function norm(value){return String(value??'').trim().toLowerCase().replace(/ё/g,'е')}
export function normalizeDate(value){
  const s=String(value??'').trim();
  let m=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if(m)return `${m[1].padStart(2,'0')}.${m[2].padStart(2,'0')}.${m[3]}`;
  m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m?`${m[3]}.${m[2]}.${m[1]}`:s;
}
export function hasReceipt(note){
  const v=norm(note);
  if(!v||/(?:без\s*чека|б\.?\s*ч\.?|нет\s*чека)/i.test(v))return false;
  return /(?:^|\s)(?:ч\.|чек\b|чек\s*есть|есть\s*чек|да\b)/i.test(v)||/чек/i.test(v);
}
export function evaluateExpenses(rows){
  const filled=rows.map((r,index)=>({...r,index})).filter(r=>Object.entries(r).some(([k,v])=>k!=='index'&&typeof v==='string'&&v.trim()));
  const fuel=filled.find(r=>/бенз|топлив|гсм|аи.?95|аи.?92/i.test(norm(r.goods)));
  const road=filled.find(r=>/дорог|проезд|платн|трасс/i.test(norm(r.goods)));
  const sumOk=(r,target)=>!!r&&Number.isFinite(normalizeMoney(r.spent))&&Math.abs(normalizeMoney(r.spent)-target)<0.005;
  const items=[
    {ok:!!fuel&&!!road&&fuel.index!==road.index,text:'Бензин и платная дорога должны быть разными строками. «ГСМ» и «платный проезд» тоже подходят.'},
    {ok:!!fuel&&!!road&&normalizeDate(fuel.date)==='01.10.2026'&&normalizeDate(road.date)==='02.10.2026',text:'Даты: топливо — 01.10.2026, платная дорога — 02.10.2026.'},
    {ok:filled.some(r=>Math.abs(normalizeMoney(r.received)-8000)<0.005),text:'Аванс 8 000 ₽ указывается в графе «Полученная сумма».'},
    {ok:sumOk(fuel,2450.70)&&sumOk(road,760),text:'Суммы без округления: бензин — 2 450,70 ₽, дорога — 760 ₽. Пробел, запятая и точка допустимы.'},
    {ok:!!fuel&&!!road,text:'Товары/услуги указаны: бензин/ГСМ и дорога/проезд. Можно уточнить названия, но это не ошибка заполнения.'},
    {ok:!!fuel&&!!road&&[fuel,road].every(r=>hasReceipt(r.note)&&norm(r.project).includes('сервис')&&norm(r.owner).includes('иванов')),text:'В обеих строках отметь наличие чека, проект «Сервис» и ответственного Иванова.'}
  ];
  return items;
}
