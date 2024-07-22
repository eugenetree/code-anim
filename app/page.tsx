"use client";

import { useEffect, useState } from "react";
import {
  codeToHtml,
  codeToTokens,
  createHighlighter,
  getHighlighter,
  HighlighterGeneric,
} from "shiki";
import { shikiToMonaco } from "@shikijs/monaco";
import * as monaco from "monaco-editor-core";
import { CodeEditor } from "./components/CodeEditor";

const f = async () => {
  const hl = await createHighlighter({
    themes: ["vitesse-dark"],
    langs: ["javascript"],
  });
};

// const d = async () => {
//   // Create the highlighter, it can be reused
//   const highlighter = await createHighlighter({
//     themes: ["vitesse-dark", "vitesse-light"],
//     langs: ["javascript", "typescript", "vue"],
//   });

//   // Register the languageIds first. Only registered languages will be highlighted.
//   monaco.languages.register({ id: "vue" });
//   monaco.languages.register({ id: "typescript" });
//   monaco.languages.register({ id: "javascript" });

//   // Register the themes from Shiki, and provide syntax highlighting for Monaco.
//   shikiToMonaco(highlighter, monaco);

//   // Create the editor
//   const editor = monaco.editor.create(document.getElementById("container"), {
//     value: "const a = 1",
//     language: "javascript",
//     theme: "vitesse-dark",
//   });
// };

const App = () => {
  return <CodeEditor />;
};

export default App;

const calc = ({ a, b }: { a: number; b: number }): number => {
  return a + b;
};
