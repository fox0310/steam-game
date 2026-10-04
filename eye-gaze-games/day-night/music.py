"""Original loopable day/night music. Python standard library only."""
from pathlib import Path
import math, wave, array
RATE=22050
NOTES={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
def frequency(note):
 return 440*2**((12*(int(note[-1])+1)+NOTES[note[0]]-69)/12)
def compose(name,bpm,melody,chords,night=False):
 beat=60/bpm; count=round(32*beat*RATE); mix=[0.0]*count
 def voice(note,start,duration,volume,pad=False):
  f=frequency(note); total=round(duration*RATE); offset=round(start*RATE)
  for i in range(total):
   t=i/RATE; attack=min(1,t/(.12 if pad else .025)); release=min(1,(duration-t)/(.4 if pad else .12))
   env=attack*release*(1 if pad else math.exp(-t/(1.5 if night else .40)))
   tone=math.sin(2*math.pi*f*t)+(.12 if night else .3)*math.sin(2*math.pi*f*2*t)+(.025 if night else .08)*math.sin(2*math.pi*f*4*t)
   mix[(offset+i)%count]+=volume*env*tone
 for bar in range(8):
  chord=chords[bar]
  if night:
   for note in chord:voice(note,bar*4*beat,3.6*beat,.020,True)
   for index,note in enumerate(melody[bar]):voice(note,(bar*4+index*2)*beat,2.7*beat,.080)
   for index,note in enumerate(chord):voice(note,(bar*4+index)*beat,2.1*beat,.035)
  else:
   for index,note in enumerate(melody[bar]):voice(note,(bar*4+index*.5)*beat,.65*beat,.095)
   for j in range(4):
    voice(chord[j%3],(bar*4+j)*beat,.6*beat,.047)
   voice(chord[0][0]+'3',bar*4*beat,1.4*beat,.055)
 # A short edge fade removes waveform discontinuities at the loop boundary.
 edge=round(.01*RATE)
 for i in range(edge):
  factor=i/(edge-1); mix[i]*=factor; mix[-1-i]*=factor
 peak=max(map(abs,mix)); scale=(.30 if night else .44)/max(peak,1e-6)
 samples=array.array('h',(round(max(-1,min(1,v*scale))*32767) for v in mix))
 import sys
 if sys.byteorder!='little':samples.byteswap()
 output=Path(__file__).parent/'assets'/name
 with wave.open(str(output),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(samples.tobytes())
 print(name,round(count/RATE,3),'seconds')
chords=[['C4','E4','G4'],['F4','A4','C5'],['C4','E4','G4'],['G4','B4','D5'],['A3','C4','E4'],['F4','A4','C5'],['G4','B4','D5'],['C4','E4','G4']]
day=[['C5','E5','G5','E5','A5','G5','E5','D5'],['F5','A5','C6','A5','G5','F5','E5','C5'],['E5','G5','A5','G5','E5','D5','C5','E5'],['G5','B5','D6','B5','A5','G5','D5','G5'],['A5','C6','E6','C6','B5','A5','G5','E5'],['F5','A5','G5','F5','E5','F5','A5','G5'],['D5','G5','B5','G5','A5','G5','E5','D5'],['C5','E5','G5','E5','D5','E5','G5','C5']]
night=[['E5','G5'],['A4','C5'],['G4','E5'],['D5','G4'],['E5','C5'],['A4','F4'],['G4','D5'],['E5','C5']]
compose('daytime.wav',108,day,chords)
compose('nighttime.wav',64,night,chords,True)
