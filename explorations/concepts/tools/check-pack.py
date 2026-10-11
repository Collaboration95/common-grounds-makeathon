"""Validate pack completeness and local HTML links without external dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote,urlparse
import json,re,subprocess,tempfile
root=Path(__file__).resolve().parent.parent
class Links(HTMLParser):
    def __init__(self): super().__init__();self.links=[];self.scripts=[];self.active=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        for key in ('href','src'):
            if a.get(key): self.links.append(a[key])
        if tag=='script' and not a.get('src'): self.active=True
    def handle_endtag(self,tag):
        if tag=='script': self.active=False
    def handle_data(self,data):
        if self.active:self.scripts.append(data)
results=[]
for p in [root/'index.html',*sorted((root/'ideas').glob('*/preview.html'))]:
    parsed=Links();parsed.feed(p.read_text());missing=[]
    for ref in parsed.links:
        u=urlparse(ref)
        if u.scheme or u.netloc or not u.path: continue
        path=(p.parent/unquote(u.path)).resolve()
        if not path.exists():missing.append(ref)
    syntax=[]
    for script in parsed.scripts:
        with tempfile.NamedTemporaryFile(suffix='.js',mode='w') as f:
            f.write(script);f.flush();r=subprocess.run(['node','--check',f.name],capture_output=True,text=True)
            if r.returncode:syntax.append(r.stderr)
    results.append({'file':str(p.relative_to(root)),'missingLocalLinks':missing,'scriptErrors':syntax})
concepts=[]
for d in sorted((root/'ideas').iterdir()):
    if not d.is_dir():continue
    required=['brief.md','storyboard.md','storyboard.js','iteration-log.md','preview.html','metadata.json','board.json']
    missing=[s for s in required if not (d/s).exists()]
    metadata=json.loads((d/'metadata.json').read_text()) if (d/'metadata.json').exists() else {}
    snapshot_path=d/'storyboard.snapshot.json'
    snapshot=json.loads(snapshot_path.read_text()) if snapshot_path.exists() else {}
    payload=snapshot.get('snapshot',snapshot)
    records=list(payload.get('document',payload).get('store',{}).values())
    actual_frames=sum(r.get('typeName')=='shape' and r.get('type')=='frame' for r in records)
    concepts.append({'id':d.name,'missing':missing,'frames':metadata.get('frameCount'),'snapshotFrames':actual_frames,'frameCountMatches':actual_frames==metadata.get('frameCount')==12,'boardUrl':metadata.get('boardUrl')})
report={'html':results,'concepts':concepts,'pass':len(concepts)==5 and len(results)==6 and all(not x['missingLocalLinks'] and not x['scriptErrors'] for x in results) and all(not x['missing'] and x['frameCountMatches'] for x in concepts)}
(root/'evidence/pack-check.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
raise SystemExit(0 if report['pass'] else 1)
