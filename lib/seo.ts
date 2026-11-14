import type {Metadata} from 'next';
export const SITE_ORIGIN='https://sichere-nacht.de';
export function publicIndexing(){return process.env.VERCEL_ENV==='production'&&process.env.SITE_LIVE_APPROVED==='true'}
export function pageMetadata(title:string,description:string,path:string,index=true):Metadata{return {title,description,alternates:{canonical:SITE_ORIGIN+path},robots:{index:index&&publicIndexing(),follow:index&&publicIndexing()},openGraph:{title,description,url:SITE_ORIGIN+path,siteName:'Sichere Nacht',locale:'de_DE',type:'website'}}}
export function safeJson(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c')}
