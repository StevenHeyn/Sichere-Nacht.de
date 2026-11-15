export function emptyContact() {
  return {full_name:'',phone:'',email:'',unit_label:'',notes:'',purpose:'',phone_permission:false,email_permission:false,permission_evidence:'',followup_at:'',privacy_notice_at:'',retain_until:''};
}
export function addressQuery(area, offset = 0, address = '') {
  const params = new URLSearchParams({area, offset:String(Math.max(0, Math.floor(Number(offset) || 0)))});
  if (address) params.set('address', address);
  return '&' + params.toString();
}
