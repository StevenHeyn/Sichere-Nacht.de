"""Resumable verified upload. Token file is private, scoped, short-lived; never logged."""
import concurrent.futures, hashlib, json, os, pathlib, sys, threading, time, urllib.parse
import requests
root, token_file, project = sys.argv[1:]
root=pathlib.Path(root); manifest=json.loads((root/'manifest.json').read_text()); snapshot=manifest['snapshot'];token=pathlib.Path(token_file).read_text().strip()
files=manifest['files']+[{'path':'manifest.json','sha256':hashlib.sha256((root/'manifest.json').read_bytes()).hexdigest()}]
log=root/'verified.jsonl';done={json.loads(l)['path'] for l in log.read_text().splitlines()} if log.exists() else set();lock=threading.Lock()
base=f'https://{project}.supabase.co';thread=threading.local(); pause_until=0.0
def upload(f):
 global pause_until
 if f['path'] in done:return
 if not hasattr(thread,'session'):thread.session=requests.Session()
 session=thread.session;body=(root/f['path']).read_bytes();assert hashlib.sha256(body).hexdigest()==f['sha256']
 for attempt in range(10):
  try:
   delay=pause_until-time.monotonic()
   if delay>0:time.sleep(delay)
   r=session.post(base+'/functions/v1/address-catalog',params={'mode':'upload','path':f['path']},headers={'Authorization':'Bearer '+token,'x-content-sha256':f['sha256'],'content-type':'application/octet-stream'},data=body,timeout=90)
   if r.status_code==429:
    with lock:pause_until=max(pause_until,time.monotonic()+min(60,max(30,float(r.headers.get('Retry-After','30')))))
   if r.status_code!=200:raise RuntimeError(f'Upload {r.status_code}: {r.text[:160]}')
   r=session.get(base+'/storage/v1/object/public/vp-address-catalog/'+snapshot+'/'+f['path'],timeout=90);
   if r.status_code==429:
    with lock:pause_until=max(pause_until,time.monotonic()+30)
   r.raise_for_status()
   if hashlib.sha256(r.content).hexdigest()!=f['sha256']:raise RuntimeError('Read-back checksum mismatch')
   with lock:
    with log.open('a') as out:out.write(json.dumps({'path':f['path'],'sha256':f['sha256'],'bytes':len(body)})+'\n')
    done.add(f['path'])
    if len(done)%100==0:print(json.dumps({'verified':len(done),'total_files':len(files)}),flush=True)
   return
  except Exception as e:
   if attempt==9:raise RuntimeError(f['path']+': '+str(e))
   time.sleep(min(2**attempt,8))
with concurrent.futures.ThreadPoolExecutor(max_workers=max(1,min(16,int(os.environ.get("CATALOG_UPLOAD_WORKERS","8"))))) as executor:list(executor.map(upload,files))
print(json.dumps({'complete':True,'verified':len(done),'snapshot':snapshot,'addresses':manifest['counts']['total'],'bytes':manifest['bytes']}),flush=True)
