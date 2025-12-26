import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useFirebase } from '../contexts/FirebaseContext';
import PrintReceiptModal from '@/Components/PrintReceiptModal';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function UnsyncedSalesDialog({ open, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { getUnsyncedSales } = useFirebase();
  
  const [sales, setSales] = useState([]);
  const [displayedSales, setDisplayedSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const ITEMS_PER_PAGE = 10;

  // Fetch unsynced sales when dialog opens
  useEffect(() => {
    if (open) {
      fetchSales();
    }
  }, [open]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const unsyncedSales = await getUnsyncedSales();
      setSales(unsyncedSales);
      
      // Load first 10 items
      setDisplayedSales(unsyncedSales.slice(0, ITEMS_PER_PAGE));
      setHasMore(unsyncedSales.length > ITEMS_PER_PAGE);
    } catch (error) {
      console.error('[UnsyncedSalesDialog] Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreSales = () => {
    const currentLength = displayedSales.length;
    const nextBatch = sales.slice(currentLength, currentLength + ITEMS_PER_PAGE);
    
    setDisplayedSales([...displayedSales, ...nextBatch]);
    setHasMore(currentLength + nextBatch.length < sales.length);
  };

  const handlePrintReceipt = (sale) => {
    setSelectedSale(sale);
    setShowPrintModal(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: isMobile ? '100vh' : '80vh',
            pb: 0, // Remove bottom padding to eliminate empty footer
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon />
              <Typography variant="h6">Unsynced Sales</Typography>
              <Chip
                label={`${sales.length} pending`}
                size="small"
                color="warning"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={fetchSales}
                disabled={loading}
                size="small"
                title="Refresh"
              >
                <RefreshIcon />
              </IconButton>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 2 }}>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                gap: 2,
              }}
            >
              <CircularProgress />
              <Typography variant="body2" color="text.secondary">
                Loading unsynced sales...
              </Typography>
            </Box>
          ) : sales.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                gap: 2,
              }}
            >
              <ReceiptIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
              <Typography variant="h6" color="text.secondary">
                All sales synced! ✅
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No pending sales to sync to the server
              </Typography>
            </Box>
          ) : (
            <InfiniteScroll
              dataLength={displayedSales.length}
              next={loadMoreSales}
              hasMore={hasMore}
              loader={
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              }
              endMessage={
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center', py: 2 }}
                >
                  No more sales
                </Typography>
              }
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {displayedSales.map((sale) => (
                  <Card
                    key={sale.id}
                    variant="outlined"
                    sx={{
                      '&:hover': {
                        boxShadow: 1,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      {/* Header Row */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 1,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {sale.invoice_number || sale.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {formatDate(sale.createdAt || sale.sale_date)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label="Pending Sync"
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 500, fontSize: '0.7rem', height: '22px' }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handlePrintReceipt(sale)}
                            sx={{ ml: 0.5 }}
                            title="Print Receipt"
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 0.75 }} />

                      {/* Sale Details - Compact Single Row */}
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 2,
                          flexWrap: 'wrap',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {sale.contact_id ? `Customer #${sale.contact_id}` : 'Walk-in'} • {sale.payment_method || 'Cash'} • {sale.items?.length || 0} item(s)
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.875rem', ml: 'auto' }}
                        >
                          {formatCurrency(sale.net_total || sale.total_amount || 0)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </InfiniteScroll>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Receipt Modal */}
      <PrintReceiptModal
        open={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setSelectedSale(null);
        }}
        receiptData={selectedSale}
      />
    </>
  );
}
