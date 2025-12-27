<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\QuantityController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReloadController;
use App\Http\Controllers\UpgradeController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\SalaryRecordController;
use App\Http\Controllers\EmployeeBalanceController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\ChequeController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SaleTemplateController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\DevDatabaseController;
use App\Http\Controllers\ChargeController;
use App\Http\Controllers\SyncController;
use App\Helpers\PwaHelper;

// Installer routes (must be before auth routes)
require __DIR__ . '/installer.php';

Route::get('/', function () {
    return redirect('login');
})->middleware('check.installed');

Route::get('/editor', function () {
    return Inertia::render('BlockEditor/Editor');
});

// PWA Routes (for standalone pos-offline app)
Route::get('/manifest.json', function () {
    return response()->json(PwaHelper::getManifestData())
        ->header('Content-Type', 'application/manifest+json');
})->name('pwa.manifest');

Route::get('/offline', function () {
    return view('offline');
})->name('pwa.offline');

Route::get('/receipt/{id}', [SaleController::class, 'receipt'])->name('sales.receipt');
Route::get('/api/receipt-text-raw/{id}', [SaleController::class, 'apiReceipt']);
Route::get('/pending-sales-receipt/{contact_id}', [SaleController::class, 'pendingSalesReceipt']);

Route::get('/version', [UpgradeController::class, 'checkVersion']);
Route::post('/api/application-update', [UpgradeController::class, 'applicationUpdate']);

// V2 Update routes (migration-based)
Route::post('/api/application-update-v2', [UpgradeController::class, 'applicationUpdateV2']);

// Automated Backup Endpoint for external schedulers
// http://localhost:8000/automation/backup/run?token=[xxxxxxxxxxxxxxxxxxxx] | token is defined in .env as INFOSHOP_TOKEN
Route::match(['get', 'post'], '/automation/backup/run', [BackupController::class, 'automation'])
    ->middleware('throttle:5,1')
    ->name('automation.backup');

// Unified Sync API endpoints for offline-first InfoPOS app are now defined in routes/api.php

// Mobile Sales API - For hybrid loading (Firebase + Laravel)
Route::post('/api/sales/exclude', [SaleController::class, 'getSalesExcluding'])->name('sales.exclude');

// Store config endpoint
// Route::get('/api/stores/{storeId}', [SyncController::class, 'getStoreConfig']);

