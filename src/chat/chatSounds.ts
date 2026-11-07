// Short original two-tone signals generated locally; no downloaded audio assets.
let ctx: AudioContext | null = null
export function primeChatAudio(){
 try{ctx??=new window.AudioContext();if(ctx.state==='suspended')void ctx.resume()}catch{}
}
export function playChatTone(kind:'sent'|'received'){
 try{
  const AudioContextCtor=window.AudioContext
  if(!AudioContextCtor)return
  ctx??=new AudioContextCtor()
  if(ctx.state==='suspended')void ctx.resume()
  const start=ctx.currentTime+.005
  const frequencies=kind==='sent'?[660,880]:[520,760]
  for(let i=0;i<frequencies.length;i++){
   const oscillator=ctx.createOscillator()
   const gain=ctx.createGain()
   oscillator.type='sine';oscillator.frequency.value=frequencies[i]
   const t=start+i*.095
   gain.gain.setValueAtTime(.0001,t)
   gain.gain.exponentialRampToValueAtTime(.11,t+.012)
   gain.gain.exponentialRampToValueAtTime(.0001,t+.09)
   oscillator.connect(gain);gain.connect(ctx.destination)
   oscillator.start(t);oscillator.stop(t+.095)
  }
 }catch{ /* Silent mode or audio policies may block playback. */ }
}
