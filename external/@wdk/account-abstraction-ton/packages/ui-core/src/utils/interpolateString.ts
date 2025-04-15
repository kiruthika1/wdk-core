export function interpolateString(str: string, variables: Record<string, string | number>) {
  const regex = /\${([a-zA-Z0-9_]+)}/g;
  return str.replace(regex, (_, variable) => {
    const value = variables[variable];
    if (value === undefined) {
      throw new Error(`Undefined environment variable: ${variable}`);
    }
    return String(value);
  });
}
