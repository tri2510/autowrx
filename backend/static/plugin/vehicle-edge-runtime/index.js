"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/index.ts
  var ReactDOM = __toESM(__require("react-dom/client"), 1);
  var React2 = __toESM(__require("react"), 1);

  // src/hooks/useVehicleRuntimeState.ts
  var import_react = __require("react");

  // src/services/runtime.service.ts
  var VehicleRuntimeService = class {
    constructor(websocketUrl = "ws://localhost:3002/runtime") {
      this.websocketUrl = websocketUrl;
    }
    ws = null;
    isConnected = false;
    messageHandlers = /* @__PURE__ */ new Map();
    pendingRequests = /* @__PURE__ */ new Map();
    async connect() {
      if (this.isConnected || this.ws?.readyState === WebSocket.OPEN) {
        return;
      }
      return new Promise((resolve, reject) => {
        try {
          this.ws = new WebSocket(this.websocketUrl);
          const connectionTimeout = setTimeout(() => {
            reject(new Error("Connection timeout"));
          }, 5e3);
          this.ws.onopen = () => {
            clearTimeout(connectionTimeout);
            this.isConnected = true;
            this.setupEventHandlers();
            this.registerClient();
            console.log("[VehicleRuntime] Connected to", this.websocketUrl);
            resolve();
          };
          this.ws.onerror = (error) => {
            clearTimeout(connectionTimeout);
            reject(new Error("WebSocket connection failed"));
          };
        } catch (error) {
          reject(error);
        }
      });
    }
    disconnect() {
      this.isConnected = false;
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.pendingRequests.forEach((request) => {
        clearTimeout(request.timeout);
        request.reject(new Error("Connection closed"));
      });
      this.pendingRequests.clear();
      console.log("[VehicleRuntime] Disconnected");
    }
    setupEventHandlers() {
      if (!this.ws)
        return;
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("[VehicleRuntime] Failed to parse message:", error);
        }
      };
      this.ws.onclose = () => {
        console.log("[VehicleRuntime] Connection closed");
        this.isConnected = false;
      };
      this.ws.onerror = (error) => {
        console.warn("[VehicleRuntime] WebSocket connection failed (optional service)");
        this.isConnected = false;
      };
    }
    async registerClient() {
      const request = {
        type: "register_client",
        id: "register-" + Date.now(),
        clientInfo: {
          name: "Vehicle Edge Runtime Plugin",
          version: "1.0.0",
          platform: "web"
        }
      };
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(request));
        console.log("[VehicleRuntime] Client registered");
      }
    }
    handleMessage(message) {
      if (message.id && this.pendingRequests.has(message.id)) {
        const request = this.pendingRequests.get(message.id);
        clearTimeout(request.timeout);
        this.pendingRequests.delete(message.id);
        if (message.type === "error") {
          request.reject(new Error(message.error || "Unknown error"));
        } else {
          request.resolve(message);
        }
        return;
      }
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message);
      }
    }
    sendMessage(request) {
      if (!this.isConnected || !this.ws) {
        return Promise.reject(new Error("Not connected to Vehicle Runtime"));
      }
      if (!request.id) {
        request.id = "msg-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      }
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(request.id);
          reject(new Error("Request timeout"));
        }, 1e4);
        this.pendingRequests.set(request.id, { resolve, reject, timeout });
        try {
          this.ws.send(JSON.stringify(request));
        } catch (error) {
          clearTimeout(timeout);
          this.pendingRequests.delete(request.id);
          reject(error);
        }
      });
    }
    // Application management methods
    async deployPythonApp(config) {
      const request = {
        type: "deploy_request",
        id: "deploy-" + Date.now(),
        code: config.code,
        language: "python",
        vehicleId: "default-vehicle",
        prototype: {
          id: config.name,
          name: config.displayName || config.name,
          description: `Python application: ${config.name}`,
          version: "1.0.0"
        },
        dependencies: config.dependencies || []
      };
      const response = await this.sendMessage(request);
      if (response.status === "started") {
        return response.appId || response.executionId || "unknown";
      } else {
        throw new Error(response.result || "Deployment failed");
      }
    }
    async getDeployedApps() {
      const request = {
        type: "list_deployed_apps"
      };
      return this.sendMessage(request);
    }
    async startApp(appId) {
      if (appId === "VEA-mock-service" || appId.includes("mock")) {
        return this.sendMessage({
          type: "mock_service_start",
          id: `mock-start-${Date.now()}`,
          mode: "echo-all"
        });
      }
      return this.sendMessage({
        type: "run_app",
        appId
      });
    }
    async stopApp(appId) {
      if (appId === "VEA-mock-service" || appId.includes("mock")) {
        return this.sendMessage({
          type: "mock_service_stop",
          id: `mock-stop-${Date.now()}`
        });
      }
      return this.sendMessage({
        type: "stop_app",
        appId
      });
    }
    async pauseApp(appId) {
      return this.sendMessage({
        type: "pause_app",
        appId
      });
    }
    async resumeApp(appId) {
      return this.sendMessage({
        type: "resume_app",
        appId
      });
    }
    async uninstallApp(appId) {
      return this.sendMessage({
        type: "uninstall_app",
        appId
      });
    }
    async getRuntimeState() {
      const request = {
        type: "report_runtime_state"
      };
      return this.sendMessage(request);
    }
    // Event listeners
    onConsoleOutput(callback) {
      this.messageHandlers.set("console_output", callback);
    }
    onAppStatus(callback) {
      this.messageHandlers.set("app_status_update", callback);
    }
    onDeployedAppsList(callback) {
      this.messageHandlers.set("list_deployed_apps-response", callback);
    }
    // Connection status
    isServiceConnected() {
      return this.isConnected;
    }
    removeAllListeners() {
      this.messageHandlers.clear();
    }
    // Service deployment methods
    async deployKuksaServer() {
      const request = {
        type: "deploy_request",
        id: `deploy-kuksa-${Date.now()}`,
        prototype: {
          id: "VEA-kuksa-databroker",
          name: "KUKSA Databroker",
          type: "docker",
          description: "Eclipse KUKSA Vehicle Signal Databroker",
          config: {
            dockerCommand: [
              "run",
              "-d",
              "--name",
              "VEA-kuksa-databroker",
              "--network",
              "host",
              "-p",
              "55555:55555",
              "-p",
              "8090:8090",
              "ghcr.io/eclipse-kuksa/kuksa-databroker:0.4.4",
              "--insecure"
            ]
          }
        },
        vehicle_id: "default-vehicle"
      };
      const response = await this.sendMessage(request);
      const isSuccess = !response || typeof response === "object" && !response.error && response.type !== "error";
      if (isSuccess) {
        return response?.executionId || response?.id || "VEA-kuksa-databroker";
      } else {
        throw new Error(response?.error || response?.result || "KUKSA deployment failed");
      }
    }
    async deployMockService(mode = "echo-all", signals) {
      const request = {
        type: "mock_service_start",
        id: `mock-start-${Date.now()}`,
        mode,
        ...signals && { signals }
      };
      const response = await this.sendMessage(request);
      const isSuccess = !response || response.success === true || typeof response === "object" && !response.error && response.type !== "error";
      if (isSuccess) {
        return response?.status?.appId || response?.id || "VEA-mock-service";
      } else {
        throw new Error(response?.error || response?.message || "Mock service deployment failed");
      }
    }
  };

  // src/services/kitManager.service.ts
  var KitManagerService = class {
    baseUrl;
    constructor(baseUrl = "https://kit.digitalauto.tech") {
      this.baseUrl = baseUrl;
    }
    getBaseUrl() {
      return this.baseUrl;
    }
    async listKits() {
      try {
        const response = await fetch(`${this.baseUrl}/listAllKits`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("[KitManager] Failed to fetch kits:", error);
        throw error;
      }
    }
    async convertCode(code) {
      try {
        const response = await fetch(`${this.baseUrl}/convertCode`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ code })
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("[KitManager] Failed to convert code:", error);
        throw error;
      }
    }
  };

  // src/hooks/useVehicleRuntimeState.ts
  function useVehicleRuntimeState(websocketUrl, kitManagerUrl) {
    const [isRuntimeConnected, setIsRuntimeConnected] = (0, import_react.useState)(false);
    const [isKitManagerConnected, setIsKitManagerConnected] = (0, import_react.useState)(false);
    const [isKitManagerLoading, setIsKitManagerLoading] = (0, import_react.useState)(false);
    const [kitManagerError, setKitManagerError] = (0, import_react.useState)(null);
    const [kits, setKits] = (0, import_react.useState)([]);
    const [selectedKit, setSelectedKit] = (0, import_react.useState)(null);
    const [vehicleApps, setVehicleApps] = (0, import_react.useState)([]);
    const [isRefreshingApps, setIsRefreshingApps] = (0, import_react.useState)(false);
    const [isDeployingKuksa, setIsDeployingKuksa] = (0, import_react.useState)(false);
    const [isDeployingMock, setIsDeployingMock] = (0, import_react.useState)(false);
    const [connectionError, setConnectionError] = (0, import_react.useState)(null);
    const runtimeServiceRef = (0, import_react.useRef)(null);
    const kitManagerServiceRef = (0, import_react.useRef)(null);
    (0, import_react.useEffect)(() => {
      runtimeServiceRef.current = new VehicleRuntimeService(websocketUrl);
      kitManagerServiceRef.current = new KitManagerService(kitManagerUrl);
      return () => {
        runtimeServiceRef.current?.disconnect();
      };
    }, [websocketUrl, kitManagerUrl]);
    const connectRuntime = (0, import_react.useCallback)(async () => {
      try {
        setConnectionError(null);
        await runtimeServiceRef.current?.connect();
        setIsRuntimeConnected(true);
        const runtime = runtimeServiceRef.current;
        if (!runtime)
          return;
        runtime.onAppStatus((message) => {
          console.log("[VehicleRuntime] App status update:", message);
          setVehicleApps((prev) => prev.map(
            (app) => app.app_id === message.appId ? { ...app, status: message.currentStatus } : app
          ));
        });
        runtime.onDeployedAppsList((message) => {
          console.log("[VehicleRuntime] Deployed apps list:", message);
          const appsArray = Array.isArray(message?.applications) ? message.applications : [];
          setVehicleApps(appsArray);
        });
      } catch (error) {
        console.warn("[VehicleRuntime] Not available (optional):", error);
        setIsRuntimeConnected(false);
      }
    }, []);
    const connectKitManager = (0, import_react.useCallback)(async () => {
      setIsKitManagerLoading(true);
      setKitManagerError(null);
      try {
        const kitManager = kitManagerServiceRef.current;
        if (!kitManager) {
          setKitManagerError("Kit Manager service not initialized");
          setIsKitManagerConnected(false);
          setIsKitManagerLoading(false);
          return;
        }
        console.log("[KitManager] Connecting to", kitManager.getBaseUrl());
        const response = await kitManager.listKits();
        const kitsList = response.content || [];
        setKits(kitsList);
        setIsKitManagerConnected(true);
        setKitManagerError(null);
        const onlineEdgeRuntimeKits = kitsList.filter((k) => k.is_online && k.name.includes("Edge-Runtime"));
        if (onlineEdgeRuntimeKits.length > 0 && !selectedKit) {
          setSelectedKit(onlineEdgeRuntimeKits[0]);
        }
        console.log("[KitManager] \u2705 Connected - Loaded", kitsList.length, "kits", `(${onlineEdgeRuntimeKits.length} Edge-Runtime online)`);
      } catch (error) {
        console.error("[KitManager] \u274C Connection failed:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to connect to Kit Manager";
        setKitManagerError(errorMsg);
        setIsKitManagerConnected(false);
      } finally {
        setIsKitManagerLoading(false);
      }
    }, [selectedKit]);
    const selectKit = (0, import_react.useCallback)((kit) => {
      setSelectedKit(kit);
      console.log("[KitManager] Selected kit:", kit.name);
      if (!isRuntimeConnected) {
        connectRuntime();
      }
      refreshApps();
    }, [isRuntimeConnected, connectRuntime]);
    const refreshApps = (0, import_react.useCallback)(async () => {
      if (!runtimeServiceRef.current?.isServiceConnected()) {
        console.warn("[VehicleRuntime] Not connected, skipping refresh");
        return;
      }
      setIsRefreshingApps(true);
      try {
        const response = await runtimeServiceRef.current.getDeployedApps();
        const appsArray = Array.isArray(response?.applications) ? response.applications : [];
        setVehicleApps(appsArray);
        console.log("[VehicleRuntime] Refreshed", appsArray.length, "apps");
      } catch (error) {
        console.error("[VehicleRuntime] Failed to refresh apps:", error);
        setConnectionError(error instanceof Error ? error.message : "Failed to refresh apps");
      } finally {
        setIsRefreshingApps(false);
      }
    }, []);
    (0, import_react.useEffect)(() => {
      if (!isRuntimeConnected)
        return;
      refreshApps();
      const interval = setInterval(() => {
        refreshApps();
      }, 1e4);
      return () => clearInterval(interval);
    }, [isRuntimeConnected, refreshApps]);
    const startApp = (0, import_react.useCallback)(async (appId) => {
      try {
        await runtimeServiceRef.current?.startApp(appId);
        await refreshApps();
      } catch (error) {
        console.error("[VehicleRuntime] Failed to start app:", error);
        throw error;
      }
    }, [refreshApps]);
    const stopApp = (0, import_react.useCallback)(async (appId) => {
      try {
        await runtimeServiceRef.current?.stopApp(appId);
        await refreshApps();
      } catch (error) {
        console.error("[VehicleRuntime] Failed to stop app:", error);
        throw error;
      }
    }, [refreshApps]);
    const uninstallApp = (0, import_react.useCallback)(async (appId) => {
      try {
        await runtimeServiceRef.current?.uninstallApp(appId);
        await refreshApps();
      } catch (error) {
        console.error("[VehicleRuntime] Failed to uninstall app:", error);
        throw error;
      }
    }, [refreshApps]);
    const deployApp = (0, import_react.useCallback)(async (config) => {
      try {
        const appId = await runtimeServiceRef.current?.deployPythonApp(config);
        await refreshApps();
        return appId || "unknown";
      } catch (error) {
        console.error("[VehicleRuntime] Failed to deploy app:", error);
        throw error;
      }
    }, [refreshApps]);
    const deployKuksa = (0, import_react.useCallback)(async () => {
      setIsDeployingKuksa(true);
      try {
        const appId = await runtimeServiceRef.current?.deployKuksaServer();
        await refreshApps();
        return appId || "VEA-kuksa-databroker";
      } catch (error) {
        console.error("[VehicleRuntime] Failed to deploy KUKSA:", error);
        throw error;
      } finally {
        setIsDeployingKuksa(false);
      }
    }, [refreshApps]);
    const deployMock = (0, import_react.useCallback)(async (mode = "echo-all", signals) => {
      setIsDeployingMock(true);
      try {
        const appId = await runtimeServiceRef.current?.deployMockService(mode, signals);
        await refreshApps();
        return appId || "VEA-mock-service";
      } catch (error) {
        console.error("[VehicleRuntime] Failed to deploy Mock service:", error);
        throw error;
      } finally {
        setIsDeployingMock(false);
      }
    }, [refreshApps]);
    return {
      isRuntimeConnected,
      isKitManagerConnected,
      isKitManagerLoading,
      kitManagerError,
      kits,
      selectedKit,
      vehicleApps,
      isRefreshingApps,
      isDeployingKuksa,
      isDeployingMock,
      connectionError,
      connectRuntime,
      connectKitManager,
      selectKit,
      refreshApps,
      startApp,
      stopApp,
      uninstallApp,
      deployApp,
      deployKuksa,
      deployMock
    };
  }

  // src/hooks/useConsoleOutput.ts
  var import_react2 = __require("react");
  function useConsoleOutput(maxEntries = 500) {
    const [entries, setEntries] = (0, import_react2.useState)([]);
    const idCounterRef = (0, import_react2.useRef)(0);
    const addEntry = (0, import_react2.useCallback)((message, type = "info") => {
      const entry = {
        id: `console-${idCounterRef.current++}`,
        timestamp: /* @__PURE__ */ new Date(),
        message,
        type
      };
      setEntries((prev) => {
        const newEntries = [...prev, entry];
        if (newEntries.length > maxEntries) {
          return newEntries.slice(-maxEntries);
        }
        return newEntries;
      });
    }, [maxEntries]);
    const clear = (0, import_react2.useCallback)(() => {
      setEntries([]);
      idCounterRef.current = 0;
    }, []);
    const addStdout = (0, import_react2.useCallback)((message) => {
      addEntry(message, "stdout");
    }, [addEntry]);
    const addStderr = (0, import_react2.useCallback)((message) => {
      addEntry(message, "stderr");
    }, [addEntry]);
    const addSuccess = (0, import_react2.useCallback)((message) => {
      addEntry(message, "success");
    }, [addEntry]);
    const addError = (0, import_react2.useCallback)((message) => {
      addEntry(message, "error");
    }, [addEntry]);
    return {
      entries,
      addEntry,
      addStdout,
      addStderr,
      addSuccess,
      addError,
      clear
    };
  }

  // src/utils/helpers.ts
  function getStatusColor(status) {
    switch (status) {
      case "online":
      case "running":
        return "text-green-600 bg-green-100";
      case "offline":
      case "stopped":
        return "text-gray-600 bg-gray-100";
      case "connecting":
      case "error":
        return "text-red-600 bg-red-100";
      case "paused":
        return "text-yellow-600 bg-yellow-100";
      case "installed":
        return "text-blue-600 bg-blue-100";
      case "starting":
        return "text-blue-400 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-100";
    }
  }
  function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  // src/utils/dependencyDetector.ts
  var STANDARD_LIBRARY_MODULES = [
    "os",
    "sys",
    "time",
    "datetime",
    "json",
    "csv",
    "re",
    "math",
    "random",
    "collections",
    "itertools",
    "functools",
    "operator",
    "pathlib",
    "urllib",
    "http",
    "socket",
    "threading",
    "multiprocessing",
    "asyncio",
    "logging",
    "unittest",
    "argparse",
    "configparser",
    "sqlite3",
    "pickle",
    "base64",
    "hashlib",
    "hmac",
    "uuid",
    "decimal",
    "fractions",
    "statistics",
    "typing",
    "dataclasses",
    "enum",
    "contextlib",
    "abc",
    "inspect",
    "importlib",
    "warnings",
    "copy",
    "io",
    "string",
    "textwrap",
    "pprint",
    "enum"
  ];
  function detectPythonDependencies(sourceCode) {
    const imports = /* @__PURE__ */ new Set();
    const cleanedCode = removeCommentsAndStrings(sourceCode);
    const patterns = [
      // import xxx or import xxx as yyy
      /^\s*import\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)(?:\s+as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*$/gm,
      // from xxx import yyy
      /^\s*from\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s+import\s+(?:\*|\(?:(?:[a-zA-Z_][a-zA-Z0-9_]*)(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*\))?\s*$/gm
    ];
    patterns.forEach((pattern) => {
      const matches = cleanedCode.matchAll(pattern);
      for (const match of matches) {
        const importPath = match[1];
        const packageName = importPath.split(".")[0].toLowerCase();
        if (!isStandardLibraryModule(packageName) && !isLocalModule(importPath, cleanedCode)) {
          if (packageName === "kuksa" || packageName === "kuksa_client") {
            imports.add("kuksa_client==0.4.3");
          } else if (packageName === "velocitas") {
            imports.add("velocitas-sdk==0.14.1");
          } else if (packageName === "sdv") {
            imports.add(packageName);
          } else {
            imports.add(packageName);
          }
        }
      }
    });
    return Array.from(imports).sort();
  }
  function removeCommentsAndStrings(sourceCode) {
    let result = sourceCode;
    result = result.replace(/'''[\s\S]*?'''/g, "");
    result = result.replace(/"""[\s\S]*?"""/g, "");
    result = result.replace(/#.*$/gm, "");
    result = result.replace(/'[^']*'/g, "''");
    result = result.replace(/"[^"]*"/g, '""');
    return result;
  }
  function isStandardLibraryModule(moduleName) {
    return STANDARD_LIBRARY_MODULES.includes(moduleName.toLowerCase());
  }
  function isLocalModule(importPath, sourceCode) {
    const relativeImportPattern = /^\s*from\s+\.\.?\s+import/;
    if (relativeImportPattern.test(sourceCode)) {
      return true;
    }
    return false;
  }
  function getDefaultDependencies() {
    return ["kuksa_client==0.4.3", "velocitas-sdk==0.14.1"];
  }
  var EXAMPLE_TEMPLPS = {
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

print("\u{1F697} Vehicle Edge Runtime Application")
print("=" * 50)

try:
    for i in range(60):  # 60 cycles = 10 minutes (10 seconds each)
        print(f"\u{1F4E1} Processing cycle {i + 1}/60")
        print(f"\u23F0 Timestamp: {time.strftime('%H:%M:%S')}")
        await asyncio.sleep(10)
        print(f"\u2705 Cycle {i + 1} completed")
        print("-" * 30)
    print("\u{1F389} Application completed successfully!")
except Exception as e:
    print(f"\u274C Error: {e}")
print("\u{1F4CA} Application execution finished")`
  };

  // src/components/Page.tsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  var React = globalThis.React;
  var Icons = {
    Rocket: () => "\u{1F680}",
    Terminal: () => "\u{1F4BB}",
    Play: () => "\u25B6\uFE0F",
    Stop: () => "\u23F9\uFE0F",
    Pause: () => "\u23F8\uFE0F",
    Refresh: () => "\u{1F504}",
    Trash: () => "\u{1F5D1}\uFE0F",
    Settings: () => "\u2699\uFE0F",
    Alert: () => "\u26A0\uFE0F",
    Check: () => "\u2705",
    Server: () => "\u{1F5A5}\uFE0F",
    Package: () => "\u{1F4E6}",
    Clock: () => "\u{1F550}",
    Wifi: () => "\u{1F4F6}",
    WifiOff: () => "\u{1F4F5}",
    Loading: () => "\u23F3",
    Cube: () => "\u{1F4E6}",
    Code: () => "\u{1F4BB}",
    Download: () => "\u2B07\uFE0F",
    Edit: () => "\u270F\uFE0F",
    Plus: () => "\u2795",
    X: () => "\u2716\uFE0F",
    Search: () => "\u{1F50D}",
    ChevronDown: () => "\u25BC",
    ChevronRight: () => "\u25B6",
    Sparkles: () => "\u2728",
    Brain: () => "\u{1F9E0}"
  };
  var DEFAULT_RUNTIME_URL = "ws://localhost:3002/runtime";
  var DEFAULT_KIT_MANAGER_URL = "https://kit.digitalauto.tech";
  var TEMPLATE_OPTIONS = [
    { id: "velocitas", label: "Velocitas Vehicle App", icon: "\u{1F697}" },
    { id: "kuksaSetValue", label: "KUKSA Set Value", icon: "\u{1F4E1}" },
    { id: "kuksaPoll", label: "KUKSA Poll Values", icon: "\u{1F4CA}" },
    { id: "simple", label: "Simple Python App", icon: "\u{1F40D}" }
  ];
  function Page({ data, config, api }) {
    const runtimeUrl = config?.runtimeUrl || DEFAULT_RUNTIME_URL;
    const kitManagerUrl = config?.kitManagerUrl || DEFAULT_KIT_MANAGER_URL;
    const {
      isRuntimeConnected,
      isKitManagerConnected,
      isKitManagerLoading,
      kitManagerError,
      kits,
      selectedKit,
      vehicleApps,
      isRefreshingApps,
      isDeployingKuksa,
      isDeployingMock,
      connectionError,
      connectRuntime,
      connectKitManager,
      selectKit,
      refreshApps,
      startApp,
      stopApp,
      uninstallApp,
      deployApp,
      deployKuksa,
      deployMock
    } = useVehicleRuntimeState(runtimeUrl, kitManagerUrl);
    const edgeRuntimeKits = React.useMemo(() => {
      return kits.filter((kit) => kit.name.includes("Edge-Runtime"));
    }, [kits]);
    const [appId, setAppId] = React.useState("my-vehicle-app");
    const [appName, setAppName] = React.useState("My Vehicle App");
    const [appCode, setAppCode] = React.useState(EXAMPLE_TEMPLPS.velocitas);
    const [dependencies, setDependencies] = React.useState(getDefaultDependencies());
    const [autoDetectEnabled, setAutoDetectEnabled] = React.useState(true);
    const [detectedDependencies, setDetectedDependencies] = React.useState([]);
    const [isDeploying, setIsDeploying] = React.useState(false);
    const [showTemplates, setShowTemplates] = React.useState(false);
    const [manualDependency, setManualDependency] = React.useState("");
    const splitContainerRef = React.useRef(null);
    const [leftPanelWidth, setLeftPanelWidth] = React.useState(66.67);
    const [isResizing, setIsResizing] = React.useState(false);
    const handleMouseDown = (e) => {
      e.preventDefault();
      setIsResizing(true);
    };
    React.useEffect(() => {
      const handleMouseMove = (e) => {
        if (!isResizing || !splitContainerRef.current)
          return;
        const containerRect = splitContainerRef.current.getBoundingClientRect();
        const newLeftWidth = (e.clientX - containerRect.left) / containerRect.width * 100;
        const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
        setLeftPanelWidth(constrainedWidth);
      };
      const handleMouseUp = () => {
        setIsResizing(false);
      };
      if (isResizing) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
      }
    }, [isResizing]);
    const { entries: consoleEntries, addEntry, addSuccess, addError, clear: clearConsole } = useConsoleOutput();
    React.useEffect(() => {
      const initializeConnections = async () => {
        addEntry("Connecting to Kit Manager...", "info");
        await connectKitManager();
        connectRuntime().catch((error) => {
          console.warn("[Plugin] Vehicle Runtime not available:", error);
          addEntry("Vehicle Runtime not available - deployment disabled", "info");
        });
      };
      initializeConnections();
    }, [connectKitManager, connectRuntime, addEntry]);
    React.useEffect(() => {
      if (autoDetectEnabled && appCode) {
        const timeoutId = setTimeout(() => {
          const detected = detectPythonDependencies(appCode);
          setDetectedDependencies(detected);
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }, [appCode, autoDetectEnabled]);
    const allDependencies = React.useMemo(() => {
      const base = getDefaultDependencies();
      const detected = autoDetectEnabled ? detectedDependencies : [];
      const manual = dependencies.filter(
        (d) => !base.includes(d) && !detected.includes(d.toLowerCase())
      );
      return [...base, ...detected, ...manual];
    }, [dependencies, detectedDependencies, autoDetectEnabled]);
    const handleDeploy = async () => {
      if (!selectedKit?.is_online) {
        addError("No online runtime selected");
        return;
      }
      if (!appId.trim()) {
        addError("Please enter an application ID");
        return;
      }
      if (!appCode.trim()) {
        addError("Please enter application code");
        return;
      }
      setIsDeploying(true);
      addEntry(`Starting deployment of Python app to ${selectedKit.name}...`, "info");
      try {
        const deployedAppId = await deployApp({
          name: appId,
          displayName: appName,
          code: appCode,
          dependencies: allDependencies
        });
        addSuccess(`Application "${appName}" deployed successfully! ID: ${deployedAppId}`);
      } catch (error) {
        addError(`Deployment failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setIsDeploying(false);
      }
    };
    const handleLoadTemplate = (templateId) => {
      const template = EXAMPLE_TEMPLPS[templateId];
      if (template) {
        setAppCode(template);
        setShowTemplates(false);
        addEntry(`Loaded template: ${TEMPLATE_OPTIONS.find((t) => t.id === templateId)?.label}`, "info");
      }
    };
    const handleAddDependency = () => {
      if (manualDependency.trim() && !dependencies.includes(manualDependency.trim())) {
        setDependencies([...dependencies, manualDependency.trim()]);
        setManualDependency("");
      }
    };
    const handleRemoveDependency = (dep) => {
      setDependencies(dependencies.filter((d) => d !== dep));
    };
    const handleKitChange = (kitId) => {
      const kit = kits.find((k) => k.kit_id === kitId);
      if (kit) {
        selectKit(kit);
        addEntry(`Selected kit: ${kit.name}`, "info");
        refreshApps();
      }
    };
    const handleStartApp = async (appId2) => {
      try {
        addEntry(`Starting application: ${appId2}...`, "info");
        await startApp(appId2);
        addSuccess(`Application ${appId2} started`);
      } catch (error) {
        addError(`Failed to start app: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };
    const handleStopApp = async (appId2) => {
      try {
        addEntry(`Stopping application: ${appId2}...`, "info");
        await stopApp(appId2);
        addSuccess(`Application ${appId2} stopped`);
      } catch (error) {
        addError(`Failed to stop app: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };
    const handleUninstallApp = async (appId2) => {
      if (!confirm(`Are you sure you want to uninstall "${appId2}"?`)) {
        return;
      }
      try {
        addEntry(`Uninstalling application: ${appId2}...`, "info");
        await uninstallApp(appId2);
        addSuccess(`Application ${appId2} uninstalled`);
      } catch (error) {
        addError(`Failed to uninstall app: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };
    const handleDeployKuksa = async () => {
      if (!isRuntimeConnected) {
        addError("Runtime not connected");
        return;
      }
      try {
        addEntry("Deploying KUKSA Databroker server...", "info");
        const appId2 = await deployKuksa();
        addSuccess(`KUKSA Databroker deployed! App ID: ${appId2}`);
      } catch (error) {
        addError(`Failed to deploy KUKSA: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };
    const handleDeployMock = async () => {
      if (!isRuntimeConnected) {
        addError("Runtime not connected");
        return;
      }
      try {
        addEntry("Deploying Mock service...", "info");
        const appId2 = await deployMock("echo-all");
        addSuccess(`Mock service deployed! App ID: ${appId2}`);
      } catch (error) {
        addError(`Failed to deploy Mock service: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };
    const styles = {
      container: {
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        color: "#333",
        display: "flex",
        flexDirection: "column"
      },
      header: {
        backgroundColor: "white",
        borderBottom: "1px solid #e5e5e5",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      },
      headerTitle: {
        fontSize: "18px",
        fontWeight: "600",
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: "8px"
      },
      connectionStatus: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "12px"
      },
      statusItem: {
        display: "flex",
        alignItems: "center",
        gap: "4px"
      },
      splitContainer: {
        display: "flex",
        flex: 1,
        overflow: "hidden",
        position: "relative"
      },
      leftPanel: (width) => ({
        width: `${width}%`,
        minWidth: "20%",
        maxWidth: "80%",
        borderRight: "1px solid #e5e5e5",
        overflowY: "auto",
        backgroundColor: "#fafafa"
      }),
      resizeHandle: {
        width: "6px",
        cursor: "col-resize",
        backgroundColor: "#e5e5e5",
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        transition: "background-color 0.15s",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      },
      resizeHandleHover: {
        backgroundColor: "#0066cc"
      },
      resizeHandleLine: {
        width: "2px",
        height: "40px",
        backgroundColor: "#999",
        borderRadius: "1px"
      },
      rightPanel: (leftWidth) => ({
        width: `${100 - leftWidth}%`,
        overflowY: "auto",
        backgroundColor: "#f5f5f5"
      }),
      panelContent: {
        padding: "16px"
      },
      card: {
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e5e5",
        marginBottom: "16px"
      },
      cardHeader: {
        padding: "12px 16px",
        borderBottom: "1px solid #e5e5e5",
        fontWeight: "600",
        fontSize: "14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      },
      cardBody: {
        padding: "16px"
      },
      label: {
        display: "block",
        marginBottom: "6px",
        fontSize: "13px",
        fontWeight: "500"
      },
      input: {
        width: "100%",
        padding: "8px 12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "13px",
        boxSizing: "border-box"
      },
      textarea: {
        width: "100%",
        padding: "12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "12px",
        fontFamily: "monospace",
        minHeight: "250px",
        resize: "vertical",
        boxSizing: "border-box"
      },
      button: {
        padding: "8px 16px",
        border: "none",
        borderRadius: "4px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        backgroundColor: "#0066cc",
        color: "white"
      },
      buttonDisabled: {
        backgroundColor: "#ccc",
        cursor: "not-allowed"
      },
      buttonSecondary: {
        backgroundColor: "#6c757d"
      },
      buttonDanger: {
        backgroundColor: "#dc3545"
      },
      buttonSmall: {
        padding: "4px 8px",
        fontSize: "11px"
      },
      badge: (color) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: "500",
        backgroundColor: color
      }),
      dependencyItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 8px",
        backgroundColor: "#f8f9fa",
        border: "1px solid #e5e5e5",
        borderRadius: "4px",
        marginBottom: "4px",
        fontSize: "12px"
      },
      grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "12px"
      },
      appCard: {
        border: "1px solid #e5e5e5",
        borderRadius: "6px",
        padding: "12px",
        backgroundColor: "white"
      },
      consoleOutput: {
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4",
        padding: "12px",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: "11px",
        maxHeight: "300px",
        overflowY: "auto"
      },
      consoleLine: (type) => ({
        marginBottom: "2px",
        color: type === "error" ? "#f48771" : type === "success" ? "#89d185" : "#d4d4d4"
      }),
      templateDropdown: {
        position: "relative"
      },
      dropdownMenu: {
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        backgroundColor: "white",
        border: "1px solid #e5e5e5",
        borderRadius: "4px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        zIndex: 1e3,
        maxHeight: "300px",
        overflowY: "auto"
      },
      dropdownItem: {
        padding: "10px 12px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        borderBottom: "1px solid #f0f0f0"
      },
      dropdownItemHover: {
        backgroundColor: "#f5f5f5"
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.container, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { style: styles.headerTitle, children: [
          Icons.Rocket(),
          " Vehicle Edge Runtime"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.connectionStatus, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                ...styles.statusItem,
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                backgroundColor: isKitManagerLoading ? "#fff3cd" : isKitManagerConnected ? "#d4edda" : kitManagerError ? "#f8d7da" : "#e2e3e5"
              },
              children: [
                isKitManagerLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  Icons.Loading(),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Connecting..." })
                ] }) : isKitManagerConnected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  Icons.Wifi(),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                    "Kit Manager ",
                    Icons.Check()
                  ] })
                ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  Icons.WifiOff(),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                    "Kit Manager ",
                    kitManagerError ? "\u274C" : "\u23F8"
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    onClick: connectKitManager,
                    style: {
                      ...styles.button,
                      ...styles.buttonSmall,
                      marginLeft: "4px",
                      padding: "2px 6px",
                      minWidth: "20px"
                    },
                    title: "Refresh Kit Manager",
                    children: Icons.Refresh()
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              style: {
                ...styles.statusItem,
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                backgroundColor: isRuntimeConnected ? "#d4edda" : "#e2e3e5"
              },
              children: isRuntimeConnected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                Icons.Wifi(),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                  "Runtime ",
                  Icons.Check()
                ] })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                Icons.WifiOff(),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Runtime" })
              ] })
            }
          ),
          isKitManagerConnected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "select",
            {
              value: selectedKit?.kit_id || "",
              onChange: (e) => handleKitChange(e.target.value),
              style: {
                padding: "6px 10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "12px"
              },
              children: edgeRuntimeKits.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", disabled: true, children: "Select Edge-Runtime device..." }),
                edgeRuntimeKits.map((kit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", { value: kit.kit_id, children: [
                  kit.name,
                  " ",
                  kit.is_online ? "\u{1F7E2}" : "\u{1F534}"
                ] }, kit.kit_id))
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", disabled: true, children: "No edge runtime" })
            }
          )
        ] })
      ] }),
      kitManagerError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
        backgroundColor: "#f8d7da",
        borderBottom: "1px solid #f5c6cb",
        padding: "10px 20px",
        fontSize: "13px",
        color: "#721c24",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }, children: [
        Icons.Alert(),
        " ",
        kitManagerError,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            onClick: connectKitManager,
            style: {
              ...styles.button,
              ...styles.buttonSmall,
              marginLeft: "auto",
              backgroundColor: "#721c24"
            },
            children: "Retry"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref: splitContainerRef, style: styles.splitContainer, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.leftPanel(leftPanelWidth), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.panelContent, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.card, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.cardHeader, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
              Icons.Cube(),
              " Application Details"
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.cardBody, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "12px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: styles.label, children: "Application ID *" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    type: "text",
                    value: appId,
                    onChange: (e) => setAppId(e.target.value),
                    placeholder: "my-vehicle-app",
                    style: styles.input
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "12px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: styles.label, children: "Display Name" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    type: "text",
                    value: appName,
                    onChange: (e) => setAppName(e.target.value),
                    placeholder: "My Vehicle App",
                    style: styles.input
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.card, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.cardBody, padding: "12px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: styles.label, children: [
                Icons.Code(),
                " Application Code (Python)"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", gap: "4px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.templateDropdown, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    onClick: () => setShowTemplates(!showTemplates),
                    style: { ...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary },
                    children: [
                      Icons.Download(),
                      " Templates ",
                      Icons.ChevronDown()
                    ]
                  }
                ),
                showTemplates && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.dropdownMenu, children: TEMPLATE_OPTIONS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "div",
                  {
                    onClick: () => handleLoadTemplate(t.id),
                    style: styles.dropdownItem,
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.icon }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.label })
                    ]
                  },
                  t.id
                )) })
              ] }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "textarea",
              {
                value: appCode,
                onChange: (e) => setAppCode(e.target.value),
                style: styles.textarea
              }
            )
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.card, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.cardHeader, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                Icons.Package(),
                " Dependencies (",
                allDependencies.length,
                ")"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "normal" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    type: "checkbox",
                    checked: autoDetectEnabled,
                    onChange: (e) => setAutoDetectEnabled(e.target.checked)
                  }
                ),
                "Auto-detect"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.cardBody, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "12px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.badge("#e3f2fd"), color: "#1565c0", marginBottom: "8px" }, children: [
                  Icons.Check(),
                  " Required (",
                  getDefaultDependencies().length,
                  ")"
                ] }),
                getDefaultDependencies().map((dep) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.dependencyItem, backgroundColor: "#f0f7ff" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: dep }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "10px", color: "#666" }, children: "fixed" })
                ] }, dep))
              ] }),
              autoDetectEnabled && detectedDependencies.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "12px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.badge("#fff3e0"), color: "#e65100", marginBottom: "8px" }, children: [
                  Icons.Sparkles(),
                  " Detected (",
                  detectedDependencies.length,
                  ")"
                ] }),
                detectedDependencies.map((dep) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.dependencyItem, backgroundColor: "#fff8f0" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: dep }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "10px", color: "#666" }, children: "auto" })
                ] }, dep))
              ] }),
              dependencies.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "12px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.badge("#f3e5f5"), color: "#7b1fa2", marginBottom: "8px" }, children: [
                  Icons.Edit(),
                  " Manual (",
                  dependencies.length,
                  ")"
                ] }),
                dependencies.map((dep) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.dependencyItem, backgroundColor: "#faf5ff" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: dep }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "button",
                    {
                      onClick: () => handleRemoveDependency(dep),
                      style: { ...styles.button, ...styles.buttonSmall, ...styles.buttonDanger, padding: "2px 6px" },
                      children: Icons.X()
                    }
                  )
                ] }, dep))
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "8px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    type: "text",
                    value: manualDependency,
                    onChange: (e) => setManualDependency(e.target.value),
                    placeholder: "Add dependency (e.g., numpy==1.24.0)",
                    onKeyPress: (e) => e.key === "Enter" && handleAddDependency(),
                    style: { ...styles.input, flex: 1 }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    onClick: handleAddDependency,
                    style: { ...styles.button, ...styles.buttonSmall },
                    children: [
                      Icons.Plus(),
                      " Add"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: "12px", padding: "8px", backgroundColor: "#e8f5e9", borderRadius: "4px", fontSize: "12px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
                  "Total: ",
                  allDependencies.length,
                  " packages"
                ] }),
                " will be installed"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: handleDeploy,
              disabled: isDeploying || !selectedKit?.is_online || !isRuntimeConnected,
              style: {
                ...styles.button,
                width: "100%",
                padding: "12px",
                fontSize: "14px",
                ...isDeploying || !selectedKit?.is_online || !isRuntimeConnected ? styles.buttonDisabled : {}
              },
              children: isDeploying ? `${Icons.Loading()} Deploying...` : `${Icons.Rocket()} Deploy Application`
            }
          ),
          consoleEntries.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.card, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.cardHeader, padding: "8px 12px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: "13px" }, children: [
                Icons.Terminal(),
                " Console Output"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  onClick: clearConsole,
                  style: { ...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary },
                  children: "Clear"
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.consoleOutput, children: consoleEntries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.consoleLine(entry.type), children: [
              "[",
              entry.timestamp.toLocaleTimeString(),
              "] ",
              entry.message
            ] }, entry.id)) })
          ] })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            onMouseDown: handleMouseDown,
            style: {
              ...styles.resizeHandle,
              left: `${leftPanelWidth}%`,
              ...isResizing ? styles.resizeHandleHover : {}
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.resizeHandleLine })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.rightPanel(leftPanelWidth), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.panelContent, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.card, marginBottom: "16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.cardHeader, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
              Icons.Server(),
              " Services"
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...styles.cardBody, padding: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "8px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  onClick: handleDeployKuksa,
                  disabled: !isRuntimeConnected || isDeployingKuksa,
                  style: {
                    ...styles.button,
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "12px",
                    ...isDeployingKuksa || !isRuntimeConnected ? styles.buttonDisabled : {}
                  },
                  children: isDeployingKuksa ? `${Icons.Loading()} KUKSA...` : `${Icons.Server()} KUKSA`
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  onClick: handleDeployMock,
                  disabled: !isRuntimeConnected || isDeployingMock,
                  style: {
                    ...styles.button,
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "12px",
                    ...isDeployingMock || !isRuntimeConnected ? styles.buttonDisabled : {}
                  },
                  children: isDeployingMock ? `${Icons.Loading()} Mock...` : `${Icons.Brain()} Mock`
                }
              )
            ] }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.card, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.cardHeader, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                Icons.Package(),
                " Deployed Applications (",
                vehicleApps.length,
                ")",
                isRefreshingApps && ` (${Icons.Loading()})`
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                "button",
                {
                  onClick: refreshApps,
                  style: { ...styles.button, ...styles.buttonSmall },
                  children: [
                    Icons.Refresh(),
                    " Refresh"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.cardBody, children: vehicleApps.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", padding: "40px 20px", color: "#666" }, children: [
              Icons.Package(),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { marginTop: "12px", marginBottom: "16px" }, children: "No applications deployed yet." }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "12px", color: "#999" }, children: "Use the form on the left to deploy your first application." })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.grid, children: vehicleApps.map((app) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.appCard, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { margin: "0 0 4px 0", fontSize: "14px", wordBreak: "break-word" }, children: app.name }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "0 0 2px 0", fontSize: "11px", color: "#666" }, children: app.type }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { margin: "0 0 4px 0", fontSize: "10px", color: "#999" }, children: [
                    "ID: ",
                    app.app_id
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: 0, fontSize: "10px", color: "#999" }, children: formatTimestamp(app.deploy_time) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
                  ...styles.badge(getStatusColor(app.status).split(" ")[1]),
                  color: getStatusColor(app.status).split(" ")[0],
                  flexShrink: 0
                }, children: app.status })
              ] }),
              app.resources && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: "11px", color: "#666", marginBottom: "8px", padding: "6px", backgroundColor: "#f8f9fa", borderRadius: "4px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                  "CPU: ",
                  app.resources.cpu_limit || "N/A"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                  "Memory: ",
                  app.resources.memory_limit || "N/A"
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "6px" }, children: [
                app.status === "stopped" || app.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    onClick: () => handleStartApp(app.app_id),
                    style: { ...styles.button, ...styles.buttonSmall, flex: 1 },
                    children: [
                      Icons.Play(),
                      " Start"
                    ]
                  }
                ) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    onClick: () => handleStopApp(app.app_id),
                    style: { ...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary, flex: 1 },
                    children: [
                      Icons.Stop(),
                      " Stop"
                    ]
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    onClick: () => handleUninstallApp(app.app_id),
                    style: { ...styles.button, ...styles.buttonSmall, ...styles.buttonDanger },
                    children: Icons.Trash()
                  }
                )
              ] })
            ] }, app.app_id)) }) })
          ] })
        ] }) })
      ] }),
      connectionError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...styles.card, margin: "16px", backgroundColor: "#fee", borderColor: "#fcc" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.cardBody, color: "#c33", padding: "12px" }, children: [
        Icons.Alert(),
        " ",
        connectionError
      ] }) })
    ] });
  }

  // src/index.ts
  var components = { Page };
  function mount(el, props) {
    const root = ReactDOM.createRoot(el);
    root.render(React2.createElement(Page, props || {}));
    el.__aw_root = root;
  }
  function unmount(el) {
    const r = el.__aw_root;
    if (r && r.unmount)
      r.unmount();
    delete el.__aw_root;
  }
  if (typeof window !== "undefined") {
    ;
    window.DAPlugins = window.DAPlugins || {};
    window.DAPlugins["page-plugin"] = { components, mount, unmount };
    console.log("Vehicle Edge Runtime plugin registered as page-plugin");
  }
})();
//# sourceMappingURL=index.js.map
