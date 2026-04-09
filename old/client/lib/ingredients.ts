const UNITS = new Set([
  "cup",
  "cups",
  "tbsp",
  "tablespoon",
  "tablespoons",
  "tsp",
  "teaspoon",
  "teaspoons",
  "oz",
  "ounce",
  "ounces",
  "lb",
  "lbs",
  "pound",
  "pounds",
  "g",
  "gram",
  "grams",
  "kg",
  "quart",
  "quarts",
  "pint",
  "pints",
  "ml",
  "l",
  "liter",
  "liters",
  "clove",
  "cloves",
  "can",
  "cans",
  "slice",
  "slices",
  "stick",
  "sticks",
  "bunch",
  "bunches",
  "ear",
  "ears",
  "rib",
  "ribs",
  "package",
  "packages",
  "packet",
  "packets",
  "pinch",
  "dash",
]);

const QUANTITY_RE = /^(\d+\s\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|[¼½¾⅓⅔⅛⅜⅝⅞]+|\d+[-–]\d+)/;

export const parseIngredientLine = (line: string) => {
  const trimmed = line.trim();
  if (!trimmed) {
    return { quantity: "", unit: "", name: "" };
  }

  const parts = trimmed.split(/\s+/);
  const first = parts[0] ?? "";
  const second = parts[1] ?? "";
  let quantity = "";
  let unit = "";
  let nameStartIndex = 0;

  if (QUANTITY_RE.test(first)) {
    if (first.match(/^\d+$/) && second.match(/^\d+\/\d+$/)) {
      quantity = `${first} ${second}`;
      nameStartIndex = 2;
    } else {
      quantity = first;
      nameStartIndex = 1;
    }

    let pendingParen = false;
    while (parts[nameStartIndex]) {
      const token = parts[nameStartIndex] ?? "";
      if (token.startsWith("(")) pendingParen = true;
      if (pendingParen) {
        nameStartIndex += 1;
        if (token.includes(")")) {
          pendingParen = false;
        }
        continue;
      }
      break;
    }

    const unitCandidate = parts[nameStartIndex]?.toLowerCase() ?? "";
    const normalizedUnit = unitCandidate.replace(/[^a-z]/g, "");
    if (UNITS.has(unitCandidate) || UNITS.has(normalizedUnit)) {
      unit = parts[nameStartIndex] ?? "";
      nameStartIndex += 1;
    }
  }

  const name = parts.slice(nameStartIndex).join(" ").trim();

  return { quantity, unit, name };
};
