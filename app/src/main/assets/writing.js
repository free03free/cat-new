/* قسم «الكتابة»: تعلّم كتابة الحروف والأرقام بثلاثة مستويات
   1) تتبّع الخط: شكل رمادي يلوّن الطفل فوقه   2) النقاط: شكل منقّط يرسم فوقه   3) بيدي: لوحة بيضاء بلا أي مساعدة
   يُحمَّل من index.html بعد games.js. نطق الحرف/الرقم بنفس سرعات الحزمة الجاهزة فيخرج فورًا. */
(function(){
"use strict";
if(document.getElementById("wr-mode"))return;
const $=id=>document.getElementById(id);
const CS=window.CatSpeech||{};
const letters=CS.letters||[],SAYM=CS.SAY||{};
const numberWord=CS.numberWord||(n=>String(n));
const sylKind=CS.sylKind||(()=>"");
function pref(k,d){try{const v=parseFloat(localStorage.getItem(k));return isFinite(v)?v:d}catch(e){return d}}
function maxNum(){let m=parseInt(localStorage.getItem("learningMaxNumber")||"10",10);if(!isFinite(m)||m<1)m=10;return Math.min(m,100)}
const LEVELS={
 trace:{hint:"لوّن فوق الشكل الرمادي دون أن تخرج منه، وسأشجعك عند الإتقان",pen:.055},
 dots:{hint:"ارسم فوق النقاط بالترتيب دون أن تبتعد عنها، وسأشجعك عند الإتقان",pen:.045},
 free:{hint:"اكتب بنفسك وانظر إلى النموذج المصغّر في الزاوية، ثم اضغط «تحقق» لترى النموذج كبيرًا",pen:.045}
};
const st={kind:"letters",level:"trace",idx:0,strokes:[],cur:null,S:300,modelT:0};

/* ----- التنسيق ----- */
const css=document.createElement("style");css.id="wr-css";
css.textContent=`
.mode-switch .mode{font-size:12.5px}
#wr-sec{padding-bottom:20px}
.wr-card{background:#fff;border-radius:24px;padding:12px;box-shadow:0 5px 18px #00000012}
.wr-lab{font-size:13px;font-weight:900;color:#8a7466;margin:2px 4px 6px}
.wr-seg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.wr-seg button{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;border:3px solid #f0e2d0;border-radius:18px;padding:8px 4px 7px;background:#fffaf3;color:#6a5444;font-family:inherit;font-weight:900;font-size:14px}
.wr-seg button .big{font-size:26px;line-height:1.2;color:#d9770a}
.wr-seg button.on{background:#f3a044;border-color:#d9770a;color:#fff;box-shadow:0 4px 10px #f3a04455}
.wr-seg button.on .big{color:#fff}
.wr-lv{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px}
.wr-lv button{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;border:3px solid #dbe6f7;border-radius:18px;padding:8px 2px 7px;background:#f4f8ff;color:#45638f;font-family:inherit;font-weight:900;font-size:13.5px}
.wr-lv button .ic{font-size:22px;line-height:1.2}
.wr-lv button.on{background:#2f7fd6;border-color:#1c5fb0;color:#fff;box-shadow:0 4px 10px #2f7fd655}
.wr-lv button.on::after,.wr-seg button.on::after{content:"✓";position:absolute;top:-8px;left:-6px;width:22px;height:22px;border-radius:50%;background:#2e9a45;color:#fff;font-size:13px;line-height:22px;text-align:center;border:2px solid #fff}
.wr-nav{display:flex;align-items:center;gap:8px;margin:8px 0 6px}
.wr-nav>button:not(.wr-title){flex:none;width:58px;height:54px;border:0;border-radius:16px;background:#fff0c8;color:#d95b2b;font-family:inherit;font-weight:900;font-size:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0}
.wr-nav>button b{font-size:20px;line-height:1.1}
.wr-title{flex:1 1 0;min-width:0;text-align:center;font-weight:900;font-size:17px;color:#4a3426;border:0;background:#fffaf3;border-radius:16px;padding:6px 4px;font-family:inherit;min-height:54px}
.wr-title small{display:block;font-size:12px;color:#8a7466;font-weight:700}
.wr-title i{font-style:normal;color:#f2b300;letter-spacing:2px}
.wr-pick{display:block;width:100%;border:2px dashed #d9a35a;border-radius:14px;background:#fffaf0;color:#a8570b;font-family:inherit;font-weight:900;font-size:15px;padding:10px 4px;margin:2px 0 6px}
.wr-pick.on{background:#f3a044;color:#fff;border-style:solid}
.wr-grid{display:none;grid-template-columns:repeat(7,1fr);gap:6px;max-height:210px;overflow-y:auto;background:#fffaf3;border:1px solid #f0e2d0;border-radius:16px;padding:8px;margin:0 0 8px;-webkit-overflow-scrolling:touch}
.wr-grid.open{display:grid}
.wr-grid.num{grid-template-columns:repeat(6,1fr)}
.wr-grid button{border:0;border-radius:12px;background:#ffe4ea;color:#7d3047;min-height:44px;font-size:22px;font-weight:900;font-family:inherit;position:relative;padding:0}
.wr-grid.num button{background:#fff0c8;color:#604126}
.wr-grid button.cur{background:#2f7fd6;color:#fff}
.wr-grid button.done::after{content:"★";position:absolute;top:0;left:3px;font-size:10px;color:#f2b300}
.wr-hint{text-align:center;font-size:13px;color:#806d60;margin:2px 0 8px}
.wr-board{position:relative;margin:0 auto;border-radius:20px;background:#fff;border:3px solid #ead8c6;overflow:hidden;box-shadow:inset 0 0 0 1px #fff}
.wr-board canvas{position:absolute;left:0;top:0;touch-action:none;display:block}
.wr-tip{text-align:center;font-size:11.5px;color:#a18f82;margin:2px 0 6px}
.wr-res{min-height:26px;text-align:center;font-weight:900;font-size:16px;color:#4a3426;margin:10px 0 2px}
.wr-res.pop{animation:wrpop .35s}
@keyframes wrpop{0%{transform:scale(.8)}60%{transform:scale(1.12)}100%{transform:scale(1)}}
.wr-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px}
.wr-bar button{border:0;border-radius:14px;padding:8px 2px;background:#fff0c8;color:#5a4030;font-weight:800;font-size:13px;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:1px}
.wr-bar button span{font-size:19px;line-height:1.2}
.wr-bar button.go{background:#2e9a45;color:#fff}
`;
document.head.appendChild(css);

/* ----- الواجهة ----- */
const sw=document.querySelector(".mode-switch");
const btn=document.createElement("button");btn.id="wr-mode";btn.className="mode";btn.textContent="✏️ الكتابة";sw.appendChild(btn);
const sec=document.createElement("section");sec.id="wr-sec";sec.className="mode-page";
sec.innerHTML=
'<div class="wr-card">'+
'<div class="wr-lab">١) ماذا تريد أن تكتب؟</div>'+
'<div class="wr-seg" id="wr-kind"><button data-k="letters" class="on"><span class="big">أ ب</span>الحروف</button><button data-k="numbers"><span class="big">١٢٣</span>الأرقام</button></div>'+
'<div class="wr-lab">٢) كيف تريد أن تكتب؟</div>'+
'<div class="wr-lv" id="wr-lv"><button data-l="trace" class="on"><span class="ic">🖍️</span>لوّن الشكل</button><button data-l="dots" ><span class="ic">🔵</span>صِلِ النقاط</button><button data-l="free"><span class="ic">✋</span>اكتب بنفسك</button></div>'+
'<div class="wr-nav"><button id="wr-prev" aria-label="السابق"><b>▶</b>السابق</button><button class="wr-title" id="wr-title" type="button" aria-label="اختيار الحرف أو الرقم"></button><button id="wr-next" aria-label="التالي"><b>◀</b>التالي</button></div>'+
'<button class="wr-pick" id="wr-pick" type="button"></button>'+
'<div class="wr-grid" id="wr-grid"></div>'+
'<div class="wr-hint" id="wr-hint"></div>'+
'<div class="wr-board" id="wr-board"><canvas id="wr-g"></canvas><canvas id="wr-d"></canvas></div>'+
'<div class="wr-res" id="wr-res"></div>'+
'<div class="wr-tip">☝️ للتمرير: اسحب بإصبعين فوق اللوحة، أو بإصبع واحد من الهامش حولها</div>'+
'<div class="wr-bar"><button id="wr-clear"><span>🗑</span>مسح</button><button id="wr-undo"><span>↩</span>تراجع</button><button id="wr-hear"><span>🔊</span>اسمع</button><button id="wr-check" class="go"><span>✔</span>تحقق</button></div>'+
'</div>';
(document.querySelector("main.app")||document.body).appendChild(sec);
const gc=$("wr-g"),ic=$("wr-d"),gx=gc.getContext("2d"),ix=ic.getContext("2d");

/* ----- العناصر ----- */
function items(){
 if(st.kind==="letters")return letters.map(l=>({ch:l[0],name:l[1]}));
 const n=maxNum(),a=[];for(let i=1;i<=n;i++)a.push({ch:String(i),num:i});return a;
}
function cur(){const a=items();if(st.idx>=a.length)st.idx=0;return a[st.idx]}
function bestKey(){return "wrBest_"+st.kind+"_"+st.idx}
function getBest(){try{return parseInt(localStorage.getItem(bestKey())||"0",10)||0}catch(e){return 0}}
function setBest(v){try{if(v>getBest())localStorage.setItem(bestKey(),String(v))}catch(e){}}
const starsText=n=>"★★★".slice(0,n)+"☆☆☆".slice(0,3-n);

/* ----- النطق (بسرعات الحزمة الجاهزة) ----- */
function say(text,sp){try{if(window.TomNative&&TomNative.say){TomNative.say(text,Number(sp),0);return true}}catch(e){}return false}
function speak(){
 const it=cur(),base=pref("speechSpeed",.9),spd=k=>Number((base*k).toFixed(3));
 if(it.name){const t=SAYM[it.name]||it.name,k=sylKind(t);say(t,spd(k==="short"?.8:k==="madd"?.84:.91))}
 else say(numberWord(it.num),base);
}

/* ----- الرسم ----- */
function gfont(sz){return (st.kind==="numbers"?"800 ":"700 ")+sz+'px "Noto Naskh Arabic","Noto Sans Arabic","Droid Arabic Naskh",system-ui,sans-serif'}
function mbox(m,sz){
 if(typeof m.actualBoundingBoxAscent==="number"&&isFinite(m.actualBoundingBoxAscent))return {l:m.actualBoundingBoxLeft,r:m.actualBoundingBoxRight,a:m.actualBoundingBoxAscent,d:m.actualBoundingBoxDescent};
 /* WebView قديم بلا actualBoundingBox: تقدير من العرض وحجم الخط */
 return {l:0,r:m.width,a:sz*0.66,d:sz*0.22};
}
const FITC={};
/* حدود الرسم الفعلية بالبكسل: لا تعتمد على actualBoundingBox (غير موثوق في WebView القديم) */
function inkBox(ch,sz0){
 const W=Math.ceil(sz0*2.4),H=Math.ceil(sz0*2.4),c=document.createElement("canvas");c.width=W;c.height=H;
 const x=c.getContext("2d"),ox=Math.round(sz0*.7),oy=Math.round(sz0*1.5);
 x.textAlign="left";x.textBaseline="alphabetic";x.font=gfont(sz0);x.fillStyle="#000";x.fillText(ch,ox,oy);
 const d=x.getImageData(0,0,W,H).data;let x0=W,x1=-1,y0=H,y1=-1;
 for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(d[(j*W+i)*4+3]>24){if(i<x0)x0=i;if(i>x1)x1=i;if(j<y0)y0=j;if(j>y1)y1=j}
 return x1<0?null:{dx0:x0-ox,dx1:x1+1-ox,dy0:y0-oy,dy1:y1+1-oy};
}
function fit(ctx,ch){
 const S=st.S,key=st.kind+"|"+ch+"|"+S;
 let f=FITC[key];
 if(!f){
  const sz0=Math.max(40,Math.round(S*.6)),b=inkBox(ch,sz0);
  if(b){
   const w=b.dx1-b.dx0,h=b.dy1-b.dy0,k=Math.min(S*.62/Math.max(w,1),S*.62/Math.max(h,1));
   f=FITC[key]={sz:sz0*k,x:S/2-k*(b.dx0+b.dx1)/2,y:S/2-k*(b.dy0+b.dy1)/2};
  }
 }
 if(f){ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.font=gfont(f.sz);return [f.x,f.y]}
 let sz=S*.6;
 ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.font=gfont(sz);
 let b=mbox(ctx.measureText(ch),sz);
 const w=b.l+b.r,h=b.a+b.d;
 const k=Math.min(S*.62/Math.max(w,1),S*.62/Math.max(h,1));
 sz*=k;ctx.font=gfont(sz);b=mbox(ctx.measureText(ch),sz);
 return [S/2-(b.r-b.l)/2,S/2+(b.a-b.d)/2];
}

/* ----- مباعدة نقاط الحروف (ث ش ت ق ي ة ...) لتسهل على الطفل: تُفصل النقاط عن الجسم وتُزاح عن بعضها دون المساس بالجسم ----- */
const GM={};
function gMask(ctx,ch,p){
 if(st.kind==="numbers")return null;
 const S=st.S,R=Math.round(Math.min(900,S*2)),s=R/S,font=ctx.font,key=st.kind+"|"+ch+"|"+Math.round(S)+"|"+font+"|"+p[0].toFixed(1)+"|"+p[1].toFixed(1);
 if(key in GM)return GM[key];
 let res=null;try{res=gBuild(ch,p,font,R,s)}catch(e){res=null}
 GM[key]=res;return res;
}
function gBuild(ch,p,font,R,s){
 const c=mkCanvas(R),x=c.getContext("2d");x.scale(s,s);x.font=font;x.textAlign="left";x.textBaseline="alphabetic";x.fillStyle="#000";x.fillText(ch,p[0],p[1]);
 const img=x.getImageData(0,0,R,R),d=img.data,lab=new Int32Array(R*R).fill(-1),comps=[],stack=new Int32Array(R*R);
 for(let i=0;i<R*R;i++){
  if(lab[i]>=0||d[i*4+3]<=10)continue;
  const id=comps.length,o={n:0,x0:R,y0:R,x1:-1,y1:-1};comps.push(o);let sp=0;stack[sp++]=i;lab[i]=id;
  while(sp){const q=stack[--sp],qx=q%R,qy=(q-qx)/R;o.n++;if(qx<o.x0)o.x0=qx;if(qx>o.x1)o.x1=qx;if(qy<o.y0)o.y0=qy;if(qy>o.y1)o.y1=qy;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=qx+dx,ny=qy+dy;if(nx<0||ny<0||nx>=R||ny>=R)continue;const j=ny*R+nx;if(lab[j]<0&&d[j*4+3]>10){lab[j]=id;stack[sp++]=j}}}
 }
 if(comps.length<3)return {c:c,R:R,t:{}};
 let bi=0;comps.forEach((o,i)=>{if(o.n>comps[bi].n)bi=i});
 const B=comps[bi],dots=[];
 comps.forEach((o,i)=>{if(i!==bi&&o.n<B.n*.35&&Math.max(o.x1-o.x0,o.y1-o.y0)<R*.25)dots.push(i)});
 if(dots.length<2)return {c:c,R:R,t:{}};
 const cs=dots.map(i=>{const o=comps[i];return [(o.x0+o.x1)/2,(o.y0+o.y1)/2]});
 const D=dots.reduce((a,i)=>a+Math.max(comps[i].x1-comps[i].x0,comps[i].y1-comps[i].y0)+1,0)/dots.length;
 const n=dots.length,pad=Math.round(D*.18),mg=Math.round(R*.03);
 const cxm=cs.reduce((a,q)=>a+q[0],0)/n,cym=cs.reduce((a,q)=>a+q[1],0)/n;
 const bcx=(B.x0+B.x1)/2,bcy=(B.y0+B.y1)/2;let awx=cxm-bcx,awy=cym-bcy;const awl=Math.hypot(awx,awy)||1;awx/=awl;awy/=awl;
 /* تنسيق ثابت: نقطتان على خط واحد بتباعد صغير ومتساوٍ، وثلاث نقاط مثلث متساوي الأضلاع رأسه للأعلى */
 const layout=f=>{
  if(n===2){const dx=cs[1][0]-cs[0][0],dy=cs[1][1]-cs[0][1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,half=D*1.55*f/2;
   return [[cxm-ux*half,cym-uy*half],[cxm+ux*half,cym+uy*half]]}
  if(n===3){let ia=0;for(let i=1;i<3;i++)if(cs[i][1]<cs[ia][1])ia=i;
   const o=[0,1,2].filter(i=>i!==ia).sort((u,v)=>cs[u][0]-cs[v][0]),sd=D*1.55*f,h=sd*.866,t=[];
   t[ia]=[cxm,cym-2*h/3];t[o[0]]=[cxm-sd/2,cym+h/3];t[o[1]]=[cxm+sd/2,cym+h/3];return t}
  return null;
 };
 if(!layout(1))return {c:c,R:R,t:{}};
 const okShift=sh=>{
  for(let k=0;k<dots.length;k++){
   const o=comps[dots[k]],ax=Math.round(o.x0+sh[k][0])-pad,bx=Math.round(o.x1+sh[k][0])+pad,ay=Math.round(o.y0+sh[k][1])-pad,by=Math.round(o.y1+sh[k][1])+pad;
   if(ax<mg||ay<mg||bx>R-mg||by>R-mg)return false;
   for(let yy=ay;yy<=by;yy++)for(let xx=ax;xx<=bx;xx++)if(lab[yy*R+xx]===bi)return false;
  }
  return true;
 };
 let sh=null;
 for(const f of [1,.92,.84,.76,.68]){
  for(const t of [0,.15,.3,.45,.6,.8]){
   const tg=layout(f),cand=tg.map((q,k)=>[q[0]+awx*t*D-cs[k][0],q[1]+awy*t*D-cs[k][1]]);
   if(okShift(cand)){sh=cand;break}
  }
  if(sh)break;
 }
 if(!sh)return {c:c,R:R,t:{}};
 const out=mkCanvas(R),ox=out.getContext("2d"),oi=ox.createImageData(R,R),od=oi.data;
 for(let i=0;i<R*R;i++)if(lab[i]===bi||(lab[i]>=0&&dots.indexOf(lab[i])<0)){od[i*4]=d[i*4];od[i*4+1]=d[i*4+1];od[i*4+2]=d[i*4+2];od[i*4+3]=d[i*4+3]}
 for(let k=0;k<dots.length;k++){
  const sx=Math.round(sh[k][0]),sy=Math.round(sh[k][1]),o=comps[dots[k]];
  for(let yy=o.y0;yy<=o.y1;yy++)for(let xx=o.x0;xx<=o.x1;xx++){const i=yy*R+xx;if(lab[i]!==dots[k])continue;const j=(yy+sy)*R+(xx+sx);od[j*4]=d[i*4];od[j*4+1]=d[i*4+1];od[j*4+2]=d[i*4+2];od[j*4+3]=d[i*4+3]}
 }
 ox.putImageData(oi,0,0);
 return {c:out,R:R,t:{}};
}
function gTint(m,color){
 if(m.t[color])return m.t[color];
 const c=mkCanvas(m.R),x=c.getContext("2d");x.drawImage(m.c,0,0);x.globalCompositeOperation="source-in";x.fillStyle=color;x.fillRect(0,0,m.R,m.R);
 return m.t[color]=c;
}
function gFill(ctx,ch,p){
 const m=gMask(ctx,ch,p);
 if(!m){ctx.fillText(ch,p[0],p[1]);return}
 ctx.drawImage(gTint(m,ctx.fillStyle),0,0,st.S,st.S);
}
function gStroke(ctx,ch,p){
 const m=gMask(ctx,ch,p);
 if(!m){ctx.strokeText(ch,p[0],p[1]);return}
 const t=gTint(m,ctx.strokeStyle),r=ctx.lineWidth/2,S=st.S;
 for(const k of [1,.75,.5,.25])for(let a=0;a<24;a++){const th=a*Math.PI/12;ctx.drawImage(t,Math.cos(th)*r*k,Math.sin(th)*r*k,S,S)}
}
/* ----- الهيكل المركزي للشكل (خط واحد منقّط بدل خطّي الحافة): ترقيق Zhang-Suen ثم حذف الأشواك القصيرة ----- */
/* ===== نماذج مرسومة يدويًا للحروف التي يشوّهها الترقيق (حاليًا: أ) ===== */
const LP={
"أ":{s:[[[54,4],[54,70]],[[66,-37],[52,-38],[44,-31],[52,-25],[63,-21],[52,-13],[40,-11]]],d:[]}
};
/* Catmull-Rom داخل كل مقطع بين زاويتين */
function sampleStroke(pts,step){
  const out=[];
  const segs=[];let cur=[pts[0]];
  for(let i=1;i<pts.length;i++){cur.push(pts[i]);if(pts[i][2]&&i<pts.length-1){segs.push(cur);cur=[pts[i]]}}
  segs.push(cur);
  segs.forEach((sg,si)=>{
    const P=sg.map(p=>[p[0],p[1]]);
    if(P.length===2){const L=Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1]),n=Math.max(1,Math.ceil(L/step));
      for(let k=(si?1:0);k<=n;k++)out.push([P[0][0]+(P[1][0]-P[0][0])*k/n,P[0][1]+(P[1][1]-P[0][1])*k/n]);return}
    const g=(i)=>P[Math.max(0,Math.min(P.length-1,i))];
    for(let i=0;i<P.length-1;i++){
      const p0=i===0?[2*P[0][0]-P[1][0],2*P[0][1]-P[1][1]]:g(i-1),p1=P[i],p2=P[i+1],
        p3=i+2>P.length-1?[2*P[P.length-1][0]-P[P.length-2][0],2*P[P.length-1][1]-P[P.length-2][1]]:g(i+2);
      const L=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),n=Math.max(2,Math.ceil(L/step));
      for(let k=(i===0&&si>0?1:(i===0?0:1));k<=n;k++){
        const t=k/n,t2=t*t,t3=t2*t;
        out.push([0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
                  0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);
      }
    }
  });
  return out;
}

