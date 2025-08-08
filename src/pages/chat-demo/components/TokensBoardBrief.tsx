import React from 'react';

interface TokenData {
  total_tokens?: number | string;
  input_tokens?: number | string;
  output_tokens?: number | string;
  procedures?: any[];
  // Possible alternative shapes from backend
  totalTokens?: number | string;
  inputTokens?: number | string;
  outputTokens?: number | string;
  prompt_tokens?: number | string;
  completion_tokens?: number | string;
  // Some backends may use *_count naming
  token_count?: number | string;
  input_count?: number | string;
  output_count?: number | string;
  usage?: {
    total_tokens?: number | string;
    input_tokens?: number | string;
    output_tokens?: number | string;
    totalTokens?: number | string;
    prompt_tokens?: number | string;
    completion_tokens?: number | string;
    token_count?: number | string;
    input_count?: number | string;
    output_count?: number | string;
  };
}

interface TokensBoardBriefProps {
  tokensData?: TokenData;
}

const TokensBoardBrief: React.FC<TokensBoardBriefProps> = ({ tokensData }) => {
  if (!tokensData) return null;
  // Helper to coalesce possible fields (accept numbers and numeric strings)
  const coalesce = (...vals: Array<number | string | undefined | null>) => {
    for (const v of vals) {
      if (v === undefined || v === null) continue;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string') {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
      }
    }
    return undefined;
  };

  const usage = tokensData.usage || {};
  const inputObj: any = (usage as any).input || (usage as any).prompt || undefined;
  const outputObj: any = (usage as any).output || (usage as any).completion || undefined;

  const total_tokens = coalesce(
    tokensData.total_tokens,
    usage.total_tokens,
    tokensData.totalTokens,
    usage.totalTokens,
    // *_count aliases
    (coalesce(tokensData.token_count, usage.token_count)),
    ((coalesce(tokensData.input_tokens, usage.input_tokens, tokensData.prompt_tokens, usage.prompt_tokens, tokensData.inputTokens) || 0)
      + (coalesce(tokensData.output_tokens, usage.output_tokens, tokensData.completion_tokens, usage.completion_tokens, tokensData.outputTokens) || 0))
  ) || 0;

  const input_tokens = coalesce(
    tokensData.input_tokens,
    usage.input_tokens,
    tokensData.prompt_tokens,
    usage.prompt_tokens,
    tokensData.inputTokens,
    // *_count alias
    tokensData.input_count,
    usage.input_count,
    // request/response aliases
    (tokensData as any).request_tokens,
    (usage as any).request_tokens,
    // nested objects
    inputObj && inputObj.tokens
  ) || 0;

  const output_tokens = coalesce(
    tokensData.output_tokens,
    usage.output_tokens,
    tokensData.completion_tokens,
    usage.completion_tokens,
    tokensData.outputTokens,
    // *_count alias
    tokensData.output_count,
    usage.output_count,
    // request/response aliases
    (tokensData as any).response_tokens,
    (usage as any).response_tokens,
    // nested objects
    outputObj && outputObj.tokens
  ) || 0;

  const hasAnyCount = Boolean(
    coalesce(
      tokensData.total_tokens, usage.total_tokens, tokensData.totalTokens, usage.totalTokens, tokensData.token_count, usage.token_count,
      tokensData.input_tokens, usage.input_tokens, tokensData.prompt_tokens, usage.prompt_tokens, tokensData.inputTokens, tokensData.input_count, usage.input_count,
      tokensData.output_tokens, usage.output_tokens, tokensData.completion_tokens, usage.completion_tokens, tokensData.outputTokens, tokensData.output_count, usage.output_count
    )
  );

  try {
    // Debug current tokensData and computed values
    console.debug('[TokensBoardBrief] tokensData:', JSON.stringify(tokensData));
    console.debug('[TokensBoardBrief] computed => total:', total_tokens, ' input:', input_tokens, ' output:', output_tokens);
  } catch (e) {
    console.debug('[TokensBoardBrief] tokensData (non-serializable):', tokensData);
    console.debug('[TokensBoardBrief] computed => total:', total_tokens, ' input:', input_tokens, ' output:', output_tokens);
  }

  return (
    <div className="tokens-board-brief">
      {/* Procedures block (align with Vue tokens-board-brif.vue) */}
      {Array.isArray(tokensData.procedures) && tokensData.procedures.length > 0 && (
        <div className="tokens-board-brief__procedures">
          {tokensData.procedures.map((ele: any, idx: number) => (
            <div className="tokens-board-brief__procedure" key={idx}>
              <div className="tokens-board-brief__procedure-title">{ele.title}</div>
              <div className="tokens-board-brief__procedure-content">{ele.content || ele.display_content}</div>
            </div>
          ))}
        </div>
      )}

      {/* Token counts: only render if backend provided any count field to avoid showing hardcoded zeros */}
      {hasAnyCount && (
        <div className="tokens-board-brief__content">
          <div className="tokens-board-brief__item">
            <span className="tokens-board-brief__label">总Token:</span>
            <span className="tokens-board-brief__value">{total_tokens}</span>
          </div>
          <div className="tokens-board-brief__item">
            <span className="tokens-board-brief__label">输入:</span>
            <span className="tokens-board-brief__value">{input_tokens}</span>
          </div>
          <div className="tokens-board-brief__item">
            <span className="tokens-board-brief__label">输出:</span>
            <span className="tokens-board-brief__value">{output_tokens}</span>
          </div>
        </div>
      )}
    </div>
  );
}
;

export default TokensBoardBrief;