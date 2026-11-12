import React,{useState} from 'react';
import {ArrowRight,CheckCircle2,LockKeyhole,Mail,ShieldCheck,Eye,EyeOff} from 'lucide-react';
import {db,connected} from './lib.js';

const translateError=(message='')=>{
 if(/Invalid login credentials/i.test(message))return 'Неверная почта или пароль.';
 if(/Email not confirmed/i.test(message))return 'Проверь почту: сначала нужно подтвердить адрес.';
 if(/User already registered/i.test(message))return 'Такой адрес уже зарегистрирован. Попробуй войти.';
 if(/Password should be/i.test(message))return 'Придумай пароль посложнее (не менее 8 символов).';
 return message;
};
export function Auth({onSuccess,recovery=false}){
 const [mode,setMode]=useState(recovery?'new-password':'login');
 const [name,setName]=useState('');const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');const [show,setShow]=useState(false);
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
 async function submit(e){
  e.preventDefault();setBusy(true);setMessage('');setError('');
  try{
   if(!connected)throw new Error('Подключение к Supabase ещё не настроено.');
   if(mode==='register'){
    if(name.trim().length<2)throw new Error('Укажи имя или ФИО.');
    if(password.length<8)throw new Error('Пароль должен содержать не менее 8 символов.');
    const {data,error}=await db.auth.signUp({email:email.trim(),password,options:{data:{display_name:name.trim()},emailRedirectTo:location.origin+import.meta.env.BASE_URL}});
    if(error)throw error;
    if(data.session){onSuccess?.()}else setMessage('Заявка создана. Подтверди почту по ссылке из письма, затем войди. Доступ к курсам откроет администратор.');
   }else if(mode==='login'){
    const {error}=await db.auth.signInWithPassword({email:email.trim(),password});
    if(error)throw error;onSuccess?.();
   }else if(mode==='forgot'){
    const {error}=await db.auth.resetPasswordForEmail(email.trim(),{redirectTo:location.origin+import.meta.env.BASE_URL});
    if(error)throw error;setMessage('Если адрес существует, письмо со ссылкой для восстановления будет отправлено.');
   }else if(mode==='new-password'){
    if(password.length<8)throw new Error('Не менее 8 символов.');
    const {error}=await db.auth.updateUser({password});if(error)throw error;
    setMessage('Пароль обновлён.');setMode('login');onSuccess?.();
   }
  }catch(ex){setError(translateError(ex.message))}finally{setBusy(false)}
 }
 return <div className="auth-layout">
  <section className="auth-side">
   <div className="eyebrow"><ShieldCheck size={15}/> ЗАЩИЩЁННОЕ ПРОСТРАНСТВО</div>
   <h2>Учиться. Пробовать. <em>Работать лучше.</em></h2>
   <p>Твой маршрут обучения, практические тренажёры и рабочие инструменты в одной системе.</p>
   <div className="auth-points"><span><CheckCircle2/> Только твои курсы</span><span><CheckCircle2/> Прогресс сохраняется</span><span><CheckCircle2/> Поддержка наставников</span></div>
  </section>
  <section className="auth-panel"><div className="eyebrow"><LockKeyhole size={15}/> CSORT ID</div>
   <h1>{mode==='register'?'Создать аккаунт':mode==='forgot'?'Восстановить доступ':mode==='new-password'?'Новый пароль':'С возвращением'}</h1>
   <p>{mode==='register'?'Регистрация создаёт заявку. Подразделение и курсы назначит администратор.':mode==='forgot'?'Пришлём письмо для восстановления доступа.':mode==='new-password'?'Установи новый пароль для своей учётной записи.':'Войди с рабочей почтой и паролем.'}</p>
   <form onSubmit={submit} className="form-stack">
    {mode==='register'&&<label>Имя и фамилия<input required minLength={2} placeholder="Например, Алексей Иванов" value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label>}
    {mode!=='new-password'&&<label>Электронная почта<div className="input-icon"><Mail size={16}/><input type="email" required placeholder="name@company.ru" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></div></label>}
    {!['forgot'].includes(mode)&&<label>Пароль<div className="input-icon"><LockKeyhole size={16}/><input type={show?'text':'password'} required minLength={mode==='login'?1:8} placeholder="Не менее 8 символов" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='login'?'current-password':'new-password'}/><button className="icon-plain" type="button" aria-label="Показать пароль" onClick={()=>setShow(!show)}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>}
    {error&&<div className="error-box" role="alert">{error}</div>}
    {message&&<div className="success-box" role="status">{message}</div>}
    <button className="btn btn-primary btn-full" type="submit" disabled={busy||!connected}>{busy?'Выполняется…':mode==='register'?'Отправить заявку':mode==='forgot'?'Отправить ссылку':mode==='new-password'?'Сохранить пароль':'Войти'}<ArrowRight size={17}/></button>
   </form>
   <div className="auth-links">{mode==='login'?<><button onClick={()=>{setMode('register');setError('');setMessage('')}}>Создать аккаунт</button><button onClick={()=>{setMode('forgot');setError('');setMessage('')}}>Забыли пароль?</button></>:<button onClick={()=>{setMode('login');setError('');setMessage('')}}>← Вернуться ко входу</button>}</div>
   <small className="auth-notice">Пароли и сессии обрабатывает Supabase Auth. Уровень доступа задаёт администратор, а не пользователь.</small>
  </section>
 </div>;
}