const MSK={key:"",o:null};
function modelSkel(ch,S){
 const key=ch+"|"+Math.round(S);if(MSK.key===key)return MSK.o;
 const M=LP[ch];if(!M)return null;
 const raw=M.s.map(sg=>sampleStroke(sg,1.2));
 let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
 const ext=(x,y)=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)};
 raw.forEach(sg=>sg.forEach(p=>ext(p[0],p[1])));M.d.forEach(p=>{ext(p[0]-6,p[1]-6);ext(p[0]+6,p[1]+6)});
 const k=Math.min(S*.64/Math.max(x1-x0,1),S*.64/Math.max(y1-y0,1)),ox=S/2-k*(x0+x1)/2,oy=S/2-k*(y0+y1)/2;
 const T=p=>[ox+k*p[0],oy+k*p[1]];
 const strokes=raw.map(sg=>sg.map(T)),pts=[],dots=[],gap=S*.056;
 strokes.forEach((sg,ci)=>{
  const cum=[0];for(let i=1;i<sg.length;i++)cum.push(cum[i-1]+Math.hypot(sg[i][0]-sg[i-1][0],sg[i][1]-sg[i-1][1]));
  sg.forEach(p=>pts.push([p[0],p[1],ci]));
  const anchors=[0];
  M.s[ci].forEach((q,i)=>{if(q[2]&&i>0&&i<M.s[ci].length-1){const t=T(q);let b=0,bd=1e18;sg.forEach((p,j)=>{const d=(p[0]-t[0])*(p[0]-t[0])+(p[1]-t[1])*(p[1]-t[1]);if(d<bd){bd=d;b=j}});anchors.push(b)}});
  anchors.push(sg.length-1);
  const at=L=>{let j=1;while(j<cum.length-1&&cum[j]<L)j++;const a=cum[j]-cum[j-1]||1,f=(L-cum[j-1])/a;return [sg[j-1][0]+(sg[j][0]-sg[j-1][0])*f,sg[j-1][1]+(sg[j][1]-sg[j-1][1])*f]};
  const first=sg[0],last=sg[sg.length-1],closed=Math.hypot(first[0]-last[0],first[1]-last[1])<gap*.6;
  for(let a=0;a<anchors.length-1;a++){
   const L0=cum[anchors[a]],L1=cum[anchors[a+1]],gp=cum[cum.length-1]<S*.3?S*.036:gap,n=Math.max(1,Math.round((L1-L0)/gp));
   for(let t=(a===0?0:1);t<=n;t++){
    if(closed&&a===anchors.length-2&&t===n)continue;
    const q=at(L0+(L1-L0)*t/n);dots.push([q[0],q[1]]);
   }
  }
 });
 const marks=M.d.map(T),r=Math.max(3.5,S*.0125);
 marks.forEach((c,j)=>{dots.push([c[0],c[1]]);const id=strokes.length+j;pts.push([c[0],c[1],id]);for(let a=0;a<6;a++)pts.push([c[0]+Math.cos(a*Math.PI/3)*r*1.1,c[1]+Math.sin(a*Math.PI/3)*r*1.1,id])});
 const o={strokes:strokes,pts:pts,dots:dots,marks:marks};
 MSK.key=key;MSK.o=o;return o;
}
const SK={key:"",pts:[],dots:[]};
function thin(bw,G){
 const I=(x,y)=>y*G+x;let changed=true,guard=0;
 while(changed&&guard++<200){
  changed=false;
  for(let pass=0;pass<2;pass++){
   const del=[];
   for(let y=1;y<G-1;y++)for(let x=1;x<G-1;x++){
    if(!bw[I(x,y)])continue;
    const p2=bw[I(x,y-1)],p3=bw[I(x+1,y-1)],p4=bw[I(x+1,y)],p5=bw[I(x+1,y+1)],p6=bw[I(x,y+1)],p7=bw[I(x-1,y+1)],p8=bw[I(x-1,y)],p9=bw[I(x-1,y-1)];
    const B=p2+p3+p4+p5+p6+p7+p8+p9;if(B<2||B>6)continue;
    const A=(p2===0&&p3===1?1:0)+(p3===0&&p4===1?1:0)+(p4===0&&p5===1?1:0)+(p5===0&&p6===1?1:0)+(p6===0&&p7===1?1:0)+(p7===0&&p8===1?1:0)+(p8===0&&p9===1?1:0)+(p9===0&&p2===1?1:0);
    if(A!==1)continue;
    if(pass===0){if(p2*p4*p6!==0||p4*p6*p8!==0)continue}else{if(p2*p4*p8!==0||p2*p6*p8!==0)continue}
    del.push(I(x,y));
   }
   if(del.length){changed=true;for(const i of del)bw[i]=0}
  }
 }
}
function nbrs(bw,G,i){
 const x=i%G,y=(i-x)/G,r=[];
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;
  if(nx<0||ny<0||nx>=G||ny>=G)continue;
  const j=ny*G+nx;if(bw[j])r.push(j);
 }
 return r;
}
function prune(bw,G,maxLen){
 for(let round=0;round<2;round++){
  for(let i=0;i<bw.length;i++){
   if(!bw[i]||nbrs(bw,G,i).length!==1)continue;
   const path=[i];let prev=-1,c=i,junction=false;
   for(let k=0;k<maxLen+2;k++){
    const n=nbrs(bw,G,c).filter(j=>j!==prev&&path.indexOf(j)<0);
    if(n.length===0)break;
    if(n.length>1||nbrs(bw,G,n[0]).length>=3){junction=true;break}
    prev=c;c=n[0];path.push(c);
   }
   if(junction&&path.length<maxLen)for(const j of path)bw[j]=0;
  }
 }
}

