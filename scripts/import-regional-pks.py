"""Extract only geographic crime totals from the official BKA 2025 city workbook.
Usage: python scripts/import-regional-pks.py /path/to/official.xlsx
Never transfers suspect demographics. Source is the XLSX linked by GovData.
"""
import sys,json,re,hashlib
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as E
source=Path(sys.argv[1]);ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
z=ZipFile(source);ss=[''.join(t.itertext()) for t in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)]
rows=[]
for row in E.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//m:row',ns):
 rows.append({re.sub(r'\d','',c.attrib['r']):ss[int(c.find('m:v',ns).text)] if c.attrib.get('t')=='s' else c.findtext('m:v',default='',namespaces=ns) for c in row})
assert '2025' in rows[2]['J'] and 'Städte' in rows[1]['J']
assert rows[4]['E']=='Anzahl erfasste Fälle' and rows[6]['G']=='Anzahl'
states=['','Schleswig-Holstein','Hamburg','Niedersachsen','Bremen','Nordrhein-Westfalen','Hessen','Rheinland-Pfalz','Baden-Württemberg','Bayern','Saarland','Berlin','Brandenburg','Mecklenburg-Vorpommern','Sachsen','Sachsen-Anhalt','Thüringen']
totals={r['C']:int(r['E']) for r in rows if r.get('A')=='------'}
def slug(name):
 for a,b in [('ä','ae'),('ö','oe'),('ü','ue'),('ß','ss')]:name=name.lower().replace(a,b)
 return re.sub('[^a-z0-9]+','-',name).strip('-')
result={}
for r in rows:
 if r.get('A')!='435*00':continue
 name=r['D'];name={'Rostock, Hanse- und Universitätsstadt':'Rostock','Oldenburg (Oldenburg)':'Oldenburg'}.get(name,name)
 count=int(r['E']);attempts=int(r['G']);assert 0<=attempts<=count and int(r['K'])<=count
 result[slug(name)]={'name':name,'officialName':r['D'],'ags':r['C'],'state':states[int(r['C'][:2])],'year':2025,'burglary':count,'attempts':attempts,'completed':count-attempts,'totalCrime':totals[r['C']],'frequency':round(float(r['F']),1),'scope':'Stadtgebiet','sourceRow':next(i+1 for i,x in enumerate(rows) if x is r)}
assert len(result)==81 and result['hamburg']['burglary']==2837 and result['hamburg']['attempts']==1433
assert len({r['ags'] for r in result.values()})==len(result)
out={'source':'https://www.bka.de/SharedDocs/Downloads/DE/Publikationen/PolizeilicheKriminalstatistik/2025/Stadt/Faelle/ST-F-01-T01-Staedte-Faelle-HZ_xls.xlsx?__blob=publicationFile&v=3','catalogue':'https://www.govdata.de/suche/daten/2025-polizeiliche-kriminalstatistik-t01-grundtabelle-stadte-ab-100-000-einwohner-ausgewahlte-strafta','version':rows[3]['A'],'retrieved':'2026-11-15','sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'offenseKey':'435*00','cities':result}
Path('lib/regional-statistics.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('Verified',len(result),'city records; Hamburg cross-check passed.')
if len(sys.argv)>2:
 county=Path(sys.argv[2]);z=ZipFile(county);ss=[''.join(t.itertext()) for t in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)];cr=[]
 for row in E.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//m:row',ns):
  cr.append({re.sub(r'\d','',c.attrib['r']):ss[int(c.find('m:v',ns).text)] if c.attrib.get('t')=='s' else c.findtext('m:v',default='',namespaces=ns) for c in row})
 assert '2025' in cr[3]['M'] and cr[4]['F']=='Anzahl erfasste Fälle'
 ct={r['C']:int(r['F']) for r in cr if r.get('A')=='------'}
 out['countySource']={'source':'https://www.bka.de/SharedDocs/Downloads/DE/Publikationen/PolizeilicheKriminalstatistik/2025/Kreis/Faelle/KR-F-01-T01-Kreise-Faelle-HZ_xls.xlsx?__blob=publicationFile&v=2','catalogue':'https://www.govdata.de/suche/daten/2025-polizeiliche-kriminalstatistik-t01-grundtabelle-kreise-ausgewahlte-straftaten-gruppen','version':cr[3]['A'],'sha256':hashlib.sha256(county.read_bytes()).hexdigest()}
 out['additionalCities']={};out['districts']={}
 for r in cr:
  if r.get('A')!='435*00':continue
  item={'name':r['D'],'officialName':r['D'],'ags':r['C'],'state':states[int(r['C'][:2])],'year':2025,'burglary':int(r['F']),'attempts':int(r['H']),'completed':int(r['F'])-int(r['H']),'totalCrime':ct[r['C']],'frequency':round(float(r['G']),1),'scope':'Stadtgebiet','sourceRow':next(i+1 for i,x in enumerate(cr) if x is r)}
  assert 0<=item['attempts']<=item['burglary']
  if r['E'] in ['KfS','SK']:
   existing=next((v for v in result.values() if v['ags'][:5]==r['C']),None)
   if existing:
    assert existing['burglary']==item['burglary'] and existing['attempts']==item['attempts'],r['D']
   else:out['additionalCities'][slug(r['D'])]=item
  if r['C']=='01056':
   item['scope']='Kreis Pinneberg (gesamter Kreis, keine Stadtwerte)';out['districts']['pinneberg']=item
 Path('lib/regional-statistics.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
 print('Added',len(out['additionalCities']),'smaller independent cities; overlapping city counts cross-checked; Pinneberg district separate.')
