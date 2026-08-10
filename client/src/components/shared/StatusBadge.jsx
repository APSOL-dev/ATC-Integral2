import { getStatusConfig, calcEstadoBadge } from '../../utils/format.js'

export default function StatusBadge({ badge, pedido, size = 'md' }) {
  // Si no viene badge pero viene pedido, lo calculamos
  const finalBadge = badge || calcEstadoBadge(pedido);
  const config = getStatusConfig(finalBadge);
  
  const sizes = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-3 py-1 text-[10px]',
    lg: 'px-4 py-1.5 text-[11px]',
  }

  // Map the generic color name to our brand/twind palette if necessary, 
  // but here we use the dynamic Tailwind classes. 
  // We'll ensure the colors in getStatusConfig match Tailwind defaults or our brand extensions.
  
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full border border-current/20 transition-all uppercase tracking-widest ${sizes[size]} bg-${config.color}-50 text-${config.color}-600`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-${config.color}-500 shadow-sm shadow-${config.color}-500/20`} />
      {config.label}
    </span>
  )
}
