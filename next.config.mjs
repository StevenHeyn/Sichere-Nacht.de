/** Basic response hardening without a speculative CSP that could break Stripe. */
const nextConfig={
 poweredByHeader:false,
 async headers(){return [
  {source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]},
  {source:'/api/:path*',headers:[{key:'Cache-Control',value:'no-store'}]},
  {source:'/admin/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'}]}
 ]}
};
export default nextConfig;
