export function MenuArtwork({ name, snack = false }: { name: string; snack?: boolean }) {
  const matcha = name.toLowerCase().includes('matcha');
  const chocolate = name.toLowerCase().includes('chocolate');
  return <svg viewBox="0 0 180 170" aria-hidden="true" className="drink-art">
    {snack ? <g stroke="#685341" strokeWidth="3"><path d="M135 80 Q151 103 124 129 Q97 150 66 131 Q34 113 43 79 Q52 44 86 41 Q112 37 129 55 Q111 70 135 80Z" fill="#d6b680" /><g fill="#685341"><circle cx="72" cy="74" r="5" /><circle cx="89" cy="108" r="4" /><circle cx="61" cy="109" r="4" /><circle cx="106" cy="81" r="4" /><circle cx="115" cy="118" r="5" /></g></g> :
    <g stroke="#374139" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="86" cy="137" rx="61" ry="13" fill="#e5e3d9" /><path d="M122 68 C164 51 161 117 119 111" fill="#faf8ef" /><path d="M43 65 L50 112 Q86 147 121 112 L129 65Z" fill={matcha ? '#a5bc85' : chocolate ? '#a27b69' : '#dbc4a1'} /><ellipse cx="86" cy="65" rx="43" ry="15" fill={matcha ? '#7e9d5b' : chocolate ? '#6d4c40' : '#b08360'} /><path d="M66 65 C68 54 110 55 107 65 C105 77 73 77 71 66 C71 62 97 60 100 65" fill="none" stroke="#f7efda" strokeWidth="4" /><path d="M72 36 Q59 25 74 14 M97 36 Q83 24 98 11" fill="none" opacity=".45" /></g>}
  </svg>;
}
