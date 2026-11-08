import { http } from './http';
import { DEMO_ACCOUNTS } from '../data/demoData';
export const DEMO=import.meta.env.VITE_DEMO_MODE!=='false';

export async function login(email,password){
  if(DEMO){const account=DEMO_ACCOUNTS[email.trim().toLowerCase()];if(!account||account.password!==password)throw new Error('That demo email or password is incorrect.');return{token:'demo-session',user:account.user}}
  const data=await http('/auth/login',{method:'POST',body:{email:email.trim().toLowerCase(),password}});
  if(!['ADMIN','AUDITOR'].includes(data.role))throw new Error('This portal is for Admin and Auditor accounts.');
  return{token:data.accessToken,user:{id:data.userId,fullName:data.fullName,email:data.email,role:data.role}};
}
