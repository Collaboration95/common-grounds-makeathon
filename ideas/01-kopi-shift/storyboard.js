/* Replay via tldraw exec (editor, toRichText) or T3 preview_evaluate.
   Only idea-specific shapes are replaced. Existing unrelated content survives.
   12 editable scenes / 3 pages. No bitmap scene assets. */
(() => {
 const e = typeof editor !== 'undefined' ? editor : window.editor;
 if (!e) throw Error('Open this concept board in tldraw first.');
 const rt = typeof toRichText !== 'undefined' ? toRichText : s=>({type:'doc',content:String(s).split('\n').map(t=>({type:'paragraph',content:t?[{type:'text',text:t}]:[]}))});
 const pages=[['page:ks01-hero','01 · Hero / words become objects'],['page:ks01-core','02 · Core / mix and compare'],['page:ks01-recovery','03 · Recovery / patient counter']];
 const scenes=[
 {n:1,title:'The whole toy, already here',kind:'hero',copy:'Some words you pour. Some words you leave out.',input:'Read two scripted hot orders. No start form.',next:'Lift the silver KOPI pot.',note:'Fixed counter. Two cups, three ingredients, one spoon. No camera cuts.'},
 {n:2,title:'Lift a labelled object',kind:'lift',copy:'Selected brewed coffee. Choose cup 01 (A) or 02 (B).',input:'Drag pot; or 1 then A. Tab + Enter also works.',next:'Pot tips over cup 01; one symbolic addition.',note:'Pointer threshold separates click from drag. Off-cup release changes nothing.'},
 {n:3,title:'The word pours',kind:'pour',copy:'Coffee added to cup 1.',input:'Release pot over cup 01.',next:'Kopi peels off ticket and settles on the liquid.',note:'A flying word is decoration. Ingredient state updates once, independently.'},
 {n:4,title:'An ingredient-shaped absence',kind:'absence',copy:'Kosong · sugar left out',input:'Leave sugar and milk untouched. Serve 1.',next:'Cup 01 accepted without ceremonial stirring.',note:'Dashed sugar cube remains OUTSIDE the cup. It is not an ingredient.'},
 {n:5,title:'C becomes its milk',kind:'milk',copy:'C → evaporated milk · sugar included',input:'3 then B; milk may enter before the coffee.',next:'C drops from the ticket toward the milk surface.',note:'Only evaporated milk is an available milk in this minimum. No generic creamer.'},
 {n:6,title:'Build the contrast',kind:'build',copy:'coffee + sugar + evaporated milk',input:'1 then B; 2 then B. Order of additions is flexible.',next:'Cup 02 becomes caramel coloured; needs a stir.',note:'One symbolic addition per type. Repeated addition is a no-op with feedback.'},
 {n:7,title:'Stir is the punctuation',kind:'stir',copy:'Cup 2 stirred. Ready to check the order.',input:'Drag spoon; or 4 then B.',next:'A pale spiral joins the letters. Serve 2.',note:'Any addition after stirring clears mixed state. Sound optional, no timing gate.'},
 {n:8,title:'Two cups, two meanings',kind:'ending',copy:'Two cups. Two meanings. “Thanks — that’s just how I like it.”',input:'Read results; optionally Try Kopi-O in cup 01.',next:'O transfer task or Reset counter.',note:'Ending sits inside the same counter. Kopi-O = coffee + sugar, no milk.'},
 {n:9,title:'Milk is not specified',kind:'ambiguity',copy:'Scripted unclear order: “Coffee with milk.” Which milk?',input:'Unclear order sample. Select written clarification.',next:'Same cup 02, clarified Kopi-C. No automatic guess.',note:'Authored ambiguity, not speech recognition. Cup is retained while blocked.'},
 {n:10,title:'The wrong pour stays wrong',kind:'wrong',copy:'Kopi-O Kosong needs no sugar. Use New cup.',input:'Pour sugar into cup 01; Serve 1.',next:'New cup → Discard & replace? → fresh cup, same ticket.',note:'Never animate mixed ingredients disappearing. No reward, no lost customer.'},
 {n:11,title:'The counter waits',kind:'access',copy:'Selection cancelled. Your cups are unchanged.',input:'Esc; hide meanings; enable Reduce motion. Replay text anytime.',next:'Keyboard or pointer keeps building existing cup.',note:'Subtitles always visible. No microphone, AI or network dependency in toy.'},
 {n:12,title:'Try O, then close the shift',kind:'transfer',copy:'Kopi-O: black coffee with sugar.',input:'Try Kopi-O in cup 01; hide meanings; coffee + sugar, stir, serve.',next:'Complete in the same scene. Reset is available.',note:'Transfer is optional. Three meanings supported; no claim of lasting mastery.'}
 ];
 let shapes=[],parent,serial=0,frameNo=0;
 const sid=k=>'shape:ks01-'+frameNo+'-'+k+'-'+(++serial);
 const text=(x,y,s,w=600,size='s',color='black',scale=.8)=>{let id=sid('text');shapes.push({id,type:'text',parentId:parent,x,y,props:{richText:rt(s),w,autoSize:false,size,font:'sans',color,scale}});return id};
 const geo=(x,y,w,h,color='black',fill='none',kind='rectangle',label='',dash='solid')=>{let id=sid('geo');shapes.push({id,type:'geo',parentId:parent,x,y,props:{geo:kind,w,h,color,fill,dash,size:'s',font:'sans',richText:rt(label)}});return id};
 const arrow=(x,y,dx,dy,color='red')=>shapes.push({id:sid('arrow'),type:'arrow',parentId:parent,x,y,props:{start:{x:0,y:0},end:{x:dx,y:dy},color,size:'m',arrowheadEnd:'arrow',dash:'solid'}});
 const cup=(x,y,milk=false,coffee=false,tag='01')=>{geo(x+68,y+18,32,35,'black','none','ellipse');geo(x-12,y+70,106,15,'grey','semi','ellipse');geo(x,y,77,76,'black','semi');geo(x,y-5,77,23,'black','semi','ellipse');if(coffee)geo(x+7,y,63,15,milk?'orange':'black','solid','ellipse');text(x+20,y+31,tag,100,'s','green',.8);if(coffee)text(x+12,y-1,milk?'K · C':'Kopi',100,'s',milk?'black':'white',.6)};
 const pot=(x,y,lift=false)=>{geo(x+62,y+18,25,43,'black','none','ellipse');geo(x-13,y+16,23,24,'grey','semi','triangle');geo(x,y,68,86,'grey','semi','trapezoid');geo(x+6,y-4,56,13,'black','semi','ellipse');geo(x+7,y+28,54,30,'black','semi');text(x+11,y+31,'KOPI',110,'s','black',.75);if(lift)arrow(x+90,y+40,287,8,'red')};
 const can=(x,y,name,color='orange')=>{geo(x,y,66,72,color,'semi');geo(x,y-5,66,13,'black','semi','ellipse');text(x+5,y+22,name,90,'s','black',.65)};
 function scene(s){
  geo(18,63,684,329,'yellow','semi');geo(18,192,684,64,'light-green','solid');
  for(let x=18;x<702;x+=42)geo(x,194,40,60,'green','none');
  geo(18,251,684,128,'green','solid');text(38,82,'KOPI SHIFT',480,'xl','green',.8);text(38,130,'Some words you pour.\nSome words you leave out.',370,'s','black',.75);
  geo(421,82,128,105,'black','semi');geo(560,82,128,105,'black','semi');
  text(433,91,s.kind==='transfer'?'Kopi-O':'Kopi-O\nKosong',180,'m','black',.75);text(433,151,s.kind==='transfer'?'sugar · no milk':'no sugar · no milk',165,'s','black',.52);
  text(573,91,'Kopi-C',170,'m','black',.8);text(573,132,'evaporated milk\n+ sugar',170,'s','black',.58);
  pot(48,253,s.kind==='lift');can(150,268,'SUGAR');can(242,259,'C\nEVAP.','red');
  const firstFull=!['hero','lift'].includes(s.kind),secondFull=['build','stir','ending','transfer','access'].includes(s.kind),secondMilk=['milk','build','stir','ending','transfer'].includes(s.kind);
  cup(443,264,false,firstFull,'01');cup(582,264,secondMilk,secondFull||secondMilk,'02');
  text(41,354,'1 coffee   2 sugar   3 milk   4 spoon',450,'s','black',.65);
  if(s.kind==='pour'){text(363,217,'Kopi',160,'m','red',.95);arrow(411,157,48,106);arrow(120,280,306,12,'orange')}
  if(s.kind==='absence'||s.kind==='hero'){geo(430,359,23,23,'black','none','rectangle','','dashed');text(460,357,'no sugar',150,'s','black',.56);arrow(494,170,-50,180,'red')}
  if(s.kind==='milk'){text(540,211,'C',100,'xl','red',1);arrow(602,163,7,97);arrow(314,281,245,17,'orange')}
  if(s.kind==='build'){geo(609,271,24,24,'orange','semi');arrow(220,281,370,14);text(580,349,'Stir next',150,'s','black',.6)}
  if(s.kind==='stir'){geo(589,235,77,40,'orange','none','ellipse');arrow(639,251,-15,26,'orange');geo(615,199,7,86,'grey','solid');text(43,217,'mix after the last addition',450,'s','black',.7)}
  if(s.kind==='ending'){geo(423,205,254,37,'green','semi','rectangle','TWO CUPS. TWO MEANINGS.');arrow(490,301,0,-47,'orange');arrow(622,301,0,-47,'orange')}
  if(s.kind==='ambiguity'){geo(347,207,340,66,'red','semi');text(357,213,'“Coffee with milk.”\nWhich milk?',430,'s','black',.73);arrow(513,187,0,18);text(38,217,'CUP STATE HELD',310,'s','red',.7)}
  if(s.kind==='wrong'){geo(463,275,23,23,'orange','solid');arrow(217,296,229,-9);geo(410,202,276,48,'red','semi');text(418,211,'No sugar. Fresh cup?',400,'s','red',.82)}
  if(s.kind==='access'){geo(339,207,342,51,'blue','semi');text(350,216,'1 → A / B   ·   Esc   ·   Reduce motion',430,'s','black',.72);text(444,359,'Actual contents always visible',320,'s','black',.52)}
  if(s.kind==='transfer'){text(42,212,'MEANINGS HIDDEN · TRY O',420,'s','green',.75);arrow(216,291,207,0);geo(464,275,19,19,'orange','solid')}
 }
 for(const [id,name] of pages){if(e.getPages().some(p=>p.id===id))e.updatePage({id,name});else e.createPage({id,name})}
 for(let p=0;p<3;p++){
  e.setCurrentPage(pages[p][0]);let old=e.getCurrentPageShapes().filter(s=>s.id.startsWith('shape:ks01-'));if(old.length)e.deleteShapes(old.map(s=>s.id));shapes=[];parent=pages[p][0];frameNo='page'+p;serial=0;
  text(0,0,pages[p][1],1450,'xl','green',1);text(0,68,'KOPI SHIFT / CULTURE × TECH / EDITABLE CUT-PAPER COUNTER',1700,'s','black',.8);
  scenes.slice(p*4,p*4+4).forEach((s,i)=>{
   serial=0;frameNo=s.n;parent=pages[p][0];const x=(i%2)*800,y=140+Math.floor(i/2)*625;
   const frameId='shape:ks01-frame-'+s.n;shapes.push({id:frameId,type:'frame',parentId:parent,x,y,props:{w:730,h:565,name:String(s.n).padStart(2,'0')+' / '+s.title,color:p===2?'red':'green'}});parent=frameId;
   text(18,16,String(s.n).padStart(2,'0')+'  '+s.title,900,'m','black',.95);scene(s);
   text(20,407,'ON SCREEN  '+s.copy,890,'s','black',.74);text(20,448,'INPUT  '+s.input,890,'s','blue',.71);text(20,483,'NEXT  '+s.next,890,'s','green',.71);text(20,521,'BUILD  '+s.note,980,'s','grey',.65);parent=pages[p][0];
  });e.createShapes(shapes);e.selectNone();e.zoomToFit();
 }
 e.setCurrentPage(pages[0][0]);
 // This new concept board's empty starter page contains no work.
 const starter=e.getPages().find(p=>p.id==='page:page'&&p.name==='Page 1');
 if(starter && !e.store.allRecords().some(r=>r.typeName==='shape'&&r.parentId===starter.id)) e.deletePage(starter.id);
 e.selectNone();e.zoomToFit();
 return {pages:pages.map(p=>({id:p[0],name:p[1]})),frameCount:12,shapeCount:e.getCurrentPageShapes().length};
})()
