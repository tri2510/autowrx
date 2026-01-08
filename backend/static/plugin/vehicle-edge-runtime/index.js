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
  var ReactDOM2 = __toESM(__require("react-dom/client"), 1);
  var React2 = __toESM(__require("react"), 1);

  // src/hooks/useConsoleOutput.ts
  var import_react = __require("react");
  function useConsoleOutput(maxEntries = 500) {
    const [entries, setEntries] = (0, import_react.useState)([]);
    const idCounterRef = (0, import_react.useRef)(0);
    const addEntry = (0, import_react.useCallback)((message, type = "info") => {
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
    const clear = (0, import_react.useCallback)(() => {
      setEntries([]);
      idCounterRef.current = 0;
    }, []);
    const addStdout = (0, import_react.useCallback)((message) => {
      addEntry(message, "stdout");
    }, [addEntry]);
    const addStderr = (0, import_react.useCallback)((message) => {
      addEntry(message, "stderr");
    }, [addEntry]);
    const addSuccess = (0, import_react.useCallback)((message) => {
      addEntry(message, "success");
    }, [addEntry]);
    const addError = (0, import_react.useCallback)((message) => {
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

  // src/components/Page.tsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  var React = globalThis.React;
  var ReactDOM = globalThis.ReactDOM;
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
    WifiOff: () => "\u{1F4F5}"
  };
  function Page({ data, config, api }) {
    const [activeTab, setActiveTab] = React.useState("deploy");
    const [selectedKit, setSelectedKit] = React.useState(null);
    const [kits, setKits] = React.useState([]);
    const [vehicleApps, setVehicleApps] = React.useState([]);
    const [isConnected, setIsConnected] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [deploymentConfig, setDeploymentConfig] = React.useState({
      type: "python",
      code: `import time
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
print("\u{1F4CA} Application execution finished")`,
      entryPoint: "main.py"
    });
    const [appName, setAppName] = React.useState("my-vehicle-app");
    const [isDeploying, setIsDeploying] = React.useState(false);
    const { entries: consoleEntries, addEntry, addSuccess, addError, clear: clearConsole } = useConsoleOutput();
    React.useEffect(() => {
      const mockKits = [
        {
          kit_id: "kit-001",
          name: "Vehicle Edge Kit 1",
          is_online: true,
          noSubscriber: 1,
          description: "Test runtime device"
        },
        {
          kit_id: "kit-002",
          name: "Vehicle Edge Kit 2",
          is_online: false,
          noSubscriber: 0,
          description: "Offline device"
        }
      ];
      setKits(mockKits);
      const onlineKits = mockKits.filter((k) => k.is_online);
      if (onlineKits.length > 0) {
        setSelectedKit(onlineKits[0]);
        setIsConnected(true);
        addSuccess(`Connected to ${onlineKits[0].name}`);
      }
      const mockApps = [
        {
          id: "app-001",
          name: "hello-world",
          type: "python",
          status: "running",
          created_at: new Date(Date.now() - 36e5).toISOString(),
          executionId: "app-001",
          resources: {
            cpu_limit: "50%",
            memory_limit: "512MB"
          }
        }
      ];
      setVehicleApps(mockApps);
    }, [addSuccess, addError]);
    const handleDeploy = async () => {
      if (!selectedKit || !selectedKit.is_online) {
        addError("No online runtime selected");
        return;
      }
      if (!appName.trim()) {
        addError("Please enter an application name");
        return;
      }
      setIsDeploying(true);
      addEntry(`Starting deployment of ${deploymentConfig.type} app...`, "info");
      try {
        await new Promise((resolve) => setTimeout(resolve, 2e3));
        const newApp = {
          id: appName,
          name: appName,
          type: deploymentConfig.type,
          status: "running",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          executionId: appName
        };
        setVehicleApps((prev) => [newApp, ...prev]);
        addSuccess(`Application "${appName}" deployed successfully to ${selectedKit.name}`);
        setActiveTab("apps");
      } catch (error) {
        addError(`Deployment failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setIsDeploying(false);
      }
    };
    const handleStartApp = async (appId) => {
      addEntry(`Starting application: ${appId}...`, "info");
      await new Promise((resolve) => setTimeout(resolve, 500));
      setVehicleApps((prev) => prev.map(
        (app) => app.id === appId ? { ...app, status: "running" } : app
      ));
      addSuccess(`Application ${appId} started`);
    };
    const handleStopApp = async (appId) => {
      addEntry(`Stopping application: ${appId}...`, "info");
      await new Promise((resolve) => setTimeout(resolve, 500));
      setVehicleApps((prev) => prev.map(
        (app) => app.id === appId ? { ...app, status: "stopped" } : app
      ));
      addSuccess(`Application ${appId} stopped`);
    };
    const handleUninstallApp = async (appId) => {
      if (!confirm(`Are you sure you want to uninstall "${appId}"?`)) {
        return;
      }
      addEntry(`Uninstalling application: ${appId}...`, "info");
      await new Promise((resolve) => setTimeout(resolve, 500));
      setVehicleApps((prev) => prev.filter((app) => app.id !== appId));
      addSuccess(`Application ${appId} uninstalled`);
    };
    const styles = {
      container: {
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        color: "#333"
      },
      header: {
        backgroundColor: "white",
        borderBottom: "1px solid #e5e5e5",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      },
      headerTitle: {
        fontSize: "20px",
        fontWeight: "600",
        margin: 0
      },
      tabs: {
        display: "flex",
        gap: "4px",
        backgroundColor: "white",
        borderBottom: "1px solid #e5e5e5",
        padding: "0 24px"
      },
      tab: {
        padding: "12px 24px",
        border: "none",
        backgroundColor: "transparent",
        cursor: "pointer",
        borderBottom: "2px solid transparent",
        fontSize: "14px",
        fontWeight: "500"
      },
      activeTab: {
        borderBottomColor: "#0066cc",
        color: "#0066cc"
      },
      content: {
        padding: "24px",
        maxWidth: "1200px",
        margin: "0 auto"
      },
      card: {
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e5e5",
        marginBottom: "16px"
      },
      cardHeader: {
        padding: "16px",
        borderBottom: "1px solid #e5e5e5",
        fontWeight: "600",
        fontSize: "16px"
      },
      cardBody: {
        padding: "16px"
      },
      input: {
        width: "100%",
        padding: "8px 12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "14px",
        boxSizing: "border-box"
      },
      textarea: {
        width: "100%",
        padding: "12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "13px",
        fontFamily: "monospace",
        minHeight: "300px",
        resize: "vertical",
        boxSizing: "border-box"
      },
      button: {
        padding: "10px 20px",
        border: "none",
        borderRadius: "4px",
        fontSize: "14px",
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
        padding: "6px 12px",
        fontSize: "12px"
      },
      statusBadge: (status) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "500"
      }),
      consoleOutput: {
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4",
        padding: "16px",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: "13px",
        maxHeight: "400px",
        overflowY: "auto"
      },
      consoleLine: (type) => ({
        marginBottom: "4px",
        color: type === "error" ? "#f48771" : type === "success" ? "#89d185" : "#d4d4d4"
      }),
      grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "16px"
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.container, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { style: styles.headerTitle, children: [
            "Vehicle Edge Runtime ",
            Icons.Rocket()
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "14px", color: "#666", margin: "4px 0 0 0" }, children: "Deploy and manage vehicle applications" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "flex", alignItems: "center", gap: "16px" }, children: selectedKit && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
          isConnected ? Icons.Wifi() : Icons.WifiOff(),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "select",
            {
              value: selectedKit.kit_id,
              onChange: (e) => {
                const kit = kits.find((k) => k.kit_id === e.target.value);
                if (kit)
                  setSelectedKit(kit);
              },
              style: {
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px"
              },
              children: kits.map((kit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", { value: kit.kit_id, children: [
                kit.name,
                " ",
                kit.is_online ? "\u{1F7E2}" : "\u{1F534}"
              ] }, kit.kit_id))
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.tabs, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            onClick: () => setActiveTab("deploy"),
            style: {
              ...styles.tab,
              ...activeTab === "deploy" ? styles.activeTab : {}
            },
            children: [
              Icons.Terminal(),
              " Deploy Application"
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            onClick: () => setActiveTab("apps"),
            style: {
              ...styles.tab,
              ...activeTab === "apps" ? styles.activeTab : {}
            },
            children: [
              Icons.Package(),
              " Applications (",
              vehicleApps.length,
              ")"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.content, children: [
        activeTab === "deploy" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.card, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.cardHeader, children: "Deploy New Application" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.cardBody, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "16px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }, children: "Application Name" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    type: "text",
                    value: appName,
                    onChange: (e) => setAppName(e.target.value),
                    placeholder: "my-vehicle-app",
                    style: styles.input
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "16px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }, children: "Application Type" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "select",
                  {
                    value: deploymentConfig.type,
                    onChange: (e) => setDeploymentConfig((prev) => ({
                      ...prev,
                      type: e.target.value
                    })),
                    style: styles.input,
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "python", children: "Python Application" }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "binary", children: "Binary Application" }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "docker", children: "Docker Container" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "16px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: { display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }, children: "Application Code" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "textarea",
                  {
                    value: deploymentConfig.code,
                    onChange: (e) => setDeploymentConfig((prev) => ({
                      ...prev,
                      code: e.target.value
                    })),
                    style: styles.textarea
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  onClick: handleDeploy,
                  disabled: isDeploying || !selectedKit?.is_online,
                  style: {
                    ...styles.button,
                    ...isDeploying || !selectedKit?.is_online ? styles.buttonDisabled : {}
                  },
                  children: isDeploying ? "Deploying..." : `${Icons.Rocket()} Deploy Application`
                }
              ),
              !selectedKit?.is_online && selectedKit && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { color: "#dc3545", fontSize: "14px", marginTop: "8px" }, children: [
                Icons.Alert(),
                " Selected runtime is offline. Please select an online runtime."
              ] })
            ] })
          ] }),
          consoleEntries.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.card, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.cardHeader, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Console Output" }),
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
        ] }),
        activeTab === "apps" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.card, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.cardHeader, display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Running Applications" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "button",
              {
                onClick: () => setActiveTab("deploy"),
                style: { ...styles.button, ...styles.buttonSmall },
                children: [
                  Icons.Rocket(),
                  " Deploy New"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.cardBody, children: vehicleApps.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", padding: "32px", color: "#666" }, children: [
            Icons.Package(),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { marginTop: "16px" }, children: "No applications deployed yet." }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                onClick: () => setActiveTab("deploy"),
                style: { ...styles.button, marginTop: "16px" },
                children: "Deploy Your First Application"
              }
            )
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.grid, children: vehicleApps.map((app) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                border: "1px solid #e5e5e5",
                borderRadius: "6px",
                padding: "16px",
                backgroundColor: "white"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { margin: "0 0 4px 0", fontSize: "16px" }, children: app.name }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { margin: 0, fontSize: "12px", color: "#666" }, children: [
                      app.type,
                      " \u2022 ",
                      formatTimestamp(app.created_at)
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
                    ...styles.statusBadge(app.status),
                    backgroundColor: getStatusColor(app.status).split(" ")[1],
                    color: getStatusColor(app.status).split(" ")[0]
                  }, children: app.status })
                ] }),
                app.resources && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { fontSize: "12px", color: "#666", marginBottom: "12px" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                    "CPU: ",
                    app.resources.cpu_limit || "N/A"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
                    "Memory: ",
                    app.resources.memory_limit || "N/A"
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "8px" }, children: [
                  app.status === "stopped" || app.status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "button",
                    {
                      onClick: () => handleStartApp(app.id),
                      style: { ...styles.button, ...styles.buttonSmall, fontSize: "12px" },
                      children: [
                        Icons.Play(),
                        " Start"
                      ]
                    }
                  ) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "button",
                    {
                      onClick: () => handleStopApp(app.id),
                      style: { ...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary, fontSize: "12px" },
                      children: [
                        Icons.Stop(),
                        " Stop"
                      ]
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "button",
                    {
                      onClick: () => handleUninstallApp(app.id),
                      style: { ...styles.button, ...styles.buttonSmall, ...styles.buttonDanger, fontSize: "12px" },
                      children: [
                        Icons.Trash(),
                        " Uninstall"
                      ]
                    }
                  )
                ] })
              ]
            },
            app.id
          )) }) })
        ] }) })
      ] })
    ] });
  }

  // src/index.ts
  var components = { Page };
  function mount(el, props) {
    const root = ReactDOM2.createRoot(el);
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
