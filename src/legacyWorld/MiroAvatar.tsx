/** The shared Miro design used in the island, wake-up preview and Android alarm. */
export function MiroAvatar({face="smile"}:{face?:"smile"|"wink"|"wow"}){
 return (
 <svg viewBox="0 0 150 172" aria-hidden="true">
     <defs>
      <linearGradient id="miroWhite" x1=".15" x2=".9" y1="0" y2="1"><stop stopColor="#fff"/><stop offset=".55" stopColor="#e5f7ff"/><stop offset="1" stopColor="#91c7e3"/></linearGradient>
      <linearGradient id="miroFace" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#17466e"/><stop offset="1" stopColor="#061b35"/></linearGradient>
      <radialGradient id="miroGlow"><stop stopColor="#86f8f4" stopOpacity=".85"/><stop offset="1" stopColor="#54bcef" stopOpacity="0"/></radialGradient>
     </defs>
     <ellipse cx="75" cy="152" rx="53" ry="19" fill="url(#miroGlow)" className="miro-beam"/>
     <path d="M42 76 Q32 92 41 122 Q55 144 75 145 Q103 142 112 121 Q119 95 106 76Z" fill="url(#miroWhite)" stroke="#b7e8fb" strokeWidth="2"/>
     <path d="M36 85 Q18 80 18 99 Q18 117 36 120 L42 109Z" className="miro-arm-left" fill="url(#miroWhite)"/>
     <path d="M114 85 Q132 80 132 99 Q132 117 114 120 L108 109Z" className="miro-arm-right" fill="url(#miroWhite)"/>
     <path d="M25 46 Q25 16 74 15 Q123 16 125 47 Q130 73 104 86 Q76 99 47 86 Q19 72 25 46Z" fill="url(#miroWhite)" stroke="#b4dff5" strokeWidth="2.5"/>
     <path d="M32 48 Q33 30 73 29 Q111 30 117 49 Q120 72 95 78 Q74 85 52 77 Q29 70 32 48Z" fill="url(#miroFace)"/>
     <g className="miro-eyes" fill="none" stroke="#66f4ed" strokeWidth="5.5" strokeLinecap="round">
      {face==='wink'?<><path d="M53 56 Q61 61 70 56"/><path d="M83 51 Q91 40 99 51 Q91 62 83 51"/></>:face==='wow'?<><ellipse cx="61" cy="53" rx="7" ry="10"/><ellipse cx="93" cy="53" rx="7" ry="10"/></>:<><path d="M52 53 Q60 44 68 53"/><path d="M83 53 Q91 44 99 53"/></>}
     </g>
     <path d="M69 66 Q75 71 81 66" stroke="#60f5e9" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
     <ellipse cx="74" cy="110" rx="11" ry="5" fill="#9be7f5" opacity=".8"/>
     <circle cx="35" cy="37" r="3" fill="#fff" opacity=".65"/>
    </svg>
 );
}
