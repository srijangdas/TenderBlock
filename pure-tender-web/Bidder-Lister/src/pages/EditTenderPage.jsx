import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tenderApi } from '../api/services';
import TenderForm from '../components/TenderForm';
import PageTitle from '../components/PageTitle';
import { BACKEND_CONTRACT, DEMO_MODE } from '../data/constants';
export default function EditTenderPage(){
  const {tenderId}=useParams(),{user,token}=useAuth();
  const [tender,setTender]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;tenderApi.detail(tenderId,token).then(t=>{if(!t)throw new Error('Tender not found.');const teamLive=!DEMO_MODE&&BACKEND_CONTRACT==='team';const editable=teamLive?t.status==='SUBMITTED':t.status==='DRAFT';const ownerId=t.authorityId||t.createdById;if(!editable||(ownerId&&String(ownerId)!==String(user.id)))throw new Error(teamLive?'Only your own SUBMITTED tenders may be edited before publication.':'Only your own draft tenders may be edited.');if(active)setTender(t);}).catch(err=>{if(active)setError(err.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[tenderId,token,user.id]);
  return <><PageTitle title="Edit tender" subtitle="Edit your own tender while it remains submitted and unpublished." action={<Link className="tb-btn-outline" to="/lister/my-tenders">Back to My Tenders</Link>}/>{loading&&<p className="tb-card p-6">Loading…</p>}{error&&<p role="alert" className="tb-error">{error}</p>}{tender&&<TenderForm key={tender.id} initialTender={tender}/>}</>;
}
