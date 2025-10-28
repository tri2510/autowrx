# Sample TSX Plugin

This is a sample plugin demonstrating how to build React plugins in TSX format.

## Features

- TypeScript + TSX syntax
- Can import npm packages
- Hot-loadable into the host application
- Accepts `data` and `config` props

## Using npm Packages

### Option 1: Bundle the package (Self-contained)

1. Create a `package.json` in the plugin directory
2. Add your dependencies to it
3. Import and use them in your code
4. The build script will install and bundle them automatically

Example:
```json
{
  "dependencies": {
    "dayjs": "^1.11.11"
  }
}
```

Then in your code:
```typescript
import dayjs from 'dayjs';

export default function Page({ data, config }: PageProps) {
  const formattedDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
  return <div>Current: {formattedDate}</div>;
}
```

### Option 2: Use host packages (Shared dependencies)

1. Add the package to `EXTERNAL_PACKAGES` in `build.sh`
2. Access it via `require()` at runtime
3. The package must already be loaded in the host environment

Example in `build.sh`:
```bash
EXTERNAL_PACKAGES="react,react-dom/client,react/jsx-runtime,dayjs"
```

Then in your code:
```typescript
const dayjs = require('dayjs');

export default function Page({ data, config }: PageProps) {
  const formattedDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
  return <div>Current: {formattedDate}</div>;
}
```

## Building

Run the build script:
```bash
bash build.sh
```

This will:
1. Install any dependencies from `package.json`
2. Compile TSX to JavaScript
3. Bundle the code into a single `index.js` file
4. Generate source maps

## Plugin API

Every plugin should expose a `Page` component that accepts:
- `data?: any` - Dynamic data from the host
- `config?: any` - Configuration from the plugin settings

The plugin is automatically registered to `window.DAPlugins[plugin-name]`.

