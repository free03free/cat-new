import json,os,subprocess,sys,re,difflib,numpy as np,imageio_ffmpeg,sherpa_onnx
FF=imageio_ffmpeg.get_ffmpeg_exe();P="/home/claude/proj/app/src/main/assets/tts-pre/v9/"
sys.path.insert(0,"/home/claude/proj/tools")
_DIAC=re.compile("[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]")
def norm(t):
    t=_DIAC.sub("",t)
    for x,y in (("أ","ا"),("إ","ا"),("آ","ا"),("ى","ي"),("ة","ه"),("ؤ","و"),("ئ","ي")):t=t.replace(x,y)
    t=re.sub(r"[^\u0621-\u064A0-9 ]"," ",t);return re.sub(r"\s+"," ",t).strip()
idx=json.load(open(P+"index.json",encoding="utf-8"));items=idx["items"]
SR=22050
def dec(f):
    o=subprocess.run([FF,"-loglevel","error","-i",P+f,"-f","f32le","-ar",str(SR),"-ac","1","-"],capture_output=True,check=True).stdout;return np.frombuffer(o,dtype="<f4").copy()
def enc(s,path,br="48k"):
    pcm=(np.clip(s,-1,1)*32767).astype("<i2").tobytes()
    subprocess.run([FF,"-y","-loglevel","error","-f","s16le","-ar",str(SR),"-ac","1","-i","-","-c:a","aac","-b:a",br,"-movflags","+faststart",path],input=pcm,check=True)
d=os.path.expanduser("~/.cache/talking-cat-engine/whisper-small/")
rec=sherpa_onnx.OfflineRecognizer.from_whisper(encoder=d+"small-encoder.int8.onnx",decoder=d+"small-decoder.int8.onnx",tokens=d+"small-tokens.txt",language="ar",task="transcribe",num_threads=2)
from scipy.signal import resample_poly
def asr(s):
    x=resample_poly(s,16000,SR).astype(np.float32);x=np.concatenate([x,np.zeros(8000,np.float32)])
    st=rec.create_stream();st.accept_waveform(16000,x);rec.decode_stream(st);return st.result.text
def asr3(s):
    gap=np.zeros(int(SR*.35),np.float32);return asr(np.concatenate([s,gap,s,gap,s]))
def ratio(a,b):return difflib.SequenceMatcher(None,norm(a),norm(b)).ratio()
def valley_cut(s):
    fr=int(SR*.01);n=len(s)//fr;e=np.sqrt((s[:n*fr].reshape(n,fr)**2).mean(axis=1));es=np.convolve(e,np.ones(3)/3,"same")
    act=np.where(e>max(e.max()*.03,1e-4))[0];a,b=int(act[0]),int(act[-1])
    best=None
    for i in range(a+18,b-18):
        if es[i]<=es[i-1] and es[i]<=es[i+1]:
            L=es[a:i].max();R=es[i:b+1].max();r=es[i]/max(1e-9,min(L,R))
            if (b-i)*.01>=.25 and (i-a)*.01>=.2 and (best is None or r<best[0]):best=(r,i)
    if not best:return None
    i=best[1];st=max(0,i*fr-int(SR*.02));en=min(len(s),(b+1)*fr+int(SR*.12))
    seg=s[st:en].copy();f=int(SR*.006);seg[:f]*=np.linspace(0,1,f);seg[-f:]*=np.linspace(1,0,f)
    return seg,best[0],i*.01
WORDS=["جَمَل","دُبْ","زَرَافَة","سَمَكَة","شَمْس","ضِفْدَع","عِنَب","مَوْز","هِلَال"]
import importlib.util
spec=importlib.util.spec_from_file_location("pg","/home/claude/proj/tools/pregen.py")
src=open("/home/claude/proj/tools/pregen.py",encoding="utf-8").read()
m=re.search(r"_NAMES\s*=\s*[^\n]+",src)
NAME_WORD={}
mm=re.search(r"NAME_WORD = (\{[^\n]+\})",src);NAME_WORD=eval(mm.group(1))
WN={w:n for n,w in NAME_WORD.items()}
apply=len(sys.argv)>1 and sys.argv[1]=="apply"
ONLY={"عِنَب"}   # الكلمات المؤكَّد خطؤها بالسماع/التحليل الصوتي؛ أضف غيرها هنا بعد التأكد
for w in WORDS:
    n=WN[w]
    for sp in sorted({k.split("|")[0] for k in items if k.split("|",1)[1]==w}):
        kb=f"{sp}|{n}، {w}";kw=f"{sp}|{w}"
        if kb not in items:print(w,sp,"لا يوجد المركّب");continue
        both=dec(items[kb]);cur=dec(items[kw]);r=valley_cut(both)
        if r is None:print(w,sp,"لا وادي مناسب");continue
        seg,depth,t=r
        a_cur=asr(cur);a_new=asr3(seg);head=asr(both[:int(t*SR)])
        print(f"{w} @{sp}: cut@{t:.2f}s depth={depth:.2f} dur={len(seg)/SR:.2f}s | الحالي→{a_cur!r} ({ratio(a_cur,w):.2f}) | المقتطع→{a_new!r} ({ratio(a_new,w):.2f}) | الرأس→{head!r}")
        if apply and w in ONLY and ratio(a_new,w)>=0.8:
            enc(seg,P+items[kw]);print("   ✔ استُبدل")
