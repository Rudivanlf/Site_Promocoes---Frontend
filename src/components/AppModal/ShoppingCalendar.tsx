import { useState } from "react";
import { ShoppingBag, Tag, Star, Zap, Gift, Trophy } from "lucide-react";

type CalendarEvent = {
  date: string; // "YYYY-MM-DD"
  title: string;
  type: "black-friday" | "consumer-day" | "mercadolivre" | "bbb" | "strategic" | "best-buy";
  description: string;
  discount?: string;
};

const EVENTS: CalendarEvent[] = [
  // JANEIRO — Saldões
  { date: "2026-01-01", title: "Saldão Início de Ano", type: "strategic", description: "Queima de estoque do Natal e renovação de mostruários. Duas primeiras semanas são as mais fortes.", discount: "até 60%" },
  { date: "2026-01-07", title: "💡 Melhor: Linha Branca", type: "best-buy", description: "Janeiro tem preços de geladeiras, fogões e máquinas de lavar melhores que a Black Friday. Ideal para móveis e eletrodomésticos." },

  // MARÇO — Mês do Consumidor
  { date: "2026-03-08", title: "Pré-Semana Consumidor", type: "consumer-day", description: "As ofertas começam antes do dia 15. Bom momento para monitorar preços de eletrônicos.", discount: "até 40%" },
  { date: "2026-03-15", title: "Dia do Consumidor", type: "consumer-day", description: "Primeiro trimestre fraco em vendas — o varejo transforma o dia 15 em uma quinzena de ofertas para aquecer o mercado.", discount: "até 50%" },
  { date: "2026-03-15", title: "Semana do Consumidor ML", type: "mercadolivre", description: "Mercado Livre expande as ofertas por toda a semana do consumidor. Melhor para e-commerce geral, eletrônicos básicos e itens de utilidade diária.", discount: "até 55%" },
  { date: "2026-03-10", title: "💡 Melhor: Eletrônicos Básicos", type: "best-buy", description: "Terças e quartas têm menor demanda — lojistas oferecem descontos para bater metas semanais." },

  // ABRIL — Final BBB
  { date: "2026-04-08", title: "Final BBB 26", type: "bbb", description: "Final do BBB patrocinado pelo Mercado Livre. Historicamente lançam ofertas relâmpago durante a transmissão ao vivo.", discount: "ofertas relâmpago" },
  { date: "2026-04-15", title: "💡 Melhor: Roupas de Verão", type: "best-buy", description: "Virada de coleção no outono. Estoques de verão com desconto máximo." },

  // MAIO — Dia das Mães
  { date: "2026-05-04", title: "Pré-Dia das Mães", type: "strategic", description: "As melhores promoções aparecem na semana exata antes da data. Não espere o último dia.", discount: "até 45%" },
  { date: "2026-05-10", title: "Dia das Mães", type: "strategic", description: "Segunda data mais importante do comércio brasileiro. Melhor para: smartphones, TVs, moda feminina, perfumes, cosméticos e airfryers.", discount: "até 45%" },

  // JUNHO — Dia dos Namorados
  { date: "2026-06-12", title: "Dia dos Namorados", type: "strategic", description: "Foco em presentes pessoais. Melhor para: roupas, calçados, perfumaria, fones Bluetooth, smartwatches e caixas de som.", discount: "até 35%" },

  // JULHO
  { date: "2026-07-15", title: "💡 Melhor: Eletrodomésticos", type: "best-buy", description: "Meio do ano — liquidações de inverno e preparo para Black Friday antecipada." },

  // AGOSTO — Dia dos Pais + Aniversário ML
  { date: "2026-08-02", title: "Aniversário Mercado Livre", type: "mercadolivre", description: "Historicamente a maior promoção da plataforma com descontos exclusivos para compradores frequentes.", discount: "até 70%" },
  { date: "2026-08-09", title: "Pré-Dia dos Pais", type: "strategic", description: "Campanhas fortes para público masculino começam na semana anterior.", discount: "até 40%" },
  { date: "2026-08-09", title: "Dia dos Pais", type: "strategic", description: "Melhor para: ferramentas, artigos esportivos, moda masculina, bebidas, cadeiras de escritório e tecnologia em geral.", discount: "até 40%" },

  // SETEMBRO — Semana do Brasil
  { date: "2026-09-07", title: "Semana do Brasil", type: "strategic", description: "Iniciativa no feriado de 7 de setembro. Grandes redes online fazem campanhas de frete grátis. Melhor para: viagens, passagens aéreas e eletrônicos pontuais.", discount: "frete grátis" },

  // OUTUBRO — Dia das Crianças
  { date: "2026-10-12", title: "Dia das Crianças", type: "strategic", description: "Foco total em entretenimento e público jovem. Melhor para: videogames, consoles, jogos, tablets, brinquedos e moda infantil.", discount: "até 40%" },

  // NOVEMBRO — Tríade de Ouro
  { date: "2026-11-11", title: "11.11 Singles' Day", type: "black-friday", description: "Importado da Ásia (AliExpress, Shopee), hoje pauta todo o varejo online brasileiro. Ideal para itens de baixo valor, cabos, acessórios e bugigangas com frete grátis.", discount: "até 70%" },
  { date: "2026-11-20", title: "💡 Comece a monitorar", type: "best-buy", description: "Monitore preços desde outubro para não cair na 'metade do dobro' da Black Friday. Use o histórico de preços." },
  { date: "2026-11-27", title: "Black Friday", type: "black-friday", description: "A data suprema. Vale para quase qualquer categoria. Exige monitoramento prévio de preços desde outubro para garantir desconto real.", discount: "até 80%" },
  { date: "2026-11-28", title: "Black Saturday", type: "black-friday", description: "Extensão da Black Friday com ofertas continuadas.", discount: "até 70%" },
  { date: "2026-11-30", title: "Cyber Monday", type: "black-friday", description: "100% digital. Data imbatível para TI: notebooks, monitores, periféricos, hardware e licenças de software. Melhor janela do ano para tecnologia.", discount: "até 60%" },

  // DEZEMBRO — Natal e Pós-Natal
  { date: "2026-12-01", title: "Pré-Natal", type: "strategic", description: "Até dia 20 surgem boas ofertas relâmpago para limpar estoque antes do Natal. Evite a última semana — preços sobem por urgência.", discount: "até 40%" },
  { date: "2026-12-26", title: "Saldão Pós-Natal", type: "strategic", description: "Lojas despencam os preços do que encalhou. Ótimo para decorações de Natal para o próximo ano e roupas.", discount: "até 70%" },
  { date: "2026-12-25", title: "Natal", type: "strategic", description: "Compre até o dia 20. Após essa data os preços sobem por urgência de última hora.", discount: "até 40%" },
];

