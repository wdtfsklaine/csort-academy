import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowRight,BookOpen,BrainCircuit,CalendarDays,CheckCircle2,ChevronLeft,ChevronRight,Compass,Download,ExternalLink,FileCheck2,GraduationCap,Home,LayoutDashboard,Library,LockKeyhole,LogIn,LogOut,Menu,MessageCircle,PlayCircle,Radio,ShieldCheck,Sparkles,Target,Users,UserRound,Video,Wrench,X} from 'lucide-react';
import logo from './csort-mark.svg';
import {db,connected,check,loadPortal,isReady,isAdmin,canManage,isManager,LABS,ACCESS_ROLES,userLabel} from './lib.js';
import {Auth} from './Auth.jsx';
import {Dashboard,MyCourses,PracticeCatalog,EventsPage,FeedbackPage,ResourcesPage,ProfilePage} from './Student.jsx';
import {CourseView} from './Learn.jsx';
import {ToolsPage} from './Tools.jsx';
import {AdminPage} from './Admin.jsx';
import {PracticeLab} from './PracticeLab.jsx';
import './styles.css';
import './PracticeLab.css';

const NAV=[['dashboard','Обзор',LayoutDashboard],['courses','Обучение',GraduationCap],['practice','Тренажёры',Target],['events','Эфиры',Radio],['resources','База знаний',Library],['tools','Инструменты',Wrench],['feedback','Обратная связь',MessageCircle]];
const MENU_LABELS={dashboard:'Обзор',courses:'Обучение',practice:'Тренажёры',events:'Эфиры',resources:'База знаний',tools:'Инструменты',feedback:'Обратная связь',profile:'Личный кабинет',admin:'Управление'};
function Landing({onLogin}){return <div className="landing">
 <header className="landing-header"><div className="landing-brand"><img src={logo} alt="СиСорт"/><span>CSORT <b>ACADEMY</b></span></div><nav><a href="#how">Возможности</a><a href="#tracks">Направления</a><a href="#practice">Практика</a></nav><button className="btn btn-primary" onClick={onLogin}>Войти в Академию <ArrowRight size={17}/></button></header>
 <main><section className="landing-hero"><div className="landing-hero-text"><span className="eyebrow"><span className="live-dot"/> ОБУЧЕНИЕ, КОТОРОЕ ПОЛЕЗНО В РАБОТЕ</span><h1>Не просто курсы.<br/><em>Твоя следующая<br/>точка роста.</em></h1><p>Единое пространство развития сотрудников СиСорт: персональные программы, практические задачи, эфиры, знания и рабочие инструменты.</p><div className="landing-cta"><button className="btn btn-primary btn-xl" onClick={onLogin}>Начать обучение <ArrowRight size={18}/></button><span><ShieldCheck size={17}/> Доступ по рабочему аккаунту</span></div></div><div className="landing-art"><div className="landing-art-glow"/><div className="landing-stack stack-back"><span>НАПРАВЛЕНИЕ</span><b>Твоя роль.</b><small>Твои задачи.</small></div><div className="landing-stack stack-mid"><span>ПРАКТИКА</span><b>Реальные кейсы</b><small>01 / 07 — Тренажёры</small></div><div className="landing-stack stack-front"><div><span className="tiny-mark">✳</span><span>ЛИЧНЫЙ КАБИНЕТ</span></div><b>Учись с результатом</b><small>Прогресс · Навыки · Обратная связь</small><div className="landing-art-progress"><i/></div></div></div></section>
 <section className="landing-section" id="how"><div className="section-head"><div><span className="eyebrow">ВНУТРИ АКАДЕМИИ</span><h2>Всё на своих местах.</h2></div></div><div className="landing-features"><div><span><GraduationCap size={25}/></span><h3>Персональный маршрут</h3><p>Программы и задания соответствуют должности, а не открываются всем подряд.</p></div><div><span><Target size={25}/></span><h3>Задачи, а не абстракции</h3><p>Табели, подотчёты, заявки и реальные рабочие сценарии в тренажёрах.</p></div><div><span><Radio size={25}/></span><h3>Люди и знания</h3><p>Расписание эфиров, материалы, вопросы наставникам и история прогресса.</p></div></div></section>
 <section className="landing-section" id="tracks"><div className="section-head"><div><span className="eyebrow">ДЛЯ КАЖДОЙ КОМАНДЫ</span><h2>Один портал. Разные маршруты.</h2></div></div><div className="track-pills">{['Бухгалтерия и финансы','Продажи','Производство','Снабжение','ВЭД','Сервис','Руководители','Кадры','Администрация'].map(t=><span key={t}>{t} <ChevronRight size={14}/></span>)}</div></section>
 <section className="landing-section practice-promo" id="practice"><span className="eyebrow">ПОПРОБУЙ НА ПРАКТИКЕ</span><h2>Ошибаться можно здесь.<br/>Не в рабочих документах.</h2><p>Обучение с проверкой ответов и разбором ошибок, а не формальное «посмотрел видео — молодец».</p><button className="btn btn-outline" onClick={onLogin}>Войти и попробовать <ArrowRight size={17}/></button></section></main><footer className="landing-footer"><span>© CSORT ACADEMY · Корпоративное обучение</span><span>Создано для команды СиСорт</span></footer></div>}
