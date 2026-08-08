import { CATEGORIES, getCategory } from '../lib/categories';
import './SpendByCategoryChart.css';

interface CategoryTotal {
  category: string;
  total: number;
}

interface Props {
  expenses: { category: string; amount: number }[];
}

export default function SpendByCategoryChart({ expenses }: Props) {
  // Aggregate by category
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    totals[e.category] = (totals[e.category] ?? 0) + e.amount;
  }

  const data: CategoryTotal[] = CATEGORIES
    .filter(c => totals[c.id] > 0)
    .map(c => ({ category: c.id, total: totals[c.id] }))
    .sort((a, b) => b.total - a.total);

  const grandTotal = data.reduce((s, d) => s + d.total, 0);

  if (data.length === 0) return null;

  // Build SVG donut
  const R = 54, stroke = 14;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  const slices = data.map(d => {
    const pct  = d.total / grandTotal;
    const dash = pct * circ;
    const cat  = getCategory(d.category);
    const slice = { ...d, cat, dash, offset };
    offset += dash;
    return slice;
  });

  return (
    <div className="spend-chart">
      <h3 className="spend-chart__title">Spending Breakdown</h3>
      <div className="spend-chart__body">
        {/* Donut SVG */}
        <div className="spend-chart__donut-wrap">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
            {slices.map(s => (
              <circle
                key={s.category}
                cx="70" cy="70" r={R}
                fill="none"
                stroke={s.cat.color}
                strokeWidth={stroke}
                strokeDasharray={`${s.dash} ${circ - s.dash}`}
                strokeDashoffset={-s.offset + circ * 0.25}
                strokeLinecap="butt"
                style={{ transition: 'stroke-dasharray 0.4s ease' }}
              />
            ))}
            <text x="70" y="65" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="Inter">Total</text>
            <text x="70" y="82" textAnchor="middle" fill="var(--text)" fontSize="14" fontWeight="600" fontFamily="'JetBrains Mono',monospace">
              ₹{grandTotal.toFixed(0)}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="spend-chart__legend">
          {slices.map(s => {
            const pct = ((s.total / grandTotal) * 100).toFixed(0);
            return (
              <div key={s.category} className="spend-chart__legend-item">
                <span className="spend-chart__legend-dot" style={{ background: s.cat.color }} />
                <div className="spend-chart__legend-info">
                  <span className="spend-chart__legend-cat">{s.cat.icon} {s.cat.label}</span>
                  <div className="spend-chart__bar-wrap">
                    <div
                      className="spend-chart__bar"
                      style={{ width: `${pct}%`, background: s.cat.color }}
                    />
                  </div>
                </div>
                <span className="spend-chart__legend-val mono">₹{s.total.toFixed(0)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
