export default {
 outputFileTracingIncludes:{
  '/api/training/installer-masterclass':['./assets/training/monteurs-masterclass.pdf'],
  '/api/training/ajax-basics':['./assets/training/ajax-technisches-basiswissen.pdf'],
  '/api/training/sales-guide':['./assets/training/verkaufsleitfaden.pdf']
 },
 poweredByHeader:false,
 async headers(){
  return [
   {source:'/:path*',headers:[
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    {key:'X-Frame-Options',value:'DENY'},
    {key:'Cache-Control',value:'private, no-store, max-age=0'}
   ]},
   // Keep the authenticated portal and other pages out of search, without
   // contradicting the public recruitment page's index/follow metadata.
   {source:'/:path((?!vertriebspartner).*)',headers:[
    {key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'}
   ]}
  ];
 }
};
