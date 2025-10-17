import React from 'react';
import { Message, Role } from '../types';

interface MessageComponentProps {
  message: Message;
}

// Make KaTeX available in the component scope for TypeScript
declare const katex: {
  renderToString(latex: string, options?: { displayMode?: boolean, throwOnError?: boolean }): string;
};

const FormatText: React.FC<{ text: string }> = ({ text }) => {
  // Split the text by LaTeX delimiters ($...$ and $$...$$)
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$]*?\$)/g);

  const renderPart = (part: string, index: number) => {
    try {
        if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.substring(2, part.length - 2);
        const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
        });
        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.substring(1, part.length - 1);
        const html = katex.renderToString(math, {
            throwOnError: false,
        });
        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } else {
        // Apply other formatting to non-math parts
        const formattedText = part
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-gray-900 px-1 py-0.5 rounded text-cyan-300">$1</code>')
            .replace(/(\w+)\^(\d+)/g, '$1<sup>$2</sup>') // for exponents like x^2
            .replace(/\n/g, '<br />');
        return <span key={index} dangerouslySetInnerHTML={{ __html: formattedText }} />;
        }
    } catch (error) {
        console.error("Could not render KaTeX:", error);
        // Fallback to displaying the raw text if KaTeX fails
        return <span key={index}>{part}</span>
    }
  };

  return <div className="whitespace-pre-wrap">{parts.map(renderPart)}</div>;
};


const MessageComponent: React.FC<MessageComponentProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-2xl p-4 max-w-lg lg:max-w-xl xl:max-w-2xl animate-fade-in-up ${
          isUser
            ? 'bg-cyan-600 text-white rounded-br-none'
            : 'bg-gray-700 text-gray-200 rounded-bl-none'
        }`}
      >
        <div className="prose prose-invert prose-p:my-0 prose-strong:text-cyan-300">
           <FormatText text={message.text} />
        </div>
      </div>
    </div>
  );
};

export default MessageComponent;