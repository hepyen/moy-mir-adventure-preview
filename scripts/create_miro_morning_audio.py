#!/usr/bin/env python3
"""Original offline alarm chimes and Russian wake-up prompts, with no network dependencies."""
import math,struct,subprocess,tempfile,wave
from pathlib import Path
ROOT=Path.cwd()
RAW=ROOT/'android/app/src/main/res/raw'
WEB=ROOT/'public/alarm'
RAW.mkdir(parents=True,exist_ok=True)
WEB.mkdir(parents=True,exist_ok=True)
phrases={
'wake':'Илья, вставай! Пора просыпаться. Новый день уже начался!',
'lessons_intro':'Илья, сегодня у тебя уроки:',
'no_schedule':'Илья, я пока не вижу уроков на сегодня. Проверь расписание в разделе «Учёба».',
'weekend':'Сегодня в школьном расписании нет уроков. Доброе утро, Илья!',
'chores':'Илья, почисти зубы и заправь кровать. Давай начнём утро с хороших дел!',
'bag':'Илья, пора собираться. Проверь, всё ли ты положил в школьный рюкзак.',
'other_subject':'И другие уроки, которые записаны у тебя в расписании.',
'subject_math':'математика',
'subject_spanish':'испанский язык и литература',
'subject_english':'английский язык',
'subject_french':'французский язык',
'subject_history':'география и история',
'subject_biology':'биология и геология',
'subject_pe':'физкультура',
'subject_technology':'технология',
'subject_music':'музыка',
'subject_art':'изобразительное искусство',
'subject_tutor':'классный час',
'subject_religion':'религия',
'subject_values':'этика и ценности',
'subject_physics':'физика и химия',
'subject_computing':'информатика',
'subject_nature':'естественные науки',
'subject_social':'обществознание',
'subject_latin':'латинский язык',
'subject_economics':'экономика',
'subject_dance':'танцы',
'subject_reading':'чтение',
'subject_science':'наука',
'subject_german':'немецкий язык'
}
with tempfile.TemporaryDirectory(prefix='moymir-miro-audio-') as temp:
    folder=Path(temp)
    for key,line in phrases.items():
        aiff=folder/(key+'.aiff')
        target=RAW/('miro_voice_'+key+'.mp3')
        subprocess.run(['say','-v','Milena','-r','158','-o',str(aiff),line],check=True)
        subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(aiff),'-ar','24000','-ac','1','-c:a','libmp3lame','-b:a','56k',str(target)],check=True)
        (WEB/(key+'.mp3')).write_bytes(target.read_bytes())
    rate=22050
    seconds=13
    output=[0.0]*(rate*seconds)
    # C-major 4/4, music-box-style notes with warm bell partials. Original melody.
    scale={'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880.0,'B5':987.77,'C6':1046.50,'D6':1174.66,'E6':1318.51}
    notes=[
      (0.00,'C5',.65),(0.48,'E5',.68),(.97,'G5',.68),(1.48,'C6',1.04),
      (2.35,'B5',.65),(2.81,'G5',.55),(3.28,'E5',.55),(3.78,'G5',.96),
      (4.70,'A5',.63),(5.15,'C6',.62),(5.60,'E6',.65),(6.10,'D6',1.0),
      (7.05,'C6',.65),(7.52,'G5',.59),(7.98,'E5',.66),(8.48,'C5',1.1),
      (9.45,'E5',.6),(9.9,'G5',.6),(10.35,'C6',.9),(11.30,'G5',1.1)
    ]
    for start,name,decay in notes:
        f=scale[name];left=round(start*rate)
        duration=min(int(decay*rate*1.65),len(output)-left)
        for j in range(duration):
            t=j/rate
            env=min(1,t/.018)*math.exp(-2.9*t/decay)
            bell=math.sin(2*math.pi*f*t)*.62+math.sin(2*math.pi*f*2.01*t)*.21+math.sin(2*math.pi*f*3.98*t)*.06
            output[left+j]+=env*bell*.20
    for k in range(len(output)):
        tail=min(1.0,(len(output)-k)/(rate*.65))
        output[k]=max(-.95,min(.95,output[k]*tail))
    wav=folder/'sunrise.wav'
    with wave.open(str(wav),'wb') as w:
        w.setframerate(rate);w.setnchannels(1);w.setsampwidth(2)
        w.writeframes(struct.pack('<'+'h'*len(output),*[int(s*32767) for s in output]))
    melody=RAW/'miro_alarm_sunrise.mp3'
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(wav),'-ar','44100','-ac','1','-c:a','libmp3lame','-b:a','96k',str(melody)],check=True)
    (WEB/'sunrise.mp3').write_bytes(melody.read_bytes())
print('GENERATED',len(phrases),'original recorded Russian morning clips + a new 13s chime melody')
