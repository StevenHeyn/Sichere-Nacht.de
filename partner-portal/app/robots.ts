import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{
 return {
  rules:[{
   userAgent:'*',
   allow:['/vertriebspartner','/vertriebspartner/','/sitemap.xml'],
   disallow:['/portal','/portal/','/api/','/login','/vertrag','/datenschutz']
  }],
  sitemap:'https://vp.sichere-nacht.de/sitemap.xml',
  host:'https://vp.sichere-nacht.de'
 };
}
