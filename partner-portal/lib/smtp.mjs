import tls from 'node:tls';
import {once} from 'node:events';

export async function sendSmtp({host,port,user,password,to,subject,html}){
 if(!host||!user||!password||!to||/[\r\n]/.test(user+to+subject))throw Error('Invalid SMTP parameters');
 const socket=tls.connect({host,port:Number(port),servername:host,rejectUnauthorized:true});
 socket.setTimeout(15000,()=>socket.destroy(new Error('SMTP timeout')));
 let buffer='',error=null;
 const lines=[],waiters=[];
 const wake=()=>{while(waiters.length&&(error||lines.length)){const resolve=waiters.shift();resolve()}};
 socket.on('data',chunk=>{
  buffer+=chunk.toString('utf8');
  let n;while((n=buffer.indexOf('\r\n'))>=0){lines.push(buffer.slice(0,n));buffer=buffer.slice(n+2)}
  wake();
 });
 socket.on('error',e=>{error=e;wake()});
 socket.on('close',()=>{if(!error)error=new Error('SMTP connection closed');wake()});
 const line=async()=>{while(!lines.length){if(error)throw error;await new Promise(resolve=>waiters.push(resolve))}return lines.shift()};
 const expect=async(allowed)=>{
  let code=0;
  while(true){const entry=await line();if(!/^\d{3}[ -]/.test(entry))throw Error('Invalid SMTP reply');code=Number(entry.slice(0,3));if(entry[3]===' ')break}
  if(!allowed.includes(code))throw Error('SMTP response '+code);
  return code;
 };
 const command=async(s,accepted)=>{socket.write(s+'\r\n');return expect(accepted)};
 try{
  await Promise.race([once(socket,'secureConnect'),once(socket,'error').then(([e])=>{throw e})]);
  await expect([220]);
  await command('EHLO vp.sichere-nacht.de',[250]);
  await command('AUTH LOGIN',[334]);
  await command(Buffer.from(user).toString('base64'),[334]);
  await command(Buffer.from(password).toString('base64'),[235]);
  await command('MAIL FROM:<'+user+'>',[250]);
  await command('RCPT TO:<'+to+'>',[250,251]);
  await command('DATA',[354]);
  const encodedSubject='=?UTF-8?B?'+Buffer.from(subject).toString('base64')+'?=';
  const encodedBody=(Buffer.from(html).toString('base64').match(/.{1,76}/g)||[]).join('\r\n');
  const message=['From: Sichere Nacht <'+user+'>','To: <'+to+'>','Subject: '+encodedSubject,'MIME-Version: 1.0','Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64','',encodedBody].join('\r\n');
  socket.write(message.replace(/(^|\r\n)\./g,'$1..')+'\r\n.\r\n');
  await expect([250]);
  await command('QUIT',[221]);
  return true;
 }finally{socket.destroy()}
}
