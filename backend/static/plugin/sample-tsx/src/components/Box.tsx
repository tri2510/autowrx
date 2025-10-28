// Use host React from the global scope at runtime. Types are optional.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const React: any = (globalThis as any).React;

type BoxProps = {
  title?: string;
  initialCount?: number;
};

export default function Box({ title = 'Sample TSX Plugin', initialCount = 0 }: BoxProps) {
  const [count, setCount] = React.useState(initialCount);
  return (
    <div className="rounded-md border p-4">
      <div className="text-lg font-semibold mb-2">{title}</div>
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1 rounded bg-slate-700 text-black"
          onClick={() => setCount((c: number) => c + 1)}
        >
          Increment
        </button>
        <span className="text-slate-600">Count: {count}</span>
      </div>
    </div>
  );
}


