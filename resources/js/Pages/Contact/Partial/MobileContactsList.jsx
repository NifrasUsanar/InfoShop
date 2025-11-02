import React, { useState } from 'react';
import { IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { ClipboardClock, PrinterIcon, ReceiptText, ShoppingCart } from 'lucide-react';
import { Link } from '@inertiajs/react';
import Catalog from '@/Pages/CatalogPOS/Catalog';

const MobileContactsList = ({ contacts, handleContactEdit }) => {
    const [dialog, setDialog] = useState({ open: false, id: null });

    const openDialog = (type, id = null) => setDialog({ open: true, type, id });
    const closeDialog = () => setDialog({ open: false, id: null });

    return (
        <>
            <ul className="faded-bottom no-scrollbar grid gap-2 overflow-auto pt-1 pb-1 w-full">
                {contacts.map((contact) => (
                    <li className="p-3 w-full shadow-sm" key={contact.id}>
                        <div className="flex justify-between items-center">
                            <div
                                className="uppercase tracking-wide text-sm text-blue-900 font-semibold"
                                onClick={() => handleContactEdit(contact, 'contact_edit')}
                            >
                                {contact.name}
                            </div>
                            <div className="flex ml-2">
                                <Link href={`/reports/${contact.id}/${contact.type}`}>
                                    <Tooltip title="REPORT">
                                        <IconButton color="primary">
                                            <PrinterIcon size={20} />
                                        </IconButton>
                                    </Tooltip>
                                </Link>

                                {contact.type === 'customer' && (
                                    <>
                                        <Link href={`/pending-sales-receipt/${contact.id}`}>
                                            <Tooltip title="PENDING RECEIPT">
                                                <IconButton color="primary">
                                                    <ClipboardClock size={20} />
                                                </IconButton>
                                            </Tooltip>
                                        </Link>
                                        <Link href={`/sales/?pending-sales-receipt=${contact.id}`}>
                                            <Tooltip title="PENDING RECEIPT">
                                                <IconButton color="primary">
                                                    <ReceiptText size={20} />
                                                </IconButton>
                                            </Tooltip>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-4">
                            <div onClick={() => handleContactEdit(contact, 'add_payment')}>
                                <div className="text-gray-500 text-sm">Balance</div>
                                <div className="text-gray-700 text-sm font-bold">Rs. {contact.balance}</div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-sm">Phone</div>
                                <div className="text-gray-700 text-sm font-bold">{contact.phone ?? '-'}</div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
};

export default MobileContactsList;
