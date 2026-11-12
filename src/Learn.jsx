import React,{useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,CheckCircle2,ChevronRight,Clock3,ExternalLink,FileText,LockKeyhole,PlayCircle,RotateCcw,ShieldCheck,Video,AlertCircle,Lightbulb,Target} from 'lucide-react';
import {db,check,courseStats,isReady,percent,videoSource,safeUrl} from './lib.js';

export function LearningCard({course,lessons,progress,assignment,onClick,compact=false}){
 const stat=courseStats(course,lessons,progress);
 return <button className={'course-card accent-'+(course.accent||'coral')+(compact?' course-compact':'')} onClick={onClick}>
  <div className="course-card-top"><span className="category-chip">{course.category}</span><span className="course-duration"><Clock3 size={14}/> {course.duration_min} мин</span></div>
  <div className="course-tile-symbol">{course.icon==='shield'?'◈':course.icon==='factory'?'▥':course.icon==='sparkles'?'✳':course.icon==='database'?'⌘':'◷'}</div>
  <h3>{course.title}</h3><p>{course.summary}</p>
  <div className="course-foot"><div className="progress-line"><span style={{width:stat.rate+'%'}}/></div><div className="course-foot-meta"><span>{stat.finished?'Завершён':stat.total?`${stat.done} из ${stat.total} уроков`:'Материалы готовятся'}</span><span>{stat.rate}% <ChevronRight size={15}/></span></div></div>
  {assignment?.due_at&&<span className="due-chip">До {new Date(assignment.due_at+'T12:00:00').toLocaleDateString('ru-RU')}</span>}
 </button>;
}
function Media({lesson}){
 const [signed,setSigned]=useState('');
 useEffect(()=>{let alive=true;setSigned('');if(!lesson?.media_path)return;
  db.storage.from('academy-media').createSignedUrl(lesson.media_path,3600).then(({data,error})=>{if(alive&&!error)setSigned(data?.signedUrl||'')});
  return ()=>{alive=false};},[lesson?.media_path]);
 const src=signed||lesson?.media_url||'';
 const player=videoSource(src);
 if(!src)return <div className="media-empty"><Video size={30}/><h3>Видео ещё не добавлено</h3><p>Попроси администратора прикрепить запись или ссылку. Незагруженный урок не засчитывается.</p></div>;
 if(player?.type==='iframe')return <div className="video-frame"><iframe src={player.src} title={lesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div>;
 if(player?.type==='video'||signed&&/\.(mp4|webm|mov)/i.test(lesson.media_path))return <video className="video-element" src={src} controls preload="metadata"/>;
 if(player?.type==='link'||signed)return <a className="btn btn-soft" href={src} target="_blank" rel="noopener noreferrer">Открыть материал <ExternalLink size={16}/></a>;
 return <div className="error-box">Некорректный адрес видеоматериала.</div>;
}
export function CourseView({course,lessons,progress,onBack,onSaved,toast}){
 const [current,setCurrent]=useState(0);const [answers,setAnswers]=useState({});const [simple,setSimple]=useState(false);
 const [busy,setBusy]=useState(false);const [result,setResult]=useState(null);
 const units=useMemo(()=>lessons.filter(l=>l.course_id===course.id&&l.published).sort((a,b)=>a.position-b.position),[lessons,course.id]);
 const stat=courseStats(course,lessons,progress);
 const lesson=units[current];const already=lesson&&progress.some(x=>x.lesson_id===lesson.id);
 useEffect(()=>{const first=units.findIndex(l=>!progress.some(p=>p.lesson_id===l.id));setCurrent(first<0?0:first)},[course.id]);
 useEffect(()=>{setAnswers({});setResult(null);setSimple(false)},[lesson?.id]);
 async function finish(){if(!lesson||busy)return;
  const qs=lesson.content?.questions||[];
  if(lesson.kind==='video'&&!lesson.media_url&&!lesson.media_path){toast('Видеоматериал ещё не прикреплён.');return;}
  if(lesson.kind==='quiz'&&qs.some((_,i)=>answers[i]===undefined)){toast('Ответь на все вопросы теста.');return;}
  setBusy(true);try{const data=await check(db.rpc('academy_finish_lesson',{p_lesson_id:lesson.id,p_answers:lesson.kind==='quiz'?qs.map((_,i)=>answers[i]):[]}));
   setResult(data);if(data.passed){toast(lesson.kind==='quiz'?`Тест сдан: ${data.score}%`:'Урок завершён');await onSaved()}else toast(`Пока ${data.score}%. Нужно ${data.required}%. Попробуй ещё раз.`);
  }catch(err){toast(err.message)}finally{setBusy(false)}
 }
 return <div className="page-in"><button className="back-link" onClick={onBack}><ArrowLeft size={17}/> Моё обучение</button>
  <div className="course-banner accent-surface"><div><div className="eyebrow"><BookOpen size={15}/> {course.category} / {course.level}</div><h1>{course.title}</h1><p>{course.summary}</p><span className="tiny-meta">{stat.done} из {stat.total} · {stat.rate}% завершено</span></div><div className="donut" style={{'--p':stat.rate}}><span>{stat.rate}%</span></div></div>
  <div className="lesson-layout"><aside className="lesson-list"><h3>Содержание</h3>{units.map((l,i)=>{const done=progress.some(p=>p.lesson_id===l.id);return <button key={l.id} className={i===current?'active':''} onClick={()=>setCurrent(i)}><span className={'lesson-number '+(done?'done':'')}>{done?<CheckCircle2 size={16}/>:String(i+1).padStart(2,'0')}</span><span><strong>{l.title}</strong><small>{l.kind==='quiz'?'Тест':l.kind==='video'?'Видео':'Статья'} · {l.duration_min} мин</small></span></button>})}</aside>
  <article className="lesson-content">{lesson?<>
   <div className="lesson-content-head"><div className="eyebrow">УРОК {current+1} / {units.length} · {lesson.kind==='quiz'?'ПРОВЕРКА':lesson.kind==='video'?'ВИДЕО':'МАТЕРИАЛ'}</div><h2>{lesson.title}</h2>{already&&<span className="completed-label"><CheckCircle2 size={15}/> Выполнено</span>}</div>
   {lesson.content?.lead&&<p className="lesson-lead">{lesson.content.lead}</p>}
   {lesson.kind==='article'&&<>
    <div className="article-block"><div className="article-block-head"><FileText size={18}/> По делу <button className="text-link" onClick={()=>setSimple(!simple)}>{simple?'Подробнее':'Ай, давай проще →'}</button></div>
    {simple?<p>{lesson.content?.tip||lesson.content?.lead}</p>:<ul className="article-bullets">{(lesson.content?.bullets||[]).map((b,i)=><li key={i}>{b}</li>)}</ul>}</div>
    {!!lesson.content?.example&&<div className="example-box"><div><Target size={17}/> Ситуация из работы</div><p>{lesson.content.example}</p></div>}
    {!!lesson.content?.tip&&<div className="tip-line"><Lightbulb size={17}/>{lesson.content.tip}</div>}
   </>}
   {lesson.kind==='video'&&<><Media lesson={lesson}/>{!!lesson.content?.lead&&<div className="tip-line"><Lightbulb size={16}/> После просмотра отметь урок завершённым.</div>}</>}
   {lesson.kind==='quiz'&&<div className="quiz-area">{(lesson.content?.questions||[]).map((q,qi)=><div className="quiz-question" key={qi}><div className="quiz-number">ВОПРОС {qi+1}</div><h3>{q.prompt}</h3><div className="quiz-answers">{(q.options||[]).map((opt,oi)=><button key={oi} className={answers[qi]===oi?'picked':''} onClick={()=>{setAnswers(a=>({...a,[qi]:oi}));setResult(null)}}><b>{'АБВГДЕ'[oi]||oi+1}</b><span>{opt}</span></button>)}</div>{result&&<p className="answer-comment">{q.explanation}</p>}</div>)}{result&&<div className={result.passed?'success-box':'error-box'}>{result.passed?'Проверка пройдена':'Есть над чем поработать'} · {result.score}% (нужно {result.required}%).</div>}</div>}
   <div className="lesson-actions"><button className="btn btn-soft" disabled={current===0} onClick={()=>setCurrent(Math.max(0,current-1))}><ArrowLeft size={16}/> Назад</button><div className="lesson-actions-right">{!already&&<button className="btn btn-primary" disabled={busy||lesson.kind==='quiz'&&!lesson.content?.questions?.length} onClick={finish}>{busy?'Сохраняем…':lesson.kind==='quiz'?'Проверить ответы':'Завершить урок'}<CheckCircle2 size={16}/></button>}{current<units.length-1&&<button className="btn btn-soft" onClick={()=>setCurrent(current+1)}>Дальше <ArrowRight size={16}/></button>}</div></div>
   </>:<div className="empty-card">В курсе пока нет опубликованных уроков.</div>}</article></div>
 </div>;
}
