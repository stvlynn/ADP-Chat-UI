import React, { useCallback, useEffect, useRef } from 'react';
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
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to clean and validate mermaid chart content
  const cleanMermaidChart = (rawChart: string): string => {
    // Remove any leading/trailing whitespace
    let cleanChart = rawChart.trim();
    
    if (!cleanChart || cleanChart.length < 3) {
      throw new Error('Empty or invalid mermaid diagram');
    }

    // Fix common streaming issues:
    // 1. Ensure the chart starts with a valid mermaid diagram type
    const validStarts = [
      'graph', 'flowchart', 'sequenceDiagram', 'gantt', 
      'classDiagram', 'stateDiagram', 'pie', 'erDiagram', 
      'journey', 'requirementDiagram', 'gitGraph'
    ];
    
    const hasValidStart = validStarts.some(start => cleanChart.startsWith(start));
    
    if (!hasValidStart) {
      // Try to detect diagram type based on content patterns
      if (cleanChart.includes('->') || cleanChart.includes('-->') || cleanChart.includes('==>')) {
        cleanChart = 'flowchart TD\n' + cleanChart;
      } else if (
        (cleanChart.includes('participant') && cleanChart.includes(':')) ||
        (cleanChart.includes('actor') && cleanChart.includes(':'))
      ) {
        cleanChart = 'sequenceDiagram\n' + cleanChart;
      } else {
        // Default to flowchart if we can't determine the type
        cleanChart = 'flowchart TD\n' + cleanChart;
      }
    }

    // 2. Fix common syntax issues in streaming content
    const lines = cleanChart.split('\n');
    const fixedLines = lines.map(line => {
      // Fix missing semicolons in style declarations
      if (line.includes('style ') && !line.includes('fill:') && !line.includes('stroke:')) {
        return line + ' fill:#ffffff,stroke:#000000';
      }
      return line;
    });
    
    // 3. Remove incomplete lines that end with operators
    const validLines = fixedLines.filter(line => {
      // Allow empty lines and comment lines
      if (line.trim() === '' || line.trim().startsWith('%%')) {
        return true;
      }
      
      // Remove lines that likely end mid-statement
      const incompleteEndings = [
        /->\s*$/,     // Ends with arrow
        /-->\s*$/,    // Ends with thick arrow
        /==>\s*$/,    // Ends with bold arrow
        /-\s*$/,      // Ends with dash
        /\+\s*$/,     // Ends with plus
        /\|\s*$/,     // Ends with pipe
      ];
      
      return !incompleteEndings.some(pattern => pattern.test(line));
    });
    
    return validLines.join('\n');
  };

  // Debounced render function to prevent excessive re-renders during streaming
  const debouncedRender = useCallback((chartContent: string) => {
    // Clear any existing timeout
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    // Set a new timeout to render the diagram
    renderTimeoutRef.current = setTimeout(async () => {
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
        const cleanChart = cleanMermaidChart(chartContent);
        
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
              <div style="margin-top: 8px; font-size: 10px; color: #666;">${error.message}</div>
            </div>
          `;
        }
      }
    }, 300); // 300ms debounce delay
  }, [id]);

  useEffect(() => {
    // Trigger debounced render
    debouncedRender(chart);
    
    // Cleanup timeout on unmount
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [chart, debouncedRender]);

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
