import type {MetadataRoute} from 'next';
export default function sitemap():MetadataRoute.Sitemap{
 return [{url:'https://vp.sichere-nacht.de/vertriebspartner',changeFrequency:'monthly',priority:1}];
}
