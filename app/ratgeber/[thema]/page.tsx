import {notFound} from 'next/navigation';
import AdvicePage from '../../components/advice-page';
import {guides} from '../../../lib/advice-content';
import {pageMetadata} from '../../../lib/seo';
export function generateStaticParams(){return Object.keys(guides).map(thema=>({thema}))}
export async function generateMetadata({params}:{params:Promise<{thema:string}>}){const {thema}=await params;const a=guides[thema];return a?pageMetadata(a.title+' | Sichere Nacht',a.description,'/ratgeber/'+thema):{title:'Seite nicht gefunden'}}
export default async function Guide({params}:{params:Promise<{thema:string}>}){const {thema}=await params;const article=guides[thema];if(!article)notFound();return <AdvicePage article={article} path={'/ratgeber/'+thema}/>}
