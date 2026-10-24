export default function Waveform({ active = false, level = 0, large = false }) {
  return (
    <div
      className={`waveform${active ? " is-active" : ""}${large ? " large" : ""}`}
      aria-hidden="true"
    >
      {Array.from({ length: 55 }, (_, i) => {
        const envelope = Math.sin(((i + 1) / 56) * Math.PI);
        const height =
          6 +
          envelope *
            (10 + Math.abs(Math.sin(i * 1.23) * Math.cos(i * 0.37)) * 72);
        return (
          <span
            key={i}
            style={{
              "--height": `${height}px`,
              "--delay": `${(i % 11) * -0.13}s`,
              "--level": Math.max(0.25, level),
            }}
          />
        );
      })}
    </div>
  );
}
