import type {MetadataRoute} from 'next';
import {publicIndexing,SITE_ORIGIN} from '../lib/seo';
export default function robots():MetadataRoute.Robots{return publicIndexing()?{rules:{userAgent:'*',allow:'/',disallow:['/api/','/admin/','/warenkorb','/bestellung','/widerruf-online','/*?']},sitemap:SITE_ORIGIN+'/sitemap.xml',host:SITE_ORIGIN}:{rules:{userAgent:'*',disallow:'/'}}}
