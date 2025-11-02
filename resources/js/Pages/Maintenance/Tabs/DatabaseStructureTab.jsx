import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Database,
    RefreshCw,
    Download,
    Play,
    Loader2,
    AlertCircle,
    CheckCircle2,
    BarChart3,
    ChevronDown,
    ChevronRight
} from "lucide-react";

export default function DatabaseStructureTab() {
    const [tables, setTables] = useState([]);
    const [migrations, setMigrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);
    const [activeAction, setActiveAction] = useState(null);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [expandedTables, setExpandedTables] = useState({});

    useEffect(() => {
        fetchDatabaseInfo();
    }, []);

    const toggleTableExpand = (tableName) => {
        setExpandedTables(prev => ({
            ...prev,
            [tableName]: !prev[tableName]
        }));
    };

    const fetchDatabaseInfo = async () => {
        setLoading(true);
        setError(null);
        try {
            const [tablesRes, migrationsRes] = await Promise.all([
                axios.get('/api/maintenance/database/tables').catch(err => {
                    console.error('Tables error:', err);
                    return { data: { tables: [] } };
                }),
                axios.get('/api/maintenance/database/migrations').catch(err => {
                    console.error('Migrations error:', err);
                    return { data: { migrations: [] } };
                })
            ]);

            setTables(tablesRes.data.tables || []);
            setMigrations(migrationsRes.data.migrations || []);

            if ((!tablesRes.data.tables || tablesRes.data.tables.length === 0) &&
                (!migrationsRes.data.migrations || migrationsRes.data.migrations.length === 0)) {
                setError('No database information available. Database might not be initialized yet.');
            }
        } catch (err) {
            setError('Failed to load database information. Please check database connection and try again.');
            console.error('Database info error:', err);
        } finally {
            setLoading(false);
        }
    };

    const runMigrations = async () => {
        setExecuting(true);
        setActiveAction('migrate');
        setMessage(null);
        setError(null);
        try {
            const response = await axios.post('/api/maintenance/database/migrate');
            setMessage(response.data.message || 'Migrations executed successfully');
            await fetchDatabaseInfo();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to run migrations';
            setError(`Migration Error: ${errorMsg}. Check your hosting provider's database access settings if this persists.`);
            console.error('Migration error:', err);
        } finally {
            setExecuting(false);
            setActiveAction(null);
        }
    };

    const runSeeders = async () => {
        setExecuting(true);
        setActiveAction('seed');
        setMessage(null);
        setError(null);
        try {
            const response = await axios.post('/api/maintenance/database/seed');
            setMessage(response.data.message || 'Seeders executed successfully');
            await fetchDatabaseInfo();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to run seeders';
            setError(`Seeder Error: ${errorMsg}. Ensure seeders are available in your database/seeders directory.`);
            console.error('Seeder error:', err);
        } finally {
            setExecuting(false);
            setActiveAction(null);
        }
    };

    const backupDatabase = async () => {
        setExecuting(true);
        setActiveAction('backup');
        setMessage(null);
        setError(null);
        try {
            const response = await axios.get('/api/maintenance/database/backup', {
                responseType: 'blob'
            });

            // Check if response is actually a file or error message
            if (response.data.type === 'application/json') {
                const reader = new FileReader();
                reader.onload = () => {
                    const errorData = JSON.parse(reader.result);
                    throw new Error(errorData.error || 'Failed to backup database');
                };
                reader.readAsText(response.data);
                return;
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `database-backup-${new Date().toISOString().split('T')[0]}.sql`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            setMessage('Database backup downloaded successfully');
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to backup database';
            setError(`Backup Error: ${errorMsg}. Ensure mysqldump is available on your hosting server.`);
            console.error('Backup error:', err);
        } finally {
            setExecuting(false);
            setActiveAction(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-blue-900">Database Management</p>
                    <p className="text-xs text-blue-700 mt-1">Manage your database tables, run migrations, seed data, and create backups. All operations require proper database permissions.</p>
                </div>
            </div>

            {/* Status Messages */}
            {message && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-green-900">Success</p>
                        <p className="text-xs text-green-700 mt-1">{message}</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-red-900">Error Loading Database</p>
                                <p className="text-xs text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchDatabaseInfo}
                            disabled={loading}
                            className="text-red-700 hover:text-red-900 font-semibold text-xs whitespace-nowrap"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <button
                    onClick={runMigrations}
                    disabled={executing || loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    {activeAction === 'migrate' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {activeAction !== 'migrate' && <Play className="w-4 h-4" />}
                    Run Migrations
                </button>

                <button
                    onClick={runSeeders}
                    disabled={executing || loading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    {activeAction === 'seed' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {activeAction !== 'seed' && <Play className="w-4 h-4" />}
                    Run Seeders
                </button>

                <button
                    onClick={backupDatabase}
                    disabled={executing || loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    {activeAction === 'backup' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {activeAction !== 'backup' && <Download className="w-4 h-4" />}
                    Backup Database
                </button>

                <button
                    onClick={fetchDatabaseInfo}
                    disabled={loading || executing}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="ml-3 text-gray-600">Loading database information...</span>
                </div>
            ) : (
                <>
                    {/* Tables Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Database className="w-5 h-5 text-purple-600" />
                            Database Tables ({tables.length})
                        </h3>
                        {tables.length === 0 ? (
                            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <Database className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No tables found in database</p>
                                <p className="text-xs text-gray-400 mt-1">Run migrations to create tables</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tables.map((table, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                                        {/* Table Header - Clickable to expand */}
                                        <button
                                            onClick={() => toggleTableExpand(table.name)}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {expandedTables[table.name] ? (
                                                    <ChevronDown className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 truncate">{table.name}</h4>
                                                    <p className="text-xs text-gray-500">
                                                        {table.columns} columns • {table.engine}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0 sm:ml-4">
                                                <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                                                    <BarChart3 className="w-3 h-3" />
                                                    {table.rows} rows
                                                </div>
                                            </div>
                                        </button>

                                        {/* Expanded Content - Columns */}
                                        {expandedTables[table.name] && (
                                            <div className="border-t border-gray-200 bg-gray-50 p-4">
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                                        Collation: {table.collation}
                                                    </p>
                                                </div>

                                                <div className="mb-2">
                                                    <p className="text-xs font-semibold text-gray-700 mb-2">Columns ({table.columnDetails?.length || 0})</p>
                                                </div>

                                                {table.columnDetails && table.columnDetails.length > 0 ? (
                                                    <>
                                                        {/* Desktop Table View */}
                                                        <div className="hidden md:block overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="border-b border-gray-200 bg-white">
                                                                        <th className="px-2 py-2 text-left text-gray-700 font-semibold">Column</th>
                                                                        <th className="px-2 py-2 text-left text-gray-700 font-semibold">Type</th>
                                                                        <th className="px-2 py-2 text-left text-gray-700 font-semibold">Null</th>
                                                                        <th className="px-2 py-2 text-left text-gray-700 font-semibold">Key</th>
                                                                        <th className="px-2 py-2 text-left text-gray-700 font-semibold">Default</th>
                                                                        <th className="px-2 py-2 text-left text-gray-700 font-semibold">Extra</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {table.columnDetails.map((col, colIndex) => (
                                                                        <tr key={colIndex} className="border-b border-gray-100 hover:bg-white">
                                                                            <td className="px-2 py-2 text-gray-900 font-mono">{col.name}</td>
                                                                            <td className="px-2 py-2 text-gray-600 font-mono text-xs">{col.type}</td>
                                                                            <td className="px-2 py-2">
                                                                                {col.null ? (
                                                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">YES</span>
                                                                                ) : (
                                                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">NO</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-2 py-2 text-gray-600">{col.key || '-'}</td>
                                                                            <td className="px-2 py-2 text-gray-600 font-mono text-xs">{col.default !== null ? col.default : '-'}</td>
                                                                            <td className="px-2 py-2 text-gray-600 text-xs">{col.extra || '-'}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {/* Mobile Card View */}
                                                        <div className="md:hidden space-y-2">
                                                            {table.columnDetails.map((col, colIndex) => (
                                                                <div key={colIndex} className="bg-white border border-gray-200 rounded-lg p-3 text-xs">
                                                                    <div className="mb-2">
                                                                        <p className="font-semibold text-gray-900 break-words">{col.name}</p>
                                                                        <p className="text-gray-600 font-mono text-xs mt-1">{col.type}</p>
                                                                    </div>
                                                                    <div className="space-y-1 border-t border-gray-200 pt-2">
                                                                        <div className="flex justify-between items-center gap-2">
                                                                            <span className="text-gray-600 font-semibold">Null:</span>
                                                                            {col.null ? (
                                                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">YES</span>
                                                                            ) : (
                                                                                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">NO</span>
                                                                            )}
                                                                        </div>
                                                                        {col.key && (
                                                                            <div className="flex justify-between items-center gap-2">
                                                                                <span className="text-gray-600 font-semibold">Key:</span>
                                                                                <span className="text-gray-700">{col.key}</span>
                                                                            </div>
                                                                        )}
                                                                        {col.default !== null && (
                                                                            <div className="flex justify-between items-center gap-2">
                                                                                <span className="text-gray-600 font-semibold">Default:</span>
                                                                                <span className="text-gray-700 font-mono text-xs">{col.default}</span>
                                                                            </div>
                                                                        )}
                                                                        {col.extra && (
                                                                            <div className="flex justify-between items-center gap-2">
                                                                                <span className="text-gray-600 font-semibold">Extra:</span>
                                                                                <span className="text-gray-700 text-xs">{col.extra}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-gray-500 text-xs">No column details available</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Migrations Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-blue-600" />
                            Migrations
                        </h3>

                        {migrations.length === 0 ? (
                            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <RefreshCw className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No migrations found</p>
                                <p className="text-xs text-gray-400 mt-1">Click "Run Migrations" to initialize the database</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-blue-600">{migrations.length}</p>
                                        <p className="text-xs text-blue-700 font-semibold">Total</p>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-green-600">{migrations.filter(m => m.status === 'executed').length}</p>
                                        <p className="text-xs text-green-700 font-semibold">Executed</p>
                                    </div>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-yellow-600">{migrations.filter(m => m.status === 'pending').length}</p>
                                        <p className="text-xs text-yellow-700 font-semibold">Pending</p>
                                    </div>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-red-600">{migrations.filter(m => !m.inFileSystem).length}</p>
                                        <p className="text-xs text-red-700 font-semibold">Missing Files</p>
                                    </div>
                                </div>

                                {/* Desktop Migrations Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50">
                                                <th className="px-4 py-2 text-left text-gray-700 font-semibold">Migration Name</th>
                                                <th className="px-4 py-2 text-center text-gray-700 font-semibold">Status</th>
                                                <th className="px-4 py-2 text-center text-gray-700 font-semibold">Batch</th>
                                                <th className="px-4 py-2 text-center text-gray-700 font-semibold">File</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {migrations.map((migration, index) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-gray-900 font-mono text-xs break-all">{migration.name}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {migration.status === 'executed' ? (
                                                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                                                                ✓ Executed
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">
                                                                ◐ Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {migration.batch ? (
                                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                                                                #{migration.batch}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {migration.inFileSystem ? (
                                                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                                                                ✓ Present
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                                                                ✗ Missing
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Migrations Card View */}
                                <div className="md:hidden space-y-2">
                                    {migrations.map((migration, index) => (
                                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                                            <div className="mb-2">
                                                <p className="font-semibold text-gray-900 text-xs break-all">{migration.name}</p>
                                            </div>
                                            <div className="space-y-2 border-t border-gray-200 pt-2 text-xs">
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="text-gray-600 font-semibold">Status:</span>
                                                    {migration.status === 'executed' ? (
                                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">
                                                            ✓ Executed
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-semibold">
                                                            ◐ Pending
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="text-gray-600 font-semibold">Batch:</span>
                                                    {migration.batch ? (
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                                                            #{migration.batch}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="text-gray-600 font-semibold">File:</span>
                                                    {migration.inFileSystem ? (
                                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">
                                                            ✓ Present
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">
                                                            ✗ Missing
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Legend */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-600 mb-2 font-semibold">Legend:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                                        <p><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>Executed: Already run in database</p>
                                        <p><span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>Pending: Waiting to be executed</p>
                                        <p><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>Missing: File not found in database/migrations</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
