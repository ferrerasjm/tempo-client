import { artwork } from "../assets";

export function MenuArtwork({
  name,
  snack = false,
}: {
  name: string;
  snack?: boolean;
}) {
  const drink = name.toLowerCase();
  if (snack) {
    let source = artwork.pastries.croissant;
    if (drink.includes("fruit")) source = artwork.pastries.fruitTart;
    else if (drink.includes("egg")) source = artwork.pastries.eggTart;
    else if (drink.includes("cinnamon")) source = artwork.pastries.cinnamonRoll;
    else if (drink.includes("donut")) source = artwork.pastries.donut;
    else if (drink.includes("muffin")) source = artwork.pastries.muffin;
    return (
      <img className="drink-art" src={source} alt="" width={128} height={128} />
    );
  }

  let source = artwork.drinks.latte;
  if (drink.includes("matcha")) source = artwork.drinks.matcha;
  else if (drink.includes("hot chocolate"))
    source = artwork.drinks.hotChocolate;
  else if (drink.includes("macchiato")) source = artwork.drinks.macchiato;
  else if (drink.includes("americano")) source = artwork.drinks.americano;
  else if (drink.includes("cappuccino")) source = artwork.drinks.cappuccino;

  return (
    <img className="drink-art" src={source} alt="" width={128} height={128} />
  );
}
