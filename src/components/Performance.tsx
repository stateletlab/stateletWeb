const retrievalMetrics = [
  { metric: 'hit@5 (recall_any@5)', value: '99.0%', detail: 'top-5 contains >=1 gold session' },
  { metric: 'recall@5', value: '93.7%', detail: 'fraction of gold evidence covered by top-5' },
  { metric: 'MRR', value: '93.8%', detail: 'first gold hit at roughly rank 1-2' },
  { metric: 'span_hit@5', value: '90.0%', detail: 'answer span lands in retrieved window' },
  { metric: 'span_recall@5', value: '78.9%', detail: 'gold answer character-span coverage' },
  { metric: 'top-1 similarity', value: '99.4%', detail: 'most-relevant hit score' },
  { metric: 'gap', value: '3.5%', detail: 'top-1 vs top-2 score gap' },
  { metric: 'avg_token_f1', value: '1.2%', detail: 'mean retrieved text vs gold token-F1' },
  { metric: 'best_token_f1', value: '2.0%', detail: 'best chunk token-F1' },
  { metric: 'rougeL', value: '1.7%', detail: 'retrieved text vs gold LCS' },
]

const accuracyMetrics = [
  { type: 'single-session-assistant', correct: '55 / 56', accuracy: '98.2%' },
  { type: 'single-session-user', correct: '68 / 70', accuracy: '97.1%' },
  { type: 'knowledge-update', correct: '74 / 78', accuracy: '94.9%' },
  { type: 'temporal-reasoning', correct: '122 / 133', accuracy: '91.7%' },
  { type: 'single-session-preference', correct: '26 / 30', accuracy: '86.7%' },
  { type: 'multi-session', correct: '113 / 133', accuracy: '85.0%' },
  { type: 'Overall', correct: '458 / 500', accuracy: '91.6%' },
]

export default function Performance() {
  return (
    <section id="performance" aria-label="Statelet Performance Benchmarks" className="py-24 md:py-32 bg-surface">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="text-center mb-20">
          <p className="eyebrow mb-4">Performance</p>
          <h2 className="text-[34px] md:text-[46px] font-medium text-text leading-[1.12] mb-5">
            Production memory metrics.
          </h2>
          <p className="text-text-muted text-lg max-w-[500px] mx-auto leading-relaxed">
            LongMemEval-S results for retrieval quality and end-to-end agent memory accuracy.
          </p>
        </div>

        <div>
          <div className="text-center mb-8">
            <h3 className="text-[26px] md:text-[32px] font-medium text-text mb-3">
              LongMemEval-S agent memory metrics.
            </h3>
            <p className="text-sm text-text-muted max-w-[620px] mx-auto leading-relaxed">
              Full 500-question run from the Statelet README. Retrieval-only uses k=5 with no LLM at search time; end-to-end accuracy uses retrieval plus reader answer with an LLM judge.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border-light bg-surface-card p-6">
              <div className="flex items-baseline justify-between gap-4 mb-5">
                <div>
                  <h4 className="text-sm font-semibold text-text">Retrieval-Only</h4>
                  <p className="text-xs text-text-light mt-1">500 questions · k=5</p>
                </div>
                <span className="text-2xl font-semibold text-primary tracking-tight">99.0%</span>
              </div>
              <div className="divide-y divide-border-light">
                {retrievalMetrics.map(item => (
                  <div key={item.metric} className="grid grid-cols-[minmax(0,1fr)_72px] gap-4 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text">{item.metric}</div>
                      <div className="text-xs text-text-light leading-relaxed mt-0.5">{item.detail}</div>
                    </div>
                    <div className="text-sm font-mono font-semibold text-text text-right">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border-light bg-surface-card p-6">
              <div className="flex items-baseline justify-between gap-4 mb-5">
                <div>
                  <h4 className="text-sm font-semibold text-text">End-to-End Accuracy</h4>
                  <p className="text-xs text-text-light mt-1">reader / judge: gpt-5.6-sol medium</p>
                  <p className="text-xs text-text-light mt-2 max-w-[260px] leading-relaxed">
                    Extraction was time-boxed; further fact-extraction and conflict-resolution tuning
                    should leave room above 91.6%.
                  </p>
                </div>
                <span className="text-2xl font-semibold text-primary tracking-tight">91.6%</span>
              </div>
              <div className="divide-y divide-border-light">
                {accuracyMetrics.map(item => (
                  <div key={item.type} className="grid grid-cols-[minmax(0,1fr)_72px_64px] gap-3 py-3">
                    <div className={`min-w-0 text-sm ${item.type === 'Overall' ? 'font-semibold text-text' : 'font-medium text-text'}`}>
                      {item.type}
                    </div>
                    <div className="text-xs font-mono text-text-light text-right">{item.correct}</div>
                    <div className={`text-sm font-mono font-semibold text-right ${item.type === 'Overall' ? 'text-primary' : 'text-text'}`}>
                      {item.accuracy}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-light leading-relaxed mt-5">
                Mean context budget: 6,873 tokens/question.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
