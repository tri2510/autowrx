// Auto-dependency detection for Python code
// Based on original implementation from feature/270-new-deployment-extension

export interface DependencyDetectionResult {
  dependencies: string[]
  count: number
  language: string
}

const STANDARD_LIBRARY_MODULES = [
  'os', 'sys', 'time', 'datetime', 'json', 'csv', 're', 'math', 'random',
  'collections', 'itertools', 'functools', 'operator', 'pathlib', 'urllib',
  'http', 'socket', 'threading', 'multiprocessing', 'asyncio', 'logging',
  'unittest', 'argparse', 'configparser', 'sqlite3', 'pickle', 'base64',
  'hashlib', 'hmac', 'uuid', 'decimal', 'fractions', 'statistics', 'typing',
  'dataclasses', 'enum', 'contextlib', 'abc', 'inspect', 'importlib',
  'warnings', 'copy', 'io', 'string', 'textwrap', 'pprint', 'enum'
]

const VEHICLE_SPECIFIC_PACKAGES = [
  'sdv', 'velocitas', 'kuksa', 'kuksa_client', 'vehicle', 'canmatrix',
  'python-can', 'opencda', 'carla', 'sdv-vdb'
]

/**
 * Detect Python dependencies from source code
 * Uses regex-based detection to find import statements
 */
