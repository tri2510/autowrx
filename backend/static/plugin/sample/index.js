(function (global) {
  // Expect host to expose React and ReactDOM on window
  var React = global.React;
  var ReactDOM = global.ReactDOM;
  if (!React || !ReactDOM) {
    console.error('[sample-plugin] React/ReactDOM not found on window');
    return;
  }

  function Box(props) {
    var _React$useState = React.useState(props.initialCount || 0),
      count = _React$useState[0],
      setCount = _React$useState[1];
    return React.createElement(
      'div',
      { className: 'rounded-md border p-4' },
      React.createElement('div', { className: 'text-lg font-semibold mb-2' }, props.title || 'Sample Plugin'),
      React.createElement(
        'div',
        { className: 'flex items-center gap-2' },
        React.createElement(
          'button',
          {
            className: 'px-3 py-1 rounded bg-slate-700 text-sky-500',
            onClick: function () {
              return setCount(function (c) { return c + 1; });
            },
          },
          'Increment'
        ),
        React.createElement('span', { className: 'text-slate-600' }, 'Count: ' + count)
      )
    );
  }

  var api = {
    // Expose React components for lazy usage
    components: {
      App: function App(props) {
        return React.createElement(
          'div',
          { className: 'min-h-screen w-full flex items-center justify-center bg-white' },
          React.createElement(Box, props || {})
        );
      },
    },
    mount: function (el, props) {
      if (!el) return;
      var root = ReactDOM.createRoot(el);
      root.render(React.createElement(Box, props || {}));
      el.__aw_root = root;
    },
    unmount: function (el) {
      if (el && el.__aw_root) {
        el.__aw_root.unmount();
        delete el.__aw_root;
      }
    },
  };

  global.DAPlugins = global.DAPlugins || {};
  global.DAPlugins.sample = api;
})(window);


