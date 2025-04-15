function formatUserInput(value: string) {
  value = value.replace(/,/g, '.');
  // if (value.startsWith("0") && value[1] !== ".") {
  //   value = value.slice(1);
  // }
  return value;
}

export const tryParseNumber = (value: string) => {
  const nextUserInput = formatUserInput(value);
  if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
    return nextUserInput;
  }
  return undefined;
};

export const parseNumber = (value: string) => {
  const number = tryParseNumber(value);
  if (!number) throw new Error(`Value "${value}" is invalid number`);
  return number;
};

const inputRegex = /^\d*(?:\\[.])?\d*$/;

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
