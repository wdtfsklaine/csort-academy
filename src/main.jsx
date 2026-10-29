import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowRight,ArrowUpRight,BookOpen,BrainCircuit,CalendarDays,Check,CheckCircle2,ChevronRight,ClipboardCheck,Copy,Download,FileCheck2,FileSpreadsheet,GraduationCap,Grid2X2,Layers3,Menu,MousePointer2,MoveUpRight,Play,RotateCcw,ShieldCheck,Sparkles,Target,Timer,Trophy,WandSparkles,Wrench,X,Zap} from 'lucide-react';
import csortLogo from './assets/csort-logo.png';
import {OfficeCourse} from './OfficeCourse.jsx';
import {PracticeLab} from './PracticeLab.jsx';
import './style.css';
import './polish.css';

const navItems=[['Главная','home'],['Обучение','courses'],['Тренажёры','practice'],['Инструменты','tools'],['Мой прогресс','progress']];
const labs=[
  {id:'timesheet',number:'01',name:'Спаси табель Самары',tag:'Excel · исправление',detail:'Проверь шапку, ФИО и лишние строки.',icon:FileSpreadsheet},
  {id:'expenses',number:'02',name:'Заполни подотчёт',tag:'Таблица · заполнение',detail:'Внеси расходы, суммы и чеки в форму.',icon:ClipboardCheck},
  {id:'trip',number:'03',name:'Собери командировку',tag:'Drag & drop',detail:'Разложи ГСМ, запчасти и суточные.',icon:Layers3},
  {id:'match',number:'04',name:'Назови документ',tag:'Соединение',detail:'Сопоставь виды файлов с шаблонами.',icon:FileCheck2},
  {id:'prize',number:'05',name:'Записка на премию',tag:'Форма · редактирование',detail:'Заполни основание премии правильно.',icon:BookOpen},
  {id:'errors',number:'06',name:'Найди косяк',tag:'Выделение ошибок',detail:'Отметь нарушения в табеле.',icon:Target}
];
const introChoices=[
  {text:'Попросить ИИ придумать универсальную инструкцию.',description:'Правдоподобный текст — ещё не технический документ производителя.',correct:false},
  {text:'Найти руководство производителя по точной модели со ссылкой.',description:'Да. Проверяем производителя, модель, редакцию и сам документ.',correct:true},
  {text:'Получить ответ ИИ без ссылок, но очень подробный.',description:'Подробность не заменяет первоисточник. Нужна ссылка на руководство.',correct:false},
  {text:'Найти подходящий ГОСТ и считать его инструкцией к модели.',description:'ГОСТ описывает требования, но не заменяет руководство конкретной машины.',correct:false}
];
const blankProgress={lessons:[],labs:[],ai:false};
function readProgress(){try{let x=JSON.parse(localStorage.getItem('csort-demo-v07')||'null');return x&&Array.isArray(x.lessons)&&Array.isArray(x.labs)?{...blankProgress,...x}:blankProgress}catch{return blankProgress}}
function downloadFile(name,content,type='text/plain;charset=utf-8'){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function formatDate(value){const [y,m,d]=value.split('-');return `${d}.${m}.${y}`}
function getWeekendDates(start,end){if(!start||!end)return null;let a=new Date(start+'T12:00:00Z'),b=new Date(end+'T12:00:00Z');if(Number.isNaN(+a)||Number.isNaN(+b)||a>b||(+b-+a)/86400000>366)return null;let dates=[];let count=0;for(let v=+a;v<=+b;v+=86400000){count++;let d=new Date(v);if([0,6].includes(d.getUTCDay()))dates.push(d.toLocaleDateString('ru-RU',{timeZone:'UTC'}))}return {count,dates}}
function BlockTitle({kicker,title,description}){return <div className="v7-section-title"><div><span className="v7-kicker"><span className="v7-kicker-bar"/>{kicker}</span><h2>{title}</h2>{description&&<p>{description}</p>}</div></div>}
function App(){
  const [tab,setTab]=useState('home');
  const [activeLab,setActiveLab]=useState('timesheet');
  const [progress,setProgress]=useState(readProgress);
  const [menu,setMenu]=useState(false);
  const [introAnswer,setIntroAnswer]=useState(null);
  const [from,setFrom]=useState('2026-11-06'),[to,setTo]=useState('2026-11-09'),[dateChecked,setDateChecked]=useState(false);
  const [fileType,setFileType]=useState('Табель'),[fileDept,setFileDept]=useState('ОП Самара'),[filePeriod,setFilePeriod]=useState('01-15.11.2026');
  const [toast,setToast]=useState('');
  const [pointer,setPointer]=useState({x:0,y:0});
  const heroRef=useRef(null);
  const completed=progress.lessons.length+progress.labs.length+Number(progress.ai);
  const weekendResult=useMemo(()=>dateChecked?getWeekendDates(from,to):null,[from,to,dateChecked]);
  useEffect(()=>{try{localStorage.setItem('csort-demo-v07',JSON.stringify(progress))}catch{}},[progress]);
  const showToast=(message)=>{setToast(message);window.setTimeout(()=>setToast(''),3400)};
  const go=(next)=>{setTab(next);setMenu(false);window.scrollTo({top:0,behavior:'smooth'})};
  const openLab=(id)=>{setActiveLab(id);go('lab')};
  const finishLesson=(id)=>setProgress(p=>({...p,lessons:p.lessons.includes(id)?p.lessons:[...p.lessons,id]}));
  const finishLab=(id)=>setProgress(p=>({...p,labs:p.labs.includes(id)?p.labs:[...p.labs,id]}));
  const chooseIntro=(i)=>{setIntroAnswer(i);if(introChoices[i].correct)setProgress(p=>({...p,ai:true}))};
  const fileParts={
    'Табель':`Табель_${fileDept}_${filePeriod}.xlsx`,
    'Питание':`Питание_${fileDept}_${filePeriod}.pdf`,
    'Подотчёт':`Подочет_Фамилия И.О._Место_${filePeriod}.pdf`,
    'Премия':`Премия_Причина_${fileDept}_Фамилия И.О._${filePeriod}.docx`
  };
  const filename=fileParts[fileType].replace(/[\\/:*?"<>|]/g,'-');
  function exportProgress(){const rows=[['Раздел','Идентификатор','Статус'],...progress.lessons.map(x=>['Урок',x,'Завершено']),...progress.labs.map(x=>['Тренажёр',x,'Пройдено']),['ИИ-практика','source-check',progress.ai?'Пройдено':'Не пройдено']];downloadFile('csort-academy-demo-progress.csv','\uFEFF'+rows.map(row=>row.map(s=>'"'+String(s).replaceAll('"','""')+'"').join(';')).join('\r\n'),'text/csv;charset=utf-8')}
  const onHeroMove=e=>{const r=heroRef.current?.getBoundingClientRect();if(!r)return;setPointer({x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5})};
  return <div className="app-shell v7-app"><div className="ambient" aria-hidden="true"/><div className="grain" aria-hidden="true"/><div className="v7-grid-bg" aria-hidden="true"/>
    <header className="container header v7-header"><button className="brand v7-brand" onClick={()=>go('home')} aria-label="На главную CSORT ACADEMY"><span className="v7-logo-bg"><img src={csortLogo} alt="CSORT Color Sorting"/></span><span className="v7-brand-word">ACADEMY</span><span className="v7-beta">DEMO</span></button>
      <nav className={menu?'nav nav-open':'nav'} aria-label="Навигация">{navItems.map(([label,id])=><button key={id} className={tab===id?'nav-current':''} onClick={()=>go(id)}>{label}</button>)}</nav>
      <div className="v7-header-right"><span className="v7-status"><span/> Онлайн-демо</span><button className="v7-icon-button v7-mobile-menu" onClick={()=>setMenu(!menu)} aria-label="Меню">{menu?<X size={20}/>:<Menu size={20}/>}</button></div>
    </header>
    <main className="container v7-main">
    {tab==='home'&&<>
      <div className="v7-hero" ref={heroRef} onPointerMove={onHeroMove} onPointerLeave={()=>setPointer({x:0,y:0})}>
        <div className="v7-hero-copy"><div className="v7-preamble"><span className="v7-live-dot"/> ВНУТРЕННЯЯ АКАДЕМИЯ · ДЕМОНСТРАЦИЯ <ArrowUpRight size={15}/></div>
          <h1>Сложное —<br/><em>по полочкам.</em><br/>Навыки —<br/>в дело<span>.</span></h1>
          <p>Меньше лекций ради галочки. Больше понятных инструкций, интерактивных документов и маленьких побед в работе.</p>
          <div className="v7-hero-buttons"><button className="primary-btn" onClick={()=>go('practice')}>Попробовать тренажёры <ArrowRight size={18}/></button><button className="ghost-btn" onClick={()=>go('courses')}>Посмотреть уроки <ArrowUpRight size={16}/></button></div>
          <div className="v7-hero-facts"><span><Check size={15}/> Настоящая практика</span><span><Zap size={15}/> 1–5 минут</span><span><ShieldCheck size={15}/> Без ИИ внутри</span></div>
        </div>
        <div className="v7-hero-visual" aria-label="Иллюстрация интерактивной академии" style={{'--rx':`${-11+pointer.x*7}deg`,'--ry':`${6-pointer.y*6}deg`}}>
          <div className="v7-visual-grid"/><div className="v7-radial v7-radial-one"/><div className="v7-radial v7-radial-two"/><div className="v7-aura"/>
          <div className="v7-demo-window"><div className="v7-window-bar"><div className="v7-traffic"><i/><i/><i/></div><span>CSORT / academy / практикум</span><Grid2X2 size={14}/></div>
            <div className="v7-window-content"><div className="v7-window-caption"><span className="v7-live-dot"/> LIVE PRACTICE <span>02 / 06</span></div><h3>Подотчёт<br/><strong>без ошибок.</strong></h3><div className="v7-data-card"><div><span>01.10 · ГСМ</span><b>2 450,70 ₽</b><CheckCircle2 size={16}/></div><div><span>02.10 · Дорога</span><b>760,00 ₽</b><CheckCircle2 size={16}/></div></div><div className="v7-meter"><span style={{width:'78%'}}/></div><div className="v7-window-foot"><span>Всё становится понятнее</span><span>↗</span></div></div>
          </div>
          <div className="v7-floating v7-floating-a"><Sparkles size={17}/> Осваивай новое</div><div className="v7-floating v7-floating-b"><MousePointer2 size={17}/> Не просто тесты</div>
        </div>
      </div>
      <div className="v7-ticker" aria-label="Разделы академии"><div className="v7-ticker-track">{Array.from({length:2}).map((_,i)=><div className="v7-ticker-group" key={i}>{['ИНСТРУКЦИИ','ТРЕНАЖЁРЫ','ДОКУМЕНТЫ','НЕЙРОСЕТИ','РАБОЧИЕ ИНСТРУМЕНТЫ'].map(x=><span key={x}><b>✳</b>{x}</span>)}</div>)}</div></div>
      <section className="v7-home-stats"><div><span>01 / УЧЕБНЫЙ КУРС</span><strong>5 уроков</strong><small>Документы без переделок</small></div><div><span>02 / ПРАКТИЧЕСКАЯ ЛАБОРАТОРИЯ</span><strong>6 тренажёров</strong><small>Настоящие формы, учебные данные</small></div><div><span>03 / ПОЛЕЗНОЕ</span><strong>2 инструмента</strong><small>Проверка дат и название файлов</small></div><div><span>МОЙ ПРОГРЕСС</span><strong>{completed} <small>/ 12</small></strong><small>Сохранено в этом браузере</small></div></section>
      <section className="v7-highlight"><BlockTitle kicker="ЛУЧШЕ ОДИН РАЗ ПОПРОБОВАТЬ" title="Знание начинается с действия." description="Не выбирай ответ наугад — исправь табель, заполни документ, разложи расходы по полям."/><div className="v7-highlight-grid"><button className="v7-feature v7-feature-hot" onClick={()=>openLab('timesheet')}><span className="v7-feature-top"><FileSpreadsheet size={29}/><ArrowUpRight size={19}/></span><span><small>01 · ТАБЕЛЬ</small><strong>Спаси Самару.</strong><span>Проверь оформление документа и найди, что исправить.</span></span></button><button className="v7-feature" onClick={()=>openLab('expenses')}><span className="v7-feature-top"><ClipboardCheck size={29}/><ArrowUpRight size={19}/></span><span><small>02 · ПОДОТЧЁТ</small><strong>Разложи по строкам.</strong><span>Заполни таблицу и получи понятную проверку.</span></span></button><button className="v7-feature v7-feature-blue" onClick={()=>go('tools')}><span className="v7-feature-top"><CalendarDays size={29}/><ArrowUpRight size={19}/></span><span><small>03 · ИНСТРУМЕНТЫ</small><strong>Больше пользы.</strong><span>Даты командировок, имена файлов и меньше рутины.</span></span></button></div></section>
      <section className="v7-bottom-cta"><div className="v7-soft-glow"/><span className="v7-kicker">У НАС УЖЕ ЕСТЬ С ЧЕГО НАЧАТЬ</span><h2>Меньше «а как это сделать?».<br/><em>Больше «я разобрался».</em></h2><button className="primary-btn" onClick={()=>go('courses')}>Перейти к обучению <ArrowRight size={16}/></button></section>
    </>}
    {tab==='courses'&&<section className="v7-page"><BlockTitle kicker="ОБУЧЕНИЕ · 5 УРОКОВ" title="Не лекция. Навык." description="Короткий рабочий курс по внутренним правилам. Все варианты ответов объясняются отдельно."/><button className="v7-course-banner" onClick={()=>go('office')}><div className="v7-course-icon"><BookOpen size={31}/></div><div><span className="v7-kicker">ОТКРЫТЫЙ КУРС</span><h3>Документы без переделок</h3><p>Командировки, авансовые отчёты, табели, премии и названия файлов.</p><div className="v7-course-progress"><span style={{width:`${progress.lessons.length/5*100}%`}}/></div><small>{progress.lessons.length} из 5 уроков · можно продолжить позже</small></div><ArrowUpRight className="v7-course-arrow" size={24}/></button><div className="v7-coming-layout"><div className="v7-coming"><BrainCircuit size={22}/><h3>ИИ без лишней магии</h3><p>Базовый курс в подготовке. Сейчас доступна интерактивная практика по проверке источников.</p><button onClick={()=>go('practice')}>Открыть практику <ArrowRight size={16}/></button></div><div className="v7-coming"><ShieldCheck size={22}/><h3>Не верь роботу на слово</h3><p>Полный курс появится позже. Первое упражнение уже работает.</p><button onClick={()=>go('practice')}>Проверить источники <ArrowRight size={16}/></button></div></div></section>}
    {tab==='office'&&<OfficeCourse completed={progress.lessons} onComplete={finishLesson} onBack={()=>go('courses')}/>}
    {tab==='practice'&&<section className="v7-page"><BlockTitle kicker="ИНТЕРАКТИВНАЯ ЛАБОРАТОРИЯ" title="Не тесты. Почти работа." description="Заполняй реальные по структуре формы, находи ошибки и сразу узнавай, что исправить. Все данные вымышленные."/><div className="v7-labs">{labs.map(x=>{let Icon=x.icon;return <button className="v7-lab-card" key={x.id} onClick={()=>openLab(x.id)}><span className="v7-lab-card-head"><span className="v7-lab-number">{x.number}</span>{progress.labs.includes(x.id)?<span className="v7-completed"><CheckCircle2 size={14}/> Пройден</span>:<ArrowUpRight size={19}/>}</span><span className="v7-lab-icon"><Icon size={26}/></span><strong>{x.name}</strong><span>{x.detail}</span><small>{x.tag}</small></button>})}</div><div className="v7-ai-exercise"><div><span className="v7-kicker">МИКРОТРЕНАЖЁР · ИИ</span><h3>Не верь роботу на слово.</h3><p>Нужно найти инструкцию к конкретной модели оборудования. Какой первый шаг надёжнее?</p></div><div className="v7-ai-options">{introChoices.map((x,i)=><button key={i} className={introAnswer===i?(x.correct?'v7-answer-ok':'v7-answer-bad'):''} onClick={()=>chooseIntro(i)}><span>{String.fromCharCode(65+i)}</span><div>{x.text}{introAnswer===i&&<small>{x.description}</small>}</div></button>)}</div>{progress.ai&&<span className="v7-ai-done"><CheckCircle2 size={17}/> Практика засчитана</span>}</div></section>}
    {tab==='lab'&&<PracticeLab key={activeLab} initialActive={activeLab} onComplete={finishLab} completed={progress.labs} onBack={()=>go('practice')}/>}
    {tab==='tools'&&<section className="v7-page"><BlockTitle kicker="ИНСТРУМЕНТЫ" title="Меньше рутины. Больше дела." description="Два небольших помощника, которые можно использовать прямо сейчас. Данные никуда не отправляются."/><div className="v7-tools-grid"><article className="v7-tool-card"><span className="v7-tool-head"><CalendarDays size={22}/> Даты командировки <span className="v7-active-tag">РАБОТАЕТ</span></span><p>Показывает календарные субботы и воскресенья в выбранном периоде. Не заменяет проверку фактической работы и графика.</p><div className="v7-tool-inputs"><label>Начало поездки<input type="date" value={from} onChange={e=>{setFrom(e.target.value);setDateChecked(false)}}/></label><label>Конец поездки<input type="date" value={to} onChange={e=>{setTo(e.target.value);setDateChecked(false)}}/></label></div><button className="primary-btn" onClick={()=>setDateChecked(true)}>Проверить даты <ArrowRight size={16}/></button>{dateChecked&&<div className="v7-tool-result">{weekendResult?<><strong>{weekendResult.dates.length?'Есть выходные по пятидневке':'Суббот и воскресений нет'}</strong><p>Всего дней: {weekendResult.count}. {weekendResult.dates.length?'Выходные: '+weekendResult.dates.join(', ')+'.':'Проверь праздничные дни и индивидуальный график отдельно.'}</p></>:<p>Проверь даты: окончание не раньше начала, диапазон до 366 дней.</p>}</div>}</article><article className="v7-tool-card"><span className="v7-tool-head"><FileCheck2 size={22}/> Название документа <span className="v7-active-tag">РАБОТАЕТ</span></span><p>Помогает собрать имя файла по памятке. Обязательно проверь поля перед использованием в работе.</p><div className="v7-tool-inputs"><label>Тип документа<select value={fileType} onChange={e=>setFileType(e.target.value)}>{Object.keys(fileParts).map(x=><option key={x}>{x}</option>)}</select></label><label>Подразделение<input value={fileDept} onChange={e=>setFileDept(e.target.value)}/></label><label className="v7-tool-wide">Период<input value={filePeriod} onChange={e=>setFilePeriod(e.target.value)}/></label></div><div className="v7-filename" title={filename}>{filename}</div><button className="ghost-btn" onClick={async()=>{try{await navigator.clipboard.writeText(filename);showToast('Имя файла скопировано')}catch{showToast('Скопируй имя вручную из поля выше')}}}><Copy size={16}/> Скопировать имя</button></article></div></section>}
    {tab==='progress'&&<section className="v7-page"><BlockTitle kicker="МОЙ ПРОГРЕСС · ЛОКАЛЬНО" title="Твои маленькие победы." description="Это демоверсия: результаты сохраняются в браузере, не связаны с учётными записями сотрудников."/><div className="v7-progress-grid"><div><GraduationCap size={24}/><strong>{progress.lessons.length}<small> / 5</small></strong><span>Пройдено уроков</span></div><div><Target size={24}/><strong>{progress.labs.length}<small> / 6</small></strong><span>Пройдено тренажёров</span></div><div><Trophy size={24}/><strong>{completed}<small> / 12</small></strong><span>Всего завершено</span></div></div><div className="v7-progress-panel"><div><h3>Продолжить обучение</h3><p>Уроки засчитываются за правильное решение, тренажёры — после полной проверки.</p><div className="v7-overall-progress"><span style={{width:`${(completed/12)*100}%`}}/></div></div><button className="primary-btn" onClick={()=>go('courses')}>К урокам <ArrowRight size={16}/></button></div><div className="v7-export-panel"><div><h3>Экспорт результатов</h3><p>Скачать CSV с учебными результатами этого браузера. Для общего отчёта по сотрудникам нужен сервер и авторизация.</p></div><div className="v7-export-actions"><button className="ghost-btn" onClick={exportProgress}><Download size={16}/> Скачать CSV</button><button className="v7-reset" onClick={()=>{if(window.confirm('Очистить результаты демоверсии в этом браузере?'))setProgress({...blankProgress,lessons:[],labs:[]})}}><RotateCcw size={15}/> Сбросить</button></div></div></section>}
    </main>
    <footer className="container v7-footer"><div className="v7-footer-logo"><img src={csortLogo} alt="CSORT"/><span>ACADEMY</span></div><span>DEMO 0.7 · 2026 · учебные данные</span><span>Сделано, чтобы работать умнее <Zap size={13}/></span></footer>
    {toast&&<div role="status" className="v7-toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App/>);
