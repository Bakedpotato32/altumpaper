import { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  content: string;
  className?: string;
}

export const MathText = ({ content, className = '' }: MathTextProps) => {
  const parts = useMemo(() => {
    if (!content) return [];
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g;
    const tokens = content.split(regex);

    return tokens.map((token, index) => {
      if (token.startsWith('$$') && token.endsWith('$$')) {
        const math = token.slice(2, -2);
        try {
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="block my-1" />;
        } catch {
          return <span key={index}>{token}</span>;
        }
      } else if (token.startsWith('$') && token.endsWith('$')) {
        const math = token.slice(1, -1);
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="inline-block" />;
        } catch {
          return <span key={index}>{token}</span>;
        }
      }
      return <span key={index}>{token}</span>;
    });
  }, [content]);

  return <span className={className}>{parts}</span>;
};
