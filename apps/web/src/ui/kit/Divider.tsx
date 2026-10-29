/** The 150 px title divider: two fading lines meeting at a gold diamond. */
export function Divider({ className }: { className?: string }) {
  return (
    <div className={className ? `divider ${className}` : 'divider'} aria-hidden="true">
      <i />
    </div>
  );
}
