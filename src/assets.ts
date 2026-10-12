export const artwork = {
  entrance: "/assets/welcome.gif",
  spaces: {
    "Midnight Cafe": "/assets/cafe/midnight-bg.png",
    "Quiet Corner": "/assets/cafe/corner-bg.png",
    "Garden Patio": "/assets/cafe/garden-bg.png",
    "Window View": "/assets/cafe/window-bg.png",
    "Library": "/assets/cafe/library-bg.png",
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
  sipStats: "/assets/cafe/stats.png?v=20261009-2",
  taskNotebook: "/assets/cafe/to-do nb.png",
  roomPets: {
    "Garden Patio": "/assets/cafe/float.gif",
    "Library": "/assets/cafe/walk.gif",
    "Library Table": "/assets/cafe/walk.gif",
    "Midnight Cafe": "/assets/cafe/sleep.gif",
    "Quiet Corner": "/assets/cafe/tap.gif",
    "Window View": "/assets/cafe/catto.gif",
    "Window Seat": "/assets/cafe/catto.gif",
  } as Record<string, string>,
  profileAvatar: "/assets/cafe/avatar-purple.png",
  profileAvatars: {
    purple: "/assets/cafe/avatar-purple.png",
    orange: "/assets/cafe/avatar-orange.png",
    teal: "/assets/cafe/avatar-teal.png",
  },
  explore: "/assets/cafe/explore.png",
  cafeLogo: "/assets/cafe/cafelogo.png",
  about: "/assets/cafe/about.png",
  calendar: "/assets/cafe/Calendar.png",
  credits: "/assets/cafe/credits.png",
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
    "Window View": "/assets/audio/window.mp3",
    "Library": "/assets/audio/library.mp3",
  } as Record<string, string>,
};

export function spaceArtwork(name: string) {
  return artwork.spaces[displayAreaName(name)] || artwork.spaces["Quiet Corner"];
}

export function spaceMusic(name: string) {
  return artwork.music[displayAreaName(name)] || "";
}

export function displayAreaName(name: string) {
  if (name === "Library Table") return "Library";
  if (name === "Window Seat") return "Window View";
  return name;
}