Route::middleware(['auth'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/dashboard/summary', [DashboardController::class, 'getDashboardSummary'])->name('dashboard.summary');
    Route::post('/dashboard/sold-items-summary', [DashboardController::class, 'getSoldItemsSummary']);

    Route::get('/stores', [StoreController::class, 'index'])->name('store');
    Route::post('/store', [StoreController::class, 'store']);
    Route::post('/store/{id}', [StoreController::class, 'update']);
    Route::post('/change-store', [StoreController::class, 'changeSelectedStore'])->name('change.store');

    Route::get('/collections', [CollectionController::class, 'index'])->name('collection');
    Route::post('/collection', [CollectionController::class, 'store']);
    Route::post('/collection/{id}', [CollectionController::class, 'update']);
    Route::delete('/collections/{id}', [CollectionController::class, 'destroy']);
    Route::post('/collections/quick-create', [CollectionController::class, 'quickCreate'])->name('collections.quick-create');

    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::get('/products/create', [ProductController::class, 'create'])->name('products.create');
    Route::get('/products/{id}/edit', [ProductController::class, 'find'])->name('products.find');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::post('/products/{id}', [ProductController::class, 'update'])->name('products.update');
    Route::get('/products/search', [ProductController::class, 'searchProduct'])->name('products.search');
    Route::post('/storebatch', [ProductController::class, 'storeNewBatch'])->name('products.newbatch');
    Route::post('/checkBatch', [ProductController::class, 'checkBatch'])->name('products.checkbatch');
    Route::post('/productbatch/{id}', [ProductController::class, 'updateBatch'])->name('products.updatebatch');
    Route::post('/productbatch/{batch_id}/toggle-featured', [ProductController::class, 'toggleFeatured'])->name('products.toggle-featured');
    Route::delete('/productbatch/{batch_id}', [ProductController::class, 'deleteBatch'])->name('products.delete-batch');
    Route::get('/getproducts/{store_id}', [ProductController::class, 'getProductsResponse'])->name('products.getproducts');
    Route::get('/product/{batch_id}/barcode', [ProductController::class, 'getBarcode'])->name('products.barcode');
    Route::get('/product/{batch_id}/barcode-v2', [ProductController::class, 'barcodeV2'])->name('products.barcode-v2');
    Route::get('/api/products/{product_id}/batches', [ProductController::class, 'getBatches'])->name('products.getBatches');

    Route::get('/pos', [POSController::class, 'index'])->name('pos.index');
    // Standalone POS-Offline (React SPA)
    Route::get('/pos-offline', function () {
        return view('pos-offline');
    })->name('pos.offline.standalone');
    // Old Inertia POS-Offline (keep for reference, can be removed later)
    Route::get('/pos-offline-inertia', [POSController::class, 'offlineIndex'])->name('pos.offline.inertia');
    Route::get('/pos/{sale_id}/return', [POSController::class, 'returnIndex'])->name('pos.return');
    Route::post('/pos/checkout', [POSController::class, 'checkout'])->name('pos.checkout');
    Route::get('/pos/customer-display', [POSController::class, 'customerDisplay']);
    Route::post('/pos/filter', [POSController::class, 'getProductsByFilter']);
    Route::get('/pos/{id}/edit', [POSController::class, 'editSale'])->name('pos.edit');

    Route::get('/customers', [ContactController::class, 'index'])->defaults('type', 'customer')->name('customers.index');
    Route::get('/vendors', [ContactController::class, 'index'])->defaults('type', 'vendor')->name('vendors.index');
    Route::post('/contact', [ContactController::class, 'store'])->name('contacts.store');
    Route::post('/contact/{id}', [ContactController::class, 'update'])->name('contacts.update');

    Route::get('/sales', [SaleController::class, 'index'])->name('sales.index');
    Route::get('/sold-items', [SaleController::class, 'solditems'])->name('sales.items');
    Route::get('/sold-items-summary', [SaleController::class, 'soldItemSummary'])->name('sales.items.summary');
    Route::delete('/sales/{id}', [SaleController::class, 'destroy'])->name('sales.destroy');
    Route::get('/sale-notification/{id}', [SaleController::class, 'sendNotification']);

    Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchases.index');
    Route::get('/purchase/create', [PurchaseController::class, 'create'])->name('purchases.create');
    Route::post('/purchase/store', [PurchaseController::class, 'store'])->name('purchases.store');

    Route::post('/quantity/store', [QuantityController::class, 'store'])->name('quantity.store');
    Route::get('/quantity/{stock_id}/log', [QuantityController::class, 'getAdjustmentsLog']);

    Route::post('/customer-transaction', [TransactionController::class, 'storeCustomerTransaction']);
    Route::post('/vendor-transaction', [TransactionController::class, 'storeVendorTransaction']);
    Route::get('/payments/{type}', [TransactionController::class, 'viewPayments']); //It will be purchases or sales

    Route::post('/getpayments/{type}', [TransactionController::class, 'findPayments']); //It will be purchases or sales
    Route::post('/delete-payment/{type}', [TransactionController::class, 'deletePayment']); //It will be purchases or sales
    Route::post('/getorderdetails/{type}', [ReportController::class, 'viewOrderDetails']); //It will be purchases or sales

    Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
    Route::post('/settings-update', [SettingController::class, 'update'])->name('settings.update');
    Route::get('/settings/quote-template', [SettingController::class, 'quoteTemplate']);
    Route::get('/settings/receipt-template', [SettingController::class, 'receiptTemplate']);
    Route::get('/settings/barcode-template', [SettingController::class, 'barcodeTemplate']);
    Route::post('/settings/save-template', [SettingController::class, 'updateTemplate']);
    Route::get('/settings/custom-css', [SettingController::class, 'customCSS']);
    Route::post('/settings/custom-css', [SettingController::class, 'updateCustomCSS']);
    Route::post('/settings/module/{action}', [SettingController::class, 'updateModule']);
    Route::post('/settings/get-template', [SettingController::class, 'getTemplate'])->name('settings.gettemplate');
    Route::post('/settings/save-template', [SettingController::class, 'saveTemplate'])->name('settings.savetemplate');

    Route::get('/api/barcode-template', [SettingController::class, 'getBarcodeTemplate'])->name('barcode.template.get');
    Route::post('/api/barcode-template', [SettingController::class, 'saveBarcodeTemplate'])->name('barcode.template.save');
    Route::post('/api/barcode-template/preview', [SettingController::class, 'renderBarcodeTemplatePreview'])->name('barcode.template.preview');

    Route::get('/charges', [ChargeController::class, 'index'])->name('charges.index');
    Route::post('/charges', [ChargeController::class, 'store'])->name('charges.store');
    Route::put('/charges/{charge}', [ChargeController::class, 'update'])->name('charges.update');
    Route::delete('/charges/{charge}', [ChargeController::class, 'destroy'])->name('charges.destroy');
    Route::get('/api/charges/active', [ChargeController::class, 'getActive'])->name('charges.active');
    Route::get('/api/charges/default', [ChargeController::class, 'getDefault'])->name('charges.default');

    Route::get('/expenses', [ExpenseController::class, 'index'])->name('expenses.index');
    Route::post('/expense', [ExpenseController::class, 'store'])->name('expenses.store');
    Route::post('/expense/{id}/delete', [ExpenseController::class, 'delete'])->name('expenses.delete');

    Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::post('/employee', [EmployeeController::class, 'store'])->name('employees.store');
    Route::post('/employee/{id}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::post('/employee/{id}/delete', [EmployeeController::class, 'delete'])->name('employees.delete');

    Route::get('/payroll', [SalaryRecordController::class, 'index']);
    Route::post('/salary-records', [SalaryRecordController::class, 'store']);
    Route::post('/salary/{id}/delete', [SalaryRecordController::class, 'delete']);

    Route::post('/employee-balance', [EmployeeBalanceController::class, 'store']);
    Route::get('/employee-balance-log', [EmployeeBalanceController::class, 'balanceLog']);

    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/user', [UserController::class, 'store'])->name('user.store');
    Route::get('/user/role', [UserController::class, 'userRole'])->name('user.role');
    Route::post('/user/role', [UserController::class, 'storeRole'])->name('user.storeRole');
    Route::post('/user/{roleId}/role', [UserController::class, 'updateRole'])->name('user.updateRole');
    Route::post('/user/{id}', [UserController::class, 'update'])->name('user.update');
    Route::post('/users/{id}/deactivate', [UserController::class, 'userDeactivate'])->name('user.deactivate');

    // Route::get('reports/daily',[ReportController::class, 'getDailyReport'])->name('reports.daily');
    Route::get('reports/dailycash', [ReportController::class, 'getDailyCashReport'])->name('reports.dailycash');
    Route::post('reports/dailycash', [ReportController::class, 'storeDailyCashReport'])->name('reports.store.dailycash');
    Route::get('reports/sales', [ReportController::class, 'getSalesReport'])->name('reports.sales');
    Route::get('reports/{customer}/customer-pending', [ReportController::class, 'getCustomerPendingReport']);
    Route::get('reports/{vendor}/vendor-pending', [ReportController::class, 'getVendorPendingReport']);
    Route::get('reports/{id}/customer', [ReportController::class, 'getCustomerReport'])->name('reports.customer');
    Route::get('reports/{id}/vendor', [ReportController::class, 'getVendorReport'])->name('reports.vendor');
    Route::get('reports/summary-report', [ReportController::class, 'getSummaryReport'])->name('reports.summary');

    Route::get('/reloads', [ReloadController::class, 'index']);
    Route::post('/reloads/{id}/update', [ReloadController::class, 'update']);

    Route::get('/link-storage', function () {
        Artisan::call('storage:link');
        return 'Linked with storage';
    });

    // Maintenance Routes
    Route::get('/maintenance', [UpgradeController::class, 'showMaintenance'])->name('maintenance.index');
    Route::post('/upload-v2', [UpgradeController::class, 'handleUploadV2'])->name('maintenance.upload');
Route::get('/update', [UpgradeController::class, 'showUploadForm'])->name('upload.form');
    Route::post('/upload', [UpgradeController::class, 'handleUpload'])->name('upload.handle');
    
    // Database Management Routes
    Route::get('/api/maintenance/database/tables', [UpgradeController::class, 'getDatabaseTables']);
    Route::get('/api/maintenance/database/migrations', [UpgradeController::class, 'getMigrationStatus']);
    Route::post('/api/maintenance/database/migrate', [UpgradeController::class, 'runMigrations']);
    Route::post('/api/maintenance/database/seed', [UpgradeController::class, 'runSeeders']);
    Route::get('/api/maintenance/database/backup', [UpgradeController::class, 'backupDatabase']);

    Route::get('/media', [MediaController::class, 'index']);
    Route::get('/migrate-images', [MediaController::class, 'migrateImages']);
    Route::post('/optimize-image', [MediaController::class, 'optimizeImages']);

    Route::get('/cheques', [ChequeController::class, 'index'])->name('cheques.index');
    Route::post('/cheques/store', [ChequeController::class, 'store'])->name('cheques.store');
    Route::post('/cheques/{cheque}/update', [ChequeController::class, 'update'])->name('cheques.update');
    Route::post('/cheques/{cheque}/destroy', [ChequeController::class, 'destroy'])->name('cheques.destroy');

    Route::post('/quotations', [QuotationController::class, 'store'])->name('quotations.store');
    Route::get('/quotations', [QuotationController::class, 'index'])->name('quotations.index');
    Route::post('/quotations/{quotation}', [QuotationController::class, 'destroy'])->name('quotations.destroy');
    Route::get('/quotations/{quotation}', [QuotationController::class, 'show'])->name('quotations.show');

    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('/inventory-items', [InventoryController::class, 'store'])->name('inventory.store');
    Route::post('/inventory-items/{id}', [InventoryController::class, 'update'])->name('inventory.update');
    Route::delete('/inventory-items/{id}', [InventoryController::class, 'destroy'])->name('inventory.destroy');
    Route::post('/inventory-single-transaction', [InventoryController::class, 'inventorySingleTransactionStore']);
    Route::get('/inventory-purchase', [InventoryController::class, 'inventoryPurchase']);
    Route::post('/inventory-purchase', [InventoryController::class, 'inventoryPurchaseStore']);
    Route::get('/inventory-logs', [InventoryController::class, 'inventoryLogs']);

    Route::resource('sale-templates', SaleTemplateController::class);

    Route::get('/clear-cache', function () {
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');
        Artisan::call('event:clear');
        Artisan::call('optimize:clear');

        return 'All caches cleared and configurations updated!';
    });

    Route::get('/check-update', function () {
        return 'Update';
    });

    Route::get('/api/backups', [BackupController::class, 'listBackups'])->name('backups.list');
    Route::delete('/api/backups/{file}', [BackupController::class, 'deleteBackup'])
        ->where('file', '[A-Za-z0-9._-]+')
        ->name('backups.delete');
    Route::get('/download-backup/{file}', [BackupController::class, 'download'])->name('backups.download');
    Route::get('/backup-now', [BackupController::class, 'downloadBackupZip'])->name('backups.download-now');

    Route::post('/test-mail', function (Request $request) {
        Mail::raw('Test email', function ($message) use ($request) {
            $message->to($request->input('test_mail'))->subject('Mail received');
        });
        return 'Mail sent';
    });
});

require __DIR__ . '/auth.php';
