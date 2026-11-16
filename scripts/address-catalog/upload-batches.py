"""Bounded, resumable bulk upload; server reads every stored object back and hashes it."""
import concurrent.futures,base64,hashlib,json,pathlib,sys,threading,time
import requests
root,token_file,project=sys.argv[1:];root=pathlib.Path(root);manifest=json.loads((root/'manifest.json').read_text());token=pathlib.Path(token_file).read_text().strip();snapshot=manifest['snapshot']
files=manifest['files']+[{'path':'manifest.json','sha256':hashlib.sha256((root/'manifest.json').read_bytes()).hexdigest(),'bytes':(root/'manifest.json').stat().st_size}]
log=root/'verified.jsonl';done={json.loads(l)['path'] for l in log.read_text().splitlines()} if log.exists() else set();lock=threading.Lock();thread=threading.local();batches=[];batch=[];size=0
for f in files:
 if f['path'] in done:continue
 if len(batch)>=16 or size+f['bytes']>4000000:batches.append(batch);batch=[];size=0
 batch.append(f);size+=f['bytes']
if batch:batches.append(batch)
def upload(batch):
 if not hasattr(thread,'session'):thread.session=requests.Session()
 payload=[]
 for f in batch:
  b=(root/f['path']).read_bytes();assert hashlib.sha256(b).hexdigest()==f['sha256'];payload.append({'path':f['path'],'sha256':f['sha256'],'content':base64.b64encode(b).decode()})
 for attempt in range(10):
  try:
   r=thread.session.post(f'https://{project}.supabase.co/functions/v1/address-catalog?mode=upload-batch',headers={'Authorization':'Bearer '+token},json={'files':payload},timeout=120)
   if r.status_code!=200:raise RuntimeError(f'Batch status {r.status_code}: {r.text[:120]}')
   receipts=r.json()['verified'];expected={f['path']:(f['sha256'],f['bytes']) for f in batch};actual={f['path']:(f['sha256'],f['bytes']) for f in receipts};assert actual==expected,'Storage read-back receipts differ'
   with lock:
    with log.open('a') as out:
     for f in receipts:out.write(json.dumps(f)+'\n');done.add(f['path'])
    print(json.dumps({'verified':len(done),'total_files':len(files)}),flush=True)
   return
  except Exception:
   if attempt==9:raise
   time.sleep(min(30,2**attempt))
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(upload,batches))
print(json.dumps({'complete':True,'verified':len(done),'snapshot':snapshot,'addresses':manifest['counts']['total']}),flush=True)
