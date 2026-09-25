import React, { useMemo } from "react";
import katex from "katex";
import { cn } from "@/utils/cn";

export interface DuoMathRendererProps {
  content?: string | null;
  className?: string;
  inlineClassName?: string;
  blockClassName?: string;
  inlineOnly?: boolean;
  onFormulaClick?: (latex: string, isBlock: boolean) => void;
}

interface ParsedToken {
  type: "text" | "inline-math" | "display-math";
  content: string;
}

/**
 * Parses a string containing LaTeX math formulas (e.g. $x^2$, $$E=mc^2$$, \(a/b\), \[x\])
 * into structured text and math tokens.
 */
function parseMathTokens(text: string): ParsedToken[] {
  if (!text) return [];

  const tokens: ParsedToken[] = [];
  // Regex to match $$...$$, \[...\], $...$, or \(...\)
  const mathRegex =
    /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    // Leading plain text
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    const raw = match[0];
    if (raw.startsWith("$$") && raw.endsWith("$$")) {
      tokens.push({
        type: "display-math",
        content: raw.slice(2, -2).trim(),
      });
    } else if (raw.startsWith("\\[") && raw.endsWith("\\]")) {
      tokens.push({
        type: "display-math",
        content: raw.slice(2, -2).trim(),
      });
    } else if (raw.startsWith("$") && raw.endsWith("$")) {
      tokens.push({
        type: "inline-math",
        content: raw.slice(1, -1).trim(),
      });
    } else if (raw.startsWith("\\(") && raw.endsWith("\\)")) {
      tokens.push({
        type: "inline-math",
        content: raw.slice(2, -2).trim(),
      });
    }

    lastIndex = match.index + raw.length;
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    tokens.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return tokens;
}

/**
 * Safely renders LaTeX string via KaTeX to HTML string
 */
function renderKaTeXHtml(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
      strict: false,
    });
  } catch (err) {
    console.warn("[DuoMathRenderer] KaTeX render error:", err);
    return `<span class="text-rose-500 font-mono text-xs">${latex}</span>`;
  }
}

/**
 * High-performance, tactile Duolingo-styled math formula and rich text renderer
 */
export const DuoMathRenderer: React.FC<DuoMathRendererProps> = React.memo(
  ({
    content,
    className,
    inlineClassName,
    blockClassName,
    inlineOnly = false,
    onFormulaClick,
  }) => {
    if (!content) return null;

    // Fast-path: If text has no math markers, return directly
    const hasMath =
      content.includes("$") ||
      content.includes("\\(") ||
      content.includes("\\[");
    if (!hasMath) {
      // Split by newline to preserve paragraph breaks cleanly
      const lines = content.split("\n");
      return (
        <span className={cn("whitespace-pre-line", className)}>
          {lines.map((line, idx) => (
            <React.Fragment key={idx}>
              {line}
              {idx < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
      );
    }

    const tokens = useMemo(() => parseMathTokens(content), [content]);

    return (
      <span
        className={cn("duo-math-container leading-relaxed inline", className)}
      >
        {tokens.map((token, index) => {
          if (token.type === "text") {
            const lines = token.content.split("\n");
            return (
              <span key={index}>
                {lines.map((line, lIdx) => (
                  <React.Fragment key={lIdx}>
                    {line}
                    {lIdx < lines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </span>
            );
          }

          const isBlock = token.type === "display-math" && !inlineOnly;
          const html = renderKaTeXHtml(token.content, isBlock);

          if (isBlock) {
            return (
              <span
                key={index}
                role={onFormulaClick ? "button" : undefined}
                tabIndex={onFormulaClick ? 0 : undefined}
                onClick={
                  onFormulaClick
                    ? (e) => {
                        e.stopPropagation();
                        onFormulaClick(token.content, true);
                      }
                    : undefined
                }
                title={onFormulaClick ? "Klik untuk mengedit rumus" : undefined}
                className={cn(
                  "duo-math-display",
                  onFormulaClick &&
                    "cursor-pointer hover:ring-2 hover:ring-duo-blue/40 hover:bg-duo-blue/10 active:scale-[0.99] transition-all",
                  blockClassName,
                )}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }

          return (
            <span
              key={index}
              role={onFormulaClick ? "button" : undefined}
              tabIndex={onFormulaClick ? 0 : undefined}
              onClick={
                onFormulaClick
                  ? (e) => {
                      e.stopPropagation();
                      onFormulaClick(token.content, false);
                    }
                  : undefined
              }
              title={onFormulaClick ? "Klik untuk mengedit rumus" : undefined}
              className={cn(
                "duo-math-inline",
                onFormulaClick &&
                  "cursor-pointer hover:ring-2 hover:ring-duo-blue/40 hover:bg-duo-blue/10 active:scale-[0.98] transition-all",
                inlineClassName,
              )}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        })}
      </span>
    );
  },
);

DuoMathRenderer.displayName = "DuoMathRenderer";

export default DuoMathRenderer;
