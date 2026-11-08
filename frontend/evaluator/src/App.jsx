import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkspacePage from './pages/WorkspacePage';
import './style.css';

function PortalRouter() {
  const [path,setPath]=useState(window.location.pathname);
  const [message,setMessage]=useState(window.history.state?.message||'');
  const { user }=useAuth();
  useEffect(()=>{const pop=()=>{setPath(window.location.pathname);setMessage(window.history.state?.message||'')};window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop)},[]);
  function navigate(next, state={}){window.history.pushState(state,'',next);setPath(next);setMessage(state.message||'')}
  if(user)return <WorkspacePage/>;
  return path==='/register'?<RegisterPage navigate={navigate}/>:<LoginPage navigate={navigate} message={message}/>;
}

export default function App() {
  return <ThemeProvider><AuthProvider><PortalRouter/></AuthProvider></ThemeProvider>;
}
