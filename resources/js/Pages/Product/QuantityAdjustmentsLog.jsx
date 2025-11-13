import * as React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import dayjs from "dayjs";

export default function QuantityAdjustmentsLog({ adjustments }) {
    const getRowBgColor = (type) => {
        return type === 'sale' ? 'bg-blue-50' : 'bg-white';
    };

    const getTypeLabel = (type) => {
        return type === 'sale' ? 'Sale' : 'Adjustment';
    };

    return (
        <AuthenticatedLayout>
            <Head title="Adjustment Log" />
            <div className="overflow-x-auto">
                <table className="table-auto w-full">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-6 py-2 font-medium text-left text-white">Date</th>
                            <th className="px-6 py-2 font-medium text-left text-white">Product</th>
                            <th className="px-6 py-2 font-medium text-left text-white">Type</th>
                            <th className="px-6 py-2 font-medium text-left text-white">Adjusted Qty</th>
                            <th className="px-6 py-2 font-medium text-left text-white">Adjustment</th>
                            <th className="px-6 py-2 font-medium text-left text-white">Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {adjustments.map((adjustment) => (
                            <tr key={`${adjustment.type}-${adjustment.id}`} className={getRowBgColor(adjustment.type)}>
                                <td className="border px-6 py-1">{dayjs(adjustment.created_at).format("DD/MM/YYYY HH:mm")}</td>
                                <td className="border px-6 py-1">{adjustment.name}</td>
                                <td className="border px-6 py-1">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                        adjustment.type === 'sale'
                                            ? 'bg-blue-200 text-blue-800'
                                            : 'bg-gray-200 text-gray-800'
                                    }`}>
                                        {getTypeLabel(adjustment.type)}
                                    </span>
                                </td>
                                <td className="border px-6 py-1 text-sm">
                                    <span style={{ color: Number(adjustment.adjusted_quantity) < 0 ? 'red' : 'green' }}>
                                        {adjustment.adjusted_quantity}
                                    </span>
                                </td>
                                <td className="border px-6 py-1 text-sm">
                                    {adjustment.type === 'adjustment' ? (
                                        <>
                                            <span>
                                                {adjustment.previous_quantity}
                                            </span>
                                            {' → '}
                                            <span style={{ color: Number(adjustment.adjusted_quantity) < 0 ? 'red' : 'green' }}>
                                                {Number(adjustment.previous_quantity) + Number(adjustment.adjusted_quantity)}
                                            </span>
                                        </>
                                    ) : (
                                        <span style={{ color: 'red' }}>
                                            {adjustment.adjusted_quantity}
                                        </span>
                                    )}
                                </td>
                                <td className="border px-6 py-1">{adjustment.reason}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AuthenticatedLayout>
    );
}
