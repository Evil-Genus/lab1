export class XmlCharacters {
  static validate(value: string): void {
    // XML 1.0 Char production; reject control characters and lone UTF-16 surrogates.
    if (!/^[\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]*$/u.test(value))
      throw new Error('invalid XML character');
  }
}
