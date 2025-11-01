import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from 'react-dropzone';
import axios from "axios";
import { 
    Upload, 
    FileArchive, 
    X, 
    CheckCircle2, 
    AlertCircle, 
    Loader2,
    Database,
    FolderSync,
    Shield,
    Zap
} from "lucide-react";

export default function UpdateV2Tab() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState(null);
    const logsEndRef = useRef(null);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { message, type, timestamp }]);
    };

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    const MAX_FILE_SIZE = 50 * 1024 * 1024;

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles[0]?.name.endsWith('.zip')) {
            if (acceptedFiles[0].size > MAX_FILE_SIZE) {
                setError(`File too large. Maximum size is 50MB. Your file is ${(acceptedFiles[0].size / 1024 / 1024).toFixed(2)}MB`);
                addLog(`Error: File exceeds 50MB limit (${(acceptedFiles[0].size / 1024 / 1024).toFixed(2)}MB)`, 'error');
                return;
            }
            setFile(acceptedFiles[0]);
            setError(null);
            setLogs([]);
            setStatus('idle');
            addLog(`File selected: ${acceptedFiles[0].name} (${(acceptedFiles[0].size / 1024 / 1024).toFixed(2)}MB)`, 'success');
        } else {
            setError('Only ZIP files are allowed');
            addLog('Error: Only ZIP files are allowed', 'error');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/zip': ['.zip'] },
        maxSize: MAX_FILE_SIZE,
        multiple: false,
        disabled: uploading,
        onDropRejected: (rejectedFiles) => {
            const file = rejectedFiles[0];
            if (file.errors[0]?.code === 'file-too-large') {
                setError(`File too large. Maximum size is 50MB. Your file is ${(file.file.size / 1024 / 1024).toFixed(2)}MB`);
                addLog(`Error: File rejected - exceeds 50MB limit (${(file.file.size / 1024 / 1024).toFixed(2)}MB)`, 'error');
            }
        }
    });

    const handleUpload = async (event) => {
        event.preventDefault();
        if (!file || uploading) return;

        setUploading(true);
        setStatus('validating');
        setError(null);
        setUploadProgress(0);
        setLogs([]);

        addLog('Preparing update package...', 'info');
        addLog('📋 Validating folder structure...', 'info');
        addLog('Required folders: app, routes, resources, config, database, lang', 'info');
        addLog('Optional folders: vendor, public (build folder will be replaced)', 'info');

        const formData = new FormData();
        formData.append('zip_file', file);

        try {
            setStatus('uploading');
            addLog('Uploading to server...', 'info');

            const response = await axios.post('/upload-v2', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 900000,
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);

                    if (percentCompleted === 100) {
                        setStatus('processing');
                        addLog('Upload complete. Processing update...', 'success');
                    }
                },
            });

            setStatus('success');
            addLog('✓ Update completed successfully!', 'success');

            if (response.data.migrations_output) {
                addLog('Migration Output:', 'info');
                const migrationLines = response.data.migrations_output.split('\n');
                migrationLines.forEach(line => {
                    if (line.trim()) {
                        addLog(line.trim(), 'info');
                    }
                });
            }

        } catch (error) {
            setStatus('error');
            const errorMsg = error.response?.data?.error || error.message || 'Update failed';
            setError(errorMsg);
            addLog(`✗ Error: ${errorMsg}`, 'error');

            if (error.response?.data?.details) {
                addLog('Error Details:', 'error');
                addLog(error.response.data.details, 'error');
            }
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setStatus('idle');
        setLogs([]);
        setError(null);
        setUploadProgress(0);
    };

    return (
        <div className="space-y-4">
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <FolderSync className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Migration Based</p>
                            <p className="text-sm font-semibold text-gray-900">Auto Updates</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <Shield className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Auto Backup</p>
                            <p className="text-sm font-semibold text-gray-900">Safe Updates</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <Database className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Smart Rollback</p>
                            <p className="text-sm font-semibold text-gray-900">Fail-Safe</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                            <Zap className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Pre-flight Checks</p>
                            <p className="text-sm font-semibold text-gray-900">Validated</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Card */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Update Package</h3>
                
                {/* Dropzone */}
                <div
                    {...getRootProps()}
                    className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                        ${file ? 'bg-white' : 'bg-white'}
                    `}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-3">
                        {!file ? (
                            <>
                                <div className="bg-gray-100 p-4 rounded-full">
                                    <Upload className="w-8 h-8 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {isDragActive ? 'Drop the file here' : 'Drag & drop your update package'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        or click to browse (ZIP files only, max 50MB)
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-blue-100 p-4 rounded-full">
                                    <FileArchive className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-900">Update Failed</p>
                            <p className="text-xs text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                {uploading && (
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-900">
                                {status === 'validating' && 'Validating...'}
                                {status === 'uploading' && `Uploading... ${uploadProgress}%`}
                                {status === 'processing' && 'Processing update...'}
                            </span>
                            {status === 'processing' && (
                                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                            )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${status === 'processing' ? 100 : uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {status === 'success' && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-green-900">Update Completed</p>
                            <p className="text-xs text-green-700 mt-1">Your system has been updated successfully.</p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                    {file && !uploading && (
                        <>
                            <button
                                onClick={handleUpload}
                                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                Start Update
                            </button>
                            <button
                                onClick={() => setFile(null)}
                                className="bg-gray-300 text-gray-900 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Clear
                            </button>
                        </>
                    )}
                    {status === 'success' && (
                        <button
                            onClick={resetForm}
                            className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
                        >
                            Upload Another
                        </button>
                    )}
                </div>
            </div>

            {/* Logs Section */}
            {logs.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Update Logs</h3>
                    <div className="bg-black rounded p-3 h-64 overflow-y-auto font-mono text-xs space-y-1">
                        {logs.map((log, index) => (
                            <div 
                                key={index}
                                className={`
                                    ${log.type === 'success' ? 'text-green-400' : ''}
                                    ${log.type === 'error' ? 'text-red-400' : ''}
                                    ${log.type === 'info' ? 'text-blue-400' : ''}
                                    ${log.type === 'warning' ? 'text-yellow-400' : ''}
                                `}
                            >
                                <span className="text-gray-600">[{log.timestamp}]</span> {log.message}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            )}
        </div>
    );
}
