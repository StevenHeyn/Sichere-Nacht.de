import tls from 'node:tls';
import {once} from 'node:events';
const readReply=async(socket,state)=>{
 while(true){
  const line=state.lines.shift();
  if(line){if(!/^\d{3}[ -]/.test(line))throw Error('Invalid SMTP response');if(line[3]===' ')return Number(line.slice(0,3));continue}
  const chunk=await Promise.race([once(socket,'data').then(([b])=>b.toString()),once(socket,'error').then(([e])=>{throw e})]);
  state.buffer+=chunk;let n;while((n=state.buffer.indexOf('\r\n'))>=0){state.lines.push(state.buffer.slice(0,n));state.buffer=state.buffer.slice(n+2)}
 }
};
export async function sendSmtp({host,port,user,password,to,subject,html}){
 const socket=tls.connect({host,port:Number(port),servername:host,rejectUnauthorized:true});
 socket.setTimeout(15000,()=>socket.destroy(Error('SMTP timeout')));
 const state={buffer:'',lines:[]};
 const expect=async(allowed)=>{const code=await readReply(socket,state);if(!allowed.includes(code))throw Error('SMTP rejected request: '+code)};
 const command=async(line,allowed)=>{socket.write(line+'\r\n');await expect(allowed)};
 try{
  await once(socket,'secureConnect');await expect([220]);
  await command('EHLO vp.sichere-nacht.de',[250]);
  await command('AUTH LOGIN',[334]);
  await command(Buffer.from(user).toString('base64'),[334]);
  await command(Buffer.from(password).toString('base64'),[235]);
  await command('MAIL FROM:<'+user+'>',[250]);
  await command('RCPT TO:<'+to+'>',[250,251]);
  await command('DATA',[354]);
  const encodedSubject='=?UTF-8?B?'+Buffer.from(subject).toString('base64')+'?=';
  const message=['From: Sichere Nacht <'+user+'>','To: <'+to+'>','Subject: '+encodedSubject,'MIME-Version: 1.0','Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64','',Buffer.from(html).toString('base64').match(/.{1,76}/g).join('\r\n')].join('\r\n');
  socket.write(message.replace(/(^|\r\n)\./g,'$1..')+'\r\n.\r\n');await expect([250]);
  await command('QUIT',[221]);return true;
 }finally{socket.destroy()}
}
