"""Emit an atomic activation transaction only after every object passed read-back verification."""
import hashlib,json,pathlib,sys
root=pathlib.Path(sys.argv[1]);m=json.loads((root/'manifest.json').read_text());snapshot=m['snapshot']
assert snapshot.replace('-','').isalnum() and snapshot.islower()
manifest_bytes=(root/'manifest.json').read_bytes()
expected={f['path']:(f['sha256'],f['bytes']) for f in m['files']}
expected['manifest.json']=(hashlib.sha256(manifest_bytes).hexdigest(),len(manifest_bytes))
verified={v['path']:(v['sha256'],v['bytes']) for v in map(json.loads,(root/'verified.jsonl').read_text().splitlines())}
assert verified==expected,'Every file must be read back and verified before activation'
digest=hashlib.md5('\n'.join(f'{p}:{sha}:{size}' for p,(sha,size) in sorted(expected.items())).encode()).hexdigest()
size=sum(v[1] for v in expected.values());count=len(expected)
print(f"""begin;
do $$declare n bigint;bytes bigint;fingerprint text;begin
 select count(*),sum(f.bytes),md5(string_agg(path||':'||sha256||':'||f.bytes,E'\\n' order by path collate \"C\")) into n,bytes,fingerprint from public.vp_address_snapshot_files f where snapshot_id='{snapshot}';
 if n<>{count} or bytes<>{size} or fingerprint is distinct from '{digest}' then raise exception 'Snapshot receipts incomplete or different';end if;
 if not exists(select 1 from public.vp_address_snapshots where id='{snapshot}' and status='building') then raise exception 'Snapshot is not awaiting activation';end if;
 update public.vp_address_snapshots set active=false where active;
 update public.vp_address_snapshots set active=true,status='ready',verified_at=now(),address_count={m['counts']['total']},file_count={count},total_bytes={size},manifest_sha256='{expected['manifest.json'][0]}' where id='{snapshot}';
 delete from public.vp_address_import_tokens where snapshot_id='{snapshot}';
end$$;
commit;
select id,address_count,file_count,total_bytes,verified_at from public.vp_address_snapshots where active;""")
