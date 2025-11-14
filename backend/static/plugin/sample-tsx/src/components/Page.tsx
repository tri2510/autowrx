// eslint-disable-next-line @typescript-eslint/no-explicit-any
const React: any = (globalThis as any).React;
import Box from './Box';

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

  // Vehicle API Operations (Write)
  replaceAPIs?: (api_data_url: string, model_id?: string) => Promise<void>;
  setRuntimeApiValues?: (values: Record<string, any>) => void;
  getRuntimeApiValues?: () => Record<string, any>;

  // Wishlist API Operations
  createWishlistApi?: (data: any) => Promise<any>;
  updateWishlistApi?: (id: string, data: any) => Promise<any>;
  deleteWishlistApi?: (id: string) => Promise<void>;
  getWishlistApi?: (name: string, model_id?: string) => Promise<any>;
  listWishlistApis?: (model_id?: string) => Promise<any>;
};

type PageProps = {
  data?: any;
  config?: any;
  api?: PluginAPI;
};

export default function Page({ data, config, api }: PageProps) {
  const [localCount, setLocalCount] = React.useState(data?.count || 0);
  const [currentTime, setCurrentTime] = React.useState(new Date().toLocaleString());
  const [savedValue, setSavedValue] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [apiData, setApiData] = React.useState<any>(null);
  const [vssVersions, setVssVersions] = React.useState<string[]>([]);
  const [prototypeName, setPrototypeName] = React.useState('');

  React.useEffect(() => {
    // console.log('Page effect');
    const intervalId = setInterval(() => {
      // console.log('Page effect interval');
      setLocalCount((prevCount: number) => prevCount + 1);
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount.

  // Initialize prototype name from data
  React.useEffect(() => {
    if (data?.prototype?.name) {
      setPrototypeName(data.prototype.name);
    }
  }, [data?.prototype?.name]);

  // Example: Save data to model using the API callback
  const handleSaveToModel = async () => {
    if (!api?.updateModel) {
      alert('updateModel API not available (model_id not provided)');
      return;
    }

    setIsSaving(true);
    try {
      // Save to the model's extend field (used for custom plugin data)
      await api.updateModel({
        extend: {
          ...data?.model?.extend,
          samplePluginData: {
            lastSaved: new Date().toISOString(),
            counter: localCount,
            customValue: savedValue
          }
        }
      });
      alert('Data saved to model successfully!');
    } catch (error: any) {
      console.error('Failed to save to model:', error);
      // Error toast is already shown by the host
    } finally {
      setIsSaving(false);
    }
  };

  // Example: Save data to prototype using the API callback
  const handleSaveToPrototype = async () => {
    if (!api?.updatePrototype) {
      alert('updatePrototype API not available (prototype_id not provided)');
      return;
    }

    setIsSaving(true);
    try {
      // Save to the prototype's extend field
      await api.updatePrototype({
        extend: {
          ...data?.prototype?.extend,
          samplePluginData: {
            lastSaved: new Date().toISOString(),
            counter: localCount,
            customValue: savedValue
          }
        }
      });
      alert('Data saved to prototype successfully!');
    } catch (error: any) {
      console.error('Failed to save to prototype:', error);
      // Error toast is already shown by the host
    } finally {
      setIsSaving(false);
    }
  };

  // Example: Get vehicle APIs
  const handleLoadAPIs = async () => {
    if (!api?.getComputedAPIs) {
      alert('getComputedAPIs API not available (model not provided)');
      return;
    }

    try {
      const apis = await api.getComputedAPIs();
      setApiData(apis);
      alert('Vehicle APIs loaded! Check console for details.');
      console.log('Computed APIs:', apis);
    } catch (error: any) {
      console.error('Failed to load APIs:', error);
    }
  };

  // Example: Get specific API detail
  const handleGetApiDetail = async () => {
    if (!api?.getApiDetail) {
      alert('getApiDetail API not available');
      return;
    }

    try {
      const detail = await api.getApiDetail('Vehicle.Speed');
      alert(`Vehicle.Speed API: ${JSON.stringify(detail, null, 2)}`);
      console.log('API Detail:', detail);
    } catch (error: any) {
      console.error('Failed to get API detail:', error);
    }
  };

  // Example: List VSS versions
  const handleLoadVSSVersions = async () => {
    if (!api?.listVSSVersions) {
      alert('listVSSVersions API not available');
      return;
    }

    try {
      const versions = await api.listVSSVersions();
      setVssVersions(versions);
      alert(`VSS Versions: ${versions.join(', ')}`);
      console.log('VSS Versions:', versions);
    } catch (error: any) {
      console.error('Failed to load VSS versions:', error);
    }
  };

  // Example: Set runtime API values (write operation)
  const handleSetRuntimeValues = () => {
    if (!api?.setRuntimeApiValues) {
      alert('setRuntimeApiValues API not available');
      return;
    }

    try {
      api.setRuntimeApiValues({
        'Vehicle.Speed': 65.5,
        'Vehicle.CurrentLocation.Latitude': 37.7749,
        'Vehicle.CurrentLocation.Longitude': -122.4194,
      });
      alert('Runtime API values set successfully!');
    } catch (error: any) {
      console.error('Failed to set runtime values:', error);
    }
  };

  // Example: Get runtime API values
  const handleGetRuntimeValues = () => {
    if (!api?.getRuntimeApiValues) {
      alert('getRuntimeApiValues API not available');
      return;
    }

    try {
      const values = api.getRuntimeApiValues();
      alert(`Current Runtime Values: ${JSON.stringify(values, null, 2)}`);
      console.log('Runtime API Values:', values);
    } catch (error: any) {
      console.error('Failed to get runtime values:', error);
    }
  };

  // Example: Replace all vehicle APIs
  const handleReplaceAPIs = async () => {
    if (!api?.replaceAPIs) {
      alert('replaceAPIs API not available');
      return;
    }

    const url = prompt('Enter VSS specification URL:');
    if (!url) return;

    try {
      await api.replaceAPIs(url);
      alert('Vehicle APIs replaced successfully!');
    } catch (error: any) {
      console.error('Failed to replace APIs:', error);
    }
  };

  // Example: Update prototype name
  const handleUpdatePrototypeName = async () => {
    if (!api?.updatePrototype) {
      alert('updatePrototype API not available (prototype_id not provided)');
      return;
    }

    if (!prototypeName.trim()) {
      alert('Please enter a valid prototype name');
      return;
    }

    setIsSaving(true);
    try {
      await api.updatePrototype({
        name: prototypeName
      });
      alert('Prototype name updated successfully!');
    } catch (error: any) {
      console.error('Failed to update prototype name:', error);
      // Error toast is already shown by the host
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-500 text-black">
      <div className="text-center space-y-6 p-8 bg-white rounded-lg shadow-lg max-w-2xl">
        <h1 className="text-3xl font-bold text-slate-800">Sample Plugin</h1>

        <div className="space-y-2">
          <div className="text-2xl font-bold text-slate-700">Local Count: {localCount}</div>
          <div className="text-lg text-slate-600">Current Time: {currentTime}</div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Plugin API Demo</h2>

          <div className="space-y-3">
            <input
              type="text"
              value={savedValue}
              onChange={(e) => setSavedValue(e.target.value)}
              placeholder="Enter a value to save..."
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleSaveToModel}
                disabled={isSaving || !api?.updateModel}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save to Model'}
              </button>

              <button
                onClick={handleSaveToPrototype}
                disabled={isSaving || !api?.updatePrototype}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save to Prototype'}
              </button>
            </div>
          </div>

          <div className="text-sm text-slate-500 mt-4">
            <p>💡 This demonstrates plugin-to-host communication.</p>
            <p>Data is saved to the model/prototype's "extend" field.</p>
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Prototype Data Management</h2>

          <div className="bg-slate-100 p-4 rounded-md text-left space-y-2">
            <div className="text-sm text-slate-600">
              <strong>Current Prototype ID:</strong> {data?.prototype?.id || 'N/A'}
            </div>
            <div className="text-sm text-slate-600">
              <strong>Current Name:</strong> {data?.prototype?.name || 'N/A'}
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={prototypeName}
              onChange={(e) => setPrototypeName(e.target.value)}
              placeholder="Enter new prototype name..."
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <button
              onClick={handleUpdatePrototypeName}
              disabled={isSaving || !api?.updatePrototype || !prototypeName.trim()}
              className="w-full px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Updating...' : 'Update Prototype Name'}
            </button>
          </div>

          <div className="text-sm text-slate-500 mt-4">
            <p>📝 This demonstrates reading prototype data from props and updating it via API.</p>
            <p>The prototype name is initialized from data.prototype.name and can be edited.</p>
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Vehicle API Operations (Read)</h2>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleLoadAPIs}
              disabled={!api?.getComputedAPIs}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Load All APIs
            </button>

            <button
              onClick={handleGetApiDetail}
              disabled={!api?.getApiDetail}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Get Speed API
            </button>

            <button
              onClick={handleLoadVSSVersions}
              disabled={!api?.listVSSVersions}
              className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              List VSS Versions
            </button>
          </div>

          {vssVersions.length > 0 && (
            <div className="text-sm text-slate-600 bg-slate-100 p-3 rounded">
              <strong>VSS Versions:</strong> {vssVersions.join(', ')}
            </div>
          )}

          {apiData && (
            <div className="text-xs text-slate-600 bg-slate-100 p-3 rounded max-h-32 overflow-auto">
              <strong>API Count:</strong> {Object.keys(apiData).length} APIs loaded
            </div>
          )}
        </div>

        <div className="border-t pt-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Vehicle API Operations (Write)</h2>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleSetRuntimeValues}
              disabled={!api?.setRuntimeApiValues}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Set Runtime Values
            </button>

            <button
              onClick={handleGetRuntimeValues}
              disabled={!api?.getRuntimeApiValues}
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Get Runtime Values
            </button>

            <button
              onClick={handleReplaceAPIs}
              disabled={!api?.replaceAPIs}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Replace All APIs
            </button>
          </div>

          <div className="text-sm text-slate-500 mt-4">
            <p>🔧 Write operations for testing and simulation</p>
          </div>
        </div>

        {/* <Box title={config?.title || 'Sample Plugin'} initialCount={data?.count || 0} /> */}
      </div>
    </div>
  );
}
