import axios from "axios";
import { useEffect, useState } from "react";
import { Archive, Download, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";

export default function BackupFilesTab() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [runningBackup, setRunningBackup] = useState(false);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get("/api/backups");
            setFiles(response.data.files || []);
        } catch (err) {
            setError("Failed to load backup files. Please try again.");
            console.error("Backup listing error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (file) => {
        if (deleting) return;
        if (!confirm(`Delete backup ${file.name}? This cannot be undone.`)) {
            return;
        }

        setDeleting(file.name);
        setError(null);
        try {
            await axios.delete(`/api/backups/${encodeURIComponent(file.name)}`);
            setFiles((prev) => prev.filter((item) => item.name !== file.name));
        } catch (err) {
            const message = err.response?.data?.message || "Failed to delete backup file.";
            setError(message);
            console.error("Delete backup error:", err);
        } finally {
            setDeleting(null);
        }
    };

    const handleDownload = (file) => {
        const url = file.download_url || `/download-backup/${encodeURIComponent(file.name)}`;
        window.location.href = url;
    };

    const handleBackupNow = async () => {
        if (runningBackup) return;
        setRunningBackup(true);
        setError(null);
        try {
            const response = await axios.get("/backup-now", { responseType: "blob" });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const anchor = document.createElement("a");
            anchor.href = blobUrl;
            anchor.download = `infoshop-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
            anchor.click();
            window.URL.revokeObjectURL(blobUrl);
            await fetchFiles();
        } catch (err) {
            const message = err.response?.data?.message || err.message || "Failed to generate backup.";
            setError(message);
            console.error("Backup now error:", err);
        } finally {
            setRunningBackup(false);
        }
    };

    const formatDate = (value) => {
        if (!value) return "Unknown";
        try {
            return new Date(value).toLocaleString();
        } catch (error) {
            return value;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-start gap-3">
                <Archive className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-teal-900">Backup Files</p>
                    <p className="text-xs text-teal-700 mt-1">
                        Review previously generated backups, download copies, or delete old archives to reclaim disk space.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={handleBackupNow}
                    disabled={runningBackup}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    {runningBackup ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    Backup Now
                </button>
                <button
                    onClick={fetchFiles}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Refresh List
                </button>
                <div className="text-sm text-gray-600 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200">
                    {files.length} backup{files.length === 1 ? "" : "s"} available
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="ml-3 text-gray-600">Loading backups...</span>
                </div>
            ) : files.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Archive className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No backups found</p>
                    <p className="text-xs text-gray-400 mt-1">Use automation or manual backup tools to create one.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {files.map((file) => (
                        <div
                            key={file.name}
                            className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 break-words">{file.name}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    {file.size_human} • Updated {formatDate(file.last_modified)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDownload(file)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                                <button
                                    onClick={() => handleDelete(file)}
                                    disabled={deleting === file.name}
                                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                                >
                                    {deleting === file.name ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
