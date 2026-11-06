import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, KeyRound, UserRound } from 'lucide-react';
import { cloudConfigured, supabase } from './cloud.js';

export function AuthPanel({ onDone }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setMessage('');
    if (!cloudConfigured) return setMessage('Сначала подключи Supabase в настройках сайта. Инструкция есть в README.');
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onDone?.();
      } else if (mode === 'register') {
        if (password.length < 8) throw new Error('Для учётной записи нужно минимум 8 символов пароля.');
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL, data: { display_name: name.trim().slice(0,100) } }
        });
        if (error) throw error;
        if (data.session) onDone?.();
        else setMessage('Заявка на регистрацию отправлена. Проверь почту, подтверди адрес, затем войди.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + import.meta.env.BASE_URL });
        if (error) throw error;
        setMessage('Если такой адрес зарегистрирован, письмо для восстановления отправлено.');
      }
    } catch (e) { setMessage(e.message || 'Не удалось выполнить запрос. Попробуй ещё раз.'); }
    finally { setBusy(false); }
  }
  return <section className="cloud-auth"><div className="cloud-auth-intro"><span className="v7-kicker"><KeyRound size={15}/> CSORT ACADEMY / АККАУНТ</span><h1>{mode==='login'?'С возвращением.':mode==='register'?'Создай кабинет.':'Восстановление доступа.'}</h1><p>Курсы, тренажёры и достижения доступны после входа. Результаты хранятся в облаке под твоей учётной записью.</p></div>
    <form className="cloud-auth-form" onSubmit={submit}>
      {mode==='register'&&<label>Как к тебе обращаться<input autoComplete="name" maxLength={100} required value={name} onChange={e=>setName(e.target.value)} placeholder="Имя и фамилия"/></label>}
      <label>Электронная почта<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></label>
      {mode!=='reset'&&<label>Пароль<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Не менее 8 символов"/></label>}
      {message&&<div className="cloud-auth-message" role="status">{message}</div>}
      <button className="primary-btn" disabled={busy||!cloudConfigured} type="submit">{busy?'Обрабатываем…':mode==='login'?'Войти':mode==='register'?'Зарегистрироваться':'Получить письмо'} <ArrowRight size={18}/></button>
      {!cloudConfigured&&<p className="cloud-config-error">Сайт пока не подключён к базе: для запуска один раз нужны ключи проекта Supabase.</p>}
      <div className="cloud-auth-switch"><button type="button" onClick={()=>{setMode(mode==='login'?'register':'login');setMessage('')}}>{mode==='login'?'Создать аккаунт':'Уже есть аккаунт? Войти'}</button><button type="button" onClick={()=>{setMode('reset');setMessage('')}}>Забыли пароль?</button></div>
      <small><CheckCircle2 size={14}/> Пароли не хранятся в коде сайта. Доступ и сессии обслуживает Supabase Auth.</small>
    </form>
  </section>;
}

export function ResetPasswordPanel({onDone}) {
  const [password,setPassword]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  const submit=async e=>{e.preventDefault();setBusy(true);const {error}=await supabase.auth.updateUser({password});setBusy(false);if(error)setMessage(error.message);else onDone?.()};
  return <section className="cloud-auth"><div className="cloud-auth-intro"><h1>Новый пароль.</h1><p>Ты перешёл по ссылке восстановления. Задай новый пароль для своего аккаунта.</p></div><form className="cloud-auth-form" onSubmit={submit}><label>Новый пароль<input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/></label>{message&&<p role="alert" className="cloud-auth-message">{message}</p>}<button className="primary-btn" disabled={busy||password.length<8} type="submit">Сохранить пароль <ArrowRight size={17}/></button></form></section>;
}
