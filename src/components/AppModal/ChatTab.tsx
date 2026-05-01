import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, RotateCcw, AlertTriangle } from "lucide-react";
import { formatCurrency } from "../../features/products/productPricing";

const API_BASE_URL = (import.meta as any).env.VITE_BASE_API_URL ?? "";
const DEFAULT_SOURCES = ["mercadolivre", "amazon", "kabum"] as const;

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type RecommendationItem = {
  rank?: number;
  title?: string;
  reason?: string;
  score?: number;
  link?: string;
  price?: number;
  source?: string;
};

type Recommendations = {
  top?: RecommendationItem[];
  rejected?: { title?: string; reason?: string }[];
  notes?: string;
};

type ChatResponse = {
  content?: string;
  provider?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  recommendations?: Recommendations;
};

function getAuthToken(): string | null {
  return (
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access")
  );
}

function readErrorMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  if (typeof payload === "object" && payload) {
    const value = (payload as { error?: unknown; message?: unknown }).error
      ?? (payload as { error?: unknown; message?: unknown }).message;
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [meta, setMeta] = useState<{ provider?: string; model?: string; inputTokens?: number; outputTokens?: number } | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);
  const canSend = input.trim().length > 0 && !loading;

  const emptyState = messages.length === 0;
  const hasRecommendations = (recommendations?.top?.length ?? 0) > 0;

  const providerLabel = useMemo(() => {
    if (!meta?.provider && !meta?.model) return null;
    if (meta?.provider && meta?.model) return `${meta.provider} · ${meta.model}`;
    return meta?.provider ?? meta?.model ?? null;
  }, [meta]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const token = getAuthToken();
    if (!token) {
      setError("Faca login para conversar com a IA.");
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ia/chat/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
          auto_recommend: true,
          sources: DEFAULT_SOURCES,
          pagina: 1,
          limite_por_fonte: 10,
          max_resultados: 5,
          provider: "gemini",
          temperature: 0.2,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let parsed: unknown = null;
        if (responseText) {
          try {
            parsed = JSON.parse(responseText);
          } catch {
            parsed = null;
          }
        }
        const backendMessage = readErrorMessage(parsed) ?? readErrorMessage(responseText);

        if (response.status === 401) {
          throw new Error(backendMessage ?? "Sessao expirada. Faca login novamente.");
        }
        if (response.status === 429) {
          throw new Error(backendMessage ?? "Limite de uso excedido. Tente novamente mais tarde.");
        }
        if (response.status === 502) {
          throw new Error(backendMessage ?? "O provedor de IA esta indisponivel no momento.");
        }

        throw new Error(backendMessage ?? "Nao foi possivel falar com a IA.");
      }

      const data = (await response.json()) as ChatResponse;
      const nextRecommendations = data.recommendations ?? null;
      const nextHasRecommendations = (nextRecommendations?.top?.length ?? 0) > 0;

      if (nextHasRecommendations) {
        const assistantContent = data.content?.trim() || "(Sem resposta da IA)";
        setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
        setRecommendations(nextRecommendations);
      } else {
        setRecommendations(null);
        setError("Nao foi possivel gerar um ranking estruturado.");
      }
      setMeta({
        provider: data.provider,
        model: data.model,
        inputTokens: data.input_tokens,
        outputTokens: data.output_tokens,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao falar com a IA.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages([]);
    setRecommendations(null);
    setMeta(null);
    setError(null);
    setInput("");
  }

  return (
    <div className="ai-chat-shell">
      <header className="ai-chat-header">
        <div className="ai-chat-title">
          <span className="ai-chat-title__icon">
            <Sparkles size={18} />
          </span>
          <div>
            <h2>Chat IA</h2>
            <p>Peca ofertas, dicas e comparacoes com contexto.</p>
          </div>
        </div>

        <div className="ai-chat-header__actions">
          {providerLabel && (
            <span className="ai-chat-provider">
              {providerLabel}
              {meta?.inputTokens && meta?.outputTokens && (
                <span>
                  · {meta.inputTokens}/{meta.outputTokens} tokens
                </span>
              )}
            </span>
          )}
          <button type="button" className="ai-chat-reset" onClick={handleReset}>
            <RotateCcw size={16} />
            Nova conversa
          </button>
        </div>
      </header>

      <div className="ai-chat-body">
        <section className="ai-chat-stream">
          <div className="ai-chat-messages" role="log" aria-live="polite">
            {emptyState && (
              <div className="ai-chat-empty">
                <Sparkles size={22} />
                <p>Comece perguntando por um produto, categoria ou melhor preco.</p>
                <span>Ex: "Procure um notebook gamer ate 5 mil"</span>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`ai-chat-message ${message.role}`}>
                <span className="ai-chat-message__role">
                  {message.role === "user" ? "Voce" : "IA"}
                </span>
                <p>{message.content}</p>
              </div>
            ))}

            {loading && (
              <div className="ai-chat-message assistant ai-chat-message--loading">
                <span className="ai-chat-message__role">IA</span>
                <p>Buscando a melhor resposta...</p>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {error && (
            <div className="ai-chat-error" role="alert">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="ai-chat-input-row">
            <textarea
              className="ai-chat-input"
              value={input}
              placeholder="Digite sua pergunta..."
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              rows={2}
            />
            <button
              type="button"
              className="ai-chat-send"
              onClick={handleSend}
              disabled={!canSend}
            >
              Enviar
            </button>
          </div>
        </section>

        <aside className="ai-chat-recommendations">
          <div className="ai-chat-recommendations__header">
            <h3>Ranking da IA</h3>
            <p>Top 5 quando houver recomendacao automatica.</p>
          </div>

          {!hasRecommendations && (
            <div className="ai-chat-recommendations__empty">
              <p>Nenhum ranking por enquanto.</p>
              <span>Peça por um produto especifico para gerar a lista.</span>
            </div>
          )}

          {hasRecommendations && (
            <div className="ai-chat-recommendations__list">
              {(recommendations?.top ?? []).slice(0, 5).map((item) => (
                <div key={`${item.rank}-${item.title}`} className="ai-chat-reco-card">
                  <div className="ai-chat-reco-card__meta">
                    <span className="ai-chat-reco-rank">#{item.rank ?? 0}</span>
                    <span className="ai-chat-reco-score">{Math.round(item.score ?? 0)} pts</span>
                  </div>
                  <p className="ai-chat-reco-title">{item.title}</p>
                  <p className="ai-chat-reco-reason">{item.reason}</p>
                  <div className="ai-chat-reco-footer">
                    {typeof item.price === "number" && (
                      <span className="ai-chat-reco-price">{formatCurrency(item.price)}</span>
                    )}
                    {item.source && <span className="ai-chat-reco-source">{item.source}</span>}
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer">
                        Ver
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {recommendations?.notes && (
                <div className="ai-chat-reco-notes">
                  {recommendations.notes}
                </div>
              )}
            </div>
          )}

        </aside>
      </div>
    </div>
  );
}
