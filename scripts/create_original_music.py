"""Generate ORIGINAL melodies for MyWorld with no external sound files or copyright assets.
Three arranged, melodic 16-bar pieces in a compact mono MP3 format.
Run: python3 scripts/create_original_music.py (requires ffmpeg on PATH).
"""
import array,math,os,random,struct,subprocess,sys,tempfile,wave
SR=22050
BASE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(BASE,'public','music')
os.makedirs(OUT,exist_ok=True)
NAMES={'C':0,'Cs':1,'D':2,'Ds':3,'E':4,'F':5,'Fs':6,'G':7,'Gs':8,'A':9,'As':10,'B':11}

def frequency(note):
 if isinstance(note,int):return 440*2**((note-69)/12)
 name=note[:-1];octave=int(note[-1]);midi=12*(octave+1)+NAMES[name]
 return frequency(midi)

def tone(buffer,at,duration,note,velocity=.42,timbre='harp'):
 freq=frequency(note); start=int(at*SR);count=min(int(duration*SR),len(buffer)-start)
 if count<=0:return
 two_pi=2*math.pi
 if timbre=='harp':harm=[(1,1),(2,.35),(3,.15),(4,.06)];attack=.009;decay=2.7
 elif timbre=='bell':harm=[(1,1),(2,.33),(3,.18),(5,.07)];attack=.006;decay=1.8
 elif timbre=='piano':harm=[(1,1),(2,.18),(3,.12),(4,.03)];attack=.015;decay=1.9
 elif timbre=='flute':harm=[(1,1),(2,.08),(3,.015)];attack=.09;decay=.63
 else:harm=[(1,1),(2,.16),(3,.04)];attack=.18;decay=.35
 # Use a soft filtered attack/release; no constant drones. Vary melody and harmony every beat.
 ramp=min(.15,duration*.17)
 for j in range(count):
  t=j/SR
  envelope=(1-math.exp(-t/max(.002,attack)))*math.exp(-decay*t)
  envelope*=min(1,max(0,(duration-t)/max(.016,ramp)))
  phase=two_pi*freq*t
  sample=0.0
  for multiplier,level in harm:sample+=level*math.sin(phase*multiplier)
  buffer[start+j]+=velocity*envelope*sample

def create(name,bpm,progression,melody,style):
 beats=4;bars=16;bar_duration=4*60/bpm
 length=bars*bar_duration;buf=array.array('f',[0.0])*int((length+.2)*SR)
 random.seed(43+len(name));beat_seconds=60/bpm
 # Keys in MIDI, varied arrangements and an actual tune (not the old static four-tone oscillator).
 for bar in range(bars):
  chord=progression[bar%len(progression)]
  chord=[int(n) for n in chord]
  start=bar*bar_duration
  if style=='garden':
   tone(buf,start,bar_duration*.87,chord[0]-12,.20,'piano')
   for step,idx in enumerate([0,1,2,1,0,1,2,1]):
    tone(buf,start+step*beat_seconds*.5,beat_seconds*.40,chord[idx]+12,.20 if step%2 else .25,'harp')
   for step in [0,2]:tone(buf,start+step*beat_seconds,beat_seconds*.8,chord[0]-12,.11,'piano')
  elif style=='tree':
   tone(buf,start,bar_duration*.90,chord[0]-12,.17,'flute')
   for step,idx in enumerate([0,2,1,2,0,2,1,2]):
    tone(buf,start+step*beat_seconds*.5,beat_seconds*.37,chord[idx]+12,.14,'bell')
   for step in [0,2]:tone(buf,start+step*beat_seconds,beat_seconds*.8,chord[step//2],.11,'piano')
  else:
   tone(buf,start,bar_duration*.75,chord[0]-12,.14,'pad')
   for step,idx in enumerate([0,1,2,1]):
    tone(buf,start+step*beat_seconds,beat_seconds*.72,chord[idx]+12,.14,'harp')
  # Melody is transposed to harmony center, with different motifs and phrase endings.
  root=chord[0]
  pattern=melody[bar%len(melody)]
  for step,offset in enumerate(pattern):
   if offset is None:continue
   pitch=root+12+int(offset)
   tone(buf,start+step*beat_seconds,beat_seconds*(.78 if style!='tree' else .60),pitch,.27 if style=='garden' else .23,'flute' if style=='tree' else 'bell' if style=='garden' else 'piano')
 # Subtle musical-room reverb; three delayed reflections, no sustained low hum.
 for delay,gain in [(0.16,.09),(.31,.065),(.47,.035)]:
  d=int(delay*SR)
  for i in range(len(buf)-1,d-1,-1):buf[i]+=gain*buf[i-d]
 peak=max(abs(x) for x in buf)
 gain=.64/max(peak,.0001)
 samples=array.array('h',(int(max(-1,min(1,x*gain))*32767) for x in buf))
 fd,path=tempfile.mkstemp(prefix='moymir-music-',suffix='.wav');os.close(fd)
 with wave.open(path,'wb') as wav:wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(SR);wav.writeframes(samples.tobytes())
 target=os.path.join(OUT,name+'.mp3')
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',path,'-codec:a','libmp3lame','-b:a','96k','-ar',str(SR),'-ac','1','-af','afade=t=in:st=0:d=1.8,afade=t=out:st='+str(max(0,length-2.5))+':d=2.5',target],check=True)
 os.remove(path)
 print('CREATED',target,'length=',round(length,2),'size=',os.stat(target).st_size,'peak=',round(peak,2))

# All tunes and progressions composed specifically for MyWorld (C and F major, no borrowed melodies).
create('meadow',92,[[60,64,67],[57,60,64],[65,69,72],[67,71,74]],[[0,2,4,7],[4,2,0,4],[2,4,7,5],[4,2,0,None],[0,4,7,9],[7,5,4,2],[4,2,0,2],[7,4,2,0]],'garden')
create('treehouse',104,[[62,65,69],[67,71,74],[60,64,67],[69,72,76]],[[0,7,4,9],[12,9,7,4],[7,9,12,9],[7,4,2,None],[0,4,7,4],[9,7,4,2],[7,12,9,7],[4,2,0,0]],'tree')
create('reading',78,[[65,69,72],[60,64,67],[62,65,69],[67,71,74]],[[0,None,4,7],[9,7,4,None],[2,4,None,5],[4,2,0,None],[4,None,7,9],[7,5,4,None],[2,4,7,5],[4,2,0,None]],'reading')