const TYPE_CONFIG = {
  "black-friday": { color: "#ff6b35", bg: "rgba(255,107,53,0.15)", border: "rgba(255,107,53,0.4)", icon: Zap, label: "Black Friday" },
  "consumer-day": { color: "#39ff14", bg: "rgba(57,255,20,0.12)", border: "rgba(57,255,20,0.4)", icon: ShoppingBag, label: "Consumidor" },
  "mercadolivre": { color: "#ffe600", bg: "rgba(255,230,0,0.12)", border: "rgba(255,230,0,0.4)", icon: Tag, label: "Mercado Livre" },
  "bbb": { color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.4)", icon: Trophy, label: "BBB" },
  "strategic": { color: "#38bdf8", bg: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.4)", icon: Star, label: "Data Especial" },
  "best-buy": { color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.3)", icon: Gift, label: "Melhor Dia" },
};

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

export function ShoppingCalendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }

  function getEventsForDate(day: number): CalendarEvent[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return EVENTS.filter(e => e.date === dateStr);
  }

  const isToday = (day: number) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "1rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>
            Calendário de Compras
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
            Melhores datas para economizar
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
            {MONTHS[month]} {year}
          </span>

          {/* Navegação com SVG inline (novo layout: gap + botões com border-radius) */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={prevMonth}
              className="shopping-cal-nav-btn"
              style={{ width: "36px", height: "36px", borderRight: "none", overflow: "visible", flexShrink: 0, padding: 0, borderRadius: "8px" }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </span>
            </button>

            <button
              onClick={() => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))}
              style={{ padding: "0 14px", height: "36px", border: "1px solid rgba(57,255,20,0.2)", borderRadius: "8px", background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
            >
              Hoje
            </button>

            <button
              onClick={nextMonth}
              className="shopping-cal-nav-btn"
              style={{ width: "36px", height: "36px", borderRight: "none", overflow: "visible", flexShrink: 0, padding: 0, borderRadius: "8px" }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", flexShrink: 0 }}>
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "20px", background: (cfg as any).bg, border: `1px solid ${(cfg as any).border}`, fontSize: "11px", fontWeight: 600, color: (cfg as any).color }}>
            {(cfg as any).label}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem", flex: 1, minHeight: 0 }}>

        {/* Grid do calendário */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Dias da semana */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "4px" }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.35)", padding: "4px 0" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Células */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", flex: 1 }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const events = getEventsForDate(day);
              const hasEvents = events.length > 0;
              const primaryEvent = events[0];
              const cfg = primaryEvent ? TYPE_CONFIG[primaryEvent.type] : null;

              return (
                <div
                  key={day}
                  onClick={() => primaryEvent && setSelectedEvent(selectedEvent?.date === primaryEvent.date && selectedEvent?.title === primaryEvent.title ? null : primaryEvent)}
                  style={{
                    borderRadius: "8px",
                    padding: "4px",
                    background: isToday(day)
                      ? "rgba(57,255,20,0.12)"
                      : hasEvents
                        ? (cfg as any).bg
                        : "rgba(255,255,255,0.03)",
                    border: isToday(day)
                      ? "1px solid rgba(57,255,20,0.5)"
                      : hasEvents
                        ? `1px solid ${(cfg as any).border}`
                        : "1px solid rgba(255,255,255,0.05)",
                    cursor: hasEvents ? "pointer" : "default",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                    minHeight: "52px",
                  }}
                  onMouseEnter={e => { if (hasEvents) { (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${(cfg as any).color}30`; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <span style={{
                    fontSize: "12px",
                    fontWeight: isToday(day) ? 800 : hasEvents ? 700 : 400,
                    color: isToday(day) ? "#39ff14" : hasEvents ? (cfg as any).color : "rgba(255,255,255,0.6)",
                  }}>
                    {day}
                  </span>

                  {events.slice(0, 2).map((ev, i) => {
                    const evCfg = TYPE_CONFIG[ev.type];
                    const Icon = evCfg.icon;
                    return (
                      <div key={i} style={{ width: "100%", display: "flex", alignItems: "center", gap: "2px" }}>
                        <Icon size={8} color={evCfg.color} />
                        <span style={{ fontSize: "9px", color: evCfg.color, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
                          {ev.title.replace("💡 ", "")}
                        </span>
                      </div>
                    );
                  })}
                  {events.length > 2 && (
                    <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)" }}>+{events.length - 2}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel de detalhes */}
        <div style={{ width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto" }}>
          {selectedEvent ? (
            <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} allEvents={EVENTS.filter(e => e.date === selectedEvent.date)} />
          ) : (
            <UpcomingEvents events={EVENTS} currentDate={currentDate} onSelect={setSelectedEvent} />
          )}
        </div>
      </div>
    </div>
  );
}

function EventDetail({ event, onClose, allEvents }: { event: CalendarEvent; onClose: () => void; allEvents: CalendarEvent[] }) {
  const cfg = TYPE_CONFIG[event.type];
  const Icon = cfg.icon;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Detalhes</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "16px", padding: 0 }}>×</button>
      </div>

      {allEvents.map((ev, i) => {
        const evCfg = TYPE_CONFIG[ev.type];
        const EvIcon = evCfg.icon;
        return (
          <div key={i} style={{ background: evCfg.bg, border: `1px solid ${evCfg.border}`, borderRadius: "12px", padding: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <EvIcon size={14} color={evCfg.color} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: evCfg.color }}>{ev.title}</span>
            </div>
            <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{ev.description}</p>
            {ev.discount && (
              <div style={{ marginTop: "6px", padding: "3px 8px", background: evCfg.bg, border: `1px solid ${evCfg.border}`, borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Tag size={10} color={evCfg.color} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: evCfg.color }}>{ev.discount}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UpcomingEvents({ events, currentDate, onSelect }: { events: CalendarEvent[]; currentDate: Date; onSelect: (e: CalendarEvent) => void }) {
  const today = new Date();
  const upcoming = events
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Próximos eventos</span>
      {upcoming.map((ev, i) => {
        const cfg = TYPE_CONFIG[ev.type];
        const Icon = cfg.icon;
        const date = new Date(ev.date);
        const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return (
          <div
            key={i}
            onClick={() => onSelect(ev)}
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "10px", padding: "0.6rem 0.75rem", cursor: "pointer", transition: "transform 0.15s ease" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateX(3px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateX(0)")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
              <Icon size={12} color={cfg.color} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: cfg.color, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ev.title.replace("💡 ", "")}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
                {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </span>
              <span style={{ fontSize: "10px", fontWeight: 600, color: daysUntil <= 7 ? "#ff6b35" : daysUntil <= 30 ? "#ffe600" : "rgba(255,255,255,0.4)" }}>
                {daysUntil === 0 ? "hoje" : daysUntil === 1 ? "amanhã" : `${daysUntil}d`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
