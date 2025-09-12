import { useState } from "react";

function CodeEditor({
  content,
  readonly = false,
  annotations = [],
  onLineClick,
}) {
  const [selectedLine, setSelectedLine] = useState(null);

  const handleLineClick = (lineNumber) => {
    if (readonly) return;
    setSelectedLine(lineNumber);
    if (onLineClick) {
      onLineClick(lineNumber);
    }
  };

  const lines = content.split("\n");

  return (
    <div style={{ display: "flex", gap: "20px", height: "80vh" }}>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          background: "#f5f5f5",
          padding: "10px",
        }}
      >
        <pre style={{ margin: 0, lineHeight: "1.5" }}>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const lineAnnotations = annotations.filter(
              (ann) => ann.line === lineNumber
            );
            const hasAnnotation = lineAnnotations.length > 0;

            return (
              <div
                key={index}
                onClick={() => handleLineClick(lineNumber)}
                style={{
                  padding: "2px 5px",
                  cursor: readonly ? "default" : "pointer",
                  background:
                    selectedLine === lineNumber
                      ? "#e3f2fd"
                      : hasAnnotation
                      ? "#fff8e1"
                      : "transparent",
                  border:
                    selectedLine === lineNumber
                      ? "1px solid #2196f3"
                      : "1px solid transparent",
                  borderRadius: "3px",
                }}
              >
                <span
                  style={{
                    color: "#666",
                    marginRight: "10px",
                    width: "30px",
                    display: "inline-block",
                    fontWeight: hasAnnotation ? "bold" : "normal",
                    color: hasAnnotation ? "#ff9800" : "#666",
                  }}
                >
                  {lineNumber}
                  {hasAnnotation && " *"}
                </span>
                {line}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

export default CodeEditor;
