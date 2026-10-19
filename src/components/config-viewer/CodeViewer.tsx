interface CodeViewerProps {
  highlightedHtml: string;
}

export function CodeViewer({ highlightedHtml }: CodeViewerProps) {
  return (
    <div
      className="code-surface min-h-full overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
  );
}
