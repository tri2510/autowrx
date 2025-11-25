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

  // src/components/Page.tsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  var React = globalThis.React;
  var getApiTypeClasses = (type) => {
    switch (type) {
      case "branch":
        return { bgClass: "", textClass: "text-purple-500" };
      case "actuator":
        return { bgClass: "", textClass: "text-yellow-500" };
      case "sensor":
        return { bgClass: "", textClass: "text-emerald-500" };
      case "attribute":
        return { bgClass: "", textClass: "text-sky-500" };
      case "Atomic Service":
        return { bgClass: "", textClass: "text-purple-500" };
      case "Basic Service":
        return { bgClass: "", textClass: "text-emerald-500" };
      default:
        return { bgClass: "", textClass: "text-da-gray-medium" };
    }
  };
  var logos = [
    {
      src: "https://bewebstudio.digitalauto.tech/data/projects/TQUHL1DoUNoI/digital.auto.png",
      name: "DigitalAuto",
      href: "https://www.digital-auto.org/"
    },
    {
      src: "https://bewebstudio.digitalauto.tech/data/projects/TQUHL1DoUNoI/certivity.png",
      name: "Certivity",
      href: "https://www.certivity.io/"
    },
    {
      src: "https://bewebstudio.digitalauto.tech/data/projects/TQUHL1DoUNoI/AlephAlpha.png",
      name: "Aleph Alpha",
      href: "https://aleph-alpha.com/"
    },
    {
      src: "https://bewebstudio.digitalauto.tech/data/projects/TQUHL1DoUNoI/ETAS.png",
      name: "ETAS",
      href: "https://www.etas.com/en/"
    }
  ];
  function Page({ data, config, api }) {
    const [vssApis, setVssApis] = React.useState([]);
    const [selectedApis, setSelectedApis] = React.useState(/* @__PURE__ */ new Set());
    React.useEffect(() => {
      const vssApisData = data?.prototype?.apis?.VSS || [];
      setVssApis(vssApisData);
    }, [data?.prototype?.apis?.VSS]);
    const handleToggleApi = (apiName) => {
      setSelectedApis((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(apiName)) {
          newSet.delete(apiName);
        } else {
          newSet.add(apiName);
        }
        return newSet;
      });
    };
    const handleSelectAll = () => {
      if (selectedApis.size === vssApis.length) {
        setSelectedApis(/* @__PURE__ */ new Set());
      } else {
        const allApiNames = vssApis.map((api2) => api2.name || api2);
        setSelectedApis(new Set(allApiNames));
      }
    };
    const handleClearSelection = () => {
      setSelectedApis(/* @__PURE__ */ new Set());
    };
    const getApiName = (api2) => {
      return typeof api2 === "string" ? api2 : api2.name || "";
    };
    const getApiType = (api2) => {
      if (typeof api2 === "string")
        return "ACTUATOR";
      return api2.type || api2.datatype || "ACTUATOR";
    };
    React.useEffect(() => {
      console.log("prototype data", data?.prototype);
    }, [data?.prototype]);
    React.useEffect(() => {
      console.log("model data", data?.model);
    }, [data?.model]);
    if (!data?.prototype?.name) {
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          className: "h-full w-full bg-slate-200 p-2 flex text-black",
          style: {},
          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bg-white shadow-lg rounded-lg w-full h-full flex items-start justify-start px-4 py-4 overflow-auto", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: "text-2xl font-bold text-slate-700", children: "No Data Found" }) })
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        className: "h-full w-full bg-slate-200 p-2 flex text-black",
        style: {},
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "bg-white shadow-lg rounded-lg w-full h-full flex gap-4 px-4 py-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "w-1/2 h-full flex flex-col gap-4", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "div",
              {
                className: "flex-1 flex flex-col rounded-lg p-2",
                style: { backgroundColor: "rgba(225, 231, 239, 0.2)" },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center justify-between mb-3", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { className: "text-lg font-bold text-slate-700", children: [
                      "Used Signals (",
                      vssApis.length,
                      ")"
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "flex items-center gap-1 text-sm cursor-pointer hover:opacity-60", children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                          "input",
                          {
                            type: "checkbox",
                            checked: vssApis.length > 0 && selectedApis.size === vssApis.length,
                            onChange: handleSelectAll,
                            className: "w-4 h-4 cursor-pointer"
                          }
                        ),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Select all" })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "button",
                        {
                          onClick: handleClearSelection,
                          className: "flex items-center gap-1 text-sm cursor-pointer hover:opacity-60",
                          title: "Clear selection",
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }),
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Clear selection" })
                          ]
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 overflow-auto", children: vssApis.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "text-sm text-slate-500 text-center py-4", children: "No signals available" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "space-y-2", children: vssApis.map((api2, index) => {
                    const apiName = getApiName(api2);
                    const apiType = getApiType(api2);
                    const isSelected = selectedApis.has(apiName);
                    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                      "div",
                      {
                        className: "flex items-center justify-between p-2 hover:bg-slate-100 rounded",
                        children: [
                          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex items-center gap-2 flex-1 min-w-0", children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                              "input",
                              {
                                type: "checkbox",
                                checked: isSelected,
                                onChange: () => handleToggleApi(apiName),
                                className: "w-4 h-4 cursor-pointer flex-shrink-0"
                              }
                            ),
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "text-sm text-slate-700 truncate", children: apiName })
                          ] }),
                          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `text-xs !font-medium uppercase select-none
                            px-2 py-1 rounded-full ${getApiTypeClasses(apiType).bgClass} ${getApiTypeClasses(apiType).textClass}`, children: apiType })
                        ]
                      },
                      index
                    );
                  }) }) })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "div",
              {
                className: "h-[160px] flex flex-col rounded-lg p-2",
                style: { backgroundColor: "rgba(225, 231, 239, 0.2)" },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "text-lg font-bold text-slate-700 mb-2", children: "Vehicle Properties" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 overflow-auto", children: data?.model?.vehicle_category && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "div",
                    {
                      className: "flex font-medium items-center gap-2",
                      style: { gap: "10px", fontSize: "14px" },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Category: " }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "font-bold", children: data?.model?.vehicle_category })
                      ]
                    }
                  ) })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "div",
              {
                className: "h-[100px] rounded-lg p-2 flex flex-col",
                style: {},
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "text-center flex-shrink-0 text-xs", children: "This prototype is powered by" }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "div",
                    {
                      className: "flex w-full h-full items-center justify-center",
                      style: { gap: "20px", backgroundColor: "white" },
                      children: logos.map((logo) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "a",
                        {
                          className: "transition cursor-pointer",
                          href: logo.href,
                          target: "__blank",
                          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                            "img",
                            {
                              src: logo.src,
                              className: "w-full object-contain",
                              style: { height: "auto", maxHeight: "60px" },
                              alt: logo.name + "-logo"
                            }
                          )
                        },
                        logo.name
                      ))
                    }
                  )
                ]
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              className: "w-1/2 h-full flex flex-col overflow-auto rounded-lg p-2",
              style: { backgroundColor: "rgba(225, 231, 239, 0.2)" },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: "text-lg font-bold text-slate-700 mb-2", children: "Regulation Compliance" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 overflow-auto" })
              ]
            }
          )
        ] })
      }
    );
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
  }
})();
//# sourceMappingURL=index.js.map
