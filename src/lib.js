import {createClient} from '@supabase/supabase-js';
import {percent,hasRequiredProfile,courseCompletion,cleanFile} from './logic.js';

export const cloudUrl=(import.meta.env.VITE_SUPABASE_URL||'').trim();
export const cloudKey=(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'').trim();
export const connected=Boolean(cloudUrl&&cloudKey);
export const db=connected?createClient(cloudUrl,cloudKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;

export const ACCESS_ROLES={learner:'Сотрудник',manager:'Руководитель',instructor:'Преподаватель',admin:'Администратор'};
export const FAMILIES={accounting:'Бухгалтерия и финансы',sales:'Продажи',production:'Производство',procurement:'Снабжение',service:'Сервис',ved:'ВЭД',management:'Управление',hr:'Кадры',admin_staff:'Администрация',it:'ИТ',other:'Другие функции'};
export const DEPARTMENTS=['Бухгалтерия и финансы','Продажи','Производство','ОП Барнаул','ОП Новосибирск','ОП Самара','ОП Краснодар','ОП Воронеж','ВЭД','Снабжение','ГП Сервис','Управление','Администрация','ИТ','Кадры'];
export const LABS=[
 {id:'timesheet',title:'Спаси табель Самары',detail:'Исправь ошибки в Excel-подобной форме.',category:'Табели'},
 {id:'expenses',title:'Заполни подотчёт',detail:'Точные суммы, строки расходов и чеки.',category:'Бухгалтерия'},
 {id:'trip',title:'Собери командировку',detail:'Распредели статьи расходов без путаницы.',category:'Командировки'},
 {id:'match',title:'Назови документ',detail:'Свяжи документ с правильным именем файла.',category:'Документы'},
 {id:'prize',title:'Записка на премию',detail:'Конкретное основание вместо общих слов.',category:'Документы'},
 {id:'errors',title:'Найди косяк',detail:'Найди ошибки и спорные фрагменты табеля.',category:'Табели'},
 {id:'sort',title:'Разложи документы',detail:'Классифицируй расходы по разделам.',category:'Практика'}
];
export const stamp=(d,withTime=false)=>d?new Date(d).toLocaleString('ru-RU',withTime?{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}:{day:'2-digit',month:'short',year:'numeric'}):'—';
export const userLabel=(u)=>u?.display_name?.trim()||'Сотрудник';
export const isReady=hasRequiredProfile;
export const canManage=(p)=>p?.status==='active'&&['admin','instructor'].includes(p?.role);
export const isAdmin=(p)=>p?.status==='active'&&p?.role==='admin';
export const isManager=(p)=>p?.status==='active'&&p?.role==='manager';
export {percent,cleanFile};
export const uniq=(array)=>[...new Set(array)];
export const csvCell=(s)=>'"'+String(s??'').replaceAll('"','""').replace(/^([=+@\-])/,(match)=>"'"+match)+'"';
export function csvDownload(filename,header,items){
 const text='\ufeff'+[header,...items].map(row=>row.map(csvCell).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
export async function check(request){const {data,error}=await request;if(error)throw error;return data;}
export async function getAll(table,columns='*'){
 const rows=[];for(let start=0;start<50000;start+=1000){const part=await check(db.from(table).select(columns).range(start,start+999));rows.push(...(part||[]));if(!part||part.length<1000)break;}return rows;
}
export async function loadPortal(userId){
 if(!db)throw new Error('Не настроено подключение к базе');
 const profile=await check(db.from('profiles').select('id,display_name,department,job_title,job_family,role,status,created_at').eq('id',userId).single());
 const [courses,lessons,assignments,progress,labAssign,labProgress,news,events,rsvps,feedback,resources,prefs]=await Promise.all([
  check(db.from('academy_courses').select('*').order('title')),
  check(db.from('academy_lessons').select('*').order('position')),
  check(db.from('academy_course_assignments').select('*').eq('user_id',userId)),
  check(db.from('academy_lesson_progress').select('*').eq('user_id',userId)),
  check(db.from('academy_lab_assignments').select('*').eq('user_id',userId)),
  check(db.from('academy_lab_progress').select('*').eq('user_id',userId)),
  check(db.from('academy_announcements').select('*').order('created_at',{ascending:false}).limit(20)),
  check(db.from('academy_events').select('*').order('starts_at',{ascending:true}).limit(100)),
  check(db.from('academy_event_rsvps').select('*').eq('user_id',userId)),
  check((canManage(profile)?db.from('academy_feedback').select('*'):db.from('academy_feedback').select('*').eq('user_id',userId)).order('created_at',{ascending:false})),
  check(db.from('academy_resources').select('*').order('created_at',{ascending:false}).limit(150)),
  check(db.from('academy_preferences').select('*').eq('user_id',userId).maybeSingle())
 ]);
 return {profile,courses,lessons,assignments,progress,labAssign,labProgress,news,events,rsvps,feedback,resources,prefs};
}
export async function loadStaffData(){
 const [people,assignments,labAssign,progress,labProgress,rules,labRules,attempts]=await Promise.all([
  getAll('profiles','id,display_name,department,job_title,job_family,status,role,created_at'),
  getAll('academy_course_assignments'),getAll('academy_lab_assignments'),
  getAll('academy_lesson_progress'),getAll('academy_lab_progress'),
  getAll('academy_role_rules'),getAll('academy_lab_rules'),getAll('academy_attempts')
 ]);
 return {people,assignments,labAssign,progress,labProgress,rules,labRules,attempts};
}
export function courseStats(course,lessons,progress){return courseCompletion(course.id,lessons,progress);}
export function safeUrl(raw){try{const url=new URL(raw);return ['https:','http:'].includes(url.protocol)?url.href:null;}catch{return null}}
export function videoSource(raw){
 const u=safeUrl(raw);if(!u)return null;
 try{const x=new URL(u);const host=x.hostname.toLowerCase();
 if(host==='youtube.com'||host.endsWith('.youtube.com')){const id=x.searchParams.get('v')||x.pathname.match(/^\/shorts\/([\w-]+)/)?.[1];if(id&&/^[\w-]{11}$/.test(id))return {type:'iframe',src:`https://www.youtube-nocookie.com/embed/${id}`}}
 if(host==='youtu.be'){const id=x.pathname.slice(1);if(/^[\w-]{11}$/.test(id))return {type:'iframe',src:`https://www.youtube-nocookie.com/embed/${id}`}}
 if(host==='rutube.ru'){const id=x.pathname.match(/\/video\/(\w+)/)?.[1];if(id)return {type:'iframe',src:`https://rutube.ru/play/embed/${id}`}}
 if(/\.(mp4|webm)(\?|$)/i.test(x.pathname))return {type:'video',src:u};
 return {type:'link',src:u};
 }catch{return null}
}
