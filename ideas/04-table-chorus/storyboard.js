/* Replay in tldraw exec with editor/toRichText, or in T3 with window.editor.
   Only replaces shape:tc04-*; 3 pages, editable primitives, 12 frames. */
(() => {
  const e=typeof editor!=='undefined'?editor:window.editor;
  const rt=typeof toRichText!=='undefined'?toRichText:s=>({type:'doc',content:String(s).split('\n').map(t=>({type:'paragraph',content:t?[{type:'text',text:t}]:[]}))});
  if(!e)throw Error('Open the Table Chorus board first.');
  const pages=[['page:page','01 Hero · an invitation'],['page:tc04-core','02 Core · a table portrait'],['page:tc04-recovery','03 Recovery · everyone can play']];
  const scenes=[
    ['01 Arrive first','You arrive first. Save yourself a place.','Click Place a tissue.','One packet saves your place; does not own the table.','empty'],
    ['02 A packet speaks','A little packet can speak for a person.','Click Pass to your neighbour.','Soft low note; same top-down view.','chope'],
    ['03 Ask, don’t assume','Neighbour: “Is this seat taken?”','Read the authored question; click the invitation.','No automatic arrival or implied consent.','ask'],
    ['04 Make room','Only this one. Please join.','Move your packet to your side; leave a seat.','The invitation opens a second place and note.','invite'],
    ['05 A second note','You make room. Someone brings a second note.','Pass device; drag the guest cup, or use button.','Distance connects cups; a faint line shows a reply.','apart'],
    ['06 Common ground','Two cups. A conversation.','Slide the guest cup within 185 units of yours.','Paired notes; cup rings remain at actual positions.','near'],
    ['07 Your tap, their reply','You: “ting.” / Neighbour: “tang.”','Take turns; tap saucer three times, no timing test.','Each tap adds an authored mark to the smile.','tap'],
    ['08 A place becomes a face','A place became a face.','Click Clear & keep our table; download SVG.','Objects clear; rings are eyes, exchanged taps a smile.','face'],
    ['09 Too far / outside table','Slide closer; the cups answer each other.','Drag away or outside; cup stays on table.','No penalty; move nearer or use slide button → 06.','far'],
    ['10 Sound unavailable','Sound unavailable','Continue using captions and visual marks.','All state changes work with sound off → same frame.','mute'],
    ['11 A quieter gesture','Take turns tapping the saucer. No timing test.','Tab → cup; arrows/Enter. Saucer: Enter/Space.','Less motion removes transitions; no time gate → 07.','keys'],
    ['12 Make room again','You arrive first. Save yourself a place.','Reset from any state, or Make room again.','Clear cup position/traces/taps; keep sound choice → 01.','reset']
  ];
  let shapes=[],parent,serial=0;
  const id=()=>`shape:tc04-${serial++}`;
  function text(x,y,t,w=540,size='s',color='black',scale=.78){shapes.push({id:id(),type:'text',parentId:parent,x,y,props:{richText:rt(t),w:w/scale,autoSize:false,size,font:'sans',color,scale}})}
  function geo(x,y,w,h,color='black',fill='none',kind='rectangle',dash='solid'){shapes.push({id:id(),type:'geo',parentId:parent,x,y,props:{geo:kind,w,h,color,fill,dash,size:'s'}})}
  function arrow(x,y,dx,dy,color='green'){shapes.push({id:id(),type:'arrow',parentId:parent,x,y,props:{start:{x:0,y:0},end:{x:dx,y:dy},color,size:'s',arrowheadEnd:'arrow',dash:'solid'}})}
  function cup(x,y,color){geo(x+25,y+10,17,17,'black','none','ellipse');geo(x,y,34,34,color,'solid','ellipse');geo(x+5,y+5,24,24,'black','semi','ellipse')}
  function packet(x,y){geo(x,y,62,35,'green','semi');geo(x+19,y-9,21,17,'grey','semi');text(x+8,y+8,'chope',75,'s','green',.6)}
  function illustration(k){
    geo(42,91,526,234,'green','none','ellipse');geo(55,101,500,214,'orange','semi','ellipse');
    text(205,112,'TABLE 04',240,'s','green',.65);
    geo(157,308,79,39,'orange','semi');geo(400,308,79,39,'green', ['empty','chope','ask','reset'].includes(k)?'none':'semi','rectangle',['empty','chope','ask','reset'].includes(k)?'dashed':'solid');
    text(164,316,'you',100,'s','black',.61);text(406,316,['empty','chope','ask','reset'].includes(k)?'free seat':'neighbour',110,'s','black',.56);
    const two=!['empty','chope','ask','reset'].includes(k),near=['near','tap','face','keys'].includes(k),bx=near?334:446;
    if(k==='face'){
      geo(217,173,43,43,'red','none','ellipse');geo(bx-5,173,43,43,'green','none','ellipse');
      shapes.push({id:id(),type:'arrow',parentId:parent,x:237,y:234,props:{start:{x:0,y:0},end:{x:bx+16-237,y:0},bend:36,color:'red',size:'m',arrowheadStart:'none',arrowheadEnd:'none',dash:'solid'}});
      text(199,281,'WE MADE ROOM.',310,'s','green',.67);text(373,141,'KEEP OUR TABLE\nSVG keepsake',160,'s','green',.61);
    }else{
      cup(222,173,'red');if(two)cup(bx,173,'green');
      if(!['empty','reset'].includes(k))packet(['chope','ask'].includes(k)?289:110,['chope','ask'].includes(k)?230:223);
      geo(446,256,39,39,'black','none','ellipse');geo(454,264,23,23,'green','none','ellipse');
      if(near){arrow(264,195,bx-276,0);geo(216,166,45,45,'red','none','ellipse','dotted');geo(bx-5,166,45,45,'green','none','ellipse','dotted')}
      if(k==='tap'||k==='keys'){arrow(499,247,-22,24,'red');text(285,260,'ting ↔ tang',195,'s','red',.72)}
      if(k==='apart'){arrow(419,220,-88,0);text(312,243,'slide closer',190,'s','green',.65)}
      if(k==='far'){arrow(345,220,74,0,'red');text(302,260,'no connection yet',245,'s','red',.6)}
    }
    if(k==='ask'){text(332,140,'Is this seat\ntaken?',206,'s','black',.71);arrow(384,180,44,132)}
    if(k==='invite'){arrow(280,249,-81,0);arrow(384,280,55,32);text(315,152,'Please join.',214,'s','green',.76)}
    if(k==='mute'){text(309,139,'Sound unavailable',270,'s','red',.7);text(291,233,'captions + marks stay',270,'s','green',.65)}
    if(k==='keys'){text(289,139,'← →  / Enter\nLess motion',240,'s','green',.66)}
    if(k==='reset'){arrow(301,249,-55,-35);text(317,221,'Reset ↻',165,'s','green',.7)}
  }
  for(const [pid,name] of pages){if(e.getPages().some(p=>p.id===pid))e.updatePage({id:pid,name});else e.createPage({id:pid,name});}
  pages.forEach(([pid,name],p)=>{e.setCurrentPage(pid);const old=e.getCurrentPageShapes().filter(s=>s.id.startsWith('shape:tc04-'));if(old.length)e.deleteShapes(old.map(s=>s.id));shapes=[];parent=undefined;
    text(0,0,'TABLE CHORUS / '+name,1400,'xl','green',1.05);text(0,68,p===0?'Culture × Tech · One table. Reservation becomes invitation.':p===1?'Everyday objects become a social instrument; their traces become a keepsake.':'Return branches preserve participation; sound, precision and speed are optional.',1410,'s','black',.93);
    for(let n=0;n<4;n++){let s=scenes[p*4+n];parent=`shape:tc04-frame-${p*4+n+1}`;shapes.push({id:parent,type:'frame',x:(n%2)*670,y:145+Math.floor(n/2)*550,props:{w:620,h:515,name:s[0],color:p===2?'red':'green'}});text(18,13,s[0],570,'m','black',.88);text(18,48,'TOP-DOWN · SAME TABLE / STATE '+String(p*4+n+1).padStart(2,'0'),580,'s','grey',.61);illustration(s[4]);text(22,365,s[1],570,'s','black',.8);text(22,408,'INPUT  '+s[2],575,'s','blue',.71);text(22,459,'NEXT  '+s[3],575,'s','grey',.69);parent=undefined;}
    text(0,1240,p===0?'PRODUCTION · Scripted dialogue, real local gestures. Seat is only shared after asking and an explicit invitation.':p===1?'PRODUCTION · Actual cup coordinates drive ring positions. Smile is authored. No live audio capture or AI inference.':'PRODUCTION · Pointer, buttons and keyboard share state. SVG download is local. Reset leaves preferences intact.',1320,'s','grey',.78);
    e.createShapes(shapes);e.selectNone();e.zoomToFit();
  });e.setCurrentPage(pages[0][0]);e.zoomToFit();return {pages:pages.map(p=>p[1]),frames:12,totalShapes:e.store.allRecords().filter(r=>r.typeName==='shape'&&r.id.startsWith('shape:tc04-')).length};
})()
