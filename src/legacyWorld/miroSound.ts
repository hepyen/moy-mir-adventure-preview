/** Original synthesised electronic chirps; no copyrighted audio samples. */
let audioContext: AudioContext | undefined
export function playMiroChirp(variant=0, enabled=true) {
 if (!enabled || typeof window === 'undefined') return false
 try {
  const AudioContextCtor = window.AudioContext
  if (!AudioContextCtor) return false
  audioContext ??= new AudioContextCtor()
  const ctx=audioContext
  if(ctx.state==='suspended') void ctx.resume()
  const now=ctx.currentTime+.009
  const songs=[
   [570,830,690,1050],
   [800,620,940,750,1100],
   [470,520,780,990,700],
   [900,1100,760,580],
  ]
  const notes=songs[Math.abs(variant)%songs.length]
  notes.forEach((freq,i)=>{
   const start=now+i*.087
   const oscillator=ctx.createOscillator()
   const volume=ctx.createGain()
   oscillator.type=i%2?'triangle':'sine'
   oscillator.frequency.setValueAtTime(freq*.84,start)
   oscillator.frequency.exponentialRampToValueAtTime(freq*1.18,start+.045)
   oscillator.frequency.exponentialRampToValueAtTime(freq*.93,start+.12)
   volume.gain.setValueAtTime(.0001,start)
   volume.gain.exponentialRampToValueAtTime(.09,start+.014)
   volume.gain.exponentialRampToValueAtTime(.0001,start+.14)
   oscillator.connect(volume)
   volume.connect(ctx.destination)
   oscillator.start(start)
   oscillator.stop(start+.16)
  })
  return true
 }catch{return false}
}
