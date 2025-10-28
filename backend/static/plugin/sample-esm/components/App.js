import Box from './Box.js'

const React = globalThis.React

export default function App(props) {
  return React.createElement(
    'div',
    { className: 'min-h-screen w-full flex items-center justify-center bg-white' },
    React.createElement(Box, props || {})
  )
}


