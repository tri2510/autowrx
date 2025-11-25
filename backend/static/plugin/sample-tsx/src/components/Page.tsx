// eslint-disable-next-line @typescript-eslint/no-explicit-any
const React: any = (globalThis as any).React;
import Box from './Box';
import { supportedCertivityApis, supportedCertivityApis_v4_map } from '../certivityApis';

// For bundling npm packages: Install them in the plugin directory
// For using host packages: Add them to EXTERNAL_PACKAGES in build.sh
// Example with external package (assumes dayjs is in host):
// const dayjs = require('dayjs');

/**
 * Plugin API provided by the host application
 * Limited to:
 * 1. Update model/prototype data
 * 2. Read & Write vehicle API information
 */
type PluginAPI = {
  // Model & Prototype Updates
  updateModel?: (updates: any) => Promise<any>;
  updatePrototype?: (updates: any) => Promise<any>;

  // Vehicle API Operations (Read)
  getComputedAPIs?: (model_id?: string) => Promise<any>;
  getApiDetail?: (api_name: string, model_id?: string) => Promise<any>;
  listVSSVersions?: () => Promise<string[]>;
};

type PageProps = {
  data?: any;
  config?: any;
  api?: PluginAPI;
};

const getApiTypeClasses = (type: string) => {
  switch (type) {
    case 'branch':
      return { bgClass: '', textClass: 'text-purple-500' }
    case 'actuator':
      return { bgClass: '', textClass: 'text-yellow-500' }
    case 'sensor':
      return { bgClass: '', textClass: 'text-emerald-500' }
    case 'attribute':
      return { bgClass: '', textClass: 'text-sky-500' }
    case 'Atomic Service':
      return { bgClass: '', textClass: 'text-purple-500' }
    case 'Basic Service':
      return { bgClass: '', textClass: 'text-emerald-500' }
    default:
      return { bgClass: '', textClass: 'text-da-gray-medium' }
  }
}

const logos = [
  {
    src: 'https://bewebstudio.digitalauto.tech/data/projects/TQUHL1DoUNoI/digital.auto.png',
    name: 'DigitalAuto',
    href: 'https://www.digital-auto.org/',
  },
  {
    src: 'https://bewebstudio.digitalauto.tech/data/projects/TQUHL1DoUNoI/certivity.png',
    name: 'Certivity',
    href: 'https://www.certivity.io/',
  },
  {
    src: 'https://bewebstudio.digitalauto.tech/data/projects/TQUHL1DoUNoI/AlephAlpha.png',
    name: 'Aleph Alpha',
    href: 'https://aleph-alpha.com/',
  },
  { src: 'https://bewebstudio.digitalauto.tech/data/projects/TQUHL1DoUNoI/ETAS.png', 
    name: 'ETAS', 
    href: 'https://www.etas.com/en/' },
]


