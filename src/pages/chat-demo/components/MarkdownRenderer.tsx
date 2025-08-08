import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Global mermaid initialization flag
let mermaidInitialized = false;

// Mermaid component for rendering diagrams
const MermaidDiagram: React.FC<{ chart: string; id: string }> = ({ chart, id }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!elementRef.current) return;

      try {
        // Initialize mermaid only once globally
        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'inherit',
            fontSize: 14,
            logLevel: 'error', // Reduce console noise
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
            },
            sequence: {
              useMaxWidth: true,
            },
            gantt: {
              useMaxWidth: true,
            },
          });
          mermaidInitialized = true;
        }

        // Clean the chart content to avoid syntax issues
        const cleanChart = chart.trim();
        
        // Validate basic mermaid syntax
        if (!cleanChart || cleanChart.length < 3) {
          throw new Error('Empty or invalid mermaid diagram');
        }

        // Generate unique ID for this render
        const uniqueId = `mermaid-${id}-${Date.now()}`;
        
        // Render the mermaid diagram
        const { svg } = await mermaid.render(uniqueId, cleanChart);
        
        if (elementRef.current) {
          elementRef.current.innerHTML = svg;
        }
      } catch (error: any) {
        console.warn('Mermaid rendering failed:', error.message);
        if (elementRef.current) {
          // Show a more user-friendly error message
          elementRef.current.innerHTML = `
            <div class="mermaid-error">
              <strong>图表渲染失败</strong><br/>
              <small>请检查图表语法是否正确</small>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [chart, id]);

  return <div ref={elementRef} className="mermaid-diagram" />;
};

// Custom code block component to handle mermaid diagrams
const CodeBlock: React.FC<{ children: string; className?: string }> = ({ children, className }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  if (language === 'mermaid') {
    const id = Math.random().toString(36).substr(2, 9);
    return <MermaidDiagram chart={children} id={id} />;
  }

  return (
    <pre className={className}>
      <code>{children}</code>
    </pre>
  );
};

// Custom components for markdown rendering
const components = {
  code: ({ node, inline, className, children, ...props }: any) => {
    if (!inline) {
      return <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  // Custom table styling
  table: ({ children }: any) => (
    <div className="table-wrapper">
      <table className="markdown-table">{children}</table>
    </div>
  ),
  // Custom blockquote styling
  blockquote: ({ children }: any) => (
    <blockquote className="markdown-blockquote">{children}</blockquote>
  ),
  // Custom link styling
  a: ({ children, href, ...props }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link" {...props}>
      {children}
    </a>
  ),
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
