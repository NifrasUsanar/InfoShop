import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Folder } from 'lucide-react';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';

export default function CollectionItem({ collection, onClick, hasChildren = false }) {

    const getIcon = (type) => {
        switch (type) {
            case 'category': return <CategoryIcon fontSize="large" color="primary" />;
            case 'brand': return <BrandingWatermarkIcon fontSize="large" color="secondary" />;
            case 'tag': return <LocalOfferIcon fontSize="large" color="action" />;
            default: return <Folder size={32} color="currentColor" />;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'category': return 'primary.light';
            case 'brand': return 'secondary.light';
            case 'tag': return 'grey.200';
            default: return 'grey.100';
        }
    };

    return (
        <Card
            sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                },
                backgroundColor: 'background.paper',
                position: 'relative'
            }}
            onClick={() => onClick(collection)}
        >
            {/* Parent Category Indicator */}
            {hasChildren && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}
                >
                    <Folder size={18} />
                </Box>
            )}
            <CardContent sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 2
            }}>
                <Box sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: '50%',
                    backgroundColor: getColor(collection.collection_type),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {getIcon(collection.collection_type)}
                </Box>

                <Typography variant="body1" component="div" align="center" noWrap sx={{ width: '100%', fontWeight: 'bold' }}>
                    {collection.name}
                </Typography>

                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {collection.collection_type}
                </Typography>
            </CardContent>
        </Card>
    );
}