/* نقاط موزّعة بالتساوي على مسار مكوّن صغير (الهمزة، علامة الكاف): أطول مسار في الهيكل ثم أخذ عينات بمسافات متساوية */
function pathDots(g,k,S){
 const key=(x,y)=>x*1000+y,m={};
 g.forEach((q,i)=>{m[key(Math.round(q[0]/k-.5),Math.round(q[1]/k-.5))]=i});
 const adj=g.map((q,i)=>{const x=Math.round(q[0]/k-.5),y=Math.round(q[1]/k-.5),r=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const j=m[key(x+dx,y+dy)];if(j!==undefined)r.push(j)}return r});
 const bfs=s0=>{const d=new Array(g.length).fill(-1),par=new Array(g.length).fill(-1),qu=[s0];d[s0]=0;
  for(let h=0;h<qu.length;h++){const i=qu[h];adj[i].forEach(j=>{if(d[j]<0){d[j]=d[i]+1;par[j]=i;qu.push(j)}})}
  let far=s0;qu.forEach(i=>{if(d[i]>d[far])far=i});return {far:far,par:par}};
 const A=bfs(0).far,r=bfs(A),path=[];
 for(let i=r.far;i>=0;i=r.par[i])path.push(g[i]);
 if(path.length<3)return null;
 const cum=[0];for(let i=1;i<path.length;i++)cum.push(cum[i-1]+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]));
 const L=cum[cum.length-1];if(L<S*.04)return null;
 const n=Math.max(3,Math.round(L/(S*.038))+1),out=[];
 for(let t=0;t<n;t++){const target=L*t/(n-1);let b=0;for(let i=0;i<cum.length;i++)if(Math.abs(cum[i]-target)<Math.abs(cum[b]-target))b=i;out.push(path[b])}
 return out;
}

