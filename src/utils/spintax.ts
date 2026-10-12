/**
 * Parses and evaluates nested Spintax format: {option1|option2|{sub1|sub2}}
 */
export function evaluateSpintax(text: string): string {
  const spintaxRegex = /\{([^{}]+)\}/;
  let result = text;
  
  while (spintaxRegex.test(result)) {
    result = result.replace(spintaxRegex, (_, choices) => {
      const options = choices.split('|');
      const chosen = options[Math.floor(Math.random() * options.length)];
      return chosen;
    });
  }
  
  return result;
}

/**
 * Generate N unique samples from a Spintax string
 */
export function generateSpintaxSamples(text: string, count: number = 4): string[] {
  const samples = new Set<string>();
  for (let i = 0; i < count * 3 && samples.size < count; i++) {
    samples.add(evaluateSpintax(text));
  }
  return Array.from(samples);
}
