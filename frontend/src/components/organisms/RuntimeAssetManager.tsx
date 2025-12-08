// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from "react"
import { useAssets } from '@/hooks/useAssets'
import { IoClose } from "react-icons/io5";
import { TbTrash, TbShare, TbServer, TbWifi } from "react-icons/tb"
import { Input } from "@/components/atoms/input";
import { Button } from "@/components/atoms/button";
import ShareAssetPanel from "@/components/molecules/ShareAssetPanel";
import DaDialog from "@/components/molecules/DaDialog";
import { Spinner } from "@/components/atoms/spinner";
import { Dialog, DialogContent } from "@/components/atoms/dialog";
import DaVehicleEdgeRuntimeDashboard from "@/components/molecules/vehicle-edge-runtime/DaVehicleEdgeRuntimeDashboard";

interface iPropRuntimeAssetManager {
    onClose: () => void,
    onCancel: () => void,
}

const RuntimeAssetManager = ({ onClose, onCancel }: iPropRuntimeAssetManager) => {
    const [myRuntimes, setMyRuntimes] = useState<any[]>([])
    const { useFetchAssets, deleteAsset, createAsset, updateAsset } = useAssets()
    const { data: assets, isLoading, refetch } = useFetchAssets()
    const [activeAsset, setActiveAsset] = useState<any>()
    const [newRtName, setNewRtName] = useState<string>("Runtime-")
    const [shareDialogOpen, setShareDialogOpen] = useState<boolean>(false)
    const [showVehicleEdgeRuntime, setShowVehicleEdgeRuntime] = useState<boolean>(false)

    useEffect(() => {
        setMyRuntimes(assets?.filter((a: any) => a.type == 'CLOUD_RUNTIME') || [])
    }, [assets])

    return <div className="w-full min-h-[400px] px-2 py-1">
        <div className="flex items-center">
            <h2 className="text-xl font-semibold text-foreground">
                My Assets
            </h2>
            <div className="grow"></div>
            <IoClose className="cursor-pointer hover:opacity-70" size={24} onClick={() => {
                if (onClose) onClose()
            }} />
        </div>

        <DaDialog 
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            trigger={<span></span>}
            dialogTitle="Share Asset"
        >
            <ShareAssetPanel 
                asset={activeAsset}
                onCancel={() => {
                    setShareDialogOpen(false)
                }}
                onDone={() => {
                    setShareDialogOpen(false)
                }}
            />
        </DaDialog>

        <div className="flex flex-col w-full mt-6 max-h-[400px] overflow-auto">
            {/* Vehicle Edge Runtime Section */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 w-full px-4 py-3 rounded mb-4">
                <div className="flex items-center mb-2">
                    <TbServer className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Vehicle Edge Runtime</h3>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Deploy applications to local vehicle edge devices (Raspberry Pi, Linux PCs, etc.)
                </p>
                <Button
                    onClick={() => setShowVehicleEdgeRuntime(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <TbWifi className="w-4 h-4 mr-2" />
                    Manage Vehicle Edge Runtime
                </Button>
            </div>

            {/* Cloud Runtime Section */}
            <div className="bg-slate-100 dark:bg-slate-800 w-full px-4 py-2 rounded">
                <h3 className="text-lg font-semibold">Add new cloud asset</h3>
                <div className="mt-2 flex items-center">
                    <span className="text-sm mr-2">Runtime Code:</span>
                    <Input
                        value={newRtName}
                        onChange={(e) => setNewRtName(e.target.value)}
                        className="flex w-[280px] mx-2"
                    />
                    <Button
                        disabled={newRtName.trim().length <= 0}
                        onClick={async () => {
                            try {
                                await createAsset.mutateAsync({
                                    name: newRtName,
                                    type: 'CLOUD_RUNTIME',
                                    data: '{}',
                                })
                                setNewRtName('Runtime-')
                                await refetch()
                            } catch (err) {
                                console.error('Error creating asset:', err)
                            }
                        }}
                    >
                        Add
                    </Button>
                </div>
            </div>

            {isLoading && (
                <div className="w-full flex py-4 justify-center items-center">
                    <Spinner className="mr-2" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
            )}

            {!isLoading && (
                <div className="mt-6 w-full">
                    <div className="flex w-full items-center text-foreground font-bold text-lg 
                            py-1 border-b border-border">
                        <div className="grow">Name</div>
                        <div className="w-[200px] min-w-[100px]">Actions</div>
                    </div>

                    {(!assets || assets.length == 0) && (
                        <div className="w-full py-4 italic text-muted-foreground text-center">
                            You have no asset
                        </div>
                    )}

                    {assets && assets.length > 0 && assets.map((asset: any, aIndex: number) => (
                        <div 
                            key={aIndex}
                            className="flex w-full items-center text-foreground font-normal text-md 
                            py-4 border-b border-border"
                        >
                            <div className="grow">{asset.name}</div>
                            <div className="w-[200px] min-w-[100px] flex space-x-4">
                                <TbShare 
                                    className="text-muted-foreground cursor-pointer hover:opacity-60" 
                                    size={24}
                                    onClick={() => {
                                        setActiveAsset(JSON.parse(JSON.stringify(asset)))
                                        setShareDialogOpen(true)
                                    }} 
                                />
                                <TbTrash 
                                    className="text-red-500 cursor-pointer hover:opacity-60" 
                                    size={24}
                                    onClick={async () => {
                                        if (!confirm(`Confirm delete asset '${asset.name}'?`) || !asset.id) {
                                            return
                                        }
                                        try {
                                            await deleteAsset.mutateAsync(asset.id)
                                            await refetch()
                                        } catch (err) {
                                            console.error('Error deleting asset:', err)
                                        }
                                    }} 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Vehicle Edge Runtime Dialog */}
        <Dialog open={showVehicleEdgeRuntime} onOpenChange={setShowVehicleEdgeRuntime}>
            <DialogContent className="max-w-7xl h-[90vh] max-h-[90vh] p-0">
                <DaVehicleEdgeRuntimeDashboard
                    onClose={() => setShowVehicleEdgeRuntime(false)}
                />
            </DialogContent>
        </Dialog>
    </div>
}

export default RuntimeAssetManager
