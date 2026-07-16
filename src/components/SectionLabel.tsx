interface SectionLabelProps {
  text: string;
}

export default function SectionLabel({ text }: SectionLabelProps) {
  return (
    <span className="font-mono text-xs uppercase tracking-[0.12em]" style={{ color: 'var(--text-tertiary)' }}>
      {text}
    </span>
  );
}