export default function Page({ data, config, api }: PageProps) {

  const [vssApis, setVssApis] = React.useState([]);
  const [selectedApis, setSelectedApis] = React.useState(new Set());

  // Watch for changes to data?.prototype?.apis?.VSS and update vssApis
  React.useEffect(() => {
    const vssApisData = data?.prototype?.apis?.VSS || [];
    setVssApis(vssApisData);
  }, [data?.prototype?.apis?.VSS]);

  // Handle individual checkbox toggle
  const handleToggleApi = (apiName: string) => {
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

  // Handle select all
  const handleSelectAll = () => {
    if (selectedApis.size === vssApis.length) {
      // If all are selected, clear selection
      setSelectedApis(new Set());
    } else {
      // Select all
      const allApiNames = vssApis.map((api) => api.name || api);
      setSelectedApis(new Set(allApiNames));
    }
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedApis(new Set());
  };

  // Get API name (handle both string and object formats)
  const getApiName = (api: any): string => {
    return typeof api === 'string' ? api : api.name || '';
  };

  // Get API type (ACTUATOR, SENSOR, etc.)
  const getApiType = (api: any): string => {
    if (typeof api === 'string') return 'ACTUATOR'; // Default if not specified
    return api.type || api.datatype || 'ACTUATOR';
  };

  // Initialize prototype name from data
  React.useEffect(() => {
    console.log('prototype data', data?.prototype);
  }, [data?.prototype]);

  React.useEffect(() => {
    console.log('model data', data?.model);
  }, [data?.model]);


  if (!data?.prototype?.name) {
    return (
      <div className="h-full w-full bg-slate-200 p-2 flex text-black"
        style={{}}>
        <div className="bg-white shadow-lg rounded-lg w-full h-full flex items-start justify-start px-4 py-4 overflow-auto">
          <h1 className="text-2xl font-bold text-slate-700">No Data Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-200 p-2 flex text-black"
      style={{}}>
      <div className="bg-white shadow-lg rounded-lg w-full h-full flex gap-4 px-4 py-4">
        <div className="w-1/2 h-full flex flex-col gap-4">
          <div className="flex-1 flex flex-col rounded-lg p-2"
            style={{ backgroundColor: 'rgba(225, 231, 239, 0.2)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-700">Used Signals ({vssApis.length})</h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-sm cursor-pointer hover:opacity-60">
                  <input
                    type="checkbox"
                    checked={vssApis.length > 0 && selectedApis.size === vssApis.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span>Select all</span>
                </label>
                <button
                  onClick={handleClearSelection}
                  className="flex items-center gap-1 text-sm cursor-pointer hover:opacity-60"
                  title="Clear selection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Clear selection</span>
                </button>
              </div>
            </div>

            {/* Signal List */}
            <div className="flex-1 overflow-auto">
              {vssApis.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-4">No signals available</div>
              ) : (
                <div className="space-y-2">
                  {vssApis.map((api, index) => {
                    const apiName = getApiName(api);
                    const apiType = getApiType(api);
                    const isSelected = selectedApis.has(apiName);

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 hover:bg-slate-100 rounded"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleApi(apiName)}
                            className="w-4 h-4 cursor-pointer flex-shrink-0"
                          />
                          <span className="text-sm text-slate-700 truncate">{apiName}</span>
                        </div>
                        <span className={`text-xs !font-medium uppercase select-none
                            px-2 py-1 rounded-full ${getApiTypeClasses(apiType).bgClass} ${getApiTypeClasses(apiType).textClass}`}>
                          {apiType}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="h-[160px] flex flex-col rounded-lg p-2"
            style={{ backgroundColor: 'rgba(225, 231, 239, 0.2)' }}>
            <h2 className="text-lg font-bold text-slate-700 mb-2">Vehicle Properties</h2>
            <div className="flex-1 overflow-auto">
              {data?.model?.vehicle_category && <div className="flex font-medium items-center gap-2"
                style={{ gap: '10px', fontSize: '14px' }}>
                <div>Category: </div>
                <div className="font-bold">{data?.model?.vehicle_category}</div>
              </div>}
            </div>
          </div>

          <div className="h-[100px] rounded-lg p-2 flex flex-col"
            style={{ }}>
            <p className="text-center flex-shrink-0 text-xs">
              This prototype is powered by
            </p>
            <div className="flex w-full h-full items-center justify-center"
            style={{ gap: '20px', backgroundColor: 'white' }}>
              {logos.map((logo) => (
                <a
                  className="transition cursor-pointer"
                  key={logo.name}
                  href={logo.href}
                  target="__blank"
                >
                  <img
                    src={logo.src}
                    className="w-full object-contain"
                    style={{ height: 'auto', maxHeight: '60px' }}
                    alt={logo.name + '-logo'}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="w-1/2 h-full flex flex-col overflow-auto rounded-lg p-2"
          style={{ backgroundColor: 'rgba(225, 231, 239, 0.2)' }}>
          <h2 className="text-lg font-bold text-slate-700 mb-2">Regulation Compliance</h2>
          <div className="flex-1 overflow-auto">

          </div>
        </div>
      </div>
    </div>
  );
}
