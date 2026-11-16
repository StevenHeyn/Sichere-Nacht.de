"""Build an immutable, compressed OSM address snapshot (no resident data).
Requires osmium==4.3.2. python extract.py SOURCE.pbf OUTPUT_DIR SNAPSHOT
The original PBF and checksum must be verified before running this script.
"""
import collections, datetime, gzip, hashlib, json, math, os, pathlib, sys
import osmium
source, output, snapshot = sys.argv[1:]
out=pathlib.Path(output); raw=out/'raw'; raw.mkdir(parents=True,exist_ok=True)
handles=collections.OrderedDict(); tiles={}; postcodes={}; counts=collections.Counter()
def tile(lon,lat):
 n=4096; r=math.radians(lat)
 return int((lon+180)/360*n),int((1-math.asinh(math.tan(r))/math.pi)/2*n)
def emit(obj,kind,identifier,lon,lat):
 tags=obj.tags; street=tags.get('addr:street') or tags.get('addr:place'); number=tags.get('addr:housenumber')
 if not street or not number: counts['missing_address_fields']+=1; return
 if not (5<=lon<=16 and 47<=lat<=56) or tags.get('addr:country','DE').upper() not in ('DE','DEU','GERMANY','DEUTSCHLAND'): counts['outside_de']+=1; return
 x,y=tile(lon,lat); k=f'{x}/{y}'; city=tags.get('addr:city',''); postcode=tags.get('addr:postcode','')
 row=[f'osm:{kind}:{identifier}',street,number,city,postcode,round(lon,7),round(lat,7)]
 if k not in handles:
  if len(handles)>=96: handles.popitem(last=False)[1].close()
  p=raw/f'{x}-{y}.jsonl'; handles[k]=p.open('a',encoding='utf8')
 handles.move_to_end(k); handles[k].write(json.dumps(row,ensure_ascii=False,separators=(',',':'))+'\n')
 t=tiles.setdefault(k,[0,0,0]);t[0]+=1;t[1]+=lon;t[2]+=lat
 if len(postcode)==5 and postcode.isdigit():
  p=postcodes.setdefault(postcode,{'postcode':postcode,'cities':set(),'count':0,'west':lon,'east':lon,'south':lat,'north':lat})
  p['cities'].add(city);p['count']+=1;p['west']=min(p['west'],lon);p['east']=max(p['east'],lon);p['south']=min(p['south'],lat);p['north']=max(p['north'],lat)
 counts[kind]+=1;counts['total']+=1
 if counts['total']%1000000==0: print(json.dumps(dict(counts)),flush=True)
# Location index is disk-backed. Area assembly only needs addressed multipolygons.
fp=osmium.FileProcessor(source).with_locations('sparse_file_array,'+str(out/'locations.idx')).with_areas(osmium.filter.KeyFilter('addr:housenumber')).with_filter(osmium.filter.KeyFilter('addr:housenumber'))
for obj in fp:
 try:
  if obj.is_node(): emit(obj,'node',obj.id,obj.location.lon,obj.location.lat)
  elif obj.is_way():
   coords=[(n.lon,n.lat) for n in obj.nodes if n.location.valid()]
   if len(coords)!=len(obj.nodes) or not coords: counts['invalid_geometry']+=1;continue
   emit(obj,'way',obj.id,(min(c[0] for c in coords)+max(c[0] for c in coords))/2,(min(c[1] for c in coords)+max(c[1] for c in coords))/2)
  elif obj.is_area() and not obj.from_way():
   coords=[(n.lon,n.lat) for ring in obj.outer_rings() for n in ring if n.location.valid()]
   if coords: emit(obj,'relation',obj.orig_id(),(min(c[0] for c in coords)+max(c[0] for c in coords))/2,(min(c[1] for c in coords)+max(c[1] for c in coords))/2)
 except osmium.InvalidLocationError: counts['invalid_geometry']+=1
for f in handles.values():f.close()
files=[]
def save(path,data,count=0):
 b=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode(); b=gzip.compress(b,compresslevel=6,mtime=0)
 p=out/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
 files.append({'path':path,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'count':count})
for k,(count,lon,lat) in sorted(tiles.items()):
 rows=[json.loads(line) for line in (raw/(k.replace('/','-')+'.jsonl')).open()]
 save('tiles/'+k+'.json.gz',rows,count)
summary=[{'x':int(k.split('/')[0]),'y':int(k.split('/')[1]),'count':v[0],'longitude':v[1]/v[0],'latitude':v[2]/v[0]} for k,v in tiles.items()]
save('summary.json.gz',summary)
for p in postcodes.values(): p['cities']=sorted(c for c in p['cities'] if c)
save('postcodes.json.gz',list(postcodes.values()))
manifest={'snapshot':snapshot,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':'https://download.geofabrik.de/europe/germany.html','license':'https://www.openstreetmap.org/copyright','attribution':'© OpenStreetMap contributors, ODbL 1.0; extract by Geofabrik','format':'Rows: [source_key, street_or_place, house_number, city, postal_code, longitude, latitude]. WebMercator tiles at zoom 12. Gzip JSON.','coverage':'Available addressed OSM nodes, ways and multipolygon relations from the Germany extract. No guarantee of complete real-world addresses. Missing house numbers/street-or-place and invalid geometry are excluded. No inferred resident or household data.','counts':dict(counts),'tile_zoom':12,'source_bytes':pathlib.Path(source).stat().st_size,'files':files,'bytes':sum(f['bytes'] for f in files)}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in manifest.items() if k!='files'}),flush=True)
