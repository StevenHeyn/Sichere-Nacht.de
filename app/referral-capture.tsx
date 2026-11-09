'use client';
import {useEffect} from 'react';
import {loadCart,saveCart,normalizeVpId} from '../lib/cart';

/**
 * Records the last valid referral link visited in this browser.
 * The partner must still be verified against an approved partner registry
 * on the server before an order can earn any commission.
 */
export default function ReferralCapture(){
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  const raw=params.get('vp');
  if(!raw)return;
  const candidate=normalizeVpId(raw);
  if(!/^VP-[A-Z0-9]{3,16}$/.test(candidate)||candidate!==raw.trim().toUpperCase())return;
  try{
   const cart=loadCart();
   if(cart.vpId===candidate)return;
   saveCart({items:cart.items,installation:cart.installation,installationZip:cart.installationZip,source:cart.source,vpId:candidate});
  }catch{/* localStorage may be unavailable: no referral is attributed */}
 },[]);
 return null;
}
