function shuffle<Type>(array: Type[]) {
  for (let from = array.length - 1; from; from--) {
    const to = Math.floor(Math.random() * (from + 1));
    [array[from], array[to]] = [array[to], array[from]];
  }
  return array;
}

export function toShuffled<Type>(array: Type[]) {
  return shuffle([...array]);
}
