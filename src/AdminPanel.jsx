import React,{useEffect,useMemo,useState} from 'react';
import {Check,Download,RefreshCw,Users,ShieldCheck} from 'lucide-react';
import {CATALOG,supabase} from './cloud.js';

const csvCell=x=>{const value=String(x??'');const safe=/^[=+\-@\t\r]/.test(value)?'\''+value:value;return '"'+safe.replaceAll('"','""')+'"'};
function downloadCsv(name,rows){
  const text='\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function AdminPanel(){
  const [people,setPeople]=useState([]);const [assignments,setAssignments]=useState([]);
  const [results,setResults]=useState([]);const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');const [selected,setSelected]=useState('');const [search,setSearch]=useState('');
  async function reload(){
    setLoading(true);setError('');
    const [p,a,r]=await Promise.all([
      supabase.from('profiles').select('id,display_name,department,role,created_at').order('display_name'),
      supabase.from('assignments').select('user_id,kind,item_id'),
      supabase.from('learning_progress').select('user_id,kind,item_id,completed_at')
    ]);
    const problem=p.error||a.error||r.error;
    if(problem) setError(problem.message);
    else {setPeople(p.data||[]);setAssignments(a.data||[]);setResults(r.data||[]);setSelected(s=>s||(p.data?.[0]?.id||''));}
    setLoading(false);
  }
  useEffect(()=>{reload()},[]);
  const current=people.find(x=>x.id===selected);
  const filtered=people.filter(x=>[x.display_name,x.department].join(' ').toLowerCase().includes(search.toLowerCase()));
  const assigned=(kind,id)=>assignments.some(a=>a.user_id===selected&&a.kind===kind&&a.item_id===id);
  async function toggle(item){
    setError('');
    const had=assigned(item.kind,item.id);
    const request=had?supabase.from('assignments').delete().match({user_id:selected,kind:item.kind,item_id:item.id}):supabase.from('assignments').insert({user_id:selected,kind:item.kind,item_id:item.id});
    const {error}=await request;
    if(error) setError(error.message);else await reload();
  }
  async function updateDepartment(department){
    const {error}=await supabase.from('profiles').update({department}).eq('id',selected);
    if(error)setError(error.message);else await reload();
  }
  function exportAll(){
    const lookup=Object.fromEntries(people.map(p=>[p.id,p]));
    downloadCsv('csort-academy-results.csv',[
      ['Сотрудник','Подразделение','Роль','Тип','Материал','Дата выполнения'],
      ...results.map(r=>[lookup[r.user_id]?.display_name,lookup[r.user_id]?.department,lookup[r.user_id]?.role,r.kind,r.item_id,new Date(r.completed_at).toLocaleString('ru-RU')])
    ]);
  }
  return <section className="cloud-admin v7-page"><div className="cloud-admin-head"><div><span className="v7-kicker"><ShieldCheck size={15}/> УПРАВЛЕНИЕ ОБУЧЕНИЕМ</span><h1>Сотрудники и результаты.</h1><p>Назначения и достижения хранятся в общей базе и доступны с любого устройства.</p></div><div className="cloud-admin-actions"><button className="ghost-btn" onClick={reload}><RefreshCw size={16}/> Обновить</button><button className="primary-btn" onClick={exportAll}><Download size={16}/> Скачать CSV</button></div></div>
    {error&&<div className="cloud-auth-message" role="alert">{error}</div>}
    <div className="cloud-admin-stats"><span><Users size={19}/> {people.length} аккаунтов</span><span><Check size={19}/> {results.length} завершений</span><span>{assignments.length} назначений</span></div>
    <div className="cloud-admin-layout"><div className="cloud-admin-list"><input placeholder="Поиск по имени или отделу" value={search} onChange={e=>setSearch(e.target.value)}/>{loading&&<small>Загрузка…</small>}{filtered.map(p=><button key={p.id} className={p.id===selected?'selected':''} onClick={()=>setSelected(p.id)}><strong>{p.display_name||'Сотрудник'}</strong><small>{p.department||'Без подразделения'} · {p.role==='admin'?'Администратор':'Сотрудник'}</small></button>)}</div>
    <div className="cloud-admin-detail">{current?<><h2>{current.display_name}</h2><p>{current.role==='admin'?'Администратор':'Сотрудник'} · {results.filter(r=>r.user_id===selected).length} завершений</p><label>Подразделение <input key={selected} defaultValue={current.department||''} onBlur={e=>{if(e.target.value!==(current.department||''))updateDepartment(e.target.value)}}/></label><h3>Назначенные материалы</h3><p>Убери или добавь материалы для этого сотрудника. Изменения действуют сразу после обновления его кабинета.</p><div className="cloud-admin-catalog">{CATALOG.map(item=><button key={item.kind+item.id} className={assigned(item.kind,item.id)?'active':''} onClick={()=>toggle(item)}><span className="cloud-admin-tick">{assigned(item.kind,item.id)&&<Check size={15}/>}</span><span><strong>{item.label}</strong><small>{item.kind==='course'?'Курс':'Тренажёр'}</small></span></button>)}</div></>:<p>Выбери сотрудника слева.</p>}</div></div>
  </section>;
}
