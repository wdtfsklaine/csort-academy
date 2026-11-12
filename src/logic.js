// Pure helpers shared by the LMS and its automated checks.
export function calcDateRange(from,to){
 if(!from||!to)return null;
 const start=new Date(from+'T12:00:00Z'),end=new Date(to+'T12:00:00Z');
 if(Number.isNaN(+start)||Number.isNaN(+end)||start>end)return null;
 const days=Math.round((+end-+start)/86400000)+1;
 if(days>366)return null;
 const weekends=[];
 for(let i=0;i<days;i++){
  const d=new Date(+start+i*86400000);
  if([0,6].includes(d.getUTCDay()))weekends.push(d.toLocaleDateString('ru-RU',{timeZone:'UTC'}));
 }
 return {days,weekdays:days-weekends.length,weekends};
}
export const cleanFile=(s)=>s.replace(/[\\/:*?"<>|]/g,'-');
export function buildFilename(type,dept,period,name='Фамилия И.О.',location='Место'){
 const patterns={
  'Табель':`Табель_${dept}_${period}.xlsx`,
  'Питание':`Питание_${dept}_${period}.pdf`,
  'Подотчёт':`Подотчёт_${name}_${location}_${period}.pdf`,
  'Чек':`Чек_Предмет_${name}_${location}_${period}.pdf`,
  'Премия':`Премия_Основание_${dept}_${name}_${period}.docx`
 };
 return cleanFile(patterns[type]||'Документ.pdf');
}
export const percent=(done,total)=>total?Math.round(100*done/total):0;
export function hasRequiredProfile(p){return p?.status==='active'&&!!p.department?.trim()&&!!p.job_title?.trim()&&!!p.job_family?.trim()}
export function courseCompletion(courseId,lessons,progress){
 const units=lessons.filter(l=>l.course_id===courseId&&l.published);
 const done=units.filter(l=>progress.some(p=>p.lesson_id===l.id)).length;
 return {total:units.length,done,rate:percent(done,units.length),finished:units.length>0&&done===units.length};
}

// Semicolon-delimited CSV reader supporting Excel quotes, escaped quotes and newlines.
export function parseSemicolonCsv(input){
 const value=String(input||'').replace(/^\uFEFF/,'');
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<value.length;i++){
  const c=value[i];
  if(c==='"'){
   if(quoted&&value[i+1]==='"'){field+='"';i++}else quoted=!quoted;
  }else if(c===';'&&!quoted){row.push(field.trim());field=''}
  else if((c==='\n'||c==='\r')&&!quoted){
   if(c==='\r'&&value[i+1]==='\n')i++;
   row.push(field.trim());if(row.some(x=>x!==''))rows.push(row);
   row=[];field='';
  }else field+=c;
 }
 if(quoted)throw new Error('CSV: не закрыты кавычки.');
 row.push(field.trim());if(row.some(x=>x!==''))rows.push(row);
 return rows;
}
