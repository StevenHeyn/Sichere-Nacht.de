import {notFound} from 'next/navigation';
import AdvicePage from '../../components/advice-page';
import {audiencePages} from '../../../lib/advice-content';
import {pageMetadata} from '../../../lib/seo';
export function generateStaticParams(){return Object.keys(audiencePages).map(ziel=>({ziel}))}
export async function generateMetadata({params}:{params:Promise<{ziel:string}>}){const {ziel}=await params;const p=audiencePages[ziel];return p?pageMetadata(p.title+' | Sichere Nacht',p.description,'/alarmanlagen/'+ziel):{title:'Seite nicht gefunden'}}
export default async function Audience({params}:{params:Promise<{ziel:string}>}){const {ziel}=await params;const article=audiencePages[ziel];if(!article)notFound();return <AdvicePage article={article} path={'/alarmanlagen/'+ziel} object={ziel}/>}
