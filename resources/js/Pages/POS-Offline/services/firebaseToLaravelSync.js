import axios from 'axios';
import { FirebaseSalesService } from './firebaseSalesService';

/**
 * Firebase to Laravel Sync Service
 * Syncs unsynced sales from Firebase to Laravel backend
 */
export class FirebaseToLaravelSync {
  /**
   * Sync all unsynced sales from Firebase to Laravel
   * @returns {Promise<Object>} - Sync result summary
   */
  static async syncUnsyncedSales() {
    try {
      console.log('[FirebaseSync] Starting Firebase → Laravel sync...');
      
      // Step 1: Get all unsynced sales from Firebase
      const unsyncedSales = await FirebaseSalesService.getUnsyncedSales();
      
      if (unsyncedSales.length === 0) {
        console.log('[FirebaseSync] No unsynced sales found');
        return {
          status: 'success',
          message: 'No sales to sync',
          synced: 0,
          failed: 0,
          errors: [],
        };
      }

      console.log(`[FirebaseSync] Found ${unsyncedSales.length} unsynced sales`);

      // Step 2: Transform Firebase sales to Laravel format
      const transformedSales = unsyncedSales.map((sale) => this.transformSaleForLaravel(sale));

      // Step 3: POST to Laravel sync endpoint
      const storeId = 1; // TODO: Get from config/settings
      const response = await axios.post('/api/sync?table=sales', {
        store_id: storeId,
        sales: transformedSales,
      });

      const { synced, errors } = response.data;

      // Step 4: Mark successfully synced sales in Firebase
      if (synced > 0) {
        const successfulInvoiceNumbers = transformedSales
          .map((sale) => sale.invoice_number)
          .filter((invoiceNumber) => {
            // Exclude sales that had errors
            return !errors.some((error) => error.invoice_number === invoiceNumber);
          });

        if (successfulInvoiceNumbers.length > 0) {
          await FirebaseSalesService.batchMarkAsSynced(successfulInvoiceNumbers);
          console.log(`[FirebaseSync] Marked ${successfulInvoiceNumbers.length} sales as synced in Firebase`);
        }
      }

      console.log(`[FirebaseSync] Sync completed: ${synced} synced, ${errors.length} failed`);

      return {
        status: errors.length === 0 ? 'success' : 'partial',
        message: `Synced ${synced} of ${unsyncedSales.length} sales`,
        synced,
        failed: errors.length,
        errors,
      };
    } catch (error) {
      console.error('[FirebaseSync] Sync error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to sync sales',
        synced: 0,
        failed: 0,
        errors: [{ error: error.message }],
      };
    }
  }

  /**
   * Transform Firebase sale data to Laravel sync format
   * @param {Object} sale - Firebase sale object
   * @returns {Object} - Transformed sale for Laravel
   */
  static transformSaleForLaravel(sale) {
    // Map Firebase Timestamp to milliseconds
    const saleDate = sale.sale_date
      ? (sale.sale_date.toMillis ? sale.sale_date.toMillis() : sale.sale_date)
      : Date.now();

    // Transform items to match Laravel format
    const items = (sale.items || []).map((item) => ({
      id: item.id || item.product_id,
      product_id: item.id || item.product_id,
      batch_id: item.batch_id,
      quantity: item.quantity,
      price: item.price || item.unit_price,
      cost: item.cost || item.unit_cost,
      discount: item.discount || 0,
      flat_discount: item.flat_discount || 0,
      is_stock_managed: item.is_stock_managed ?? 1,
      is_free: item.is_free || 0,
      free_quantity: item.free_quantity || 0,
      category_name: item.category_name,
      product_type: item.product_type || 'normal',
    }));

    // Transform charges
    const charges = (sale.charges || []).map((charge) => ({
      id: charge.id,
      name: charge.name,
      charge_type: charge.charge_type,
      rate_value: charge.rate_value,
      rate_type: charge.rate_type,
    }));

    // Build transactions array for payments
    const transactions = [
      {
        payment_method: sale.payment_method || 'Cash',
        amount: sale.amount_received || sale.net_total || 0,
      },
    ];

    return {
      invoice_number: sale.invoice_number,
      contact_id: sale.contact_id || null,
      sale_date: saleDate,
      total_amount: sale.net_total || 0,
      discount: sale.discount || 0,
      amount_received: sale.amount_received || 0,
      profit_amount: sale.profit_amount || 0,
      note: sale.note || '',
      sale_type: sale.return_sale ? 'return' : 'normal',
      reference_id: sale.return_sale_id || null,
      items: items,
      charges: charges,
      transactions: transactions,
      created_by: sale.created_by || 'pos-offline',
    };
  }

  /**
   * Sync a single sale from Firebase to Laravel
   * @param {string} invoiceNumber - Invoice number to sync
   * @returns {Promise<Object>} - Sync result
   */
  static async syncSingleSale(invoiceNumber) {
    try {
      console.log(`[FirebaseSync] Syncing single sale: ${invoiceNumber}`);
      
      const sale = await FirebaseSalesService.getSaleByInvoiceNumber(invoiceNumber);
      
      if (!sale) {
        return {
          status: 'error',
          message: `Sale ${invoiceNumber} not found in Firebase`,
        };
      }

      if (sale.synced) {
        return {
          status: 'success',
          message: `Sale ${invoiceNumber} already synced`,
        };
      }

      const transformedSale = this.transformSaleForLaravel(sale);
      const storeId = 1; // TODO: Get from config/settings

      const response = await axios.post('/api/sync?table=sales', {
        store_id: storeId,
        sales: [transformedSale],
      });

      const { synced, errors } = response.data;

      if (synced > 0 && errors.length === 0) {
        await FirebaseSalesService.markSaleAsSynced(invoiceNumber);
        console.log(`[FirebaseSync] Sale ${invoiceNumber} synced successfully`);
        
        return {
          status: 'success',
          message: `Sale ${invoiceNumber} synced successfully`,
        };
      } else {
        return {
          status: 'error',
          message: errors[0]?.error || 'Failed to sync sale',
        };
      }
    } catch (error) {
      console.error(`[FirebaseSync] Error syncing sale ${invoiceNumber}:`, error);
      return {
        status: 'error',
        message: error.message || 'Failed to sync sale',
      };
    }
  }

  /**
   * Get sync status summary
   * @returns {Promise<Object>} - Sync status
   */
  static async getSyncStatus() {
    try {
      const [totalSales, unsyncedSales] = await Promise.all([
        FirebaseSalesService.getSalesCount(),
        FirebaseSalesService.getUnsyncedSalesCount(),
      ]);

      return {
        totalSales,
        unsyncedSales,
        syncedSales: totalSales - unsyncedSales,
        needsSync: unsyncedSales > 0,
      };
    } catch (error) {
      console.error('[FirebaseSync] Error getting sync status:', error);
      return {
        totalSales: 0,
        unsyncedSales: 0,
        syncedSales: 0,
        needsSync: false,
        error: error.message,
      };
    }
  }
}

export default FirebaseToLaravelSync;
