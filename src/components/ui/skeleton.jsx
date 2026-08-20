export const Skeleton = ({ w = '100%', h = 16, radius = 8, style }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: radius,
      background: 'linear-gradient(90deg, var(--ink-100) 25%, var(--ink-50) 50%, var(--ink-100) 75%)',
      backgroundSize: '200% 100%',
      animation: 'zShimmer 1.5s infinite linear',
      ...style,
    }}
  />
);

export const SkeletonCard = ({ lines = 3, height = 160 }) => (
  <div
    style={{
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      padding: 20,
      height,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}
  >
    <Skeleton w="40%" h={12} radius={6} />
    <Skeleton w="60%" h={28} radius={6} />
    {Array.from({ length: Math.max(0, lines - 2) }).map((_, i) => (
      <Skeleton key={i} w={i % 2 === 0 ? '80%' : '50%'} h={10} radius={6} />
    ))}
  </div>
);

export default Skeleton;
