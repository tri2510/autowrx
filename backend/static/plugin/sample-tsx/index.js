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
    if (typeof require !== "undefined") return require.apply(this, arguments);
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

  // src/components/Page.tsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  var React = globalThis.React;
  function Page({ data, config, api }) {
    const [localCount, setLocalCount] = React.useState(data?.count || 0);
    const [currentTime, setCurrentTime] = React.useState((/* @__PURE__ */ new Date()).toLocaleString());
    const [savedValue, setSavedValue] = React.useState("");
    const [isSaving, setIsSaving] = React.useState(false);
    const [apiData, setApiData] = React.useState(null);
    const [vssVersions, setVssVersions] = React.useState([]);
    const [prototypeName, setPrototypeName] = React.useState("");
    React.useEffect(() => {
      const intervalId = setInterval(() => {
        setLocalCount((prevCount) => prevCount + 1);
        setCurrentTime((/* @__PURE__ */ new Date()).toLocaleString());
      }, 1e3);
      return () => {
        clearInterval(intervalId);
      };
    }, []);
    React.useEffect(() => {
      if (data?.prototype?.name) {
        setPrototypeName(data.prototype.name);
      }
    }, [data?.prototype?.name]);
    const handleSaveToModel = async () => {
      if (!api?.updateModel) {
        alert("updateModel API not available (model_id not provided)");
        return;
      }
      setIsSaving(true);
      try {
        await api.updateModel({
          extend: {
            ...data?.model?.extend,
            samplePluginData: {
              lastSaved: (/* @__PURE__ */ new Date()).toISOString(),
              counter: localCount,
              customValue: savedValue
            }
          }
        });
        alert("Data saved to model successfully!");
      } catch (error) {
        console.error("Failed to save to model:", error);
      } finally {
        setIsSaving(false);
      }
    };
    const handleSaveToPrototype = async () => {
      if (!api?.updatePrototype) {
        alert("updatePrototype API not available (prototype_id not provided)");
        return;
      }
      setIsSaving(true);
      try {
        await api.updatePrototype({
          extend: {
            ...data?.prototype?.extend,
            samplePluginData: {
              lastSaved: (/* @__PURE__ */ new Date()).toISOString(),
              counter: localCount,
              customValue: savedValue
            }
          }
        });
        alert("Data saved to prototype successfully!");
      } catch (error) {
        console.error("Failed to save to prototype:", error);
      } finally {
        setIsSaving(false);
      }
    };
    const handleLoadAPIs = async () => {
      if (!api?.getComputedAPIs) {
        alert("getComputedAPIs API not available (model not provided)");
        return;
      }
      try {
        const apis = await api.getComputedAPIs();
        setApiData(apis);
        alert("Vehicle APIs loaded! Check console for details.");
        console.log("Computed APIs:", apis);
      } catch (error) {
        console.error("Failed to load APIs:", error);
      }
    };
    const handleGetApiDetail = async () => {
      if (!api?.getApiDetail) {
        alert("getApiDetail API not available");
        return;
      }
      try {
        const detail = await api.getApiDetail("Vehicle.Speed");
        alert(`Vehicle.Speed API: ${JSON.stringify(detail, null, 2)}`);
        console.log("API Detail:", detail);
      } catch (error) {
        console.error("Failed to get API detail:", error);
      }
    };
    const handleLoadVSSVersions = async () => {
      if (!api?.listVSSVersions) {
        alert("listVSSVersions API not available");
        return;
      }
      try {
        const versions = await api.listVSSVersions();
        setVssVersions(versions);
        alert(`VSS Versions: ${versions.join(", ")}`);
        console.log("VSS Versions:", versions);
      } catch (error) {
        console.error("Failed to load VSS versions:", error);
      }
    };
    const handleSetRuntimeValues = () => {
      if (!api?.setRuntimeApiValues) {
        alert("setRuntimeApiValues API not available");
        return;
      }
      try {
        api.setRuntimeApiValues({
          "Vehicle.Speed": 65.5,
          "Vehicle.CurrentLocation.Latitude": 37.7749,
          "Vehicle.CurrentLocation.Longitude": -122.4194
        });
        alert("Runtime API values set successfully!");
      } catch (error) {
        console.error("Failed to set runtime values:", error);
      }
    };
    const handleGetRuntimeValues = () => {
      if (!api?.getRuntimeApiValues) {
        alert("getRuntimeApiValues API not available");
        return;
      }
      try {
        const values = api.getRuntimeApiValues();
        alert(`Current Runtime Values: ${JSON.stringify(values, null, 2)}`);
        console.log("Runtime API Values:", values);
      } catch (error) {
        console.error("Failed to get runtime values:", error);
      }
    };
    const handleReplaceAPIs = async () => {
      if (!api?.replaceAPIs) {
        alert("replaceAPIs API not available");
        return;
      }
      const url = prompt("Enter VSS specification URL:");
      if (!url) return;
      try {
        await api.replaceAPIs(url);
        alert("Vehicle APIs replaced successfully!");
      } catch (error) {
        console.error("Failed to replace APIs:", error);
      }
    };
    const handleUpdatePrototypeName = async () => {
      if (!api?.updatePrototype) {
        alert("updatePrototype API not available (prototype_id not provided)");
        return;
      }
      if (!prototypeName.trim()) {
        alert("Please enter a valid prototype name");
        return;
      }
      setIsSaving(true);
      try {
        await api.updatePrototype({
          name: prototypeName
        });
        alert("Prototype name updated successfully!");
      } catch (error) {
        console.error("Failed to update prototype name:", error);
      } finally {
        setIsSaving(false);
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "min-h-screen w-full flex items-center justify-center bg-slate-500 text-black", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-center space-y-6 p-8 bg-white rounded-lg shadow-lg max-w-2xl", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: "text-3xl font-bold text-slate-800", children: "Sample Plugin" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-2xl font-bold text-slate-700", children: [
          "Local Count: ",
          localCount
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-lg text-slate-600", children: [
          "Current Time: ",
          currentTime
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "border-t pt-6 space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "text-xl font-semibold text-slate-800", children: "Plugin API Demo" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "space-y-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "text",
              value: savedValue,
              onChange: (e) => setSavedValue(e.target.value),
              placeholder: "Enter a value to save...",
              className: "w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex gap-3 justify-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                onClick: handleSaveToModel,
                disabled: isSaving || !api?.updateModel,
                className: "px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors",
                children: isSaving ? "Saving..." : "Save to Model"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                onClick: handleSaveToPrototype,
                disabled: isSaving || !api?.updatePrototype,
                className: "px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors",
                children: isSaving ? "Saving..." : "Save to Prototype"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-sm text-slate-500 mt-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u{1F4A1} This demonstrates plugin-to-host communication." }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: `Data is saved to the model/prototype's "extend" field.` })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "border-t pt-6 space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "text-xl font-semibold text-slate-800", children: "Prototype Data Management" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "bg-slate-100 p-4 rounded-md text-left space-y-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-sm text-slate-600", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Current Prototype ID:" }),
            " ",
            data?.prototype?.id || "N/A"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-sm text-slate-600", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Current Name:" }),
            " ",
            data?.prototype?.name || "N/A"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "space-y-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "text",
              value: prototypeName,
              onChange: (e) => setPrototypeName(e.target.value),
              placeholder: "Enter new prototype name...",
              className: "w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: handleUpdatePrototypeName,
              disabled: isSaving || !api?.updatePrototype || !prototypeName.trim(),
              className: "w-full px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors",
              children: isSaving ? "Updating..." : "Update Prototype Name"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-sm text-slate-500 mt-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u{1F4DD} This demonstrates reading prototype data from props and updating it via API." }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The prototype name is initialized from data.prototype.name and can be edited." })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "border-t pt-6 space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "text-xl font-semibold text-slate-800", children: "Vehicle API Operations (Read)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "grid grid-cols-3 gap-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: handleLoadAPIs,
              disabled: !api?.getComputedAPIs,
              className: "px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm",
              children: "Load All APIs"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: handleGetApiDetail,
              disabled: !api?.getApiDetail,
              className: "px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm",
              children: "Get Speed API"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: handleLoadVSSVersions,
              disabled: !api?.listVSSVersions,
              className: "px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm",
              children: "List VSS Versions"
            }
          )
        ] }),
        vssVersions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-sm text-slate-600 bg-slate-100 p-3 rounded", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "VSS Versions:" }),
          " ",
          vssVersions.join(", ")
        ] }),
        apiData && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "text-xs text-slate-600 bg-slate-100 p-3 rounded max-h-32 overflow-auto", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "API Count:" }),
          " ",
          Object.keys(apiData).length,
          " APIs loaded"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "border-t pt-6 space-y-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "text-xl font-semibold text-slate-800", children: "Vehicle API Operations (Write)" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "grid grid-cols-3 gap-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: handleSetRuntimeValues,
              disabled: !api?.setRuntimeApiValues,
              className: "px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm",
              children: "Set Runtime Values"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: handleGetRuntimeValues,
              disabled: !api?.getRuntimeApiValues,
              className: "px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm",
              children: "Get Runtime Values"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: handleReplaceAPIs,
              disabled: !api?.replaceAPIs,
              className: "px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm",
              children: "Replace All APIs"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "text-sm text-slate-500 mt-4", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u{1F527} Write operations for testing and simulation" }) })
      ] })
    ] }) });
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
    if (r && r.unmount) r.unmount();
    delete el.__aw_root;
  }
  if (typeof window !== "undefined") {
    ;
    window.DAPlugins = window.DAPlugins || {};
    window.DAPlugins["page-plugin"] = { components, mount, unmount };
  }
})();
//# sourceMappingURL=index.js.map
