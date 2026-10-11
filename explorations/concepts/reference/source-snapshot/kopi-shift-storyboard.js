/* Editable tldraw storyboard. Run in the target tldraw editor's browser context.
 * Creates only Kopi Shift pages/shapes; rerunning replaces only these shapes.
 * Source companion to design-idea-2.md. */
(() => {
  const e = window.editor;
  if (!e) throw new Error('Open the tldraw board before running this script.');
  const rt = s => ({type:'doc',content:String(s).split('\n').map(t=>({type:'paragraph',content:t?[{type:'text',text:t}]:[]}))});
  const pages = [
    ['page:page','00 Concept and reading map'],
    ['page:kopi-01','01 Open the stall · shots 01–06'],
    ['page:kopi-02','02 First cup · shots 07–12'],
    ['page:kopi-03','03 Learn the difference · shots 13–18'],
    ['page:kopi-04','04 Mistakes and recovery · shots 19–24'],
    ['page:kopi-05','05 Tea and toast later · shots 25–30']
  ];
  const scenes = [
    {id:1,title:'Your name on the apron',kind:'start',shot:'FRONT / TITLE',say:'KOPI SHIFT — your first morning behind the counter',action:'Enter name; choose Coached or Independent; Open stall.',result:'Both modes are available immediately. Name may be skipped.',scope:'CORE'},
    {id:2,title:'The shutter goes up',kind:'shutter',shot:'WIDE / ESTABLISH',say:'A new morning at a neighbourhood kopi stall.',action:'Open the shutter; a brief street ambience fades in.',result:'Cut to your side of the counter. No cassette or 3D prologue.',scope:'CORE'},
    {id:3,title:'Meet your workbench',kind:'station',shot:'OVER COUNTER',say:'Mentor: “I’ll show you around. One order at a time.”',action:'See coffee, sugar, two distinct milk cans, cups and spoon.',result:'Labels and stable positions make each ingredient recognisable.',scope:'CORE'},
    {id:4,title:'First customer speaks',kind:'customer',shot:'MEDIUM / EYELINE',say:'Customer: “One Kopi-O Kosong, please.”',action:'Hear the recorded order; read its matching subtitle.',result:'A ticket stays pinned. Replay is always available.',scope:'CORE'},
    {id:5,title:'Decode the order',kind:'decode',shot:'INSERT / TICKET',say:'Mentor: “O: black coffee. Kosong: no added sugar.”',action:'Coached mode reveals coffee ✓ / milk — / sugar —.',result:'Independent mode keeps the local order; no ingredient solution.',scope:'CORE'},
    {id:6,title:'Ask a question in your words',kind:'ask',shot:'HOLD / OPTIONAL',say:'Player: “Does kosong mean no milk?”',action:'Type a question or opt into the microphone; review heard text.',result:'Mentor explains: kosong is no added sugar; O makes this black.',scope:'AI HELP'},
    {id:7,title:'Place an empty cup',kind:'cup',shot:'CLOSE / HANDS',say:'Mentor: “Start with an empty cup.”',action:'Select a cup and place it on the marked preparation spot.',result:'A cup must exist before adding ingredients.',scope:'CORE'},
    {id:8,title:'Pour the coffee',kind:'pour',shot:'CLOSE / POUR',say:'A short pour, a soft clink, a curl of steam.',action:'Select the coffee pot, then the cup: one measured portion.',result:'Cup contents: coffee. Equivalent valid assembly paths work.',scope:'CORE'},
    {id:9,title:'Knowing what to leave out',kind:'inspect',shot:'INSERT / CONTENTS',say:'Kopi-O Kosong: coffee; no added milk or sugar.',action:'Check the cup. Leave both milk cans and sugar untouched.',result:'Choosing to omit ingredients is the learning moment.',scope:'CORE'},
    {id:10,title:'Slide the cup across',kind:'serve',shot:'COUNTER / SERVE',say:'Your first cup is ready.',action:'Press Serve or slide the cup into the serving zone.',result:'Recipe validator checks the cup once; serving animation follows.',scope:'CORE'},
    {id:11,title:'The order makes sense',kind:'success',shot:'REACTION / PAYOFF',say:'Customer: “Yes, that’s mine. Thank you!”',action:'See the local phrase beside the finished cup.',result:'A brief explanation connects the name to what you made.',scope:'CORE'},
    {id:12,title:'A different milk order',kind:'customerC',shot:'MEDIUM / RESET',say:'Next customer: “One Kopi-C, please.”',action:'A fresh ticket replaces the first; prepare a new cup.',result:'Same counter, new distinction. No new scene system needed.',scope:'CORE'},
    {id:13,title:'Which milk is C?',kind:'milk',shot:'INSERT / TWO CANS',say:'Mentor: “C uses evaporated milk.”',action:'Choose the labelled evaporated-milk can, not condensed milk.',result:'Different labels and silhouettes; colour is only a second cue.',scope:'CORE'},
    {id:14,title:'Build the second recipe',kind:'recipeC',shot:'CLOSE / INGREDIENTS',say:'For this stall: coffee + evaporated milk + sugar.',action:'Add one game portion of each required ingredient.',result:'Quantities are a teaching abstraction, not a universal recipe.',scope:'CORE'},
    {id:15,title:'Stir, then serve',kind:'stir',shot:'CLOSE → REACTION',say:'The spoon turns; the drink changes colour.',action:'Mix after the final addition, then Serve.',result:'If you add more later, mix again. Never require pointless steps.',scope:'CORE'},
    {id:16,title:'Try one without the coach',kind:'independent',shot:'SAME COUNTER',say:'Customer: “Kopi-O, please.”',action:'Independent mode removes highlights and recipe breakdowns.',result:'Ticket, labels, replay and optional help remain. No timer.',scope:'CORE'},
    {id:17,title:'Understand, then make',kind:'solo',shot:'CLOSE / TRANSFER',say:'Player chooses coffee and sugar; leaves out milk.',action:'Build and serve without an automatic next-step prompt.',result:'Correct cup succeeds; mismatch branches to shot 19 or 21.',scope:'CORE'},
    {id:18,title:'Close your first shift',kind:'recap',shot:'WIDE / BOOKEND',say:'Mentor: “Three orders. You know what goes into them.”',action:'Review recipe cards, replay either mode, or choose a later lesson.',result:'This is the complete demo ending. Tea and toast are optional.',scope:'CORE'},
    {id:19,title:'Wrong ingredient reaches cup',kind:'wrong',shot:'HOLD / SPECIFIC ERROR',say:'“This Kopi-C has condensed milk. It needs evaporated milk.”',action:'Coached: explain now. Independent: explain at Serve.',result:'Keep the ticket; offer a fresh cup and optional explanation.',scope:'RECOVERY'},
    {id:20,title:'Swap a can or start fresh',kind:'reset',shot:'CLOSE / RECOVERY',say:'An unpoured selection can be changed. A mixed cup needs a reset.',action:'Swap the selected can; or press New cup after confirming reset.',result:'Keep the customer. No magical removal of already mixed milk.',scope:'RECOVERY'},
    {id:21,title:'Incomplete or impossible action',kind:'missing',shot:'INSERT / CLEAR CAUSE',say:'“Kopi-O needs sugar.” / “Place a cup before pouring.”',action:'Missing ingredient: return to cup. Impossible action: do nothing.',result:'Preserve valid progress. Double-clicks must not add two portions.',scope:'RECOVERY'},
    {id:22,title:'Didn’t catch the order?',kind:'replay',shot:'MEDIUM / REPEAT',say:'Customer repeats the same authored order.',action:'Use Replay, read the ticket, or ask “Did you say Kopi-C?”',result:'Clarification does not invent or silently change the order.',scope:'RECOVERY'},
    {id:23,title:'Mic denied or help unavailable',kind:'offline',shot:'HOLD / HONEST STATUS',say:'“Couldn’t hear that. Type your question or use the guide.”',action:'Retry, type, or open approved help cards; customer stays.',result:'Offline help still works. No cup changes from a failed request.',scope:'RECOVERY'},
    {id:24,title:'Pause, switch mode, restart',kind:'pause',shot:'STILL / PAUSE CARD',say:'The stall waits for you.',action:'Resume; change guidance; or confirm Restart shift.',result:'Preserve cup on pause. Restart clears it and ignores old replies.',scope:'RECOVERY'},
    {id:25,title:'Later lesson: tea',kind:'teaorder',shot:'MEDIUM / NEW BASE',say:'Customer: “One Teh, please.”',action:'Introduce the tea vessel with its own label and silhouette.',result:'Reuse the order, cup and serving system; teach the new base.',scope:'LATER'},
    {id:26,title:'Make a milk tea',kind:'tea',shot:'CLOSE / TRANSFER',say:'Use this stall’s reviewed Teh recipe card.',action:'Tea + condensed milk + the stall’s stated sugar portion; mix.',result:'Distinguish tea from coffee. Sugar levels vary by stall.',scope:'LATER'},
    {id:27,title:'Later lesson: kaya toast',kind:'toastorder',shot:'MEDIUM → BENCH',say:'Customer: “Kaya toast with my kopi, please.”',action:'A two-item ticket opens the toast area beside the drinks.',result:'Track each item separately; keep the drink on the tray.',scope:'LATER'},
    {id:28,title:'Toast the bread',kind:'toast',shot:'CLOSE / TOASTER',say:'Bread goes in; toast comes out.',action:'Place bread, start the toaster, then lift the finished slices.',result:'Short authored animation; skip motion without skipping state.',scope:'LATER'},
    {id:29,title:'Kaya, butter, assemble',kind:'spread',shot:'TOP / HANDS',say:'Spread prepared kaya, add butter, and assemble the toast.',action:'Use labelled tools; assemble and cut for this stall’s serving.',result:'Kaya is not coffee creamer. Eggs would be a separate later side.',scope:'LATER'},
    {id:30,title:'A complete breakfast tray',kind:'combo',shot:'COUNTER → WIDE',say:'The familiar customer returns for breakfast.',action:'Serve only when both drink and toast match the ticket.',result:'Unlock another lesson. No cash economy or rush simulation yet.',scope:'LATER'}
  ];
  let shapes=[], parent, serial=0;
  const sid = prefix => 'shape:kopi-'+prefix+'-'+(++serial);
  function text(x,y,s,w=550,size='s',color='black',scale=.88){
    const id=sid('text');shapes.push({id,type:'text',parentId:parent,x,y,props:{richText:rt(s),w,autoSize:false,size,font:'sans',color,scale}});return id;
  }
  function box(x,y,w,h,label='',color='black',fill='none',geo='rectangle',dash='draw'){
    const id=sid('geo');shapes.push({id,type:'geo',parentId:parent,x,y,props:{geo,w,h,color,fill,dash,size:'s',font:'sans',richText:rt(label)}});return id;
  }
  function arrow(x,y,dx,dy,color='black'){
    const id=sid('arrow');shapes.push({id,type:'arrow',parentId:parent,x,y,props:{start:{x:0,y:0},end:{x:dx,y:dy},color,size:'s',arrowheadEnd:'arrow',dash:'draw'}});return id;
  }
  function label(x,y,w,h,s,color='black') {box(x,y,w,h,'',color,'semi');text(x+8,y+6,s,(w-16)/.72,'s',color,.72);}
  function cup(x=235,y=166,fill='black',tag='coffee'){
    box(x+65,y+17,32,35,'','black','none','ellipse');
    box(x,y,72,72,'','black','semi');
    if(fill!=='empty')box(x+6,y+22,59,40,'',fill,'pattern');
    box(x-8,y+72,91,9,'','grey','none','ellipse');
    if(tag)text(x-14,y+89,tag,150,'s','black',.64);
  }
  function person(x=94,y=109,color='black'){
    box(x+18,y,48,49,'',color,'none','ellipse');
    box(x,y+58,84,69,'',color,'none','trapezoid');
    box(x+31,y+20,3,3,'',color,'solid','ellipse');box(x+51,y+20,3,3,'',color,'solid','ellipse');
    box(x+31,y+36,23,2,'',color,'none');
  }
  function counter(){box(40,251,540,28,'','grey','pattern');}
  function can(x,y,name,color='blue',h=66){box(x,y,73,h,'',color,'none');box(x,y-5,73,12,'',color,'none','ellipse');text(x+3,y+12,name,100,'s',color,.64);}
  function pot(x,y,name='COFFEE',color='black'){
    box(x,y,72,83,'',color,'none','trapezoid');box(x+14,y-9,47,12,'',color,'none','ellipse');box(x+69,y+14,25,44,'',color,'none','ellipse');
    box(x-20,y+10,26,30,'',color,'none','triangle');text(x+5,y+31,name,100,'s',color,.63);
  }
  function ticket(s='Kopi-O\nKosong',x=388,y=88){label(x,y,170,75,s,'black');text(x+8,y+83,'Replay  ↻',190,'s','blue',.72);}
  function bubble(s,x=209,y=94,w=337){label(x,y,w,82,s,'black');arrow(x+26,y+82,-31,27,'grey');}
  function bench(){counter();pot(58,139);can(167,167,'SUGAR','orange',56);can(355,155,'COND.\nMILK','violet');can(460,155,'EVAP.\nMILK','blue');}
  function image(s){
    const k=s.kind;
    if(k==='start'){
      label(145,83,325,49,'KOPI SHIFT','green');label(161,148,294,38,'Name: Sam _','grey');
      label(89,205,192,39,'Coached ✓','green');label(325,205,192,39,'Independent','black');label(218,267,172,35,'OPEN STALL →','green');
    } else if(k==='shutter'){
      box(98,87,426,207);label(139,100,345,38,'MORNING KOPI','green');
      for(let i=0;i<5;i++)box(111,152+i*12,400,3,'','grey');arrow(543,230,0,-110,'green');
      text(193,242,'shutter lifting',300,'s','grey',.8);
    } else if(k==='station'){
      bench();text(43,84,'YOUR SIDE OF THE COUNTER',650,'s','green',.9);cup(269,163,'empty','cup spot');
      text(155,282,'Labels + shapes + consistent positions',570,'s','grey',.72);
    } else if(k==='customer'||k==='customerC'||k==='teaorder'||k==='toastorder'){
      person();counter();bubble(k==='customer'?'One Kopi-O Kosong, please.':k==='customerC'?'One Kopi-C, please.':k==='teaorder'?'One Teh, please.':'Kaya toast with my kopi, please.');
      label(289,196,254,40,'ORDER PINNED  /  REPLAY','blue');
    } else if(k==='decode'){
      label(55,86,237,67,'Kopi-O Kosong','green');arrow(304,119,77,0,'green');
      label(398,78,157,40,'coffee ✓','green');label(398,131,157,40,'milk —','grey');label(398,184,157,40,'sugar —','grey');
      text(67,245,'O = black     •     kosong = no added sugar',650,'s','black',.82);
    } else if(k==='ask'){
      label(50,83,506,55,'“Does kosong mean no milk?”','blue');label(50,154,506,66,'“Kosong means no added sugar.\nO makes this order black.”','green');
      label(62,249,196,35,'TYPE A QUESTION','blue');label(294,249,234,35,'MIC  /  ASK MENTOR','blue');
    } else if(k==='cup'){
      cup(72,161,'empty','cup shelf');arrow(187,197,161,0,'green');box(382,167,113,90,'','green','none','rectangle','dashed');text(383,270,'cup spot',170,'s','green',.75);
    } else if(k==='pour'){
      pot(87,93);arrow(181,163,60,47,'green');cup(252,186);ticket();
    } else if(k==='inspect'){
      cup(100,139);label(305,85,240,46,'Coffee ✓','green');label(305,142,240,46,'No milk ✓','green');label(305,199,240,46,'No added sugar ✓','green');
    } else if(k==='serve'){
      counter();cup(78,152);arrow(201,201,143,0,'green');box(386,186,164,49,'','green','none','ellipse');text(386,246,'serving zone',220,'s','green',.8);
    } else if(k==='success'){
      person(412,100,'green');bubble('“Thank you!”',71,85,280);cup(161,190);box(365,190,41,41,'','green','none','star');counter();
    } else if(k==='milk'){
      can(103,121,'CONDENSED\nsweetened','violet',108);can(389,121,'EVAPORATED\nfor Kopi-C','blue',108);
      box(367,99,119,151,'','green','none','rectangle','dashed');arrow(293,172,65,0,'green');text(89,263,'Look at the label, not just the colour.',620,'s','grey',.78);
    } else if(k==='recipeC'){
      pot(64,123);can(202,139,'EVAP.\nMILK','blue');can(332,155,'SUGAR','orange',56);cup(458,176,'orange','Kopi-C');arrow(395,195,45,0,'green');
    } else if(k==='stir'){
      cup(119,158,'orange','mix after additions');arrow(153,95,0,88,'blue');box(210,109,77,65,'','blue','none','ellipse');
      arrow(285,201,72,0,'green');label(387,172,164,54,'SERVE →','green');
    } else if(k==='independent'){
      bench();ticket('Kopi-O',225,77);label(47,284,197,29,'GUIDANCE OFF','grey');label(351,284,211,29,'ASK FOR HELP','blue');
    } else if(k==='solo'){
      pot(69,127);can(206,153,'SUGAR','orange',56);arrow(307,192,60,0,'green');cup(412,163);text(53,277,'No automatic answer reveal. Check only at Serve.',710,'s','grey',.74);
    } else if(k==='recap'){
      label(49,82,511,40,'FIRST SHIFT COMPLETE','green');
      ['O KOSONG\ncoffee','O\ncoffee + sugar','C\nevap. + sugar'].forEach((t,i)=>label(48+i*176,145,163,72,t,i===2?'blue':'black'));
      label(55,258,211,37,'REPLAY / CHANGE MODE','green');label(322,258,228,37,'TEA + TOAST LATER','violet');
    } else if(k==='wrong'){
      ticket('Kopi-C',371,83);cup(94,159,'violet','condensed added');label(283,216,281,78,'Milk mismatch:\nneeds evaporated','red');
      box(205,114,45,45,'','red','none','x-box');
    } else if(k==='reset'){
      can(57,124,'COND.','violet');arrow(158,157,54,0,'blue');can(245,124,'EVAP.','blue');text(54,218,'Before pouring: swap',370,'s','blue',.78);
      cup(445,110,'empty','fresh cup');label(344,246,215,40,'NEW CUP / KEEP TICKET','green');
    } else if(k==='missing'){
      cup(71,148);ticket('Kopi-O',354,84);label(276,205,278,70,'Missing: sugar\nReturn to this cup','red');arrow(251,239,-57,-26,'red');
    } else if(k==='replay'){
      person(68,117);bubble('“Kopi-C, please.”',201,87,349);label(269,224,244,46,'↻ REPEAT ORDER','blue');counter();
    } else if(k==='offline'){
      label(57,83,501,66,'Voice help unavailable.\nYour cup is still here.','red');
      label(57,178,501,47,'Type your question…','blue');label(58,255,217,37,'RETRY MIC','blue');label(324,255,234,37,'OPEN LOCAL GUIDE','green');
    } else if(k==='pause'){
      label(124,80,377,40,'PAUSED','grey');label(124,137,377,36,'RESUME','green');label(124,184,377,36,'CHANGE GUIDANCE','blue');label(124,231,377,36,'RESTART SHIFT → CONFIRM','red');
    } else if(k==='tea'){
      pot(62,123,'TEA','orange');can(203,143,'COND.\nMILK','violet');can(328,158,'SUGAR','orange',54);cup(459,176,'orange','Teh');
      text(66,278,'Stall recipe card defines the sugar portion.',680,'s','grey',.77);
    } else if(k==='toast'){
      box(61,141,101,69,'','orange');arrow(182,173,55,0,'green');box(268,119,162,118,'','grey','none');box(290,107,117,15,'','black');
      arrow(452,180,65,0,'green');box(531,149,42,62,'','orange','pattern');text(275,264,'Toast → lift',300,'s','grey',.8);
    } else if(k==='spread'){
      box(64,125,161,99,'','orange','pattern');can(280,139,'KAYA','green',65);label(427,141,133,51,'BUTTER','orange');arrow(259,169,-19,0,'green');
      text(72,265,'Prepared kaya + butter → assemble → cut',660,'s','black',.83);
    } else if(k==='combo'){
      box(69,114,480,151,'','green','none');cup(121,130,'orange','kopi');box(346,151,137,72,'','orange','pattern');box(412,151,2,72,'','black');
      label(69,277,480,32,'CHECK BOTH ITEMS → SERVE TOGETHER','green');
    }
  }
  function panel(s,index){
    const x=(index%3)*665,y=160+Math.floor(index/3)*555;
    const color=s.scope==='LATER'?'violet':s.scope==='RECOVERY'?'red':s.scope==='AI HELP'?'blue':'green';
    parent='shape:kopi-frame-'+s.id;
    shapes.push({id:parent,type:'frame',x,y,props:{w:620,h:510,name:String(s.id).padStart(2,'0')+' / '+s.title,color}});
    text(18,15,String(s.id).padStart(2,'0')+'  '+s.title,670,'m','black',.9);
    text(20,43,s.shot,700,'s','grey',.62);
    box(17,69,586,257,'','grey','none');
    image(s);
    text(20,343,s.say,659,'s','black',.84);
    text(20,401,'DO  '+s.action,659,'s','blue',.8);
    text(20,457,'THEN  '+s.result,690,'s','grey',.76);
    parent=undefined;
  }
  for(const [id,name] of pages){
    if(e.getPages().some(p=>p.id===id)) e.updatePage({id,name}); else e.createPage({id,name});
  }
  for(let p=0;p<pages.length;p++){
    e.setCurrentPage(pages[p][0]);
    const old=e.getCurrentPageShapes().filter(s=>s.id.startsWith('shape:kopi-'));
    if(old.length)e.deleteShapes(old.map(s=>s.id));
    shapes=[];parent=undefined;
    if(p===0){
      text(0,0,'KOPI SHIFT',1200,'xl','green',1.55);
      text(0,100,'Run a Singapore kopi stall. Learn the words by making the order.',1800,'m','black',1);
      text(0,156,'DESIGN IDEA 2  /  CULTURE × TECH  /  EDITABLE STORYBOARD',2100,'s','grey',.95);
      const cards=[
        ['THE GAME','Hear a local order → choose ingredients → make the cup → serve → understand why.\nOne counter. One customer at a time. No rush timer.','green'],
        ['WHY CULTURE','The ordering vocabulary changes what the player makes. Milk, sweetness, language and everyday stall work are the mechanics.','green'],
        ['TWO MODES','COACHED: explanations and immediate feedback.\nINDEPENDENT: no prompts; check at serving.\nBoth: replay, labels, optional help, recovery.','blue'],
        ['DIRECTING','Warm 2D counter; bold ingredient silhouettes.\nCustomer → hands → cup → reaction.\nHold the camera while choosing.\nNo VHS or 3D opening.','black'],
        ['THE AI ROLE','Understand optional spoken or typed questions.\nSelect reviewed explanations using lesson state.\nRecipes, cup state and success stay deterministic.','blue'],
        ['ONE-DAY DEMO','Three customers: O Kosong → C → O.\nTwo modes; one finished shift.\nTea and kaya toast are a later lesson, not demo dependencies.','violet']
      ];
      cards.forEach((c,i)=>{const x=(i%3)*665,y=250+Math.floor(i/3)*265;box(x,y,620,227,'',c[2],'none');text(x+25,y+20,c[0],640,'m',c[2],.95);text(x+25,y+77,c[1],670,'s','black',.84);});
      text(0,839,'READ THE PAGES IN ORDER',1800,'m','black',1);
      const nav=[['01','OPEN THE STALL','Shots 01–06 · start, orders, coaching, questions'],['02','FIRST CUP','Shots 07–12 · cup, pour, inspect, serve, response'],['03','LEARN THE DIFFERENCE','Shots 13–18 · milk, mixing, independent play, ending'],['04','MISTAKES AND RECOVERY','Shots 19–24 · error, reset, replay, service failure, pause'],['05','TEA AND TOAST LATER','Shots 25–30 · optional expansion, separate from demo']];
      nav.forEach((n,i)=>{let y=913+i*71;label(0,y,69,45,n[0],i===4?'violet':'green');text(98,y,n[1],600,'s','black',.91);text(640,y,n[2],1400,'s','grey',.87);});
      text(0,1300,'GREEN = demo   •   BLUE = optional AI help   •   RED = recovery   •   VIOLET = later levels',2400,'s','black',.95);
      text(0,1355,'Recipe portions are this fictional stall’s teaching conventions. Review them with a local practitioner.',2400,'s','grey',.86);
    } else {
      text(0,0,pages[p][1].split(' · ')[0].toUpperCase(),2150,'xl',p===5?'violet':p===4?'red':'green',1.12);
      const sub=p===1?'Start behind the counter. Read left → right, then the next row.':p===2?'The first customer teaches omission: no milk, no added sugar.':p===3?'Contrast evaporated milk, then remove the coaching. Shot 18 ends the demo.':p===4?'Branches from the current order; recover and return to the same cup or ticket.':'Future progression only. These frames are not required for the hackathon demo.';
      text(0,74,sub,2400,'s','grey',.94);
      scenes.slice((p-1)*6,p*6).forEach(panel);
      text(0,1245,p===4?'RETURN PATHS: 19 → 20 → 07; 21 → current cup; 22/23/24 → current order.':p===5?'LATER PATH: 25 → 26; 27 → 28 → 29 → 30. Unlock after the complete coffee shift.':'NEXT: '+(p===3?'18 ends the shift; use page 04 for recovery and page 05 for future levels.':'continue on page '+String(p+1).padStart(2,'0')+'.'),2400,'s','grey',.85);
    }
    e.createShapes(shapes);
    e.zoomToFit();
  }
  e.setCurrentPage(pages[0][0]);e.selectNone();e.zoomToFit();
  return {pages:pages.map(p=>({id:p[0],name:p[1]})),storyboardFrames:scenes.length};
})()