export function detectPythonDependencies(sourceCode: string): string[] {
  const imports = new Set<string>()

  // Remove comments and multi-line strings to avoid false positives
  const cleanedCode = removeCommentsAndStrings(sourceCode)

  // Smart regex patterns for Python imports
  const patterns = [
    // import xxx or import xxx as yyy
    /^\s*import\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)(?:\s+as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*$/gm,
    // from xxx import yyy
    /^\s*from\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s+import\s+(?:\*|\(?:(?:[a-zA-Z_][a-zA-Z0-9_]*)(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*\))?\s*$/gm
  ]

  patterns.forEach(pattern => {
    const matches = cleanedCode.matchAll(pattern)
    for (const match of matches) {
      const importPath = match[1]
      // Get the top-level package name (e.g., "sdv.vdb.reply" -> "sdv")
      const packageName = importPath.split('.')[0].toLowerCase()

      // Filter out standard library modules and local modules
      if (!isStandardLibraryModule(packageName) && !isLocalModule(importPath, cleanedCode)) {
        // Add common vehicle packages with versions
        if (packageName === 'kuksa' || packageName === 'kuksa_client') {
          imports.add('kuksa_client==0.4.3')
        } else if (packageName === 'velocitas') {
          imports.add('velocitas-sdk==0.14.1')
        } else if (packageName === 'sdv') {
          imports.add(packageName)
        } else {
          imports.add(packageName)
        }
      }
    }
  })

  return Array.from(imports).sort()
}

/**
 * Remove Python comments and strings to avoid false positive matches
 */
function removeCommentsAndStrings(sourceCode: string): string {
  let result = sourceCode

  // Remove multi-line strings ('''...''' and """..."""")
  result = result.replace(/'''[\s\S]*?'''/g, '')
  result = result.replace(/"""[\s\S]*?"""/g, '')

  // Remove single-line comments (# comment)
  result = result.replace(/#.*$/gm, '')

  // Remove regular strings (single and double quoted)
  result = result.replace(/'[^']*'/g, "''")
  result = result.replace(/"[^"]*"/g, '""')

  return result
}

/**
 * Check if a module is from Python standard library
 */
function isStandardLibraryModule(moduleName: string): boolean {
  return STANDARD_LIBRARY_MODULES.includes(moduleName.toLowerCase())
}

/**
 * Check if an import is from a local module
 */
function isLocalModule(importPath: string, sourceCode: string): boolean {
  // Check for relative imports (from . import xxx, from .. import xxx)
  const relativeImportPattern = /^\s*from\s+\.\.?\s+import/
  if (relativeImportPattern.test(sourceCode)) {
    return true
  }

  return false
}

/**
 * Get default dependencies for vehicle applications
 */
export function getDefaultDependencies(): string[] {
  return ['kuksa_client==0.4.3', 'velocitas-sdk==0.14.1']
}

/**
 * Get example code templates
 */
export const EXAMPLE_TEMPLPS = {
  velocitas: `import asyncio
from sdv import VehicleApp
from vehicle import vehicle


class TestApp(VehicleApp):
    def __init__(self, vehicle_client):
        super().__init__()
        self.Vehicle = vehicle_client

    async def on_start(self):
        print("App started!")
        while True:
            await asyncio.sleep(2)
            await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(True)
            await asyncio.sleep(1)

            # Print the Low Beam status
            low_beam_val = await self.Vehicle.Body.Lights.Beam.Low.IsOn.get()
            print("Low Beam value: ", low_beam_val.value)

            # Print the High Beam status
            high_beam_val = await self.Vehicle.Body.Lights.Beam.High.IsOn.get()
            print("High Beam value: ", high_beam_val.value)

            await asyncio.sleep(2)
            await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(False)
            await asyncio.sleep(1)


async def main():
    app = TestApp(vehicle)
    await app.run()


if __name__ == "__main__":
    asyncio.run(main())`,

  kuksaSetValue: `# kuksa_set_value.py
from kuksa_client.grpc import VSSClient
from kuksa_client.grpc import Datapoint
import time
import math

# --- Configuration ---
SERVER_HOST = "127.0.0.1"
SERVER_PORT = 55555
VSS_PATH_SPEED = 'Vehicle.Speed'
LOOP_INTERVAL = 1.0  # seconds

def main():
    """
    Connects to KUKSA and continuously sets random speed values in a loop.
    Runs forever with 1-second intervals.
    """
    try:
        with VSSClient(SERVER_HOST, SERVER_PORT) as client:
            print(f"Connected to KUKSA at {SERVER_HOST}:{SERVER_PORT}")
            print(f"Starting to set {VSS_PATH_SPEED} every {LOOP_INTERVAL} seconds...")
            print("Press Ctrl+C to stop")

            speed = 0.0
            loop_count = 0

            # Infinite loop with 1-second interval
            while True:
                try:
                    # Generate a smooth sine wave speed pattern
                    speed = 50 + 45 * math.sin(math.radians(loop_count * 6))
                    speed = round(speed, 1)

                    client.set_current_values({
                        VSS_PATH_SPEED: Datapoint(speed)
                    })

                    timestamp = time.strftime('%H:%M:%S')
                    print(f"[{timestamp}] Set {VSS_PATH_SPEED}: {speed} km/h")

                    loop_count += 1
                    time.sleep(LOOP_INTERVAL)

                except Exception as loop_error:
                    print(f"Error in loop iteration {loop_count}: {loop_error}")
                    time.sleep(LOOP_INTERVAL)

    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()`,

  kuksaPoll: `# poll_speed.py
from kuksa_client.grpc import VSSClient
import time

# --- Configuration ---
SERVER_HOST = "127.0.0.1"
SERVER_PORT = 55555
VSS_PATH_SPEED = 'Vehicle.Speed'
POLL_INTERVAL = 1.0

def main():
    """
    Connects to KUKSA and polls for speed values in an infinite loop.
    Runs forever with 1-second intervals.
    """
    try:
        with VSSClient(SERVER_HOST, SERVER_PORT) as client:
            print(f"Connected to KUKSA at {SERVER_HOST}:{SERVER_PORT}")
            print(f"Polling {VSS_PATH_SPEED} every {POLL_INTERVAL} seconds...")
            print("Press Ctrl+C to stop")

            while True:
                try:
                    # Get current value
                    current_values = client.get_current_values([VSS_PATH_SPEED])
                    speed_value = current_values[VSS_PATH_SPEED]

                    timestamp = time.strftime('%H:%M:%S')
                    print(f"[{timestamp}] {VSS_PATH_SPEED}: {speed_value}")

                    time.sleep(POLL_INTERVAL)

                except Exception as poll_error:
                    print(f"Error polling value: {poll_error}")
                    time.sleep(POLL_INTERVAL)

    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()`,

  simple: `import time
import asyncio

print("🚗 Vehicle Edge Runtime Application")
print("=" * 50)

try:
    for i in range(60):  # 60 cycles = 10 minutes (10 seconds each)
        print(f"📡 Processing cycle {i + 1}/60")
        print(f"⏰ Timestamp: {time.strftime('%H:%M:%S')}")
        await asyncio.sleep(10)
        print(f"✅ Cycle {i + 1} completed")
        print("-" * 30)
    print("🎉 Application completed successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
print("📊 Application execution finished")`
}
