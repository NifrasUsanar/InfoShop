import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import dayjs from "dayjs";
import axios from "axios";
import Swal from "sweetalert2";
import BatchModal from "./BatchModal";

export default function BatchesTable({ product, batches = [], onBatchesChange, contacts = [] }) {
    const [localBatches, setLocalBatches] = useState(batches);
    const [batchModalOpen, setBatchModalOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);

    useEffect(() => {
        setLocalBatches(batches);
    }, [batches]);

    const handleBatchUpdated = async (batchData) => {
        try {
            // Fetch fresh batches from backend
            const response = await axios.get(`/api/products/${product.id}/batches`);
            if (response.data.batches) {
                setLocalBatches(response.data.batches);
            }
        } catch (error) {
            console.error('Failed to reload batches:', error);
            // Fallback: Update local state with the batch data we received
            const updatedBatch = batchData.batch || batchData;
            if (updatedBatch && updatedBatch.id) {
                setLocalBatches(prevBatches =>
                    prevBatches.map(batch =>
                        batch.id === updatedBatch.id || batch.batch_id === updatedBatch.id
                            ? { ...batch, ...updatedBatch, batch_id: updatedBatch.id }
                            : batch
                    )
                );
            }
        }
        // Don't call onBatchesChange - that triggers page reload
        // Local state is already updated above
        setBatchModalOpen(false);
        setSelectedBatch(null);
    };

    const handleCardClick = (batch) => {
        setSelectedBatch(batch);
        setBatchModalOpen(true);
    };

    const handleDeleteBatch = (e, batchId) => {
        e.stopPropagation();
        
        Swal.fire({
            title: "Delete Batch?",
            text: "Are you sure you want to delete this batch?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d32f2f",
            cancelButtonColor: "#757575",
            confirmButtonText: "Delete",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteBatch(batchId);
            }
        });
    };

    const deleteBatch = async (batchId) => {
        try {
            const response = await axios.delete(`/productbatch/${batchId}`);

            setLocalBatches((prevBatches) =>
                prevBatches.filter((batch) => batch.id !== batchId)
            );

            Swal.fire({
                icon: "success",
                title: "Deleted",
                text: "Batch deleted successfully",
                position: "bottom",
                toast: true,
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.message || "Failed to delete batch",
                position: "bottom",
                toast: true,
                timer: 1500,
                showConfirmButton: false,
            });
        }
    };

    const getSupplierName = (batch) => {
        if (!batch.contact_id) return 'No Supplier';
        if (batch.contact) return batch.contact.name;
        const contact = contacts.find(c => c.id === batch.contact_id);
        return contact ? contact.name : 'Unknown Supplier';
    };

    const DisplayField = ({ label, value }) => (
        <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                {label}
            </label>
            <div className="text-sm font-semibold text-gray-900">
                {value || '-'}
            </div>
        </div>
    );

    return (
        <>
            {/* Hidden trigger for Add Batch button in ProductForm */}
            <div
                data-batch-modal-trigger
                onClick={() => {
                    setSelectedBatch(null);
                    setBatchModalOpen(true);
                }}
                className="hidden"
            />

            <div className="space-y-3">
                {localBatches && localBatches.length > 0 ? (
                    localBatches.map((batch) => (
                        <div
                            key={batch.id}
                            onClick={() => handleCardClick(batch)}
                            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
                        >
                            {/* Card Header */}
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">
                                        {batch.batch_number}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {getSupplierName(batch)}
                                    </p>
                                </div>
                                
                                {localBatches.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteBatch(e, batch.id)}
                                        className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:cursor-pointer transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Card Body - Batch Details */}
                            <div className="px-4 py-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <DisplayField
                                        label="Cost"
                                        value={batch.cost}
                                    />
                                    
                                    <DisplayField
                                        label="Price"
                                        value={batch.price}
                                    />
                                    
                                    <DisplayField
                                        label="Discount %"
                                        value={`${batch.discount_percentage || 0}%`}
                                    />
                                    
                                    <DisplayField
                                        label="Flat Discount"
                                        value={batch.discount || 0}
                                    />
                                    
                                    <div className="col-span-2">
                                        <DisplayField
                                            label="Expiry Date"
                                            value={batch.expiry_date ? dayjs(batch.expiry_date).format("DD/MM/YYYY") : "No expiry"}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                        <p className="text-gray-600 font-medium">No batches found</p>
                        <p className="text-xs text-gray-500 mt-1">Create batches to track inventory</p>
                    </div>
                )}
            </div>

            {/* Batch Modal for editing/creating batches */}
            <BatchModal
                batchModalOpen={batchModalOpen}
                setBatchModalOpen={setBatchModalOpen}
                selectedBatch={selectedBatch}
                selectedProduct={product}
                contacts={contacts}
                refreshProducts={handleBatchUpdated}
                initialIsNew={!selectedBatch}
            />
        </>
    );
}
