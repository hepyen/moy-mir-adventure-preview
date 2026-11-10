#!/usr/bin/env python3
"""Original instrumental morning theme plus licensed local OS speech synthesis;
offline assets are stored within app and no network requests are made."""
import math,wave,struct,subprocess,tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
out=root/'public'/'health';out.mkdir(parents=True,exist_ok=True)
rate=22050
duration=19.2
n=int(duration*rate)
data=[0.0]*n
# Fresh original, light bell tune with soft harmonic pads and no borrowed melodies.
chords=[
 [261.63,329.63,392.00,523.25],
 [293.66,349.23,440.00,587.33],
 [220.00,293.66,349.23,440.00],
 [246.94,329.63,392.00,493.88]]
melody=[2,3,1,2,0,1,3,2,1,2,3,1,0,3,2,1,
        3,1,2,0,2,3,1,2,0,2,1,3,2,1,0,3]
def bell(t,frequency):
 return (math.sin(2*math.pi*frequency*t)+.27*math.sin(2*math.pi*frequency*2*t)+.1*math.sin(2*math.pi*frequency*3.02*t))
for j in range(32):
 start=.6*j
 chord=chords[(j//8)%4];freq=chord[melody[j]%len(chord)]
 for k in range(int(rate*.7)):
  i=int(start*rate)+k
  if i>=n:break
  t=k/rate; env=min(1,t/.012)*math.exp(-4.2*t)
  data[i]+=.11*env*bell(t,freq*2)
for ch in range(4):
 base=ch*4.8
 for k in range(int(rate*4.8)):
  i=int((base*rate)+k)
  if i>=n:break
  t=k/rate;v=chords[ch][0]/2
  attack=min(1,t/.25);release=min(1,(4.8-t)/.65)
  data[i]+=.035*attack*release*(math.sin(2*math.pi*v*t)+.22*math.sin(2*math.pi*v*2*t))
with tempfile.TemporaryDirectory() as tmp:
 raw=Path(tmp)/'tone.wav'
 with wave.open(str(raw),'wb') as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate)
  buf=bytearray()
  for val in data:
   sig=max(-1,min(1,val))
   buf+=struct.pack('<h',int(sig*30000))
  f.writeframes(buf)
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(raw),'-af','afade=t=out:st=18.4:d=0.8','-codec:a','libmp3lame','-qscale:a','5',str(out/'morning.mp3')],check=True)
 phrases={
  'intro':'Привет, Илья! Это Миро. Начнём спокойную зарядку. Если неприятно или болит, остановись.',
  'stretch':'Потянись вверх, мягко и спокойно. Не делай движений через боль.',
  'shoulders':'Теперь медленно покрути плечами вперёд и назад.',
  'arms':'Подними руки и опусти их. Дыши спокойно.',
  'walk':'Пошагаем на месте без прыжков. Если нога болит, можно двигаться сидя.',
  'chair':'Медленно присядь на устойчивый стул и встань. Если ноге неприятно, пропусти.',
  'sides':'Плавно потянись в стороны, без резких наклонов.',
  'breathe':'Остановись, расслабь плечи и сделай несколько спокойных вдохов.',
  'finish':'Отлично, Илья! Ты уделил время своему здоровью. Теперь можно позавтракать.',
  'rest':'Сегодня можно сделать зарядку полегче. Важно чувствовать себя хорошо.'
 }
 for key,msg in phrases.items():
  aiff=Path(tmp)/(key+'.aiff')
  try:
   subprocess.run(['/usr/bin/say','-v','Milena','-r','172','-o',str(aiff),msg],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=30)
   subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(aiff),'-af','loudnorm=I=-19:LRA=10:TP=-2','-codec:a','libmp3lame','-qscale:a','5',str(out/('voice_'+key+'.mp3'))],check=True,timeout=30)
  except Exception as ex:
   raise RuntimeError('Offline Russian speech rendering failed for '+key) from ex
 print('ORIGINAL_AUDIO',len(phrases),'voice clips + 19.2s instrumental')
 for f in sorted(out.glob('*.mp3')):print(f.name,f.stat().st_size)
