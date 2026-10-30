import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowRight,ArrowUpRight,BookOpen,BrainCircuit,CalendarDays,Check,CheckCircle2,ChevronRight,ClipboardCheck,Copy,Download,FileCheck2,FileSpreadsheet,GraduationCap,Grid2X2,Layers3,Menu,MousePointer2,MoveUpRight,Play,RotateCcw,ShieldCheck,Sparkles,Target,Timer,Trophy,WandSparkles,Wrench,X,Zap,LogIn,LogOut,UserRound,LockKeyhole,Eye,EyeOff,LayoutDashboard} from 'lucide-react';
import csortLogo from './assets/csort-mark.svg';
import {OfficeCourse} from './OfficeCourse.jsx';
import {demoCredentialsMatch,requiresDemoLogin} from './demoAuth.js';
import {PracticeLab} from './PracticeLab.jsx';
import './style.css';
import './polish.css';
import './v08.css';

const navItems=[['Главная','home'],['Обучение','courses'],['Тренажёры','practice'],['Инструменты','tools'],['Личный кабинет','cabinet']];
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
  const [tab,setTab]=useState(()=>{try{return sessionStorage.getItem('csort-academy-demo-auth-v08')==='yes'?'cabinet':'home'}catch{return 'home'}});
  const [auth,setAuth]=useState(()=>{try{return sessionStorage.getItem('csort-academy-demo-auth-v08')==='yes'}catch{return false}});
  const [loginName,setLoginName]=useState('');
  const [loginPassword,setLoginPassword]=useState('');
  const [loginError,setLoginError]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [redirectAfterLogin,setRedirectAfterLogin]=useState('cabinet');
  const [simplifyPublic,setSimplifyPublic]=useState(false);
  const [activeLab,setActiveLab]=useState('timesheet');
  const [progress,setProgress]=useState(readProgress);
  const [menu,setMenu]=useState(false);
  const [introAnswer,setIntroAnswer]=useState(null);
  const [from,setFrom]=useState('2026-11-06'),[to,setTo]=useState('2026-11-09'),[dateChecked,setDateChecked]=useState(false);
  const [fileType,setFileType]=useState('Табель'),[fileDept,setFileDept]=useState('ОП Самара'),[filePeriod,setFilePeriod]=useState('01-15.11.2026');
  const [toast,setToast]=useState('');
  const completed=progress.lessons.length+progress.labs.length+Number(progress.ai);
  const weekendResult=useMemo(()=>dateChecked?getWeekendDates(from,to):null,[from,to,dateChecked]);
  useEffect(()=>{try{localStorage.setItem('csort-demo-v07',JSON.stringify(progress))}catch{}},[progress]);
  const showToast=(message)=>{setToast(message);window.setTimeout(()=>setToast(''),3400)};
  const go=(next)=>{
    const isProtected=requiresDemoLogin(next);
    if(isProtected&&!auth){setRedirectAfterLogin(next);setLoginError('');setTab('login')}
    else setTab(next);
    setMenu(false);
    window.scrollTo({top:0,behavior:'smooth'});
  };
  const signIn=(e)=>{
    e.preventDefault();
    if(demoCredentialsMatch(loginName,loginPassword)){
      setAuth(true);
      try{sessionStorage.setItem('csort-academy-demo-auth-v08','yes')}catch{}
      setLoginPassword('');setLoginError('');setTab(redirectAfterLogin);
      window.scrollTo({top:0,behavior:'smooth'});
    }else setLoginError('Не совпали данные. Для демоверсии: админ / админ');
  };
  const signOut=()=>{
    setAuth(false);try{sessionStorage.removeItem('csort-academy-demo-auth-v08')}catch{}
    setLoginPassword('');setLoginName('');setLoginError('');setRedirectAfterLogin('cabinet');setTab('home');setMenu(false);
    window.scrollTo({top:0,behavior:'smooth'});
  };
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
  return <div className="app-shell v7-app v08-app"><div className="ambient" aria-hidden="true"/><div className="grain" aria-hidden="true"/>
    <header className="container header v7-header v08-header">
      <button className="brand v7-brand v08-brand" onClick={()=>go('home')} aria-label="На главную CSORT ACADEMY">
        <span className="v08-logo-mark"><img src={csortLogo} alt="Логотип СиСорт"/></span>
        <span className="v08-logo-label"><b>CSORT</b><small>Color Sorting</small></span>
        <span className="v7-brand-word">ACADEMY</span><span className="v7-beta">DEMO</span>
      </button>
      <nav className={menu?'nav nav-open':'nav'} aria-label="Навигация">{navItems.map(([label,id])=><button key={id} className={tab===id?'nav-current':''} onClick={()=>go(id)}>{label}{!auth&&id!=='home'&&<LockKeyhole size={11} className="v08-nav-lock"/>}</button>)}</nav>
      <div className="v7-header-right">
        {auth?<><span className="v08-status"><span className="v08-status-dot"/> Демо-участник</span><button className="v08-account-btn" onClick={()=>go('cabinet')} title="Личный кабинет"><UserRound size={17}/> Кабинет</button><button className="v08-logout-btn" title="Выйти" onClick={signOut}><LogOut size={17}/></button></>:<><span className="v08-status"><span className="v08-status-dot"/> Не выполнен вход</span><button className="v08-account-btn" onClick={()=>go('login')} title="Войти в Академию"><LogIn size={18}/> Войти</button></>}
        <button className="v7-icon-button v7-mobile-menu" onClick={()=>setMenu(!menu)} aria-label="Меню">{menu?<X size={20}/>:<Menu size={20}/>}</button>
      </div>
    </header>
    <main className="container v7-main">
    {tab==='home'&&<>
      <section className="v08-hero">
        <div className="v08-hero-copy">
          <div className="v08-eyebrow"><Sparkles size={15}/> КОРПОРАТИВНОЕ ОБУЧЕНИЕ · СИСОРТ</div>
          <h1>Работай <em>умнее.</em><br/>Не сложнее<span>.</span></h1>
          <p>Добро пожаловать в CSORT ACADEMY — пространство, где рабочие задачи становятся понятнее. Здесь не зубрят инструкции, а учатся применять их на практике.</p>
          <div className="v7-hero-buttons"><button className="primary-btn" onClick={()=>go(auth?'cabinet':'login')}>{auth?'Открыть личный кабинет':'Войти в Академию'} <LogIn size={18}/></button><button className="ghost-btn" onClick={()=>document.getElementById('about-academy')?.scrollIntoView({behavior:'smooth'})}>Как это устроено <ArrowRight size={17}/></button></div>
          <div className="v7-hero-facts"><span><Check size={15}/> В своём темпе</span><span><Zap size={15}/> Практика за минуты</span><span><ShieldCheck size={15}/> Без встроенного ИИ</span></div>
        </div>
        <div className="v08-hero-scene" aria-label="Пример учебного интерфейса">
          <div className="v08-preview-window">
            <div className="v08-preview-head"><span className="v08-preview-controls"><i/><i/><i/></span><span>CSORT ACADEMY / ПРОСТО О СЛОЖНОМ</span><CheckCircle2 size={15}/></div>
            <div className="v08-preview-inside"><span className="v7-kicker">УЧИСЬ В ДЕЙСТВИИ</span><h3>Понял.<br/><em>Применил.</em></h3><div className="v08-preview-task"><span><FileSpreadsheet size={18}/> Рабочая ситуация</span><strong>Найди ошибку в документе</strong><small>Не угадывай ответ — разбирайся на примере.</small></div><div className="v08-preview-bar"><span/></div><div className="v08-preview-finish"><CheckCircle2 size={16}/> Шаг за шагом — к результату</div></div>
          </div>
          <div className="v08-float-tag v08-float-one"><Sparkles size={15}/> Новые навыки</div>
          <div className="v08-float-tag v08-float-two"><Wrench size={15}/> Полезные инструменты</div>
        </div>
      </section>
      <section id="about-academy" className="v08-public-section">
        <div className="v08-section-heading"><span className="v7-kicker">ЗАЧЕМ НУЖНА АКАДЕМИЯ</span><h2>Меньше вопросов.<br/>Больше уверенности.</h2><p>У каждого сотрудника будет собственная траектория обучения под его рабочие задачи. Никаких одинаковых курсов для всех подряд.</p></div>
        <div className="v08-public-cards">
          <article><div className="v08-benefit-icon"><BookOpen size={23}/></div><span>01 / ИЗУЧАЙ</span><h3>Объяснения на человеческом языке</h3><p>Короткие уроки, пошаговые инструкции и реальные рабочие примеры, без бесконечных лекций.</p></article>
          <article><div className="v08-benefit-icon"><MousePointer2 size={23}/></div><span>02 / ПРАКТИКУЙ</span><h3>Не только выбирай ответы</h3><p>Заполняй учебные формы, находи ошибки, перетаскивай элементы и сразу понимай результат.</p></article>
          <article><div className="v08-benefit-icon"><Wrench size={23}/></div><span>03 / ПОЛЬЗУЙСЯ</span><h3>Помощники на каждый день</h3><p>Небольшие инструменты, к которым можно вернуться даже после завершения обучения.</p></article>
        </div>
      </section>
      <section className="v08-simple-demo" aria-label="Пример кнопки Ай давай проще">
        <div className="v08-simple-copy"><span className="v7-kicker">У НАС МОЖНО СПРОСИТЬ ПО-ПРОСТОМУ</span><h2>«Ай, давай проще!»</h2><p>Сложное объяснение можно заменить понятным одним нажатием. Попробуй прямо сейчас — это пример, вход не нужен.</p><button className="v08-simplify-button" onClick={()=>setSimplifyPublic(s=>!s)}><WandSparkles size={19}/>{simplifyPublic?'Вернуть подробное объяснение':'Ай, давай проще!'}</button></div>
        <div className="v08-simple-sample"><div className="v08-simple-sample-title"><BrainCircuit size={20}/> Пример объяснения <span>{simplifyPublic?'ПРОСТО':'ПОДРОБНО'}</span></div><p key={String(simplifyPublic)} className="v08-sample-answer">{simplifyPublic?'Сначала проверь, кто выпустил документ, для какого оборудования он написан и есть ли ссылка на оригинал. ИИ может ошибаться — сверяй с источником.':'При работе с генеративными моделями необходимо верифицировать происхождение технической документации, релевантность модели оборудования и достоверность первоисточника.'}</p><small><CheckCircle2 size={15}/> Смысл сохраняется, язык становится понятнее.</small></div>
      </section>
      <section className="v08-public-bottom"><span className="v7-kicker">ТВОЯ ТРАЕКТОРИЯ НАЧИНАЕТСЯ ЗДЕСЬ</span><h2>У каждого — свои задачи.<br/><em>У каждого — свой путь.</em></h2><p>В личном кабинете открываются обучение, тренажёры, инструменты и твой прогресс.</p><button className="primary-btn" onClick={()=>go(auth?'cabinet':'login')}>{auth?'Перейти в личный кабинет':'Войти и посмотреть возможности'} <ArrowRight size={17}/></button></section>
    </>}
    {tab==='login'&&<section className="v08-auth">
      <div className="v08-auth-intro"><div className="v08-auth-emblem"><img src={csortLogo} alt=""/></div><span className="v7-kicker">CSORT ACADEMY · ДЕМОНСТРАЦИЯ</span><h1>Добро пожаловать.</h1><p>Войди в учебный личный кабинет, чтобы открыть уроки, практические тренажёры, инструменты и прогресс.</p></div>
      <form className="v08-login-card" onSubmit={signIn}>
        <div className="v08-login-card-head"><UserRound size={22}/><div><strong>Вход в Академию</strong><span>Демонстрационный участник</span></div></div>
        <label>Логин<input autoComplete="username" value={loginName} onChange={e=>setLoginName(e.target.value)} placeholder="Введите логин" required/></label>
        <label>Пароль<div className="v08-password-input"><input autoComplete="current-password" type={showPassword?'text':'password'} value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder="Введите пароль" required/><button type="button" onClick={()=>setShowPassword(s=>!s)} aria-label={showPassword?'Скрыть пароль':'Показать пароль'}>{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label>
        {loginError&&<p className="v08-login-error" role="alert">{loginError}</p>}
        <button className="primary-btn v08-login-submit" type="submit">Войти в кабинет <ArrowRight size={17}/></button>
        <div className="v08-login-hint"><span>Демо-доступ для презентации</span><p>Логин: <b>админ</b> · Пароль: <b>админ</b> <small>(работает и admin / admin)</small></p><small>Это учебный вход без прав администратора и без серверной защиты. Не используйте реальные данные сотрудников.</small></div>
      </form>
    </section>}
    {tab==='cabinet'&&<section className="v08-cabinet">
      <div className="v08-cabinet-hello"><div><span className="v7-kicker"><UserRound size={15}/> ЛИЧНЫЙ КАБИНЕТ · УЧЕБНЫЙ ПРОФИЛЬ</span><h1>Привет, участник! <span>👋</span></h1><p>Всё для обучения и работы — в одном месте. Выбирай, с чего начать.</p></div><div className="v08-hello-badge"><ShieldCheck size={21}/><div><strong>Демо-участник</strong><span>Без административных прав</span></div></div></div>
      <div className="v08-cabinet-grid">
        <button onClick={()=>go('courses')}><div className="v08-cabinet-ico"><GraduationCap size={28}/></div><span>01 / ОБУЧЕНИЕ</span><strong>Мои курсы</strong><p>Пять уроков и разборы реальных рабочих ситуаций.</p><small>{progress.lessons.length} / 5 уроков <ArrowUpRight size={18}/></small></button>
        <button onClick={()=>go('practice')}><div className="v08-cabinet-ico"><MousePointer2 size={28}/></div><span>02 / ПРАКТИКА</span><strong>Тренажёры</strong><p>Табели, подотчёты, командировки, премии и поиск ошибок.</p><small>{progress.labs.length} / 6 пройдено <ArrowUpRight size={18}/></small></button>
        <button onClick={()=>go('tools')}><div className="v08-cabinet-ico"><Wrench size={28}/></div><span>03 / ПОМОЩНИКИ</span><strong>Инструменты</strong><p>Проверка дат поездки и помощник с именами документов.</p><small>Открыть инструменты <ArrowUpRight size={18}/></small></button>
        <button onClick={()=>go('progress')}><div className="v08-cabinet-ico"><Trophy size={28}/></div><span>04 / РЕЗУЛЬТАТЫ</span><strong>Мой прогресс</strong><p>Посмотри, что уже освоено, и выгрузи результаты.</p><small>{completed} / 12 выполнено <ArrowUpRight size={18}/></small></button>
      </div><div className="v08-cabinet-next"><div><span className="v7-kicker">НАЧНИ ПРЯМО СЕЙЧАС</span><h2>Документы без переделок</h2><p>Короткий практический курс по рабочим ситуациям. Никакой лишней теории.</p></div><button className="primary-btn" onClick={()=>go('office')}>Открыть курс <ArrowRight size={18}/></button></div>
      <p className="v08-cabinet-note"><LockKeyhole size={14}/> Это презентационный кабинет: единый демо-вход, прогресс хранится только в этом браузере. Реальных учётных записей сотрудников пока нет.</p>
    </section>}
    {tab==='courses'&&<section className="v7-page"><BlockTitle kicker="ОБУЧЕНИЕ · 5 УРОКОВ" title="Не лекция. Навык." description="Короткий рабочий курс по внутренним правилам. Все варианты ответов объясняются отдельно."/><button className="v7-course-banner" onClick={()=>go('office')}><div className="v7-course-icon"><BookOpen size={31}/></div><div><span className="v7-kicker">ОТКРЫТЫЙ КУРС</span><h3>Документы без переделок</h3><p>Командировки, авансовые отчёты, табели, премии и названия файлов.</p><div className="v7-course-progress"><span style={{width:`${progress.lessons.length/5*100}%`}}/></div><small>{progress.lessons.length} из 5 уроков · можно продолжить позже</small></div><ArrowUpRight className="v7-course-arrow" size={24}/></button><div className="v7-coming-layout"><div className="v7-coming"><BrainCircuit size={22}/><h3>ИИ без лишней магии</h3><p>Базовый курс в подготовке. Сейчас доступна интерактивная практика по проверке источников.</p><button onClick={()=>go('practice')}>Открыть практику <ArrowRight size={16}/></button></div><div className="v7-coming"><ShieldCheck size={22}/><h3>Не верь роботу на слово</h3><p>Полный курс появится позже. Первое упражнение уже работает.</p><button onClick={()=>go('practice')}>Проверить источники <ArrowRight size={16}/></button></div></div></section>}
    {tab==='office'&&<OfficeCourse completed={progress.lessons} onComplete={finishLesson} onBack={()=>go('courses')}/>}
    {tab==='practice'&&<section className="v7-page"><BlockTitle kicker="ИНТЕРАКТИВНАЯ ЛАБОРАТОРИЯ" title="Не тесты. Почти работа." description="Заполняй реальные по структуре формы, находи ошибки и сразу узнавай, что исправить. Все данные вымышленные."/><div className="v7-labs">{labs.map(x=>{let Icon=x.icon;return <button className="v7-lab-card" key={x.id} onClick={()=>openLab(x.id)}><span className="v7-lab-card-head"><span className="v7-lab-number">{x.number}</span>{progress.labs.includes(x.id)?<span className="v7-completed"><CheckCircle2 size={14}/> Пройден</span>:<ArrowUpRight size={19}/>}</span><span className="v7-lab-icon"><Icon size={26}/></span><strong>{x.name}</strong><span>{x.detail}</span><small>{x.tag}</small></button>})}</div><div className="v7-ai-exercise"><div><span className="v7-kicker">МИКРОТРЕНАЖЁР · ИИ</span><h3>Не верь роботу на слово.</h3><p>Нужно найти инструкцию к конкретной модели оборудования. Какой первый шаг надёжнее?</p></div><div className="v7-ai-options">{introChoices.map((x,i)=><button key={i} className={introAnswer===i?(x.correct?'v7-answer-ok':'v7-answer-bad'):''} onClick={()=>chooseIntro(i)}><span>{String.fromCharCode(65+i)}</span><div>{x.text}{introAnswer===i&&<small>{x.description}</small>}</div></button>)}</div>{progress.ai&&<span className="v7-ai-done"><CheckCircle2 size={17}/> Практика засчитана</span>}</div></section>}
    {tab==='lab'&&<PracticeLab key={activeLab} initialActive={activeLab} onComplete={finishLab} completed={progress.labs} onBack={()=>go('practice')}/>}
    {tab==='tools'&&<section className="v7-page"><BlockTitle kicker="ИНСТРУМЕНТЫ" title="Меньше рутины. Больше дела." description="Два небольших помощника, которые можно использовать прямо сейчас. Данные никуда не отправляются."/><div className="v7-tools-grid"><article className="v7-tool-card"><span className="v7-tool-head"><CalendarDays size={22}/> Даты командировки <span className="v7-active-tag">РАБОТАЕТ</span></span><p>Показывает календарные субботы и воскресенья в выбранном периоде. Не заменяет проверку фактической работы и графика.</p><div className="v7-tool-inputs"><label>Начало поездки<input type="date" value={from} onChange={e=>{setFrom(e.target.value);setDateChecked(false)}}/></label><label>Конец поездки<input type="date" value={to} onChange={e=>{setTo(e.target.value);setDateChecked(false)}}/></label></div><button className="primary-btn" onClick={()=>setDateChecked(true)}>Проверить даты <ArrowRight size={16}/></button>{dateChecked&&<div className="v7-tool-result">{weekendResult?<><strong>{weekendResult.dates.length?'Есть выходные по пятидневке':'Суббот и воскресений нет'}</strong><p>Всего дней: {weekendResult.count}. {weekendResult.dates.length?'Выходные: '+weekendResult.dates.join(', ')+'.':'Проверь праздничные дни и индивидуальный график отдельно.'}</p></>:<p>Проверь даты: окончание не раньше начала, диапазон до 366 дней.</p>}</div>}</article><article className="v7-tool-card"><span className="v7-tool-head"><FileCheck2 size={22}/> Название документа <span className="v7-active-tag">РАБОТАЕТ</span></span><p>Помогает собрать имя файла по памятке. Обязательно проверь поля перед использованием в работе.</p><div className="v7-tool-inputs"><label>Тип документа<select value={fileType} onChange={e=>setFileType(e.target.value)}>{Object.keys(fileParts).map(x=><option key={x}>{x}</option>)}</select></label><label>Подразделение<input value={fileDept} onChange={e=>setFileDept(e.target.value)}/></label><label className="v7-tool-wide">Период<input value={filePeriod} onChange={e=>setFilePeriod(e.target.value)}/></label></div><div className="v7-filename" title={filename}>{filename}</div><button className="ghost-btn" onClick={async()=>{try{await navigator.clipboard.writeText(filename);showToast('Имя файла скопировано')}catch{showToast('Скопируй имя вручную из поля выше')}}}><Copy size={16}/> Скопировать имя</button></article></div></section>}
    {tab==='progress'&&<section className="v7-page"><BlockTitle kicker="МОЙ ПРОГРЕСС · ЛОКАЛЬНО" title="Твои маленькие победы." description="Это демоверсия: результаты сохраняются в браузере, не связаны с учётными записями сотрудников."/><div className="v7-progress-grid"><div><GraduationCap size={24}/><strong>{progress.lessons.length}<small> / 5</small></strong><span>Пройдено уроков</span></div><div><Target size={24}/><strong>{progress.labs.length}<small> / 6</small></strong><span>Пройдено тренажёров</span></div><div><Trophy size={24}/><strong>{completed}<small> / 12</small></strong><span>Всего завершено</span></div></div><div className="v7-progress-panel"><div><h3>Продолжить обучение</h3><p>Уроки засчитываются за правильное решение, тренажёры — после полной проверки.</p><div className="v7-overall-progress"><span style={{width:`${(completed/12)*100}%`}}/></div></div><button className="primary-btn" onClick={()=>go('courses')}>К урокам <ArrowRight size={16}/></button></div><div className="v7-export-panel"><div><h3>Экспорт результатов</h3><p>Скачать CSV с учебными результатами этого браузера. Для общего отчёта по сотрудникам нужен сервер и авторизация.</p></div><div className="v7-export-actions"><button className="ghost-btn" onClick={exportProgress}><Download size={16}/> Скачать CSV</button><button className="v7-reset" onClick={()=>{if(window.confirm('Очистить результаты демоверсии в этом браузере?'))setProgress({...blankProgress,lessons:[],labs:[]})}}><RotateCcw size={15}/> Сбросить</button></div></div></section>}
    </main>
    <footer className="container v7-footer"><div className="v7-footer-logo"><span className="v08-footer-logo"><img src={csortLogo} alt="CSORT"/></span><span>CSORT ACADEMY</span></div><span>DEMO 0.8 · 2026 · учебные данные</span><span>Сделано, чтобы работать умнее <Zap size={13}/></span></footer>
    {toast&&<div role="status" className="v7-toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App/>);
