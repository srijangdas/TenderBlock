import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bidApi, tenderApi } from '../api/services';
import BidForm from '../components/BidForm';
import PageTitle from '../components/PageTitle';
import { BACKEND_CONTRACT, DEMO_MODE } from '../data/constants';
export default function EditBidPage(){
  const {bidId}=useParams(),{user,token}=useAuth();
  const [record,setRecord]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;
    if (!DEMO_MODE && BACKEND_CONTRACT === 'team' && user?.verified !== true) {
      setRecord(null);
      setLoading(false);
      setError('Admin verification is required before accessing or editing your saved bids.');
      return () => { active = false; };
    }
    (async()=>{const bids=await bidApi.mine(user,token);const bid=bids.find(x=>String(x.id)===String(bidId));if(!bid)throw new Error('Bid not found in your own submissions.');const tender=await tenderApi.detail(bid.tenderId,token);if(!tender)throw new Error('Tender could not be loaded.');if(tender.status!=='PUBLISHED'||Date.parse(tender.submissionDeadline)<=Date.now())throw new Error('Bid editing is no longer allowed after the deadline.');if(!DEMO_MODE && BACKEND_CONTRACT==='team' && bid.status!=='DRAFT')throw new Error('The team backend only allows editing DRAFT bids.');if(active)setRecord({bid,tender});})().catch(err=>{if(active)setError(err.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[bidId,user,token]);
  return <><PageTitle title="Continue bid draft" subtitle="Update your quotation or upload your PDF before submitting. Once submitted, the bid is locked." action={<Link className="tb-btn-outline" to="/bidder/my-bids">Back to My Bids</Link>}/>{loading&&<p className="tb-card p-6">Loading…</p>}{error&&<p role="alert" className="tb-error">{error}</p>}{record&&<BidForm tender={record.tender} initialBid={record.bid}/>}</>;
}
