import React from "react";
import { Box } from "@mui/material";

const TOKEN_PATTERN = /(https?:\/\/[^\s]+|\/\/.*$|#.*$|\/\*.*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|"[A-Za-z0-9_-]+"(?=\s*:)|\b(?:ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE|FATAL|TASK_[A-Z_]+)\b|\b(?:if|else|for|while|function|return|const|let|var|class|import|from|def|true|false|null|None|export|echo)\b|\b\d+(?:\.\d+)?\b)/g;

export function detectSyntaxLanguage(name = "") {
  const value = String(name).toLowerCase();
  if (/\.(json|jsonl)$/.test(value)) return "json";
  if (/\.(ya?ml)$/.test(value)) return "yaml";
  if (/\.(sh|bash|zsh)$/.test(value)) return "shell";
  if (/\.(py)$/.test(value)) return "python";
  if (/\.(js|jsx|ts|tsx)$/.test(value)) return "javascript";
  if (/\.(css|scss)$/.test(value)) return "css";
  if (/\.(html?|xml)$/.test(value)) return "markup";
  return "log";
}

function tokenColor(token, language) {
  if (/^https?:\/\//.test(token)) return "#7dd3fc";
  if (/^(ERROR|WARN(?:ING)?|FATAL|TASK_FAILED|TASK_ERROR)$/.test(token)) return "#fb7185";
  if (/^(INFO|TASK_RUNNING|TASK_FINISHED|TASK_STARTING)$/.test(token)) return "#86efac";
  if (/^(DEBUG|TRACE)$/.test(token)) return "#c4b5fd";
  if (/^#|^\/\//.test(token)) return "#94a3b8";
  if (/^\/\*/.test(token)) return "#94a3b8";
  if (/^['"]/.test(token)) return language === "json" && /"\s*:/.test(token) ? "#7dd3fc" : "#fbbf24";
  if (/^(if|else|for|while|function|return|const|let|var|class|import|from|def|export|echo)$/.test(token)) return "#c4b5fd";
  if (/^\d/.test(token)) return "#f0abfc";
  return "inherit";
}

export function highlightLine(line, language = "log") {
  const value = String(line ?? "");
  const result = [];
  let lastIndex = 0;
  let match;
  TOKEN_PATTERN.lastIndex = 0;
  while ((match = TOKEN_PATTERN.exec(value)) !== null) {
    if (match.index > lastIndex) result.push(value.slice(lastIndex, match.index));
    result.push(
      <Box component="span" key={`${match.index}-${match[0]}`} sx={{ color: tokenColor(match[0], language) }}>
        {match[0]}
      </Box>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < value.length) result.push(value.slice(lastIndex));
  return result.length ? result : value || " ";
}

export default function SyntaxHighlightedText({ text, language = "log", showLineNumbers = false }) {
  return (
    <>
      {String(text || "").split("\n").map((line, index) => (
        <Box
          component="span"
          key={`line-${index}`}
          sx={showLineNumbers ? { display: "grid", gridTemplateColumns: "4em minmax(0, 1fr)", columnGap: 1.5 } : { display: "block" }}
        >
          {showLineNumbers && (
            <Box component="span" sx={{ color: "#64748b", textAlign: "right", userSelect: "none" }}>
              {index + 1}
            </Box>
          )}
          <Box component="span" sx={{ minWidth: 0 }}>{highlightLine(line, language)}</Box>
        </Box>
      ))}
    </>
  );
}