/* الترقيق يقصّر أطراف الخط بمقدار نصف السُّمك: نمدّ كل طرف على اتجاهه حتى حافة الحرف فيظهر الشكل كاملًا من أول الخط إلى آخره */
function extendEnds(bw,ink0,G){
 const eps=[];
 for(let i=0;i<bw.length;i++)if(bw[i]&&nbrs(bw,G,i).length===1)eps.push(i);
 const maxExt=Math.round(G*.075);
 eps.forEach(e=>{
  const path=[e];let prev=-1,c=e;
  for(let k=0;k<7;k++){const n=nbrs(bw,G,c).filter(j=>j!==prev&&path.indexOf(j)<0);if(n.length!==1)break;prev=c;c=n[0];path.push(c)}
  if(path.length<4)return;
  const ex=e%G,ey=(e-ex)/G,bx=c%G,by=(c-bx)/G;let dx=ex-bx,dy=ey-by;const L=Math.hypot(dx,dy);if(!L)return;dx/=L;dy/=L;
  let fx=ex,fy=ey;
  for(let s=1;s<=maxExt;s++){
   fx=ex+dx*s;fy=ey+dy*s;const ix=Math.round(fx),iy=Math.round(fy);
   if(ix<1||iy<1||ix>=G-1||iy>=G-1||!ink0[iy*G+ix])break;
   // لا نمدّ إن اقتربنا من جزء آخر من الهيكل
   let near=false;for(let ddy=-1;ddy<=1&&!near;ddy++)for(let ddx=-1;ddx<=1;ddx++){const j=(iy+ddy)*G+ix+ddx;if(bw[j]&&path.indexOf(j)<0&&j!==iy*G+ix){near=true;break}}
   if(near)break;
   bw[iy*G+ix]=1;
  }
 });
}

