const React = globalThis.React;

export default function Box(props) {
  const [count, setCount] = React.useState(props.initialCount || 0);
  return React.createElement(
    'div',
    { className: 'rounded-md border p-4' },
    React.createElement('div', { className: 'text-lg font-semibold mb-2' }, props.title || 'Sample ESM Plugin'),
    React.createElement(
      'div',
      { className: 'flex items-center gap-2' },
      React.createElement(
        'button',
        {
          className: 'px-3 py-1 rounded bg-slate-700 text-white',
          onClick: () => setCount((c) => c + 1),
        },
        'Increment'
      ),
      React.createElement('span', { className: 'text-slate-600' }, 'Count: ' + count)
    )
  );
}


