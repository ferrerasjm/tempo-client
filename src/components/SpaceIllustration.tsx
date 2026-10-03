export function SpaceIllustration({ name, className = '' }: { name: string; className?: string }) {
  const midnight = name === 'Midnight Cafe';
  const garden = name === 'Garden Patio';
  const quiet = name === 'Quiet Corner';
  const library = name === 'Library Table';
  return <svg className={`space-illustration ${className}`} viewBox="0 0 480 320" role="img" aria-label={`Original illustration of ${name}`}>
    <rect x="1" y="1" width="478" height="318" rx="12" fill={midnight ? '#344653' : garden ? '#e2e8db' : '#f0eadc'} />
    <g fill="none" stroke={midnight ? '#e9e0cd' : '#4d5045'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 255q216-7 444 0" opacity=".45" />
      {library ? <><path d="M87 46h302v121H87zM87 105h302" fill="#bca484" /><path d="M107 102V59h15v43m14 0V53h20v49m13 0V63h20v39m21 0V55h23v47m22 0V62h17v40m15 0V57h24v45m19 0V68h30v34m-246 61v-42h32v42m18 0v-42h18v42m25 0v-38h36v38m30 0v-42h15v42m22 0v-35h27v35" /></> : quiet ? <><path d="M101 244V104q0-12 10-12M86 96h49l-10-37h-28z" fill="#d4bd83" /><path d="M154 242v-98q52-33 113 0v98m-119-70q-20-9-20 15v50h155v-50q0-24-20-15m-112 45h114m-100 26-9 28m98-28 9 28" fill="#a7b5a0" /></> : <>
        <path d="M94 165V89q0-58 91-58t92 58v76z" fill={midnight ? '#243746' : '#b9cec8'} />
        <path d="M185 33v130m-88-61h176" />
        {midnight ? <><path d="M223 63q-22 24 5 37-43 7-33-29 6-16 28-8" fill="#e3cb8c" /><path d="m132 55 2 7m-5-3h10m118 74 2 7m-5-3h10" /></> : <><path d="M110 127q27-47 49 0m42 2q32-43 56 0" fill={garden ? '#a4b77e' : '#94ad9d'} /><path d="M126 64q17-13 30 0m54 8q12-13 28-2" stroke="#f5f6e9" /></>}
      </>}
      {garden && <><path d="M64 36h350m-331 0v200m310-200v210m-18-193q-34 13-39 50 28-15 39-50m-278 0q33 4 49 39-36-6-49-39" fill="#90a276" /></>}
      {!quiet && <><path d="M110 211q125-9 258 0l-3 15q-123-6-253 0z" fill={midnight ? '#9d8264' : '#c6ad8b'} /><path d="m136 226-8 58m211-58 6 59" /><path d="M82 238v48m45-48v48m-51-69h58v24H76z" fill={midnight ? '#536969' : '#a7b5a0'} /><path d="M353 237v49m43-49v49m-50-69h58v25h-58z" fill={midnight ? '#536969' : '#a7b5a0'} /><path d="m180 195 57-4 11 16-57 4z" fill="#fff9eb" /><path d="M273 185h25v25h-25Zm25 5h8q13 10-8 15" fill="#f7efdc" /></>}
      <path d="M326 147h37l-7 40h-24z" fill="#c09c7b" /><path d="M345 146v-46m0 21q-30-41-27-13 6 18 27 21m0-16q28-40 28-17-6 21-28 28" fill={midnight ? '#8d9b7c' : '#8fa17e'} />
      {quiet && <><path d="M300 225h75m-61 2v39m49-39v39" /><path d="M318 203h20v22h-20Zm20 5h6q10 8-6 13" fill="#f7efdc" /></>}
    </g>
  </svg>;
}