/* نقاط منتظمة التباعد على مسار الحرف: نمشي على الهيكل من طرفه الأيمن العلوي (جهة بداية الكتابة العربية) ونضع نقطة كلما ابتعدنا مسافة ثابتة عن النقاط السابقة، ونضمن نقطة عند كل طرف */
function orderedDots(g,k,gap){
 const key=(x,y)=>x*1000+y,m={},gx=g.map(q=>Math.round(q[0]/k-.5)),gy=g.map(q=>Math.round(q[1]/k-.5));
 g.forEach((q,i)=>{m[key(gx[i],gy[i])]=i});
 const adj=g.map((q,i)=>{const r=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const j=m[key(gx[i]+dx,gy[i]+dy)];if(j!==undefined)r.push(j)}return r});
 const seen=new Uint8Array(g.length),order=[];
 const ends=[];g.forEach((q,i)=>{if(adj[i].length===1)ends.push(i)});
 const score=i=>g[i][0]-g[i][1]*.6;
 const starts=ends.slice().sort((a,b)=>score(b)-score(a));
 const rest=g.map((q,i)=>i).sort((a,b)=>score(b)-score(a));
 const run=s0=>{if(seen[s0])return;const qu=[s0];seen[s0]=1;for(let h=0;h<qu.length;h++){const i=qu[h];order.push(i);adj[i].forEach(j=>{if(!seen[j]){seen[j]=1;qu.push(j)}})}};
 starts.concat(rest).forEach(run);
 const mine=[],g2=gap*gap;
 const far=(q,r2)=>{for(const w of mine){const dx=q[0]-w[0],dy=q[1]-w[1];if(dx*dx+dy*dy<r2)return false}return true};
 order.forEach(i=>{if(far(g[i],g2))mine.push(g[i])});
 ends.forEach(i=>{if(far(g[i],g2*.3))mine.push(g[i])});
 return mine;
}
function skeleton(){
 if(st.kind==="letters"&&LP[cur().ch]){const mk=modelSkel(cur().ch,st.S);if(mk)return mk}
 const S=st.S,it=cur(),G=Math.min(190,Math.round(S)),key=st.kind+"|"+it.ch+"|"+Math.round(S);
 if(SK.key===key)return SK;
 const c=mkCanvas(G),x=c.getContext("2d");x.scale(G/S,G/S);
 const p=fit(x,it.ch);x.fillStyle="#000";gFill(x,it.ch,p);
 const d=x.getImageData(0,0,G,G).data,bw=new Uint8Array(G*G);
 for(let i=0;i<bw.length;i++)bw[i]=d[i*4+3]>127?1:0;
 const ink0=bw.slice();
 thin(bw,G);prune(bw,G,Math.round(G*.085));
 /* كل مكوّن من الحرف (نقطة، همزة...) يجب أن يبقى له أثر في الهيكل؛ الترقيق قد يمحو المكوّنات الصغيرة تمامًا فتضيع نقطة من الحرف */
 (function(){const N=G*G,il=new Uint8Array(N);
  for(let i=0;i<N;i++){if(!ink0[i]||il[i])continue;const comp=[],st_=[i];il[i]=1;let has=false,sx=0,sy=0;
   while(st_.length){const c0=st_.pop();comp.push(c0);if(bw[c0])has=true;const x=c0%G,y=(c0-x)/G;sx+=x;sy+=y;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;if(ink0[j]&&!il[j]){il[j]=1;st_.push(j)}}}
   if(!has&&comp.length>=3){const cx=sx/comp.length,cy=sy/comp.length;let b=comp[0],bd=1e18;comp.forEach(c0=>{const x=c0%G,y=(c0-x)/G,d=(x-cx)*(x-cx)+(y-cy)*(y-cy);if(d<bd){bd=d;b=c0}});bw[b]=1}
  }})();
 extendEnds(bw,ink0,G);
 const k=S/G,pts=[],lbl=new Int32Array(G*G).fill(-1);let nc=0;
 for(let i=0;i<bw.length;i++)if(bw[i]&&lbl[i]<0){const stack=[i];lbl[i]=nc;while(stack.length){const c0=stack.pop();for(const j of nbrs(bw,G,c0))if(lbl[j]<0){lbl[j]=nc;stack.push(j)}}nc++}
 for(let i=0;i<bw.length;i++)if(bw[i]){const gx_=i%G,gy_=(i-gx_)/G;pts.push([(gx_+.5)*k,(gy_+.5)*k,lbl[i]])}
 /* ترميم: مناطق من الحرف ضاعت من الهيكل (بعد الترقيق أو حذف الأشواك) فتبقى بلا نقاط؛ نضيف لها نقاط من منتصف السُّمك */
 (function(){
  const N=G*G,INF=1e9,dBg=new Int32Array(N).fill(INF),dSk=new Int32Array(N).fill(INF),lSk=new Int32Array(N).fill(-1);
   const il=new Int32Array(N).fill(-1),ia=[];
  for(let i=0;i<N;i++){if(!ink0[i]||il[i]>=0)continue;const id=ia.length;let n_=0;const st_=[i];il[i]=id;
   while(st_.length){const c0=st_.pop();n_++;const x=c0%G,y=(c0-x)/G;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;if(ink0[j]&&il[j]<0){il[j]=id;st_.push(j)}}}
   ia.push(n_)}
  const maxA=Math.max.apply(null,ia.concat([1]));
 let q=[];for(let i=0;i<N;i++)if(!ink0[i]){dBg[i]=0;q.push(i)}
  for(let h=0;h<q.length;h++){const i=q[h],x=i%G,y=(i-x)/G;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;if(dBg[j]>dBg[i]+1){dBg[j]=dBg[i]+1;q.push(j)}}}
  q=[];for(let i=0;i<N;i++)if(bw[i]){dSk[i]=0;lSk[i]=lbl[i];q.push(i)}
  if(!q.length)return;
  for(let h=0;h<q.length;h++){const i=q[h],x=i%G,y=(i-x)/G;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;if(dSk[j]>dSk[i]+1){dSk[j]=dSk[i]+1;lSk[j]=lSk[i];q.push(j)}}}
  for(let y=1;y<G-1;y++)for(let x=1;x<G-1;x++){
   const i=y*G+x;if(!ink0[i]||ia[il[i]]<maxA*.35||dBg[i]<3||dSk[i]<4||dSk[i]<=dBg[i]+1)continue;
   let ridge=true;for(let dy=-1;dy<=1&&ridge;dy++)for(let dx=-1;dx<=1;dx++)if(dBg[(y+dy)*G+x+dx]>dBg[i]){ridge=false;break}
   if(ridge)pts.push([(x+.5)*k,(y+.5)*k,lSk[i]]);
  }
 })();
 // نقاط متباعدة بانتظام لكل مكوّن على حدة: الجسم (أكبر مكوّن) بمسافة عادية، الهمزة وما يشبهها بمسافة أصغر لتظهر بشكلها، والنقطة الصغيرة علامة واحدة فقط
 const dots=[],byc={};
 for(const q of pts)(byc[q[2]]=byc[q[2]]||[]).push(q);
 let bodyId=-1,bodyN=-1;Object.keys(byc).forEach(id=>{if(byc[id].length>bodyN){bodyN=byc[id].length;bodyId=id}});
 Object.keys(byc).forEach(id=>{
  const g=byc[id];let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  g.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])});
  const ext=Math.max(x1-x0,y1-y0);
  if(id!=bodyId&&ext<=S*.045){
   const cx=g.reduce((a,q)=>a+q[0],0)/g.length,cy=g.reduce((a,q)=>a+q[1],0)/g.length;
   let b=g[0],bd=1e18;g.forEach(q=>{const d=(q[0]-cx)*(q[0]-cx)+(q[1]-cy)*(q[1]-cy);if(d<bd){bd=d;b=q}});
   dots.push(b);return;
  }
  if(id!=bodyId&&ext<S*.22){const ps=pathDots(g,k,S);if(ps){ps.forEach(q=>dots.push(q));return}}
  orderedDots(g,k,S*.056).forEach(q=>dots.push(q));
 });
 SK.key=key;SK.pts=pts;SK.dots=dots;return SK;
}

