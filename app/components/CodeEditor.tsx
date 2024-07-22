import { useEffect, useRef, useState } from "react";
import {
  createHighlighter,
  HighlighterGeneric,
  ThemedToken,
  TokensResult,
} from "shiki";
import "./code-editor.css";
import DiffMatchPath from "diff-match-patch";
import { hash as getHash } from "ohash";

const dmp = new DiffMatchPath();
dmp.Diff_Timeout = 1;

const value1 = [
  "const",
  " calc",
  " =",
  " ({ ",
  "a",
  ", ",
  "b",
  " }",
  ":",
  " { ",
  "a",
  ":",
  " number",
  "; ",
  "b",
  ":",
  " number",
  " })",
  ":",
  " number",
  " =>",
  " {",
];

const value2 = [
  "const",
  " calc",
  " =",
  " ({ ",
  "a",
  ", ",
  "c",
  " }",
  ":",
  " { ",
  "a",
  ":",
  " string",
  "; ",
  "c",
  ":",
  " number",
  " })",
  ":",
  " number",
  " =>",
  " {",
];

const a = `const x = "hello";`;
const b = `const y = "world";`;

console.log("debug:ab", dmp.diff_main(a, b));

console.log("qqq", dmp.diff_main("hello", "world"));

const prevData = {
  tokens: [
    [
      {
        content: "hello",
        offset: 0,
        color: "#E6EDF3",
        fontStyle: 0,
      },
    ],
  ],
  fg: "#e6edf3",
  bg: "#0d1117",
  themeName: "github-dark-default",
};

const nextData = {
  tokens: [
    [
      {
        content: "hello world",
        offset: 0,
        color: "#E6EDF3",
        fontStyle: 0,
      },
    ],
  ],
  fg: "#e6edf3",
  bg: "#0d1117",
  themeName: "github-dark-default",
};

export const CodeEditor = () => {
  const [codeString, setCodeString] = useState("");
  const [html, setHtml] = useState("");
  const hl = useRef<any>(null);

  // useEffect(() => {
  //   if (!codeString.length) return;

  //   const v = codeToKeyedTokens(hl.current, codeString, {
  //     lang: "typescript",
  //     theme: "github-dark-default",
  //   });

  //   console.log("debug:codeToKeyedTokens", v);
  // }, [codeString]);

  useEffect(() => {
    if (!hl.current) {
      return;
    }

    const hello = codeToKeyedTokens(
      hl.current,
      // "const calc = (a: number, b: number): number => a + b;",
      "hello",
      {
        lang: "typescript",
        theme: "github-dark-default",
      }
    );

    const world = codeToKeyedTokens(
      hl.current,
      // `const calc = ({ a, b }: { a: number; b: number }): number => {
      // return a + b;
      // };`,
      "world",
      {
        lang: "typescript",
        theme: "github-dark-default",
      }
    );

    const result = syncTokenKeys(hello, world, {});

    console.log({
      hello,
      world,
      result,
    });
  }, [codeString]);

  useEffect(() => {
    createHighlighter({
      themes: ["vitesse-dark", "vitesse-light", "github-dark-default"],
      langs: ["javascript", "typescript", "vue"],
    }).then((v) => {
      console.log("created", v);
      hl.current = v;
    });
  }, []);

  useEffect(() => {
    const highlighter = hl.current;
    if (!highlighter) return;

    const html = highlighter.codeToHtml(codeString, {
      lang: "typescript",
      theme: "github-dark-default",
    });

    console.log(
      highlighter.codeToTokens(codeString, {
        lang: "typescript",
        theme: "github-dark-default",
      })
    );
    setHtml(html);

    // console.log("codeString", codeString);
  }, [codeString]);

  return (
    <div style={{ height: 320, width: 500, position: "relative" }}>
      <textarea
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          color: "transparent",
          backgroundColor: "transparent",
          caretColor: "white",
          outline: 0,
          border: 0,
          letterSpacing: "-.186px",
          // opacity: 0,
          // resize: "none",
        }}
        value={codeString}
        onChange={(e) => setCodeString(e.target.value)}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

const calc = ({ a, b }: { a: number; b: number }): number => {
  return a + b;
};

// ########################################
// ########################################
// ########################################
// ########################################

export type Range = [number, number];

export interface MatchedRanges {
  from: Range;
  to: Range;
  content: string;
}

export interface KeyedToken extends ThemedToken {
  key: string;
  htmlClass?: string;
}

