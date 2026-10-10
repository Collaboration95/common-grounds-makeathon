/* Can Lah! editable storyboard. Replay in tldraw exec (editor, toRichText)
   or in a browser with window.editor. Own IDs only. No unrelated deletions. */
(() => {
 const e=typeof editor!=='undefined'?editor:window.editor;
 if(!e)throw new Error('Can Lah requires an open tldraw editor.');
 const rt=typeof toRichText==='function'?toRichText:s=>({type:'doc',content:String(s).split('\n').map(t=>({type:'paragraph',content:t?[{type:'text',text:t}]:[]}))});
 const pages=[['page:canlah-hero','01 Hero · hands on the phrase'],['page:canlah-core','02 Core · same words, new world'],['page:canlah-recovery','03 Recovery · interpretation stays open']];
 const data=[
 ['Ready to play','seat',0,35,'FRIEND: “Can save me a seat? I’m almost there.”','Your friend is on the way.','Drag words, or use Delivery + Play.','01 → 02 • No setup overlay; sound begins off.'],
 ['Bend the delivery','seat',0,80,'Same words. The lettering leans and firms up.','Delivery changed. Play this reading.','Drag right / ArrowRight on Delivery.','02 → 03 • No analysis; slider selects an authored take.'],
 ['Let the phrase go','seat',1,80,'Can lah.','“Steady. Coming now.” — a seat waits.','Release drag / press Play.','03 → 04 • Chair shifts; three abstract notes; caption persists.'],
 ['Carry the same words','rain',0,80,'BUDDY: “Still walk to the MRT? It’s raining.”','Two people, one umbrella.','Select Walk in rain / press 2.','04 → 05 • Serif/sans exchange roles; rain remains visible.'],
 ['A reluctant yes','rain',1,20,'In this scene: you agree, with some reluctance.','“Okay, share my umbrella.” — make room.','Move Delivery left; Play.','05 → 06 • Long spaced notes, umbrella makes room for two.'],
 ['Game for the walk','rain',1,85,'In this scene: you encourage the walk.','“Let’s go together.” — make room.','Move Delivery right; Play.','06 → 07 • Shorter notes; do not remove the rain.'],
 ['One step at a time','blocks',1,20,'TEAMMATE: “One more try? The demo is in ten minutes.”','“Okay. One step at a time.” — try together.','Select One more try / 3; softer; Play.','07 → 08 • Taller type and imperfect block tower; reassurance.'],
 ['Rally the team','blocks',1,85,'In this scene: you rally your teammate.','“Then we go again.” — try together.','Firm delivery; Play.','08 → 09 • Tower nudges, three ascending notes; no score.'],
 ['Leave interpretation open','rain',0,50,'These readings belong to these exchanges.','Particles have no one-to-one translation here.','Compare softer / firmer delivery.','09 → current scene • Continuous type bend; two authored take bands.'],
 ['Quiet is playable','seat',1,35,'Sound off • Motion off','“Thanks! See you soon.” — a seat waits.','Sound off; Still mode; keyboard Play.','10 → current scene • Static prop result and text remain; no permission.'],
 ['A cancelled gesture','blocks',0,35,'Drag interrupted: still the same scene.','Gesture cancelled. Play when you are ready.','Pointer cancellation / move focus to Delivery.','11 → 07/08 • Cancel never commits play; no lost progress.'],
 ['The small ending','seat',1,35,'Same words. Three exchanges.','Play another reading.','Play all three; Reset / R to begin again.','12 → 01 • Inline ending and three filled dots; no result grade.']
 ];
 let shapes=[],parent,serial=0;
 const id=kind=>'shape:canlah-'+kind+'-'+(++serial);
 function txt(x,y,s,w=600,size='s',color='black',scale=1,font='sans') {const i=id('text');shapes.push({id:i,type:'text',parentId:parent,x,y,props:{richText:rt(s),w,autoSize:false,size,color,font,scale}});return i;}
 function geo(x,y,w,h,kind='rectangle',color='black',fill='none',label=''){const i=id('geo');shapes.push({id:i,type:'geo',parentId:parent,x,y,props:{geo:kind,w,h,color,fill,dash:'solid',size:'s',font:'sans',richText:rt('')}});if(label)txt(x+8,y+5,label,w/.72-16,'s',color,.72);return i;}
 function arr(x,y,dx,dy,color='black'){shapes.push({id:id('arrow'),type:'arrow',parentId:parent,x,y,props:{start:{x:0,y:0},end:{x:dx,y:dy},color,size:'s',dash:'solid',arrowheadEnd:'arrow'}});}
 function chair(x,y,active){geo(x,y,47,43);geo(x-6,y+44,60,6,'rectangle','black','solid');geo(x,y+50,4,27,'rectangle','black','solid');geo(x+43,y+50,4,27,'rectangle','black','solid');if(active)arr(x-45,y+39,34,0,'green');}
 function umbrella(x,y,active){geo(x,y,74,42,'oval','blue','semi');geo(x+36,y+35,3,47,'rectangle','black','solid');geo(x+35,y+72,22,18,'ellipse');if(active){geo(x-3,y+69,15,15,'ellipse','black','semi');geo(x+18,y+69,15,15,'ellipse','black','semi');arr(x-39,y+68,22,0,'blue');}[[2,-22],[58,-19],[-35,30],[94,45]].forEach(([a,b])=>arr(x+a,y+b,-8,12,'blue'));}
 function blocks(x,y,active){geo(x,y+68,47,34,'rectangle','orange','semi');geo(x+8,y+31,47,34,'rectangle','orange','semi');geo(x+(active?-3:17),y-6,47,34,'rectangle','orange','semi','×');if(active)arr(x+84,y+23,-29,-11,'orange');}
 function scene(d,n){const [title,kind,active,tone,copy,reaction,input,next]=d;parent='shape:canlah-frame-'+n;const px=((n-1)%2)*780,py=130+Math.floor(((n-1)%4)/2)*635;
 shapes.push({id:parent,type:'frame',x:px,y:py,props:{w:735,h:482,name:String(n).padStart(2,'0')+' / '+title,color:kind==='seat'?'green':kind==='rain'?'blue':'orange'}});
 txt(22,16,'CAN LAH!   /   '+String(n).padStart(2,'0')+'   '+title,780,'m','black',.88);
 txt(24,52,'Culture × Tech    •    phrase instrument    •    authored scene',1000,'s','grey',.65);
 ['Save a seat','Walk in rain','One more try'].forEach((t,i)=>geo(24+i*227,81,211,29,'rectangle',(kind==='seat'?0:kind==='rain'?1:2)===i?'black':'grey',(kind==='seat'?0:kind==='rain'?1:2)===i?'semi':'none',t));
 txt(24,124,kind==='seat'?'FRIEND  “Can save me a seat?”':kind==='rain'?'BUDDY  “Still walk? It’s raining.”':'TEAMMATE  “One more try?”',880,'s','black',.85);
 const color=kind==='seat'?'light-green':kind==='rain'?'light-blue':'light-red';geo(23,164,689,195,'rectangle',color,'solid');
 txt(35,173,'02 / BEND THE DELIVERY',400,'s','black',.6);txt(606,173,'TAKE '+(active?'02':'01'),160,'s','black',.6);
 txt(101,199,'Can',320,'xl','black',2.65,kind==='rain'?'serif':'sans');
 const phraseid=txt(kind==='blocks'?335:354,205,'lah.',340,'xl','black',2.65,kind==='seat'?'serif':'sans');
 const phrase=shapes.find(s=>s.id===phraseid);phrase.rotation=(tone-50)/650;
 if(kind==='seat')chair(601,234,active);if(kind==='rain')umbrella(592,227,active);if(kind==='blocks')blocks(601,213,active);
 if(n===2){arr(265,339,150,0,'green');}else if(n===3){arr(558,279,0,-39,'green');}else txt(39,335,'← drag words / release →',460,'s','black',.65);
 txt(28,375,reaction,760,'s','black',.88);geo(30,424,10,10,'ellipse','black',n===12?'solid':'none');geo(51,424,10,10,'ellipse','black',n===12?'solid':'none');geo(72,424,10,10,'ellipse','black',n===12?'solid':'none');
 geo(378,421,230,3,'rectangle','grey','solid');geo(378+tone*2.16,414,16,16,'ellipse','black','solid');txt(378,443,'SOFTER                 FIRMER',430,'s','grey',.6);geo(644,406,46,46,'ellipse','black','semi','▶');
 if(n===10){txt(27,449,'SOUND OFF / MOTION OFF',390,'s','blue',.65);}if(n===11){arr(573,350,-33,-16,'orange');txt(546,334,'CANCEL',170,'s','orange',.6);}
 parent=undefined;
 txt(px+8,py+495,'INPUT  '+input,1020,'s','blue',.72);
 txt(px+8,py+525,'PERFORMANCE  '+copy,1020,'s','black',.7);
 txt(px+8,py+555,'STATE  '+next,1040,'s','grey',.69);
 if(n%2===1)arr(px+741,py+241,33,0,'grey');
 }
 pages.forEach(([p,name],pidx)=>{if(e.getPage(p))e.updatePage({id:p,name});else e.createPage({id:p,name});e.setCurrentPage(p);const owned=e.getCurrentPageShapes().filter(s=>s.id.startsWith('shape:canlah-'));if(owned.length)e.deleteShapes(owned.map(s=>s.id));shapes=[];parent=undefined;txt(0,0,pidx===0?'CAN LAH! — Hands on the phrase':pidx===1?'Same words. A different exchange.':'A reading, not a verdict.',1950,'xl','black',1.12);txt(0,64,['01–04 · first gesture and context swap. Read left → right, then next row.','05–08 · two authored delivery bands per situation; continuous typographic bend.','09–12 · ambiguity, quiet play, cancellation, and an inline ending.'][pidx],2150,'s','grey',.87);data.slice(pidx*4,pidx*4+4).forEach((d,i)=>scene(d,pidx*4+i+1));txt(0,1403,'PRODUCTION: No microphone, pitch analysis, universal particle gloss, or accent score. Sound = optional abstract synth cues.',2300,'s','black',.82);e.createShapes(shapes);e.zoomToFit();});
 e.setCurrentPage(pages[0][0]);e.selectNone();e.zoomToFit();return {pages:pages.map(p=>p[0]),frames:12,ownedShapes:e.getPages().filter(p=>p.id.startsWith('page:canlah-')).map(p=>({page:p.id,count:e.getPageShapeIds(p.id).size}))};
})()