function clearCtx(ctx){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.restore()}
function updateMini(){
 let m=document.getElementById("wr-m");const it=cur(),b=$("wr-board");
 if(!m&&b){m=document.createElement("canvas");m.id="wr-m";b.appendChild(m)}
 if(!m)return;
 if(st.level!=="free"||!it){m.style.display="none";return}
 const S=st.S,ms=Math.round(S*.28),d=window.devicePixelRatio||1,px=Math.round(ms*d);
 if(m.width!==px){m.width=m.height=px;m.style.width=m.style.height=ms+"px"}
 m.style.display="block";
 const mx=m.getContext("2d");mx.setTransform(1,0,0,1,0,0);mx.clearRect(0,0,m.width,m.height);mx.setTransform(d*ms/S,0,0,d*ms/S,0,0);
 const p=fit(mx,it.ch);mx.fillStyle="#7f97c4";gFill(mx,it.ch,p);
}
function drawGuide(model){
 updateMini();clearCtx(gx);
 const it=cur();if(!it)return;
 if(model){const p=fit(gx,it.ch);gx.fillStyle="rgba(255,110,110,.5)";gFill(gx,it.ch,p);return}
 if(st.level==="free")return;
 const p=fit(gx,it.ch);
 if(st.level==="trace"){
  gx.lineWidth=2.5;gx.strokeStyle="#a9c0ea";gx.lineJoin="round";gStroke(gx,it.ch,p);
  gx.fillStyle="#dfe9fa";gFill(gx,it.ch,p);
 }else{
  const sk=skeleton();gx.fillStyle="#4f6fae";
  sk.dots.forEach(q=>{gx.beginPath();gx.arc(q[0],q[1],Math.max(3.5,st.S*.0125),0,6.2832);gx.fill()});
 }
}
function penW(){return Math.max(8,st.S*LEVELS[st.level].pen)}
function strokesTo(ctx,w,S){
 ctx.lineCap="round";ctx.lineJoin="round";ctx.lineWidth=w;ctx.strokeStyle="#1f6fd0";ctx.fillStyle="#1f6fd0";
 st.strokes.forEach(s=>{
  if(!s.length)return;
  if(s.length<3){const q=s[0];ctx.beginPath();ctx.arc(q[0]*S,q[1]*S,w/2,0,6.2832);ctx.fill();if(s.length===1)return}
  ctx.beginPath();ctx.moveTo(s[0][0]*S,s[0][1]*S);
  for(let i=1;i<s.length-1;i++){const a=s[i],b=s[i+1];ctx.quadraticCurveTo(a[0]*S,a[1]*S,(a[0]+b[0])/2*S,(a[1]+b[1])/2*S)}
  const l=s[s.length-1];ctx.lineTo(l[0]*S,l[1]*S);ctx.stroke();
 });
}
function drawInk(){
 clearCtx(ix);strokesTo(ix,penW(),st.S);
 // في «صِلِ النقاط»: النقاط تُرسم فوق الخط دائمًا، فلا تُخفيها كتلة ولا يظن الطفل أنها «مُسحت»
 if(st.level==="dots"&&cur()){
  const sk=skeleton(),r=Math.max(3.5,st.S*.0125);
  sk.dots.forEach(q=>{ix.beginPath();ix.arc(q[0],q[1],r+1.6,0,6.2832);ix.fillStyle="#fff";ix.fill();ix.beginPath();ix.arc(q[0],q[1],r,0,6.2832);ix.fillStyle="#2c4a8c";ix.fill()});
 }
}
/* نسبة الحبر خارج «ممر» النقاط (نحو 7% من اللوحة حول مسار الحرف): الرسم الصحيح داخله، والتظليل الواسع يخرج منه */
function outsideRatio(S){
 if(st.level!=="dots"||!st.strokes.length)return 0;
 const sc=.5,N=Math.max(60,Math.round(S*sc));
 const m=mkCanvas(N),mx=m.getContext("2d");mx.scale(sc,sc);mx.fillStyle="#000";const rr=S*.07;
 skeleton().pts.forEach(q=>{mx.beginPath();mx.arc(q[0],q[1],rr,0,6.2832);mx.fill()});
 const k=mkCanvas(N),kx=k.getContext("2d");kx.scale(sc,sc);strokesTo(kx,penW(),S);
 const M=mx.getImageData(0,0,N,N).data,K=kx.getImageData(0,0,N,N).data;let ink=0,out=0;
 for(let i=3;i<K.length;i+=4)if(K[i]>40){ink++;if(M[i]<=40)out++}
 return ink?out/ink:0;
}
/* كتلة: خط يعيد المرور على المساحة نفسها مرارًا (تظليل/تلطيخ) بدل أن يصل النقاط بخط واحد */
function blobCount(S){
 if(st.level!=="dots")return 0;
 const w=penW(),sc=.5,N=Math.max(60,Math.round(S*sc));let n=0;
 st.strokes.forEach(s_=>{
  if(s_.length<8)return;
  let L=0;for(let i=1;i<s_.length;i++)L+=Math.hypot((s_[i][0]-s_[i-1][0])*S,(s_[i][1]-s_[i-1][1])*S);
  if(L<S*.3)return;
  const c=mkCanvas(N),x=c.getContext("2d");x.scale(sc,sc);x.lineCap=x.lineJoin="round";x.lineWidth=w;x.strokeStyle="#000";
  x.beginPath();x.moveTo(s_[0][0]*S,s_[0][1]*S);for(let i=1;i<s_.length;i++)x.lineTo(s_[i][0]*S,s_[i][1]*S);x.stroke();
  const d=x.getImageData(0,0,N,N).data;let A=0;for(let i=3;i<d.length;i+=4)if(d[i]>40)A++;
  A=A/(sc*sc);if(A>0&&L*w/A>2.2)n++;
 });
 return n;
}
function setup(){
 const b=$("wr-board"),host=b.parentNode,w=Math.max(200,Math.min(host.clientWidth-44,420)),d=window.devicePixelRatio||1;
 st.S=w;b.style.width=w+"px";b.style.height=w+"px";
 [gc,ic].forEach(c=>{c.width=c.height=Math.round(w*d);c.style.width=c.style.height=w+"px"});
 gx.setTransform(d,0,0,d,0,0);ix.setTransform(d,0,0,d,0,0);
 drawGuide();drawInk();
}