export interface KeyedTokensInfo
  extends Pick<TokensResult, "bg" | "fg" | "rootStyle" | "themeName"> {
  code: string;
  hash: string;
  tokens: KeyedToken[];
  lang?: string;
  lineNumbers: boolean;
}

type ArgumentsType<F extends Function> = F extends (...args: infer A) => any
  ? A
  : never;

export function codeToKeyedTokens<
  BundledLangKeys extends string,
  BundledThemeKeys extends string
>(
  highlighter: HighlighterGeneric<BundledLangKeys, BundledThemeKeys>,
  code: string,
  options: ArgumentsType<
    HighlighterGeneric<BundledLangKeys, BundledThemeKeys>["codeToTokens"]
  >[1],
  lineNumbers = false
): KeyedTokensInfo {
  const result = highlighter.codeToTokens(code, options);
  return {
    ...toKeyedTokens(
      code,
      result.tokens,
      // We put the lang and theme to participate in the hash calculation because they can affect the tokenization
      JSON.stringify([
        options.lang,
        "themes" in options ? options.themes : options.theme,
      ]),
      lineNumbers
    ),
    bg: result.bg,
    fg: result.fg,
    rootStyle: result.rootStyle,
    themeName: result.themeName,
    lang: options.lang,
  };
}

export function toKeyedTokens(
  code: string,
  tokens: ThemedToken[][],
  salt = "",
  lineNumbers = false
): KeyedTokensInfo {
  const hash = getHash(code + salt);
  let lastOffset = 0;
  let firstOffset = 0;
  const lineNumberDigits = Math.ceil(Math.log10(tokens.length));
  const keyed = splitWhitespaceTokens(tokens)
    .flatMap((line, lineIdx): ThemedToken[] => {
      firstOffset = line[0]?.offset || lastOffset;
      const lastEl = line[line.length - 1];
      if (!lastEl) lastOffset += 1;
      else lastOffset = lastEl.offset + lastEl.content.length;
      const tokens = [
        ...line,
        {
          content: "\n",
          offset: lastOffset,
        },
      ] as KeyedToken[];
      if (lineNumbers) {
        tokens.unshift({
          key: `${hash}-ln-${lineIdx + 1}`,
          content: `${String(lineIdx + 1).padStart(lineNumberDigits, " ")}  `,
          offset: firstOffset,
          htmlClass: "shiki-magic-move-line-number",
        });
      }
      return tokens;
    })
    .map((token, idx) => {
      const t = token as KeyedToken;
      t.key ||= `${hash}-${idx}`;
      return t;
    });

  return {
    code,
    hash,
    tokens: keyed,
    lineNumbers,
  };
}

function splitWhitespaceTokens(tokens: ThemedToken[][]) {
  return tokens.map((line) => {
    return line.flatMap((token) => {
      if (token.content.match(/^\s+$/)) return token;
      // eslint-disable-next-line regexp/no-super-linear-backtracking
      const match = token.content.match(/^(\s*)(.*?)(\s*)$/);
      if (!match) return token;
      const [, leading, content, trailing] = match;
      if (!leading && !trailing) return token;

      const expanded = [
        {
          ...token,
          offset: token.offset + leading.length,
          content,
        },
      ];
      if (leading) {
        expanded.unshift({
          content: leading,
          offset: token.offset,
        });
      }
      if (trailing) {
        expanded.push({
          content: trailing,
          offset: token.offset + leading.length + content.length,
        });
      }
      return expanded;
    });
  });
}

/**
 * Split a token into multiple tokens by given offsets.
 *
 * The offsets are relative to the token, and should be sorted.
 */
function splitToken(token: KeyedToken, offsets: number[]): KeyedToken[] {
  let lastOffset = 0;
  const key = token.key;
  let index = 0;
  const tokens: KeyedToken[] = [];

  function getKey() {
    if (index === 0) {
      index++;
      return key;
    }
    return `${key}-${index++}`;
  }

  for (const offset of offsets) {
    if (offset > lastOffset) {
      tokens.push({
        ...token,
        content: token.content.slice(lastOffset, offset),
        offset: token.offset + lastOffset,
        key: getKey(),
      });
    }
    lastOffset = offset;
  }

  if (lastOffset < token.content.length) {
    tokens.push({
      ...token,
      content: token.content.slice(lastOffset),
      offset: token.offset + lastOffset,
      key: getKey(),
    });
  }

  return tokens;
}

/**
 * Split 2D tokens array by given breakpoints.
 */
