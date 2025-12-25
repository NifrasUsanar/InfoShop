import React, { useContext } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import { Typography, Box,  Grid, IconButton } from "@mui/material";
import { usePage } from "@inertiajs/react";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSales as useCart } from "@/Context/SalesContext";
import { SharedContext } from "@/Context/SharedContext";
import productplaceholder from "@/Pages/Product/product-placeholder.webp";
import Swal from "sweetalert2";

export default function SaleTemplateItem({ templates, setTemplates }) {
    const { addToCart, cartState, emptyCart } = useCart();
    const { setCartItemModalOpen, setSelectedCartItem } = useContext(SharedContext);

    const fillCart = (template) => {

        Swal.fire({
            title: 'Group item confirmation',
            text: "This will replace the items in your cart with the items in the selected group. Are you sure you want to do this?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, replace it!',
            cancelButtonText: 'No, keep current items'
        }).then((result) => {
            if (result.isConfirmed) {
                // emptyCart();
                if (template) {
                    template.cart_items.forEach(item => {
                        addToCart(item, item.quantity);
                    });
                }
            }
        });
    }

    const deleteTemplate = (template) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`/sale-templates/${template.id}`)
                    .then(response => {
                        if (response.data.success) {
                            Swal.fire(
                                'Deleted!',
                                response.data.message,
                                'success'
                            )
                            setTemplates(templates.filter(t => t.id !== template.id));
                        } else {
                            Swal.fire(
                                'Error!',
                                response.data.message,
                                'error'
                            )
                        }
                    })
                    .catch(error => {
                        Swal.fire(
                            'Error!',
                            error.message,
                            'error'
                        )
                    })
            }
        })

    }
    return (

        <>
            {templates.map((template) => (
                <Grid
                    key={template.id}
                    size={{ xs: 6, sm: 6, md: 2 }}
                    sx={{ cursor: "pointer", }}
                >
                    <Card
                        onClick={() => { fillCart(template) }}
                        sx={{ height: '100%', position: 'relative' }}
                    >
                        <IconButton
                            aria-label="delete"
                            size="large"
                            color="error"
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                zIndex: 1,
                                color: 'white',
                                backgroundColor: '#E43636',
                                '&:hover': {
                                    backgroundColor: '#E43647',
                                },
                            }}
                            onClick={() => { deleteTemplate(template) }}
                        >
                            <DeleteIcon />
                        </IconButton>

                        <CardMedia
                            sx={{ height: 120 }}
                            image={productplaceholder}
                        />
                        <CardContent sx={{ paddingBottom: "10px!important", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                            <Typography
                                variant="p"
                                component="div"
                                className="text-center"
                                sx={{ lineHeight: "1.2rem" }}
                            >
                                {template.name}
                                {/* - ({quantity}) */}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))

            }
        </>
    );
}