/* ----- التقييم (للتتبّع والنقاط) ----- */
function mkCanvas(S){const c=document.createElement("canvas");c.width=c.height=S;return c}
function score(){
 const S=Math.round(st.S),it=cur();
 // تغطية: مسار القلم بسُمكه + هامش تساهل صغير
 const cov=mkCanvas(S),cx=cov.getContext("2d");strokesTo(cx,penW()+S*.035,S);
 const C=cx.getImageData(0,0,S,S).data;
 // حدود مسموحة للخروج: الشكل موسَّعًا قليلًا
 const dil=mkCanvas(S),dx=dil.getContext("2d");
 if(st.level==="dots"&&st.kind==="letters"&&LP[it.ch]){
  const mk=skeleton();dx.fillStyle="#000";dx.strokeStyle="#000";dx.lineCap=dx.lineJoin="round";dx.lineWidth=S*.15;
  mk.strokes.forEach(sg=>{dx.beginPath();sg.forEach((p,i)=>i?dx.lineTo(p[0],p[1]):dx.moveTo(p[0],p[1]));dx.stroke()});
 }else{const q=fit(dx,it.ch);
 dx.fillStyle="#000";gFill(dx,it.ch,q);dx.lineWidth=S*.12;dx.lineJoin="round";dx.strokeStyle="#000";gStroke(dx,it.ch,q);}
 const D=dx.getImageData(0,0,S,S).data;
 const at=(arr,x,y)=>arr[(Math.min(S-1,Math.max(0,y))*S+Math.min(S-1,Math.max(0,x)))*4+3];
 // عينات الهدف مع رقم المكوّن (الجسم، الهمزة، كل نقطة...)
 const samples=[];
 if(st.level==="trace"){
  const tg=mkCanvas(S),tx=tg.getContext("2d"),p=fit(tx,it.ch);tx.fillStyle="#000";gFill(tx,it.ch,p);
  const T=tx.getImageData(0,0,S,S).data,st3=3,W=Math.ceil(S/st3),lab=new Int32Array(W*W).fill(-1);let nc=0;
  const on=(gx_,gy_)=>gx_>=0&&gy_>=0&&gx_<W&&gy_<W&&at(T,gx_*st3,gy_*st3)>40;
  for(let gy_=0;gy_<W;gy_++)for(let gx_=0;gx_<W;gx_++){
   if(!on(gx_,gy_)||lab[gy_*W+gx_]>=0)continue;
   const stack=[[gx_,gy_]];lab[gy_*W+gx_]=nc;
   while(stack.length){const c=stack.pop();[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const nx=c[0]+d[0],ny=c[1]+d[1];if(on(nx,ny)&&lab[ny*W+nx]<0){lab[ny*W+nx]=nc;stack.push([nx,ny])}})}
   nc++;
  }
  for(let gy_=0;gy_<W;gy_++)for(let gx_=0;gx_<W;gx_++){const l=lab[gy_*W+gx_];if(l>=0)samples.push([gx_*st3,gy_*st3,l])}
 }else{
  skeleton().pts.forEach(q2=>samples.push([Math.round(q2[0]),Math.round(q2[1]),q2[2]]));
 }
 // أكبر جزء متصل من الشكل بقي بلا تغطية (يميّز الشكل الناقص، مثل رسم 7 فوق 2، عن الشكل التقريبي الكامل)
 const uncov=[];let gtot=0;
 samples.forEach(s_=>{if(st.level==="trace"&&((s_[0]/3|0)%3||(s_[1]/3|0)%3))return;gtot++;if(at(C,s_[0],s_[1])<=40)uncov.push(s_)});
 let gap=0;
 if(uncov.length&&gtot){const seen=new Uint8Array(uncov.length),lim=(S*.06)*(S*.06);
  for(let i=0;i<uncov.length;i++){if(seen[i])continue;let n=0;const q=[i];seen[i]=1;
   while(q.length){const a=uncov[q.pop()];n++;for(let j=0;j<uncov.length;j++){if(seen[j])continue;const b=uncov[j],dx_=a[0]-b[0],dy_=a[1]-b[1];if(dx_*dx_+dy_*dy_<=lim){seen[j]=1;q.push(j)}}}
   if(n>gap)gap=n}
  gap=gap/gtot}
 const tot=samples.length;let hit=0;const byC={};
 samples.forEach(s=>{const h=at(C,s[0],s[1])>40;if(h)hit++;const o=byC[s[2]]||(byC[s[2]]={n:0,h:0});o.n++;if(h)o.h++});
 // كل مكوّن في الحرف (نقطة، همزة، جسم) يجب أن يُكتب فعلًا؛ المكوّنات الصغيرة تُفحص بقلم بلا هامش تساهل زائد
 const gl=glyphComps(S,it),cov2=mkCanvas(S),cx2=cov2.getContext("2d");strokesTo(cx2,penW()+S*.05,S);
 const Ct=cx2.getImageData(0,0,S,S).data,bigN=gl.total*.12,gb={};
 gl.samples.forEach(q=>{const small=gl.cnt[q[2]]<bigN,h=at(small?Ct:C,q[0],q[1])>40,o=gb[q[2]]||(gb[q[2]]={n:0,h:0});o.n++;if(h)o.h++});
 let worst=1;Object.keys(gb).forEach(k=>{const o=gb[k];if(o.n>=2&&(gl.cnt[k]<bigN||st.level==="trace"))worst=Math.min(worst,o.h/o.n)});
 if(st.level==="dots")Object.keys(byC).forEach(k=>{const o=byC[k];if(o.n>=3)worst=Math.min(worst,o.h/o.n)});
 const ncomp=Object.keys(gb).length;
 // الدقة: نقاط مسار القلم نفسه (لا سُمكه) داخل حدود الشكل
 let ink=0,out=0,extra=0;const step=S*.008;
 st.strokes.forEach(s=>{
  let sI=0,sO=0;
  for(let i=0;i<s.length;i++){
   const a=s[i],b=s[i+1]||s[i],dist=Math.hypot((b[0]-a[0])*S,(b[1]-a[1])*S),n=Math.max(1,Math.ceil(dist/step));
   for(let k=0;k<n;k++){
    const x=Math.round((a[0]+(b[0]-a[0])*k/n)*S),y=Math.round((a[1]+(b[1]-a[1])*k/n)*S);
    ink++;sI++;if(at(D,x,y)<=40){out++;sO++}
   }
  }
  if(sI&&sO/sI>.6)extra++;
 });
 let dotsMiss=0;if(st.level==="dots")skeleton().dots.forEach(q=>{if(at(C,Math.round(q[0]),Math.round(q[1]))<=40)dotsMiss++});
  const cv=tot?hit/tot:0,sy=ink?out/ink:1;
 return {dotsMiss:dotsMiss,cover:cv,worst:worst,stray:sy,ink:ink,extra:extra,outLen:out*step,S:S,ncomp:ncomp,blob:blobCount(S)+(outsideRatio(S)>.55?1:0),outside:outsideRatio(S),gap:gap,small:Object.keys(gl.cnt).some(k=>gl.cnt[k]<bigN),pct:Math.round(100*cv*(1-sy))};
}
/* مكوّنات الحرف نفسه (الجسم، كل نقطة، الهمزة...) تُستخرج من رسم الحرف مهما كان المستوى */
function glyphComps(S,it){
 if(st.level==="dots"&&st.kind==="letters"&&LP[it.ch]){
  const samples=[],cnt={};skeleton().pts.forEach(q=>{const c=q[2];samples.push([Math.round(q[0]),Math.round(q[1]),c]);cnt[c]=(cnt[c]||0)+1});
  return {samples:samples,cnt:cnt,total:samples.length};
 }
 const tg=mkCanvas(S),tx=tg.getContext("2d"),p=fit(tx,it.ch);tx.fillStyle="#000";gFill(tx,it.ch,p);
 const T=tx.getImageData(0,0,S,S).data,k=3,W=Math.ceil(S/k),lab=new Int32Array(W*W).fill(-1);let nc=0;
 const on=(a,b)=>a>=0&&b>=0&&a<W&&b<W&&T[(Math.min(S-1,b*k)*S+Math.min(S-1,a*k))*4+3]>40;
 for(let b=0;b<W;b++)for(let a=0;a<W;a++){
  if(!on(a,b)||lab[b*W+a]>=0)continue;
  const stack=[[a,b]];lab[b*W+a]=nc;
  while(stack.length){const c=stack.pop();[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const nx=c[0]+d[0],ny=c[1]+d[1];if(on(nx,ny)&&lab[ny*W+nx]<0){lab[ny*W+nx]=nc;stack.push([nx,ny])}})}
  nc++;
 }
 const samples=[],cnt={};
 for(let b=0;b<W;b++)for(let a=0;a<W;a++){const l=lab[b*W+a];if(l>=0){samples.push([a*k,b*k,l]);cnt[l]=(cnt[l]||0)+1}}
 return {samples:samples,cnt:cnt,total:samples.length};
}
/* معايير مرنة: يكفي أن يطابق الرسمُ الشكلَ تقريبًا (تغطية الشكل + البقاء قريبًا منه + عدم ترك نقطة كاملة) */
function grade(r){
 if(r.blob>0)return 0;
 let s=0;
 if(r.cover>=.78&&r.worst>=.45&&r.stray<=.30&&r.extra===0&&r.gap<=.10)s=3;
 else if(r.cover>=.62&&r.worst>=.30&&r.stray<=.45&&r.gap<=.25)s=2;
 else if(r.cover>=.40&&r.stray<=.60)s=1;
 if(r.extra>0&&s>2)s=2;
 if(r.dotsMiss>0)s=Math.min(s,r.dotsMiss>=3?1:2);
 if(r.outside>.25&&s>2)s=2;
 if(r.outside>.40&&s>1)s=1;
 return s;
}
function result(r){
 const lv=st.level;
 const s=grade(r);
 setBest(s);refreshTitle();
 const msgs=[
  "حاول مرة أخرى وتتبّع الشكل ببطء",
  "بداية جيدة! تتبّع الشكل كله ببطء",
  "جميل! بقي بعض الدقة في التفاصيل",
  "ممتاز! كتابتك دقيقة ورائعة"
 ];
 let m=msgs[s];
 if(s<3){
  if(r.blob===0&&r.dotsMiss>0&&r.outside<=.25&&r.extra===0)m="بقيت "+(r.dotsMiss===1?"نقطة واحدة":"نقاط")+" لم تصل إليها؛ صِل كل النقاط الظاهرة";
  else if(r.blob>0)m="لا تُلوّن كتلة فوق النقاط؛ صِل النقاط بخط واحد من أول نقطة إلى آخرها";
  else if(r.outside>.25)m="حاول أن تبقى فوق النقاط ولا تبتعد عنها كثيرًا";
  else if(r.extra>0)m=r.small?"هناك علامة زائدة؛ انتبه لعدد النقاط والهمزة في هذا الحرف":"هناك خط زائد خارج الشكل، حاول أن تبقى فوقه";
  else if(r.stray>.30)m="حاول أن تبقى فوق الشكل ولا تخرج منه كثيرًا";
  else if(r.gap>.10&&!(r.worst<.45&&r.small))m=lv==="trace"?"بقي جزء من الشكل بلا تلوين":"بقي جزء من النقاط بلا رسم";
  else if(r.worst<.45&&r.cover>=.5)m=r.small?"ينقصك جزء صغير في الحرف (نقطة أو همزة)، اكتبه قريبًا من مكانه":"بقي جزء من الشكل بلا "+(lv==="trace"?"تلوين":"رسم");
  else if(r.cover<.78)m=lv==="trace"?"بقي جزء من الشكل بلا تلوين":"بقي جزء من النقاط بلا رسم";
 }
 msg(starsText(s)+"  "+(r.pct!==undefined?r.pct+"٪  ":"")+m,true);
 cheer(s);
}
/* كلمات التشجيع (كلها في الحزمة الجاهزة بسرعة speechSpeed فتُنطق فورًا) */
const CHEERS={
 3:["أَحْسَنْتَ","مُمْتَاز","رَائِع"],
 2:["جَيِّد","جَمِيل"],
 1:["أَعِدِ المُحَاوَلَةَ مَرَّةً أُخْرَى","حَاوِلْ مَرَّةً أُخْرَى"],
 0:["أَعِدِ المُحَاوَلَةَ مَرَّةً أُخْرَى","حَاوِلْ مَرَّةً أُخْرَى"],
 free:[]
};
let lastCheer="";
function cheer(k){
 const a=CHEERS[k]||CHEERS[0];if(!a.length)return;let t=a[Math.floor(Math.random()*a.length)];
 if(a.length>1&&t===lastCheer)t=a[(a.indexOf(t)+1)%a.length];
 lastCheer=t;say(t,pref("speechSpeed",.9));
}
function msg(t,pop){const e=$("wr-res");e.textContent=t;e.classList.remove("pop");if(pop){void e.offsetWidth;e.classList.add("pop")}}

