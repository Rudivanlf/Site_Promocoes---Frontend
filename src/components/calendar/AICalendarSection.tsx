import "./AICalendarSection.css";

export function AICalendarSection() {
  return (
    <section className="calendar-layout">
      <header className="calendar-header">
        <h2>Calendario IA</h2>
        <p>Espaco para agendamentos e organizacao assistida por inteligencia artificial.</p>
      </header>

      <article className="calendar-main-card">
        <div className="calendar-block">
          <h3>Hoje</h3>
          <ul>
            <li>Revisar variacoes de preco dos produtos monitorados.</li>
            <li>Conferir alertas ativos e ajustar prioridades.</li>
            <li>Registrar novas metas de busca para o dia.</li>
          </ul>
        </div>

        <div className="calendar-block">
          <h3>Proximas acoes</h3>
          <ul>
            <li>Planejar acompanhamento semanal de categorias em alta.</li>
            <li>Definir horarios de verificacao para ofertas recorrentes.</li>
            <li>Organizar pauta de monitoramento para o proximo ciclo.</li>
          </ul>
        </div>

        <div className="calendar-block">
          <h3>Sugestoes da IA</h3>
          <ul>
            <li>Priorize produtos com maior taxa de vendas e menor volatilidade.</li>
            <li>Crie rotinas de comparacao por categoria para reduzir ruido.</li>
            <li>Ative checkpoints diarios para identificar oportunidades cedo.</li>
          </ul>
        </div>
      </article>
    </section>
  );
}
