/* Run via tldraw exec with editor, or T3 preview_evaluate with window.editor. */
(() => {
const e=typeof editor!=='undefined'?editor:window.editor;
if(!e) throw new Error('Open a tldraw editor first.');
const rt=s=>({type:'doc',content:String(s).split('\n').map(t=>({type:'paragraph',content:t?[{type:'text',text:t}]:[]}))});
let shapes=[],n=0,parent;
const id=()=>`shape:cg5-overview-${++n}`;
function text(x,y,s,w=500,size='m',color='black',scale=1){shapes.push({id:id(),type:'text',parentId:parent,x,y,props:{richText:rt(s),w,autoSize:false,size,font:'sans',color,scale}})}
function box(x,y,w,h,color='black',geo='rectangle',fill='none',label=''){shapes.push({id:id(),type:'geo',parentId:parent,x,y,props:{w,h,geo,fill,color,dash:'draw',size:'s',font:'sans',richText:rt(label)}})}
function arrow(x,y,dx,dy,color='black'){shapes.push({id:id(),type:'arrow',parentId:parent,x,y,props:{start:{x:0,y:0},end:{x:dx,y:dy},color,size:'m',arrowheadEnd:'arrow'}})}
const page='page:cg5-selection';if(!e.getPages().some(p=>p.id===page))e.createPage({id:page,name:'Five one-screen wonders'});e.setCurrentPage(page);
const blank=e.getPages().find(p=>p.id==='page:page');if(blank&&!e.store.allRecords().some(r=>r.typeName==='shape'&&r.parentId===blank.id))e.deletePage(blank.id);
e.deleteShapes(e.getCurrentPageShapes().filter(s=>s.id.startsWith('shape:cg5-overview-')).map(s=>s.id));
text(0,0,'COMMON GROUND',1700,'xl','black',1.7);text(0,98,'Five small worlds. One unforgettable gesture each.',1700,'l','black',1.1);
text(0,161,'CULTURE × TECH + DESIGN × TECH  /  ONE MAIN SCREEN PER CONCEPT',1700,'s','grey');
const concepts=[
['01','KOPI SHIFT','Pour a word. Make it real.','orange','Culture × Tech · develops culture idea 2','Best starting point: your preferred direction.','Words → ingredients → pour → serve'],
['02','THE TAPE CAN HEAR YOU','Talk back to a little fictional past.','green','Culture × Tech · develops culture idea 1','Most theatrical narrative reveal.','Play → answer → scene reacts → shared lunch'],
['03','CAN LAH!','A tiny phrase. A whole different room.','violet','Culture × Tech · a language instrument','Fastest invitation to play.','Set context → choose delivery → watch meaning shift'],
['04','TABLE CHORUS','Make room. Leave a little smile.','blue','Culture × Tech · everyday social ritual','Best together: two people, one table.','Invite → slide → tap → cup rings become a portrait'],
['05','POCKET STAGE','A shadow with a life of its own.','red','Design × Tech · a miniature puppet theatre','Boldest gesture experiment; camera is optional.','Move light → pose → shadow transforms → curtain']
];
concepts.forEach((c,i)=>{
const x=(i%3)*720,y=240+Math.floor(i/3)*640;parent=`shape:cg5-overview-card-${i}`;
shapes.push({id:parent,type:'frame',x,y,props:{w:680,h:590,name:`${c[0]} / ${c[1]}`,color:c[3]}});
text(24,22,c[0]+'  '+c[1],650,'l',c[3]);text(24,66,c[2],650,'m');box(24,112,632,264,'grey');
if(i===0){box(77,192,90,105,'orange','trapezoid','semi','COFFEE');arrow(185,231,71,41,'orange');box(290,212,125,110,'orange','rectangle','semi');box(408,232,38,50,'orange','ellipse');box(473,140,151,80,'black','rectangle','none','KOPI-O\nKOSONG');text(85,330,'The cup is the explanation.',650,'s','orange',.9)}
if(i===1){box(94,145,441,192,'green','rectangle','semi');box(118,163,334,146,'black');box(214,203,89,81,'orange','trapezoid','semi');box(242,174,42,40,'orange','ellipse','semi');box(480,177,24,24,'black','ellipse');box(479,227,26,27,'black','ellipse');arrow(560,291,-87,-51,'green');text(345,338,'“One kopi, please.”',330,'s','green',.9)}
if(i===2){text(78,141,'CAN',700,'xl','violet',2.2);box(388,189,173,72,'violet','ellipse','semi','LAH!');arrow(161,245,28,45,'violet');box(101,308,132,37,'violet','rectangle','none','FRIENDS');box(255,308,132,37,'violet','rectangle','none','DOUBT');box(409,308,161,37,'violet','rectangle','none','REASSURE')}
if(i===3){box(166,148,338,193,'blue','ellipse','semi');box(295,130,70,29,'orange','rectangle','semi','SEAT');box(220,194,57,53,'orange','ellipse','semi');box(365,237,57,53,'violet','ellipse','semi');box(400,179,64,48,'black','rectangle','none');arrow(87,260,93,-13,'blue');arrow(545,249,-50,0,'violet');text(232,339,'A seat becomes an invitation.',480,'s','blue',.9)}
if(i===4){box(135,138,429,210,'red','rectangle','semi');box(85,198,36,39,'orange','ellipse','solid');arrow(126,219,149,0,'orange');box(300,168,81,107,'black','ellipse','fill');box(381,168,81,107,'black','ellipse','fill');box(313,247,67,61,'black','ellipse','fill');box(382,247,67,61,'black','ellipse','fill');box(371,182,24,111,'black','ellipse','fill');text(198,344,'Move the light. Meet the creature.',590,'s','red',.9)}
text(24,400,c[4],680,'s','grey',.94);text(24,446,c[6],650,'m',c[3],.92);text(24,509,c[5],650,'s','black',.95);parent=undefined;
});
text(1470,907,'START WITH KOPI SHIFT',630,'l','orange');text(1470,969,'Choose the gesture you want to rehearse.\n\nEach idea has a playable sketch, 12 storyboard states, sources, a tiny build plan, and a recovery route.\n\nFrames are moments on one screen—not 12 pages.',640,'m','black',1);
e.createShapes(shapes);e.zoomToFit();return {pageId:page,shapes:shapes.length,frames:5};
})()