function SideNav({page,go,profile,signOut,mobile,setMobile}){const control=isAdmin(profile)||canManage(profile)||isManager(profile);
 return <aside className={'side '+(mobile?'side-mobile-open':'')}><div className="side-top"><button className="side-brand" onClick={()=>go('dashboard')}><span className="logo-holder"><img src={logo} alt="СиСорт"/></span><span><strong>CSORT</strong><small>ACADEMY</small></span></button><button className="mobile-close icon-plain" onClick={()=>setMobile(false)}><X size={22}/></button></div>
 <div className="side-label">РАБОЧЕЕ ПРОСТРАНСТВО</div><nav className="side-menu">{NAV.map(([id,label,Icon])=><button key={id} className={page===id?'active':''} onClick={()=>go(id)}><Icon size={19}/><span>{label}</span>{page===id&&<span className="side-active-dot"/>}</button>)}</nav>
 {control&&<><div className="side-label side-label-later">УПРАВЛЕНИЕ</div><nav className="side-menu"><button className={page==='admin'?'active':''} onClick={()=>go('admin')}><Users size={19}/><span>{isAdmin(profile)?'Администрирование':isManager(profile)?'Моя команда':'Студия курсов'}</span></button></nav></>}
 <div className="side-spacer"/><div className="side-bottom"><div className="side-help"><span>✳ НАШИ ПОДСКАЗКИ</span><p>Сложно? В учебных материалах есть кнопка «Ай, давай проще».</p></div><button className="side-signout" onClick={signOut}><LogOut size={17}/> Выйти</button></div></aside>
}
function App(){const [sessionUser,setSessionUser]=useState(null),[readyAuth,setReadyAuth]=useState(!connected);
 const [data,setData]=useState(null),[loading,setLoading]=useState(false),[loadError,setLoadError]=useState('');
 const [page,setPage]=useState('dashboard'),[courseId,setCourseId]=useState(null),[labId,setLabId]=useState('timesheet');
 const [toast,setToast]=useState(''),[mobile,setMobile]=useState(false),[recovery,setRecovery]=useState(false);
 function notify(msg){setToast(String(msg));window.clearTimeout(window.__toastTimer);window.__toastTimer=window.setTimeout(()=>setToast(''),4400)}
 useEffect(()=>{if(!db)return;let alive=true;
  db.auth.getSession().then(({data:d,error})=>{if(alive){if(error)setLoadError(error.message);setSessionUser(d?.session?.user||null);setReadyAuth(true)}}).catch(e=>{setLoadError(e.message);setReadyAuth(true)});
  const {data:{subscription}}=db.auth.onAuthStateChange((event,session)=>{if(!alive)return;
   if(event==='PASSWORD_RECOVERY'){setRecovery(true);setPage('auth');}
   const user=session?.user||null;setSessionUser(x=>x?.id===user?.id?x:user);
   setReadyAuth(true);
  });return()=>{alive=false;subscription.unsubscribe()};},[]);
 async function reload(){if(!sessionUser?.id||!db)return;setLoading(true);try{const out=await loadPortal(sessionUser.id);setData(out);setLoadError('');}catch(e){setLoadError(e.message)}finally{setLoading(false)}}
 useEffect(()=>{if(!sessionUser){setData(null);setPage('dashboard');return;}let alive=true;setLoading(true);loadPortal(sessionUser.id).then(out=>{if(alive){setData(out);setLoadError('')}}).catch(e=>{if(alive)setLoadError(e.message)}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[sessionUser?.id]);
 function go(next){setPage(next);setMobile(false);window.scrollTo({top:0,behavior:'smooth'})}
 function openCourse(id){if(!isReady(data?.profile))return notify('Профиль ещё не настроен администратором.');if(!data?.assignments.some(a=>a.course_id===id))return notify('Курс не назначен твоему профилю.');setCourseId(id);go('course')}
 function openLab(id){if(!isReady(data?.profile))return notify('Профиль ещё не настроен администратором.');if(!data?.labAssign.some(a=>a.lab_id===id))return notify('Этот тренажёр пока не назначен.');setLabId(id);go('lab')}
 async function logout(){try{await db.auth.signOut()}catch(e){notify(e.message)}setSessionUser(null);setData(null);go('dashboard')}
 if(!readyAuth)return <div className="boot-screen"><div className="boot-logo">✳</div><h2>CSORT ACADEMY</h2><p>Открываем твоё пространство…</p></div>;
 if(!connected)return <div className="config-screen"><img src={logo} width="56"/><h1>CSORT ACADEMY</h1><p>Не переданы настройки Supabase. Проверь GitHub Actions → Variables: <code>SUPABASE_URL</code> и <code>SUPABASE_PUBLISHABLE_KEY</code>, а также переменные <code>VITE_*</code> в сборке.</p></div>;
 if(recovery)return <Auth recovery onSuccess={()=>{setRecovery(false);go('dashboard')}}/>;
 if(!sessionUser)return page==='auth'?<Auth onSuccess={()=>go('dashboard')}/>:<Landing onLogin={()=>go('auth')}/>;
 const p=data?.profile;
 if(loading&&!data)return <div className="boot-screen"><div className="boot-logo">✳</div><h2>CSORT ACADEMY</h2><p>Загружаем личный кабинет…</p></div>;
 if(loadError&&!data)return <div className="config-screen"><h2>Не удалось открыть профиль</h2><p>{loadError}</p><div className="inline-actions"><button className="btn btn-primary" onClick={reload}>Повторить</button><button className="btn btn-soft" onClick={logout}>Выйти</button></div></div>;
 if(!data)return null;
 const currentCourse=data.courses.find(x=>x.id===courseId);
 const active=isReady(p),privileged=isAdmin(p)||canManage(p)||isManager(p);
 function render(){if(!active&&['course','lab','courses','practice'].includes(page))return <div className="page-in"><div className="pending-hero"><h1>Программа ещё не открыта</h1><p>Администратор должен активировать профиль и назначить обучение.</p><button className="btn btn-primary" onClick={()=>go('profile')}>Личный кабинет</button></div></div>;if(page==='course'&&currentCourse)return <CourseView key={courseId} course={currentCourse} lessons={data.lessons} progress={data.progress} onBack={()=>go('courses')} onSaved={reload} toast={notify}/>;
  if(page==='lab')return <div className="page-in"><PracticeLab onBack={()=>go('practice')} initialActive={labId} allowedIds={data.labAssign.map(a=>a.lab_id)} completed={data.labProgress.map(p=>p.lab_id)} onComplete={async (id,response)=>{try{await check(db.rpc('academy_finish_lab',{p_lab_id:id,p_response:response}));await reload();notify('Тренажёр пройден — результат сохранён')}catch(e){notify(e.message);throw e}}}/></div>;
  if(page==='admin'&&privileged)return <AdminPage portal={data} me={p.id} toast={notify} onSaved={reload}/>;
  if(page==='profile')return <ProfilePage data={data} toast={notify} onSaved={reload} onRoute={go}/>;
  if(page==='feedback')return <FeedbackPage data={data} toast={notify} onSaved={reload}/>;
  if(page==='tools')return <ToolsPage toast={notify}/>;
  if(page==='events')return <EventsPage data={data} onSaved={reload} toast={notify}/>;
  if(page==='resources')return <ResourcesPage data={data} toast={notify}/>;
  if(!active){return <div className="page-in"><div className="pending-hero"><span className="eyebrow"><LockKeyhole size={15}/> НАСТРОЙКА АККАУНТА</span><h1>{p.status==='suspended'?'Доступ приостановлен':'Добро пожаловать в Академию!'}</h1><p>{p.status==='suspended'?'Свяжись с администратором для восстановления доступа.':'Твоя учётная запись создана. Чтобы открыть профессиональные программы, администратор укажет подразделение, должность и направление обучения.'}</p><div className="pending-actions"><button className="btn btn-primary" onClick={()=>go('profile')}>Открыть личный кабинет <ArrowRight size={16}/></button>{privileged&&<button className="btn btn-outline" onClick={()=>go('admin')}>Панель администратора</button>}<button className="btn btn-outline" onClick={()=>go('feedback')}>Написать администратору</button></div></div></div>}
  if(page==='courses')return <MyCourses data={data} onCourse={openCourse}/>;
  if(page==='practice')return <PracticeCatalog data={data} onLab={openLab}/>;
  return <Dashboard data={data} onRoute={go} onCourse={openCourse} onLab={openLab}/>;
 }
 return <div className="app-layout"><SideNav page={page} go={go} profile={p} signOut={logout} mobile={mobile} setMobile={setMobile}/>{mobile&&<button className="mobile-overlay" aria-label="Закрыть меню" onClick={()=>setMobile(false)}/>}
 <div className="main-wrap"><header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-plain" onClick={()=>setMobile(true)}><Menu size={23}/></button><span>CSORT ACADEMY</span><ChevronRight size={16}/><strong>{page==='course'?currentCourse?.title:page==='lab'?'Тренажёр':MENU_LABELS[page]||'Обзор'}</strong></div><div className="topbar-right"><span className="online-indicator"><i/> Облако подключено</span><button className="top-profile" onClick={()=>go('profile')}><span className={'tiny-avatar avatar-'+(data.prefs?.avatar_color||'coral')}>{p.display_name?.[0]||'C'}</span><span><b>{userLabel(p).split(' ')[0]}</b><small>{ACCESS_ROLES[p.role]}</small></span><ChevronRight size={14}/></button></div></header>
 <main className="main-content">{loadError&&<div className="error-box top-error">Ошибка обновления данных: {loadError}<button onClick={reload}>Повторить</button></div>}{render()}</main><footer className="app-footer"><span>CSORT ACADEMY · Рабочая версия 2.0</span><span>Учебные примеры не заменяют действующие регламенты СиСорт</span></footer></div>
 {toast&&<div className="toast" role="status"><CheckCircle2 size={17}/>{toast}<button onClick={()=>setToast('')} aria-label="Закрыть"><X size={14}/></button></div>}</div>;
}

createRoot(document.getElementById('root')).render(<App/>);
