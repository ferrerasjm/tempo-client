export const artwork = {
  entrance: "/assets/cafe-entrance.gif",
  spaces: {
    "Midnight Cafe": "/assets/cafe/midnight-bg.png",
    "Quiet Corner": "/assets/cafe/corner-bg.png",
    "Garden Patio": "/assets/cafe/garden-bg.png",
    "Window Seat": "/assets/cafe/window-bg.png",
    "Library Table": "/assets/cafe/library-bg.png",
  } as Record<string, string>,
  furniture: "/assets/cafe/table-and-chair.png",
  characters: {
    yellow: "/assets/cafe/yellow.png",
    green: "/assets/cafe/green.png",
    blue: "/assets/cafe/blue.png",
    red: "/assets/cafe/red.png",
  },
  homeSign: "/assets/cafe/left-sign.png",
  sipStatsSign: "/assets/cafe/right-sign.png",
  drinks: {
    americano: "/assets/cafe/americano.png",
    cappuccino: "/assets/cafe/cappuccino.png",
    latte: "/assets/cafe/latte.png",
    matcha: "/assets/cafe/matcha.png",
    hotChocolate: "/assets/cafe/hot-choco.png",
    macchiato: "/assets/cafe/macchiato.png",
  },
  pastries: {
    fruitTart: "/assets/cafe/fruit-tart.png",
    eggTart: "/assets/cafe/egg-tart.png",
    cinnamonRoll: "/assets/cafe/cinnamon.png",
    donut: "/assets/cafe/donut.png",
    muffin: "/assets/cafe/muffin.png",
    croissant: "/assets/cafe/croissant.png",
  },
  music: {
    "Midnight Cafe": "/assets/audio/midnight.mp3",
    "Quiet Corner": "/assets/audio/quiet-corner.mp3",
    "Garden Patio": "/assets/audio/garden-patio.mp3",
    "Window Seat": "/assets/audio/window.mp3",
    "Library Table": "/assets/audio/library.mp3",
  } as Record<string, string>,
};

export function spaceArtwork(name: string) {
  return artwork.spaces[name] || artwork.spaces["Quiet Corner"];
}

export function spaceMusic(name: string) {
  return artwork.music[name] || "";
}
