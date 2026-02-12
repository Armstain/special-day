const IntlWithSegmenter = Intl as typeof Intl & {
    Segmenter?: new (
        locales?: string | string[],
        options?: { granularity?: "grapheme" | "word" | "sentence" }
    ) => {
        segment: (input: string) => Iterable<{ segment: string }>;
    };
};

export function splitGraphemes(text: string): string[] {
    if (typeof IntlWithSegmenter.Segmenter === "function") {
        const segmenter = new IntlWithSegmenter.Segmenter("bn", { granularity: "grapheme" });
        return Array.from(segmenter.segment(text), (part) => part.segment);
    }

    return Array.from(text);
}

export function toBengaliNumber(num: number | string): string {
    const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit)]);
}
