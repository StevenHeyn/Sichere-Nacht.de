import {NextResponse} from 'next/server';
import {client} from '../../../lib/server';
export async function GET(request:Request){const u=new URL(request.url),code=u.searchParams.get('code');if(code){const db=await client();const {error}=await db.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(u.searchParams.get('recovery')==='1'?'/login?recovery=1':'/portal',u.origin))}return NextResponse.redirect(new URL('/login?error=confirmation',u.origin))}
