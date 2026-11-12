import React,{useEffect,useMemo,useState} from 'react';
import {Activity,ArrowRight,BookOpen,CalendarDays,Check,CheckCircle2,ChevronDown,ClipboardCheck,Download,Edit3,FilePlus2,FileText,Filter,GraduationCap,Inbox,Layers3,MessageCircle,Plus,RefreshCw,Save,Search,Settings2,ShieldCheck,Trash2,UploadCloud,Users,Video,X} from 'lucide-react';
import {db,check,loadStaffData,courseStats,csvDownload,LABS,ACCESS_ROLES,FAMILIES,DEPARTMENTS,stamp,isAdmin,canManage,isManager,percent} from './lib.js';
import {PageTitle,Metric} from './Student.jsx';
import {parseSemicolonCsv} from './logic.js';

const ENTITY_MODES={
 news:{table:'academy_announcements',label:'Новость',title:'Объявления',fields:[['title','Заголовок','text'],['body','Текст новости','textarea'],['department','Подразделение','department'],['pinned','Закрепить','checkbox']]},
 events:{table:'academy_events',label:'Эфир',title:'Эфиры и записи',fields:[['title','Тема эфира','text'],['description','Описание','textarea'],['speaker','Спикер','text'],['starts_at','Дата и время','datetime-local'],['duration_min','Продолжительность (мин)','number'],['join_url','Ссылка на трансляцию','url'],['replay_url','Ссылка на запись','url'],['department','Подразделение','department']]},
 resources:{table:'academy_resources',label:'Материал',title:'Библиотека файлов',fields:[['title','Название','text'],['description','Описание','textarea'],['body','Текст инструкции (если без файла)','textarea'],['category','Категория','text'],['url','Ссылка на файл / документ','url'],['department','Подразделение','department']]},
};
function defaultEntity(mode){return mode==='news'?{title:'',body:'',department:'all',pinned:false}:mode==='events'?{title:'',description:'',speaker:'',starts_at:'',duration_min:60,join_url:'',replay_url:'',department:'all'}:{title:'',description:'',body:'',category:'Инструкция',url:'',media_path:'',department:'all'};}
function niceDate(value){if(!value)return '';const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
function EntityEditor({mode,items,toast,refresh}){
 const conf=ENTITY_MODES[mode];const [draft,setDraft]=useState(defaultEntity(mode));const [current,setCurrent]=useState('');const [busy,setBusy]=useState(false);const [upload,setUpload]=useState(null);
 useEffect(()=>{setDraft(defaultEntity(mode));setCurrent('');setUpload(null)},[mode]);
 function edit(item){setCurrent(item.id);setDraft({...item,starts_at:item.starts_at?niceDate(item.starts_at):''});setUpload(null)}
 async function save(e){e.preventDefault();setBusy(true);try{
  const out={};for(const [k,,type] of conf.fields)out[k]=type==='number'?Number(draft[k]):type==='checkbox'?!!draft[k]:draft[k]||'';
  if(mode==='events')out.starts_at=new Date(draft.starts_at).toISOString();
  if(mode==='resources'){
   out.media_path=draft.media_path||'';
   if(upload){if(upload.size>50*1024*1024)throw new Error('Файл больше 50 МБ. Используй ссылку на внешний файл.');
    const path=`resources/${crypto.randomUUID()}-${upload.name.replace(/[^\w.а-яА-ЯёЁ-]/g,'_')}`;
    await check(db.storage.from('academy-media').upload(path,upload,{upsert:false}));out.media_path=path;
   }
  }
  if(current)out.id=current;
  await check(db.from(conf.table).upsert(out));
  toast(conf.label+' сохранён');setCurrent('');setDraft(defaultEntity(mode));setUpload(null);await refresh();
 }catch(ex){toast(ex.message)}finally{setBusy(false)}}
 async function remove(id){if(!window.confirm(`Удалить «${conf.label.toLowerCase()}»?`))return;try{await check(db.from(conf.table).delete().eq('id',id));toast('Удалено');await refresh();}catch(e){toast(e.message)}}
 return <div className="admin-cols"><section className="panel-card"><div className="section-head condensed"><h3>{current?'Редактировать':'Создать'} · {conf.label.toLowerCase()}</h3>{current&&<button className="text-link" onClick={()=>{setCurrent('');setDraft(defaultEntity(mode))}}>Новый <Plus size={15}/></button>}</div><form className="form-stack" onSubmit={save}>
  {conf.fields.map(([k,label,type])=><label key={k}>{type==='checkbox'?<span className="toggle-label"><input type="checkbox" checked={!!draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.checked}))}/>{label}</span>:<>{label}{type==='textarea'?<textarea rows={4} value={draft[k]||''} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}/>:type==='department'?<select value={draft[k]||'all'} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}><option value="all">Вся компания</option>{DEPARTMENTS.map(x=><option key={x}>{x}</option>)}</select>:<input type={type} value={draft[k]||''} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))} required={['title','starts_at','body'].includes(k)} min={type==='number'?1:undefined} maxLength={k==='title'?160:undefined}/>}</>}</label>)}
  {mode==='resources'&&<label>Или загрузить файл (до 50 МБ)<input type="file" onChange={e=>setUpload(e.target.files?.[0]||null)}/>{draft.media_path&&<small>Файл прикреплён</small>}</label>}
  <button type="submit" className="btn btn-primary" disabled={busy}><Save size={16}/>{busy?'Сохраняем…':current?'Сохранить изменения':'Создать'}</button></form></section>
  <section className="panel-card"><div className="section-head condensed"><h3>Опубликовано · {items.length}</h3></div>{items.length?<div className="admin-list-cards">{items.map(item=><div key={item.id} className="admin-list-card"><div><strong>{item.title}</strong><small>{mode==='events'?stamp(item.starts_at,true):stamp(item.created_at,true)} · {item.department==='all'?'Вся компания':item.department}</small></div><div><button title="Изменить" onClick={()=>edit(item)}><Edit3 size={16}/></button><button title="Удалить" onClick={()=>remove(item.id)}><Trash2 size={16}/></button></div></div>)}</div>:<div className="empty-card">Записей пока нет. Создай первую слева.</div>}</section></div>;
}
function StaffMemberEditor({person,all,refresh,toast,me}){
 const [form,setForm]=useState({...person});const [due,setDue]=useState('');const [saving,setSaving]=useState(false);
 useEffect(()=>{setForm({...person})},[person.id]);
 const assigned=new Set(all.assignments.filter(a=>a.user_id===person.id).map(a=>a.course_id));
 const labs=new Set(all.labAssign.filter(a=>a.user_id===person.id).map(a=>a.lab_id));
 const myResults=all.progress.filter(p=>p.user_id===person.id);
 async function save(){setSaving(true);try{
  if(person.id===me&&(form.role!=='admin'||form.status!=='active'))throw new Error('Нельзя снять собственные права администратора или приостановить свой аккаунт.');
  await check(db.from('profiles').update({display_name:form.display_name?.trim()||'Сотрудник',department:form.department,job_title:form.job_title,job_family:form.job_family,role:form.role,status:form.status,updated_at:new Date().toISOString()}).eq('id',person.id));
  await refresh();toast('Профиль обновлён, назначения по направлению пересчитаны.');
 }catch(e){toast(e.message)}finally{setSaving(false)}}
 async function toggleCourse(id){try{if(assigned.has(id))await check(db.from('academy_course_assignments').delete().match({user_id:person.id,course_id:id}));else await check(db.from('academy_course_assignments').insert({user_id:person.id,course_id:id,source:'manual',due_at:due||null,assigned_by:me}));await refresh();}catch(e){toast(e.message)}}
 async function toggleLab(id){try{if(labs.has(id))await check(db.from('academy_lab_assignments').delete().match({user_id:person.id,lab_id:id}));else await check(db.from('academy_lab_assignments').insert({user_id:person.id,lab_id:id,source:'manual'}));await refresh();}catch(e){toast(e.message)}}
 return <div className="staff-detail"><div className="staff-profile-head"><div className="avatar avatar-coral">{person.display_name?.[0]||'?'}</div><div><h2>{person.display_name}</h2><p>{myResults.length} завершённых уроков · {assigned.size} программ</p></div></div>
 <div className="form-grid"><label>Имя / ФИО<input value={form.display_name||''} onChange={e=>setForm(x=>({...x,display_name:e.target.value}))}/></label><label>Должность<input placeholder="Бухгалтер, менеджер, инженер…" value={form.job_title||''} onChange={e=>setForm(x=>({...x,job_title:e.target.value}))}/></label><label>Подразделение<select value={form.department||''} onChange={e=>setForm(x=>({...x,department:e.target.value}))}><option value="">— Не выбрано —</option>{DEPARTMENTS.map(x=><option key={x}>{x}</option>)}</select></label><label>Профессиональное направление<select value={form.job_family||''} onChange={e=>setForm(x=>({...x,job_family:e.target.value}))}><option value="">— Не назначено —</option>{Object.entries(FAMILIES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label>Уровень доступа<select value={form.role} onChange={e=>setForm(x=>({...x,role:e.target.value}))}>{Object.entries(ACCESS_ROLES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label>Статус аккаунта<select value={form.status||'pending'} onChange={e=>setForm(x=>({...x,status:e.target.value}))}><option value="pending">Ожидает настройки</option><option value="active">Активен</option><option value="suspended">Приостановлен</option></select></label></div>
 <div className="inline-actions"><button className="btn btn-primary" onClick={save} disabled={saving}><Save size={16}/>{saving?'Сохраняем…':'Сохранить профиль и назначить по роли'}</button><small className="dim">Пока нет отдела, должности и направления, обучение закрыто.</small></div>
 <div className="admin-divider"/><div className="section-head condensed"><h3>Индивидуальные назначения</h3><span className="dim">Можно добавлять сверх матрицы</span></div><label className="mini-label">Срок прохождения для нового назначения<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label>
 <div className="assignment-grid">{all.courses.map(c=><button key={c.id} className={'assignment-tile '+(assigned.has(c.id)?'assigned':'')} onClick={()=>toggleCourse(c.id)}><span className="assignment-check">{assigned.has(c.id)&&<Check size={15}/>}</span><div><strong>{c.title}</strong><small>{c.category}</small></div></button>)}</div>
 <h3 className="inner-heading">Тренажёры</h3><div className="assignment-grid">{LABS.map(l=><button key={l.id} className={'assignment-tile '+(labs.has(l.id)?'assigned':'')} onClick={()=>toggleLab(l.id)}><span className="assignment-check">{labs.has(l.id)&&<Check size={15}/>}</span><div><strong>{l.title}</strong><small>{l.category}</small></div></button>)}</div>
 </div>;
}

const HEADER_CSV=['ФИО','Подразделение','Должность','Направление','Права','Статус'];
const normalizeName=s=>String(s||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('ru-RU');
function BulkImport({people,refresh,toast}){
 const [preview,setPreview]=useState([]),[loading,setLoading]=useState(false);
 async function choose(e){
  const file=e.target.files?.[0];if(!file)return;
  try{
   const rows=parseSemicolonCsv(await file.text());
   if(rows.length<2)throw new Error('Файл пустой. Нужны заголовки и строки сотрудников.');
   const hdr=rows[0].map(x=>normalizeName(x));
   const index=k=>hdr.indexOf(normalizeName(k));
   if(index('ФИО')<0||index('Подразделение')<0)throw new Error('Нужны столбцы «ФИО» и «Подразделение».');
   const pool=new Map();people.forEach(p=>{const name=normalizeName(p.display_name);pool.set(name,[...(pool.get(name)||[]),p]);});
   const out=rows.slice(1).map((row,i)=>{
    const val=k=>index(k)<0?'':row[index(k)]||'';
    const name=val('ФИО');const matches=pool.get(normalizeName(name))||[];
    const family=Object.keys(FAMILIES).find(k=>k===val('Направление')||normalizeName(FAMILIES[k])===normalizeName(val('Направление')))||'';
    const role=Object.keys(ACCESS_ROLES).find(k=>k===val('Права')||normalizeName(ACCESS_ROLES[k])===normalizeName(val('Права')))||'learner';
    const status=['pending','active','suspended'].includes(val('Статус'))?val('Статус'):'active';
    const fields={department:val('Подразделение'),job_title:val('Должность')||'Сотрудник',job_family:family,role,status,updated_at:new Date().toISOString()};
    const reason=matches.length!==1?matches.length?'Неоднозначное ФИО':'Аккаунт не зарегистрирован':!fields.department?'Нет отдела':!fields.job_family?'Не выбрано направление':'';
    return {row:i+2,name,profile:matches[0],fields,reason};
   });
   setPreview(out);toast('CSV прочитан. Сначала проверь сопоставление, затем запускай импорт.');
  }catch(err){toast(err.message);setPreview([])}
 }
 const ready=preview.filter(x=>!x.reason);
 async function apply(){
  if(!ready.length)return;
  if(!window.confirm(`Активировать и обновить ${ready.length} найденных аккаунтов? Проверь ФИО, отдел и направление в таблице.`))return;
  setLoading(true);let updated=0,failed=0;
  try{
   for(let i=0;i<ready.length;i+=6){
    const batch=await Promise.all(ready.slice(i,i+6).map(async row=>{
     const {error}=await db.from('profiles').update(row.fields).eq('id',row.profile.id);
     return {row,error};
    }));
    for(const b of batch){if(b.error){failed++}else updated++}
   }
   toast(`Импорт: обновлено ${updated}, ошибок ${failed}.`);
   setPreview([]);await refresh();
  }catch(e){toast('Ошибка импорта: '+e.message)}finally{setLoading(false)}
 }
 function template(){csvDownload('csort-academy-employees-template.csv',HEADER_CSV,[['Иванов Иван Иванович','Продажи','Менеджер по продажам','sales','learner','active']])}
 return <section className="panel-card bulk-import-section"><div className="section-head condensed"><div><h3>Массовое назначение отделов и ролей</h3><p className="dim">Загрузи CSV из Excel; файл сопоставляется только с уже зарегистрированными аккаунтами. Перед импортом будет проверка.</p></div><button className="btn btn-soft" onClick={template}><Download size={15}/> Образец CSV</button></div>
 <label className="file-import">Выбрать CSV с сотрудниками <input type="file" accept=".csv,text/csv" onChange={choose}/></label>
 {preview.length>0&&<><div className="inline-actions"><b>Можно обновить: {ready.length}</b><span className="dim">Не сопоставлено / требуется правка: {preview.length-ready.length}</span></div><div className="table-scroll"><table className="data-table"><thead><tr><th>ФИО из файла</th><th>Отдел</th><th>Должность</th><th>Направление</th><th>Результат</th></tr></thead><tbody>{preview.map(row=><tr key={row.row}><td>{row.name||'—'}</td><td>{row.fields.department||'—'}</td><td>{row.fields.job_title}</td><td>{FAMILIES[row.fields.job_family]||'—'}</td><td>{row.reason||'Готово'}</td></tr>)}</tbody></table></div><button className="btn btn-primary" disabled={!ready.length||loading} onClick={apply}>{loading?'Обновляем профили…':`Подтвердить и обновить (${ready.length})`}</button></>}
 <p className="small-hint">Импорт не создаёт пароли и не регистрирует людей без аккаунта. Совпадения только по точному ФИО. Неподходящие строки пропускаются; направление можно указать русским названием или кодом из образца.</p>
 </section>;
}

function PeoplePage({all,refresh,toast,me}){
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[selected,setSelected]=useState('');
 useEffect(()=>{if(!selected&&all.people.length)setSelected(all.people[0].id)},[all.people.length]);
 const filtered=all.people.filter(p=>(filter==='all'||filter===p.status)&&(p.display_name+' '+p.job_title+' '+p.department).toLowerCase().includes(query.toLowerCase()));
 const current=all.people.find(p=>p.id===selected);
 return <div className="staff-layout"><section className="staff-directory"><div className="search-field"><Search size={17}/><input placeholder="Поиск сотрудников" value={query} onChange={e=>setQuery(e.target.value)}/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Все статусы</option><option value="pending">Ожидают настройки</option><option value="active">Активны</option><option value="suspended">Приостановлены</option></select><div className="staff-items">{filtered.map(p=><button key={p.id} className={selected===p.id?'active':''} onClick={()=>setSelected(p.id)}><span className="tiny-avatar">{p.display_name?.[0]||'?'}</span><span><strong>{p.display_name}</strong><small>{p.department||'Отдел не указан'} · {p.job_title||'Без должности'}</small></span>{p.status==='pending'&&<span className="pending-dot" title="Ожидает настройки"/>}</button>)}</div><p className="small-hint">Аккаунт создаётся через регистрацию на сайте. После регистрации он появляется здесь.</p><button className="btn btn-soft" onClick={()=>{navigator.clipboard?.writeText(location.origin+import.meta.env.BASE_URL);toast('Ссылка регистрации скопирована')}}><Plus size={16}/> Копировать ссылку для сотрудника</button></section><section className="panel-card staff-editor">{current?<StaffMemberEditor key={selected} person={current} all={all} refresh={refresh} toast={toast} me={me}/>:<div className="empty-card">Выбери сотрудника слева.</div>}</section><BulkImport people={all.people} refresh={refresh} toast={toast}/></div>
}
function Matrix({all,refresh,toast}){
 const [family,setFamily]=useState('accounting');
 const currentRules=new Set(all.rules.filter(r=>r.job_family===family).map(r=>r.course_id));
 const currentLabs=new Set(all.labRules.filter(r=>r.job_family===family).map(r=>r.lab_id));
 async function toggleCourse(id){try{if(currentRules.has(id))await check(db.from('academy_role_rules').delete().match({job_family:family,course_id:id}));else await check(db.from('academy_role_rules').insert({job_family:family,course_id:id}));await refresh();toast('Матрица обновлена; назначения сотрудников пересчитаны.');}catch(e){toast(e.message)}}
 async function toggleLab(id){try{if(currentLabs.has(id))await check(db.from('academy_lab_rules').delete().match({job_family:family,lab_id:id}));else await check(db.from('academy_lab_rules').insert({job_family:family,lab_id:id}));await refresh();}catch(e){toast(e.message)}}
 return <div className="panel-card"><div className="section-head"><div><h2>Матрица обучения по направлениям</h2><p className="dim">Изменения сразу применяются ко всем активным сотрудникам выбранного направления.</p></div></div><label className="form-max">Направление<select value={family} onChange={e=>setFamily(e.target.value)}><option value="all">Все сотрудники — базовая программа</option>{Object.entries(FAMILIES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
 <h3 className="inner-heading">Обязательные курсы</h3><div className="assignment-grid">{all.courses.map(c=><button key={c.id} className={'assignment-tile '+(currentRules.has(c.id)?'assigned':'')} onClick={()=>toggleCourse(c.id)}><span className="assignment-check">{currentRules.has(c.id)&&<Check size={15}/>}</span><div><strong>{c.title}</strong><small>{c.category}</small></div></button>)}</div>
 <h3 className="inner-heading">Практические тренажёры</h3><div className="assignment-grid">{LABS.map(l=><button key={l.id} className={'assignment-tile '+(currentLabs.has(l.id)?'assigned':'')} onClick={()=>toggleLab(l.id)}><span className="assignment-check">{currentLabs.has(l.id)&&<Check size={15}/>}</span><div><strong>{l.title}</strong><small>{l.category}</small></div></button>)}</div><div className="tip-line">Персонально назначенные программы при изменении матрицы сохраняются. При смене направления пересчитываются только автоматические назначения.</div></div>;
}
function CourseEditor({data,refresh,toast}){
 const [selected,setSelected]=useState(data.courses[0]?.id||'');const [isNew,setIsNew]=useState(false);
 const [draft,setDraft]=useState(null);const [lessonId,setLessonId]=useState(null);
 const course=data.courses.find(x=>x.id===selected);
 useEffect(()=>{setDraft(course?{...course}:null);setLessonId(null)},[selected,course?.id]);
 const lessons=data.lessons.filter(x=>x.course_id===selected).sort((a,b)=>a.position-b.position);
 async function saveCourse(e){e.preventDefault();try{if(!draft?.id||!/^[a-z0-9-]{2,70}$/.test(draft.id))throw new Error('ID курса: латинские буквы, цифры и дефис, минимум 2 знака.');
  await check(db.from('academy_courses').upsert({id:draft.id,title:draft.title,summary:draft.summary||'',category:draft.category||'Общее',level:draft.level||'Базовый',duration_min:Number(draft.duration_min)||15,accent:draft.accent||'coral',icon:draft.icon||'book',published:!!draft.published,updated_at:new Date().toISOString()}));
  setSelected(draft.id);setIsNew(false);toast('Курс сохранён');await refresh();}catch(e){toast(e.message)}}
 async function removeCourse(){if(!window.confirm('Снять курс с публикации и сохранить историю обучения?'))return;try{await check(db.from('academy_courses').update({published:false}).eq('id',selected));toast('Курс снят с публикации');setSelected('');await refresh()}catch(e){toast(e.message)}}
 return <div className="admin-cols content-admin"><section className="panel-card"><div className="section-head condensed"><h3>Курсы · {data.courses.length}</h3><button className="btn btn-soft" onClick={()=>{setIsNew(true);setSelected('');setDraft({id:'',title:'',summary:'',category:'Общее',level:'Базовый',duration_min:20,accent:'coral',icon:'book',published:false});setLessonId(null)}}><Plus size={15}/> Новый</button></div><div className="admin-course-list">{data.courses.map(c=><button key={c.id} className={selected===c.id?'active':''} onClick={()=>{setSelected(c.id);setIsNew(false)}}><strong>{c.title}</strong><small>{c.published?'Опубликован':'Черновик'} · {c.category}</small></button>)}</div></section><section className="panel-card"><h3>{isNew?'Новая программа':course?'Редактор программы':'Выбери программу'}</h3>{draft&&<><form className="form-stack" onSubmit={saveCourse}><div className="form-grid"><label>ID / код<input required value={draft.id||''} disabled={!isNew} onChange={e=>setDraft(x=>({...x,id:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-')}))}/></label><label>Название<input required value={draft.title||''} onChange={e=>setDraft(x=>({...x,title:e.target.value}))}/></label></div><label>Описание<textarea rows={3} value={draft.summary||''} onChange={e=>setDraft(x=>({...x,summary:e.target.value}))}/></label><div className="form-grid"><label>Категория<input value={draft.category||''} onChange={e=>setDraft(x=>({...x,category:e.target.value}))}/></label><label>Уровень<select value={draft.level||'Базовый'} onChange={e=>setDraft(x=>({...x,level:e.target.value}))}><option>Базовый</option><option>Продвинутый</option><option>Экспертный</option></select></label><label>Минут<input type="number" min="1" value={draft.duration_min||15} onChange={e=>setDraft(x=>({...x,duration_min:e.target.value}))}/></label><label>Цвет<select value={draft.accent||'coral'} onChange={e=>setDraft(x=>({...x,accent:e.target.value}))}>{['coral','violet','blue','green','amber'].map(x=><option key={x}>{x}</option>)}</select></label></div><label className="toggle-label"><input type="checkbox" checked={!!draft.published} onChange={e=>setDraft(x=>({...x,published:e.target.checked}))}/> Опубликовать (после добавления уроков)</label><div className="inline-actions"><button type="submit" className="btn btn-primary"><Save size={16}/> Сохранить курс</button>{!isNew&&<button type="button" className="btn btn-danger" onClick={removeCourse}>Снять с публикации</button>}</div></form>
 {!isNew&&<><div className="admin-divider"/><div className="section-head condensed"><h3>Уроки · {lessons.length}</h3><button className="btn btn-soft" onClick={()=>setLessonId('new')}><Plus size={15}/> Новый урок</button></div><div className="admin-list-cards">{lessons.map(l=><button className="admin-lesson-row" key={l.id} onClick={()=>setLessonId(l.id)}><span>{l.position}</span><div><strong>{l.title}</strong><small>{l.kind==='article'?'Текст':l.kind==='quiz'?'Тест':'Видео'} · {l.published?'Опубликован':'Черновик'}</small></div><ArrowRight size={16}/></button>)}</div>{lessonId&&<LessonEditor key={lessonId+selected} courseId={selected} lesson={lessons.find(l=>l.id===lessonId)} close={()=>setLessonId(null)} refresh={refresh} toast={toast}/>}</>}
 </> }</section></div>;
}
function LessonEditor({courseId,lesson,close,refresh,toast}){
 const fresh={id:'',course_id:courseId,title:'',kind:'article',position:10,duration_min:5,published:false,media_url:'',media_path:'',pass_score:70,content:{lead:'',bullets:[],example:'',tip:'',questions:[]}};
 const [draft,setDraft]=useState(lesson?{...lesson}:fresh);const [bullets,setBullets]=useState((lesson?.content?.bullets||[]).join('\n'));
 const [answers,setAnswers]=useState([]);const [file,setFile]=useState(null);const [busy,setBusy]=useState(false);
 useEffect(()=>{let alive=true;if(lesson?.kind==='quiz')db.from('academy_quiz_keys').select('answers').eq('lesson_id',lesson.id).maybeSingle().then(({data})=>{if(alive)setAnswers(data?.answers||[])});return()=>{alive=false};},[lesson?.id]);
 const content=draft.content||{};const questions=content.questions||[];
 function setContent(key,value){setDraft(x=>({...x,content:{...x.content,[key]:value}}))}
 function setQuestion(i,key,value){setContent('questions',questions.map((q,j)=>i===j?{...q,[key]:value}:q))}
 function setOption(i,k,value){setQuestion(i,'options',questions[i].options.map((v,j)=>j===k?value:v))}
 function addQuestion(){setContent('questions',[...questions,{prompt:'',options:['','','',''],explanation:''}]);setAnswers(a=>[...a,0])}
 async function save(e){e.preventDefault();setBusy(true);try{
  const code=draft.id||`${courseId}-${crypto.randomUUID().slice(0,8)}`;
  const payload={id:code,course_id:courseId,title:draft.title,kind:draft.kind,position:Number(draft.position)||1,duration_min:Number(draft.duration_min)||5,pass_score:Number(draft.pass_score)||70,published:!!draft.published,content:draft.kind==='quiz'?{lead:content.lead||'',questions}:draft.kind==='article'?{lead:content.lead||'',bullets:bullets.split('\n').filter(x=>x.trim()),example:content.example||'',tip:content.tip||''}:{lead:content.lead||''},media_url:draft.media_url||'',media_path:draft.media_path||''};
  if(draft.kind==='quiz'&&(!questions.length||answers.length!==questions.length||questions.some((q,i)=>!q.prompt?.trim()||!Array.isArray(q.options)||q.options.length<2||q.options.some(x=>!x.trim())||!Number.isInteger(Number(answers[i]))||Number(answers[i])<0||Number(answers[i])>=q.options.length)))throw new Error('Проверь все вопросы, варианты и правильные ответы.');
  if(file){if(file.size>50*1024*1024)throw new Error('Файл больше 50 МБ. Лучше указать ссылку на внешнее видео.');const path=`lessons/${crypto.randomUUID()}-${file.name.replace(/[^\w.а-яА-ЯёЁ-]/g,'_')}`;await check(db.storage.from('academy-media').upload(path,file));payload.media_path=path;}
  if(draft.kind==='video'&&payload.published&&!payload.media_url&&!payload.media_path)throw new Error('Чтобы опубликовать видеоурок, добавь файл или ссылку.');
  await check(db.rpc('academy_save_lesson',{p_lesson:payload,p_answers:draft.kind==='quiz'?answers.map(Number):[]}));
  toast('Урок сохранён');await refresh();close();
 }catch(e){toast(e.message)}finally{setBusy(false)}}
 async function remove(){if(!lesson||!window.confirm('Снять урок с публикации и сохранить результаты?'))return;try{await check(db.from('academy_lessons').update({published:false}).eq('id',lesson.id));await refresh();close();toast('Урок снят с публикации')}catch(e){toast(e.message)}}
 return <div className="lesson-editor"><div className="section-head condensed"><h3>{lesson?'Изменить урок':'Добавить урок'}</h3><button className="icon-plain" onClick={close}><X size={18}/></button></div><form className="form-stack" onSubmit={save}><label>Название<input required value={draft.title} onChange={e=>setDraft(x=>({...x,title:e.target.value}))}/></label><div className="form-grid"><label>Формат<select value={draft.kind} onChange={e=>setDraft(x=>({...x,kind:e.target.value}))}><option value="article">Статья</option><option value="video">Видео</option><option value="quiz">Тест</option></select></label><label>Порядок<input type="number" min="1" value={draft.position} onChange={e=>setDraft(x=>({...x,position:e.target.value}))}/></label><label>Минут<input type="number" min="1" value={draft.duration_min} onChange={e=>setDraft(x=>({...x,duration_min:e.target.value}))}/></label>{draft.kind==='quiz'&&<label>Проходной балл, %<input type="number" min="1" max="100" value={draft.pass_score} onChange={e=>setDraft(x=>({...x,pass_score:e.target.value}))}/></label>}</div><label>Вводный текст<textarea rows={3} value={content.lead||''} onChange={e=>setContent('lead',e.target.value)}/></label>
 {draft.kind==='article'&&<><label>Тезисы — каждый с новой строки<textarea rows={7} value={bullets} onChange={e=>setBullets(e.target.value)}/></label><label>Практическая ситуация<textarea rows={3} value={content.example||''} onChange={e=>setContent('example',e.target.value)}/></label><label>«Ай, давай проще» / подсказка<textarea rows={2} value={content.tip||''} onChange={e=>setContent('tip',e.target.value)}/></label></>}
 {draft.kind==='video'&&<><label>Ссылка на видео (YouTube, Rutube, MP4, WebM)<input type="url" value={draft.media_url||''} onChange={e=>setDraft(x=>({...x,media_url:e.target.value}))}/></label><label>Или загрузить файл (не более 50 МБ)<input type="file" accept="video/*" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>{draft.media_path&&<small>Загруженный файл: {draft.media_path}</small>}</>}
 {draft.kind==='quiz'&&<div className="quiz-editor"><div className="section-head condensed"><h4>Вопросы</h4><button className="btn btn-soft" type="button" onClick={addQuestion}><Plus size={15}/> Вопрос</button></div>{questions.map((q,i)=><div key={i} className="question-editor"><label>Вопрос {i+1}<textarea rows={2} value={q.prompt||''} onChange={e=>setQuestion(i,'prompt',e.target.value)}/></label>{(q.options||[]).map((option,k)=><label key={k}>Вариант {k+1}<input value={option} onChange={e=>setOption(i,k,e.target.value)}/></label>)}<label>Правильный ответ<select value={answers[i]??0} onChange={e=>setAnswers(a=>a.map((x,j)=>j===i?Number(e.target.value):x))}>{(q.options||[]).map((_,k)=><option key={k} value={k}>Вариант {k+1}</option>)}</select></label><label>Объяснение<textarea rows={2} value={q.explanation||''} onChange={e=>setQuestion(i,'explanation',e.target.value)}/></label><button type="button" className="text-link" onClick={()=>{setContent('questions',questions.filter((_,j)=>j!==i));setAnswers(a=>a.filter((_,j)=>j!==i))}}>Удалить вопрос</button></div>)}</div>}
 <label className="toggle-label"><input type="checkbox" checked={draft.published} onChange={e=>setDraft(x=>({...x,published:e.target.checked}))}/> Опубликован и доступен назначенным сотрудникам</label><div className="inline-actions"><button className="btn btn-primary" type="submit" disabled={busy}><Save size={16}/>{busy?'Сохранение…':'Сохранить урок'}</button>{lesson&&<button className="btn btn-danger" type="button" onClick={remove}><Trash2 size={16}/></button>}</div></form></div>;
}
function InboxPage({data,refresh,toast}){
 const [filter,setFilter]=useState('all');const items=data.feedback.filter(f=>filter==='all'||f.status===filter);
 const people=Object.fromEntries((data.staff?.people||[]).map(p=>[p.id,p]));
 return <div className="panel-card"><div className="filter-row"><div className="tab-pills">{[['all','Все'],['new','Новые'],['review','В работе'],['closed','Закрытые']].map(([k,v])=><button className={filter===k?'active':''} key={k} onClick={()=>setFilter(k)}>{v}</button>)}</div></div>{items.length?<div className="ticket-list">{items.map(f=><ReplyCard key={f.id} item={f} who={people[f.user_id]?.display_name||'Сотрудник'} refresh={refresh} toast={toast}/>)}</div>:<div className="empty-card">В этой категории обращений нет.</div>}</div>;
}
function ReplyCard({item,who,refresh,toast}){
 const [reply,setReply]=useState(item.admin_reply||''),[status,setStatus]=useState(item.status);
 async function save(){try{await check(db.from('academy_feedback').update({admin_reply:reply,status,updated_at:new Date().toISOString()}).eq('id',item.id));await refresh();toast('Ответ сохранён');}catch(e){toast(e.message)}}
 return <div className="ticket admin-ticket"><div><strong>{item.subject}</strong><span className="dim">{who} · {stamp(item.created_at,true)}</span></div><p>{item.body}</p><label>Ответ<textarea rows={3} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Напиши ответ сотруднику"/></label><div className="inline-actions"><select value={status} onChange={e=>setStatus(e.target.value)}><option value="new">Новое</option><option value="review">В работе</option><option value="closed">Закрыто</option></select><button className="btn btn-primary" onClick={save}><Save size={15}/> Ответить</button></div></div>;
}
function Reports({data}){
 const [dept,setDept]=useState('all'),[search,setSearch]=useState('');
 const list=data.staff?.people||[];const people=list.filter(p=>(dept==='all'||p.department===dept)&&(p.display_name+' '+p.department).toLowerCase().includes(search.toLowerCase()));
 const info=people.map(p=>{
  const assigned=data.staff.assignments.filter(x=>x.user_id===p.id);
  const total=assigned.reduce((sum,a)=>sum+data.lessons.filter(l=>l.course_id===a.course_id&&l.published).length,0);
  const done=data.staff.progress.filter(x=>x.user_id===p.id && data.lessons.some(l=>l.published&&l.id===x.lesson_id&&assigned.some(a=>a.course_id===l.course_id))).length;
  const passedLabs=data.staff.labProgress.filter(x=>x.user_id===p.id).length;
  return {...p,total,done,rate:percent(done,total),courses:assigned.length,passedLabs};
 });
 function exportCsv(){csvDownload('csort-academy-report-'+new Date().toISOString().slice(0,10)+'.csv',['Сотрудник','Отдел','Должность','Направление','Статус','Курсов','Уроков выполнено','Уроков всего','Прогресс %','Тренажёров пройдено'],info.map(p=>[p.display_name,p.department,p.job_title,FAMILIES[p.job_family]||'',p.status,p.courses,p.done,p.total,p.rate,p.passedLabs]));}
 return <div className="panel-card"><div className="filter-row"><div className="search-field"><Search size={16}/><input placeholder="Имя или отдел" value={search} onChange={e=>setSearch(e.target.value)}/></div><select value={dept} onChange={e=>setDept(e.target.value)}><option value="all">Все подразделения</option>{[...new Set(list.map(p=>p.department))].filter(Boolean).map(x=><option key={x}>{x}</option>)}</select><button className="btn btn-primary" onClick={exportCsv}><Download size={16}/> Скачать Excel/CSV</button></div><div className="table-scroll"><table className="data-table"><thead><tr>{['Сотрудник','Подразделение','Направление','Курсы','Прогресс','Тренажёры'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{info.map(p=><tr key={p.id}><td><strong>{p.display_name}</strong><small>{p.job_title||'—'}</small></td><td>{p.department||'—'}</td><td>{FAMILIES[p.job_family]||'—'}</td><td>{p.courses}</td><td><div className="table-progress"><div className="progress-line"><span style={{width:p.rate+'%'}}/></div>{p.done}/{p.total} ({p.rate}%)</div></td><td>{p.passedLabs}</td></tr>)}</tbody></table></div><p className="small-hint">Руководитель видит сотрудников только своего подразделения. Администратору доступны все. Отчёт выгружается в CSV с разделителем «;» для Excel.</p></div>;
}
export function AdminPage({portal,me,toast,onSaved,mode='admin'}){
 const admin=isAdmin(portal.profile),manager=isManager(portal.profile),editor=canManage(portal.profile);
 const allowed=admin?['overview','people','matrix','content','events','news','resources','inbox','reports']:manager?['overview','reports']:['overview','content','events','news','resources','inbox'];
 const labels={overview:['Сводка',Activity],people:['Сотрудники',Users],matrix:['Матрица ролей',Layers3],content:['Курсы и уроки',BookOpen],events:['Трансляции',CalendarDays],news:['Новости',MessageCircle],resources:['Материалы',FileText],inbox:['Обращения',Inbox],reports:['Отчёты',Download]};
 const [tab,setTab]=useState('overview'),[staff,setStaff]=useState(null),[busy,setBusy]=useState(false);
 async function reload(){setBusy(true);try{const next=await loadStaffData();setStaff(next);await onSaved();}catch(e){toast('Ошибка обновления: '+e.message)}finally{setBusy(false)}}
 useEffect(()=>{reload()},[]);
 const all=staff?{...staff,courses:portal.courses}:null;
 const pending=staff?.people?.filter(x=>x.status==='pending').length||0;
 const total=staff?.people?.length||0;
 const active=staff?.people?.filter(x=>x.status==='active').length||0;
 const progress=staff?.progress?.length||0;
 const tabs=allowed.filter(x=>x!=='overview');
 return <div className="page-in admin-page"><PageTitle overline={admin?'УПРАВЛЕНИЕ АКАДЕМИЕЙ':manager?'КАБИНЕТ РУКОВОДИТЕЛЯ':'СТУДИЯ ПРЕПОДАВАТЕЛЯ'} title={admin?'Пульт управления':manager?'Моя команда':'Работа с материалами'} subtitle={admin?'Сотрудники, роли, программы, эфиры, обратная связь и отчёты — в одном месте.':manager?'Прогресс сотрудников вашего подразделения.':'Создавай курсы, публикуй уроки и планируй мероприятия.'} actions={<button className="btn btn-outline" onClick={reload} disabled={busy}><RefreshCw size={16}/>{busy?'Обновляем…':'Обновить'}</button>}/>
 <div className="admin-nav">{allowed.map(x=>{const Icon=labels[x][1];return <button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}><Icon size={16}/>{labels[x][0]}{x==='people'&&pending>0&&<span className="nav-bubble">{pending}</span>}</button>})}</div>
 {tab==='overview'&&<><div className="metric-grid"><Metric icon={Users} value={total} label="Сотрудников"/><Metric icon={CheckCircle2} value={active} label="Активных аккаунтов"/><Metric icon={Inbox} value={portal.feedback.filter(x=>x.status==='new').length} label="Новых обращений"/><Metric icon={GraduationCap} value={progress} label="Завершений уроков"/></div><div className="admin-overview-grid"><section className="panel-card"><h2>Быстрые действия</h2><div className="admin-quick-actions">{tabs.slice(0,6).map(x=><button key={x} onClick={()=>setTab(x)}><span>{labels[x][0]}</span><ArrowRight size={16}/></button>)}</div></section><section className="panel-card"><h2>Как выдавать доступ</h2><div className="steps-list"><div><b>01</b> Сотрудник регистрируется по рабочей почте.</div><div><b>02</b> Администратор указывает отдел, должность и профессиональное направление.</div><div><b>03</b> После активации система назначает курсы по матрице. Можно добавить индивидуальные.</div><div><b>04</b> Завершения и тесты сохраняются в общей базе, отчёты доступны в CSV.</div></div></section></div></>}
 {tab==='people'&&all&&<PeoplePage all={all} me={me} refresh={reload} toast={toast}/>}
 {tab==='matrix'&&all&&<Matrix all={all} refresh={reload} toast={toast}/>}
 {tab==='content'&&<CourseEditor data={portal} refresh={onSaved} toast={toast}/>}
 {['events','news','resources'].includes(tab)&&<EntityEditor mode={tab} items={portal[tab]||[]} toast={toast} refresh={onSaved}/>}
 {tab==='inbox'&&<InboxPage data={{...portal,staff}} refresh={onSaved} toast={toast}/>}
 {tab==='reports'&&staff&&<Reports data={{...portal,staff}}/>}
 {busy&&!staff&&<div className="empty-card">Загружаем сотрудников и отчёты…</div>}
 </div>;
}