function splitTokens(
  tokens: KeyedToken[],
  breakpoints: number[] | Set<number>
): KeyedToken[] {
  const sorted = Array.from(
    breakpoints instanceof Set ? breakpoints : new Set(breakpoints)
  ).sort((a, b) => a - b);

  if (!sorted.length) return tokens;

  return tokens.flatMap((token) => {
    const breakpointsInToken = sorted
      .filter(
        (i) => token.offset < i && i < token.offset + token.content.length
      )
      .map((i) => i - token.offset)
      .sort((a, b) => a - b);

    if (!breakpointsInToken.length) return token;

    return splitToken(token, breakpointsInToken);
  });
}

export function syncTokenKeys(
  from: KeyedTokensInfo,
  to: KeyedTokensInfo,
  options: any
): { from: KeyedTokensInfo; to: KeyedTokensInfo } {
  const { splitTokens: shouldSplitTokens = false, enhanceMatching = true } =
    options;

  // Run the diff and generate matches parts
  // In the matched parts, we override the keys with the same key so that the transition group can know they are the same element
  const matches = findTextMatches(from.code, to.code, options);
  console.log("matches", matches);

  const tokensFrom = shouldSplitTokens
    ? splitTokens(
        from.tokens,
        matches.flatMap((m) => m.from)
      )
    : from.tokens;

  const tokensTo = shouldSplitTokens
    ? splitTokens(
        to.tokens,
        matches.flatMap((m) => m.to)
      )
    : to.tokens;

  const matchedKeys = new Set<string>();

  matches.forEach((match) => {
    const tokensF = tokensFrom.filter(
      (t) =>
        t.offset >= match.from[0] &&
        t.offset + t.content.length <= match.from[1]
    );
    const tokensT = tokensTo.filter(
      (t) =>
        t.offset >= match.to[0] && t.offset + t.content.length <= match.to[1]
    );

    let idxF = 0;
    let idxT = 0;
    while (idxF < tokensF.length && idxT < tokensT.length) {
      if (!tokensF[idxF] || !tokensT[idxT]) break;
      if (tokensF[idxF].content === tokensT[idxT].content) {
        // assign the key from the first set to the second set
        tokensT[idxT].key = tokensF[idxF].key;
        matchedKeys.add(tokensF[idxF].key);
        idxF++;
        idxT++;
      } else if (tokensF[idxF + 1]?.content === tokensT[idxT].content) {
        // console.log('Token missing match', tokensF[idxF], undefined)
        idxF++;
      } else if (tokensF[idxF].content === tokensT[idxT + 1]?.content) {
        // console.log('Token missing match', undefined, tokensT[idxT])
        idxT++;
      } else {
        // console.log('Token missing match', tokensF[idxF], tokensT[idxT])
        idxF++;
        idxT++;
      }
    }
  });

  console.log("syncTokenKeys:matchedKeys:1", matchedKeys.entries());

  if (enhanceMatching) {
    for (const token of tokensFrom) {
      if (matchedKeys.has(token.key)) continue;
      if (token.content.length < 3 || !token.content.match(/^[\w-]+$/))
        continue;
      const matched = tokensTo.find(
        (t) => t.content === token.content && !matchedKeys.has(t.key)
      );
      if (matched) {
        matched.key = token.key;
        matchedKeys.add(token.key);
      }
    }
  }

  console.log("syncTokenKeys:matchedKeys:2", matchedKeys.entries());

  return {
    from:
      tokensFrom.length === from.tokens.length
        ? from
        : { ...from, tokens: tokensFrom },
    to: tokensTo.length === to.tokens.length ? to : { ...to, tokens: tokensTo },
  };
}

/**
 * Find ranges of text matches between two strings
 * It uses `diff-match-patch` under the hood
 */
export function findTextMatches(
  a: string,
  b: string,
  options: any
): MatchedRanges[] {
  let delta = dmp.diff_main(a, b);
  console.log("debug:delta", delta);
  delta = options.diffCleanup?.(delta) || delta;

  let aContent = "";
  let bContent = "";

  const matched: MatchedRanges[] = [];

  for (const [op, text] of delta) {
    if (op === 0) {
      matched.push({
        from: [aContent.length, aContent.length + text.length],
        to: [bContent.length, bContent.length + text.length],
        content: text,
      });
      aContent += text;
      bContent += text;
    } else if (op === -1) {
      aContent += text;
    } else if (op === 1) {
      bContent += text;
    }
  }

  if (aContent !== a || bContent !== b) throw new Error("Content mismatch");

  console.log("debug:findTextMatches:matched", matched);

  return matched;
}
