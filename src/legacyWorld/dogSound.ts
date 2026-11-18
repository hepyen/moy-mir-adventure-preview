/** Locally synthesised two-bark sound. No network, external audio, or licensed recording. */
let context:AudioContext|undefined
export function playDogBark(enabled=true):boolean{
 if(!enabled||typeof window==='undefined'||!window.AudioContext)return false
 try{
  context??=new window.AudioContext()
  const audio=context
  if(audio.state==='suspended')void audio.resume()
  const start=audio.currentTime+.015
  for(const i of [0,1]){
   const at=start+i*.235
   const length=i===0?.175:.20
   const tone=audio.createOscillator()
   const gain=audio.createGain()
   const filter=audio.createBiquadFilter()
   tone.type='sawtooth'
   tone.frequency.setValueAtTime(i===0?215:190,at)
   tone.frequency.exponentialRampToValueAtTime(i===0?90:76,at+length)
   filter.type='lowpass'
   filter.frequency.value=750
   gain.gain.setValueAtTime(.0001,at)
   gain.gain.exponentialRampToValueAtTime(.18,at+.018)
   gain.gain.exponentialRampToValueAtTime(.08,at+.085)
   gain.gain.exponentialRampToValueAtTime(.0001,at+length)
   tone.connect(filter).connect(gain).connect(audio.destination)
   tone.start(at);tone.stop(at+length+.01)
  }
  return true
 }catch{return false}
}
