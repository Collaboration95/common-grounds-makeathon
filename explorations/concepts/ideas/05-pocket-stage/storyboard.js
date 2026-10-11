/* Pocket Stage editable tldraw replay. Run with editor, toRichText, createShapeId.
   Also runnable in browser: uses window.editor and local rich text helper.
   Stable 05-pocket IDs; upserts only our shapes; never deletes unrelated work. */
(() => {
const e=typeof editor!=='undefined'?editor:window.editor;
if(!e)throw Error('Pocket Stage requires an open tldraw editor');
const rt=typeof toRichText!=='undefined'?toRichText:s=>({type:'doc',content:String(s).split('\n').map(text=>({type:'paragraph',content:text?[{type:'text',text}]:[]}))});
const id=s=>typeof createShapeId!=='undefined'?createShapeId('05-pocket-'+s):'shape:05-pocket-'+s;
const pages=[['page:05-pocket-hero','01 Hero · invitation & transformation'],['page:05-pocket-core','02 Core · light choreography & payoff'],['page:05-pocket-recovery','03 Recovery · ambiguity, stillness & replay']];
const scenes=[
['01','A theatre in your browser','Move the light. The shadow follows.','Pointer moves / arrow keys','Light + shadow respond together','Single scene; no setup permissions.'],
['02','Find the light','Move the light. The shadow follows.','Move right / →','Shadow moves left; height changes scale','Keep input continuous; projection is stylised.'],
['03','A paper hand waits','Open hand · Space','Click Open hand / Space','Paper fingers open; shadow begins changing','Visible affordance; never infer a real hand.'],
['04','The shadow lives','Your hand has become a moth. Bring it to the flower.','Open hand completes','Hand silhouette crossfades to winged cutout','Authored moth design; no AI generation.'],
['05','You are the lighting designer','Your hand has become a moth. Bring it to the flower.','Move left / ←','Moth approaches the flower on the right','Opposite movement deliberately feels like projection.'],
['06','Depth without a 3D pipeline','Your hand has become a moth. Bring it to the flower.','Change light height / ↑ ↓','Shadow scales; paper layers remain still','SVG layers + light wash; not physical ray tracing.'],
['07','A small hello','A small hello. The flower opens for your shadow.','Open moth within flower neighbourhood','Flower unfolds; optional two-note chime','Spatial threshold; no precision hold or timer.'],
['08','Keep performing','A small hello. The flower opens for your shadow.','Move light / Close hand','Shadow changes; flower stays open','Ending in same scene; no result dashboard.'],
['09','Which way do I move?','Guide to flower','Click Guide to flower','Light moves to a known authored position','Assistance moves light only; player opens the hand.'],
['10','The pointer leaves','Move the light. The shadow follows.','Pointer leaves / keyboard takes over','Last light position persists','No failure screen; ranges remain operable.'],
['11','A quiet, still performance','Still mode on / Sound off','Toggle still mode / sound','No wing loop; identical spatial payoff','Reduced motion starts still; captions carry meaning.'],
['12','Another little performance','Move the light. The shadow follows.','Reset · R','Closed hand; light restored; flower closes','Reset all progress; sound/still preferences persist.']
];
let shapes=[],parent,seq=0;
function put(type,x,y,props,rotation=0){const shape={id:id('f'+seq+'-'+shapes.length),type,parentId:parent,x,y,rotation,props};shapes.push(shape);return shape.id}
function geo(x,y,w,h,color='black',kind='rectangle',fill='fill',rotation=0){return put('geo',x,y,{geo:kind,w,h,color,fill,dash:'solid',size:'s'},rotation)}
function txt(x,y,s,w=610,scale=.8,color='black',size='s'){return put('text',x,y,{richText:rt(s),w,autoSize:false,font:'sans',color,size,scale})}
function arrow(x,y,dx,dy,color='orange'){return put('arrow',x,y,{start:{x:0,y:0},end:{x:dx,y:dy},color,size:'m',dash:'solid',arrowheadEnd:'arrow',arrowheadStart:'none'})}
function hand(x,y,open=true,scale=1,color='black'){
geo(x,y,48*scale,48*scale,color,'ellipse');geo(x+14*scale,y+33*scale,20*scale,32*scale,color);
if(open){for(let k=0;k<4;k++)geo(x+(4+k*11)*scale,y-(22+(k%2)*8)*scale,9*scale,37*scale,color,'oval');geo(x-14*scale,y+4*scale,25*scale,11*scale,color,'oval','fill',-.6)}
else geo(x-5*scale,y-5*scale,54*scale,25*scale,color,'oval');}
function moth(x,y,scale=1){geo(x-64*scale,y-40*scale,64*scale,45*scale,'black','ellipse','fill',-.25);geo(x+1*scale,y-55*scale,64*scale,45*scale,'black','ellipse','fill',.25);geo(x-38*scale,y+2*scale,37*scale,30*scale,'black','ellipse');geo(x+4*scale,y+2*scale,37*scale,30*scale,'black','ellipse');geo(x-5*scale,y-24*scale,12*scale, 50*scale,'black','oval');arrow(x,y-20,-14*scale,-16*scale,'black');arrow(x+5,y-20,14*scale,-16*scale,'black');}
function flower(bloom=false){geo(478,245,4,76,'black');geo(453,271,29,10,'black','ellipse','fill',-.35);geo(478,272,29,10,'black','ellipse','fill',.35);const r=bloom?1:.65;for(let k=0;k<5;k++){let a=k*Math.PI*2/5;geo(480+Math.sin(a)*16*r-10*r,246+Math.cos(a)*16*r-16*r,20*r,30*r,'black','ellipse','fill',a)}geo(474,242,13,13,'orange','ellipse')}
for(let p=0;p<3;p++){
const [pid,name]=pages[p];if(e.getPages().some(x=>x.id===pid))e.updatePage({id:pid,name});else e.createPage({id:pid,name});e.setCurrentPage(pid);shapes=[];parent=pid;seq=100+p;
txt(0,0,'POCKET STAGE / '+name,1700,1.15,'violet','xl');txt(0,68,'DESIGN × TECH   ·   THE MOTH & THE LIGHT   ·   STATES OF ONE SCENE',1900,.82,'grey');
for(let j=0;j<4;j++){
const n=p*4+j,s=scenes[n],fx=j%2*710,fy=135+Math.floor(j/2)*715;seq=n+1;parent=pid;
const fid=id('frame-'+s[0]);shapes.push({id:fid,type:'frame',parentId:pid,x:fx,y:fy,props:{w:670,h:665,name:s[0]+' / '+s[1],color:p===2?'blue':'violet'}});parent=fid;
txt(20,16,s[0]+'  '+s[1],780,.98,'black','m');
// Stage layers, kept as editable geometry rather than screenshot artwork.
geo(20, 61,630,357,'violet');geo(56,85,557,257,'orange','oval','fill');geo(80,111,512,221,'yellow','rectangle','fill');geo(84,294,505,37,'orange','rectangle','semi');
geo(20,61, 57,300,'red','trapezoid');geo(594,61,56,300,'red','trapezoid');geo(20, 342,630,76,'violet');
const living=n>=3&&n!==9&&n!==11,bloom=[6,7,10].includes(n),lx=[105,220,220,220,100,100,100,210,100,220,100,105][n],sx=[380,300,300,300,430,430,449,350,449,300,449,380][n],sy=n===5?166:215;
// Light cone, source, authored hand, projected silhouette and single flower.
geo(lx,315,198,20,'yellow','triangle','semi',-1.05);geo(lx,358,23,23,'yellow','ellipse');geo(lx+10,382,3,22,'orange');hand(307,360,n>=2&&n!==11,.48,'red');flower(bloom);
if(living)moth(sx,sy,n===5?1.12:.88);else hand(sx-24,sy-25,n===2,1.05);
if([1,4,5,8].includes(n))arrow(lx+12,388,n===1?80:-58,0,'yellow');if([1,4].includes(n))arrow(sx,155,n===1?- 55:70,0,'blue');
if(n===3){hand(159,194,true,.72,'grey');arrow(215,215,42,0,'blue');txt(157,281,'hand → authored moth',450,.66,'black')}
if(n===6)arrow(415,246,45,7,'blue');
if(n===8)txt(94,123,'ASSIST: LIGHT MOVES FOR YOU',600,.66,'blue');
if(n===9)arrow(100,140,-52,-25,'blue');
if(n===10)txt(104,122,'STILL / NO WING LOOP',500,.7,'blue');
if(n===11)arrow(405,155,-60,0,'blue');
txt(87, 319,s[2],685,.71,'black');
txt(30,386,n===10?'Still mode on     Sound off':'Open / close hand   ·   Reset   ·   Light controls',810,.58,'yellow');
txt(24,442,'INPUT   '+s[3],800,.82,'blue');txt(24,494,'RESPONSE   '+s[4],800,.8,'black');txt(24,548,'PRODUCTION   '+s[5],800,.74,'grey');txt(24,605,'NEXT   '+(n===11?'01 / replay':n===8?'07 after Open hand':n===9?'current state':n===10?'07 / same success condition':String(n+2).padStart(2,'0')),800,.7,'grey');
}
parent=pid;seq=200+p;txt(0,1590,p===0?'HERO: input becomes story. The moth is authored; no camera is requested.':p===1?'CORE: move light → guide shadow → open flower. Keep one prop and one scene.':'RECOVERY: assistance, keyboard and still mode preserve the same magic moment.',1900,.8,'grey');
for(const s of shapes){if(e.getShape(s.id))e.updateShape(s);else e.createShape(s)}
e.zoomToFit();
}
if(e.getPages().some(p=>p.id==='page:page')&&!e.store.allRecords().some(r=>r.typeName==='shape'&&r.parentId==='page:page'))e.deletePage('page:page');
e.setCurrentPage(pages[0][0]);e.selectNone();e.zoomToBounds({x:0,y:110,w:1380,h:1410},{inset:100});
return {pages:pages.map(p=>({id:p[0],name:p[1]})),frames:12,shapeCount:e.store.allRecords().filter(x=>x.typeName==='shape'&&x.id.startsWith('shape:05-pocket-')).length};
})()