/* ----- الواجهة: تحديث ----- */
function refreshTitle(){
 const it=cur(),n=items().length,b=getBest();
 const label=st.kind==="letters"?"الحرف "+it.ch+" — "+it.name:"الرقم "+it.ch;
 $("wr-title").innerHTML=label+'<small>'+(st.idx+1)+' من '+n+(b?'  <i>'+starsText(b)+'</i>':'')+'</small>';
}
function render(speakIt){
 st.strokes=[];st.cur=null;clearTimeout(st.modelT);cancelAuto();st.done=false;
 $("wr-hint").textContent=LEVELS[st.level].hint;
 refreshTitle();buildPick();msg("");drawGuide();drawInk();
 if(speakIt)speak();
}
function go(d){const n=items().length;st.idx=(st.idx+d+n)%n;render(true)}

/* ----- اختيار حرف أو رقم بنفسك ----- */
function buildPick(){
 const g=$("wr-grid"),a=items(),isNum=st.kind==="numbers";
 g.className="wr-grid"+(isNum?" num":"")+(g.classList.contains("open")?" open":"");
 g.innerHTML="";
 a.forEach((it,i)=>{
  const b=document.createElement("button");b.type="button";b.textContent=it.ch;b.dataset.i=i;
  b.setAttribute("aria-label",(isNum?"الرقم ":"الحرف ")+it.ch);
  if(i===st.idx)b.classList.add("cur");
  try{if(parseInt(localStorage.getItem("wrBest_"+st.kind+"_"+i)||"0",10)>0)b.classList.add("done")}catch(e){}
  g.appendChild(b);
 });
 $("wr-pick").textContent=(g.classList.contains("open")?"▲ إغلاق القائمة":(isNum?"🔎 اختر الرقم بنفسك":"🔎 اختر الحرف بنفسك"));
 $("wr-pick").classList.toggle("on",g.classList.contains("open"));
}
function togglePick(force){
 const g=$("wr-grid"),open=force===undefined?!g.classList.contains("open"):force;
 g.classList.toggle("open",open);buildPick();
 if(open){const c=g.querySelector(".cur");if(c&&c.scrollIntoView)try{c.scrollIntoView({block:"nearest"})}catch(e){}}
}
$("wr-pick").onclick=()=>togglePick();
$("wr-title").onclick=()=>togglePick();
$("wr-grid").onclick=e=>{const b=e.target.closest("button");if(!b)return;st.idx=parseInt(b.dataset.i,10)||0;togglePick(false);render(true)};

/* ----- تشجيع مباشر: عند رفع الطفل يده وتوقّفه عن الكتابة، إن بلغت الدقة 95% فأكثر وكان الشكل صحيحًا ----- */
const AUTO_WAIT=700;
function autoCheck(){
 st.autoT=0;
 if(st.level==="free"||!st.strokes.length||st.cur||st.done)return;
 const r=score();
 if(grade(r)===3&&r.ink>0){
  st.done=true;setBest(3);refreshTitle();buildPick();
  msg(starsText(3)+"  ممتاز! كتابتك صحيحة ودقيقة",true);
  cheer(3);
 }
}
function scheduleAuto(){clearTimeout(st.autoT);st.autoT=0;if(st.level==="free"||!st.strokes.length)return;st.autoT=setTimeout(autoCheck,AUTO_WAIT)}
function cancelAuto(){clearTimeout(st.autoT);st.autoT=0}

/* ----- المؤشر ----- */
function pt(e){const r=ic.getBoundingClientRect();return [Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))]}
ic.addEventListener("pointerdown",e=>{
 if(e.isPrimary===false||st.multi)return;
 e.preventDefault();try{ic.setPointerCapture(e.pointerId)}catch(x){}
 clearTimeout(st.modelT);cancelAuto();st.done=false;if(st.level==="free")drawGuide();
 st.cur=[pt(e)];st.strokes.push(st.cur);drawInk();msg("");
});
ic.addEventListener("pointermove",e=>{if(!st.cur||e.isPrimary===false||st.multi)return;e.preventDefault();st.cur.push(pt(e));drawInk()});
["pointerup","pointercancel","pointerleave"].forEach(t=>ic.addEventListener(t,()=>{const was=!!st.cur;st.cur=null;if(was)scheduleAuto()}));
/* تمرير الصفحة: بإصبعين فوق لوحة الكتابة (أو بإصبع واحد من الهامش حولها) */
let scrollY0=null;
const avgY=t=>{let y=0;for(let i=0;i<t.length;i++)y+=t[i].clientY;return y/t.length};
ic.addEventListener("touchstart",e=>{
 e.preventDefault();
 if(e.touches.length>=2){
  if(st.cur){st.strokes.pop();st.cur=null;drawInk()}
  st.multi=true;cancelAuto();scrollY0=avgY(e.touches);
 }
},{passive:false});
ic.addEventListener("touchmove",e=>{
 if(e.touches.length>=2&&scrollY0!==null){
  e.preventDefault();const y=avgY(e.touches),d=scrollY0-y;scrollY0=y;
  window.scrollBy(0,d);const se=document.scrollingElement;if(se&&Math.abs(se.scrollTop-(window.pageYOffset||0))>1)se.scrollTop+=d;
 }
},{passive:false});
const endTouch=e=>{if(e.touches.length<2)scrollY0=null;if(e.touches.length===0)st.multi=false};
ic.addEventListener("touchend",endTouch);ic.addEventListener("touchcancel",endTouch);

/* ----- الأزرار ----- */
$("wr-kind").onclick=e=>{const b=e.target.closest("button");if(!b)return;st.kind=b.dataset.k;st.idx=0;$("wr-grid").classList.remove("open");
 [].forEach.call($("wr-kind").children,x=>x.classList.toggle("on",x===b));render(true)};
$("wr-lv").onclick=e=>{const b=e.target.closest("button");if(!b)return;st.level=b.dataset.l;
 [].forEach.call($("wr-lv").children,x=>x.classList.toggle("on",x===b));render(false)};
$("wr-next").onclick=()=>go(1);
$("wr-prev").onclick=()=>go(-1);
$("wr-hear").onclick=speak;
$("wr-clear").onclick=()=>{st.strokes=[];st.cur=null;clearTimeout(st.modelT);cancelAuto();st.done=false;drawGuide();drawInk();msg("")};
$("wr-undo").onclick=()=>{st.strokes.pop();st.cur=null;cancelAuto();st.done=false;drawInk();msg("")};
$("wr-check").onclick=()=>{
 if(!st.strokes.length){msg("اكتب أولًا ثم اضغط «تحقق»");return}
 if(st.level==="free"){
  drawGuide(true);msg("قارن كتابتك بالنموذج الأحمر، ثم جرّب مرة أخرى لتصير أجمل",true);cheer("free");
  clearTimeout(st.modelT);st.modelT=setTimeout(()=>drawGuide(),4000);return;
 }
 if(st.done)return;result(score());
};

/* ----- الدخول والخروج من القسم ----- */
function open(){
 [].slice.call(document.querySelectorAll(".mode-page")).forEach(p=>p.classList.remove("active"));
 [].slice.call(document.querySelectorAll(".mode-switch .mode")).forEach(b=>b.classList.remove("active"));
 sec.classList.add("active");btn.classList.add("active");
 const s=$("subtitle");if(s)s.textContent="نتعلّم الكتابة";
 setup();render(false);
}
function leave(){sec.classList.remove("active");btn.classList.remove("active");clearTimeout(st.modelT);cancelAuto()}
btn.onclick=open;
[].slice.call(sw.querySelectorAll(".mode")).forEach(b=>{if(b!==btn)b.addEventListener("click",leave)});
/* ----- إخفاء قسم الكتابة من الإعدادات ----- */
function applyWritingTab(){
 let on=true;try{on=(JSON.parse(localStorage.getItem("learningFeatures")||"{}")).writingTab!==false}catch(e){}
 btn.hidden=!on;
 if(!on&&sec.classList.contains("active")){const l=$("learning-mode");if(l)l.click()}
}
window.applyWritingTab=applyWritingTab;
applyWritingTab();
window.addEventListener("resize",()=>{if(sec.classList.contains("active")){setup()}});
})();
