import React, { useState, useContext, useRef, useEffect, useCallback } from "react";
import {
    Box,
    Divider,
    IconButton,
    TextField,
    Autocomplete,
} from "@mui/material";
import { usePage } from "@inertiajs/react";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import _ from "lodash";

import { useSales as useCart } from "@/Context/SalesContext";
import { SharedContext } from "@/Context/SharedContext";

export default function SearchBox() {
    const return_sale = usePage().props.return_sale;
    const { setCartItemModalOpen, setSelectedCartItem } = useContext(SharedContext);

    const { addToCart, cartState } = useCart();
    const [loading, setLoading] = useState(false);
    const [search_query, setQuery] = useState("");
    const [options, setOptions] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const searchRef = useRef(null);

    const fetchProducts = (search_query) => {
        if (search_query.length > 2) {
            setLoading(true);
            axios
                .get(`/products/search`, {
                    params: { search_query },
                }) // Send both parameters
                .then((response) => {
                    setOptions(response.data.products); // Set options with response products
                    setLoading(false);

                    if (response.data.products.length === 1) {
                        const product = response.data.products;
                        if (product[0].discount_percentage && Number(product[0].discount_percentage) !== 0) {
                            const discount = (product[0].price * product[0].discount_percentage) / 100;
                            product[0].discount = discount;
                        }

                        const existingProductIndex = _.findIndex(cartState, (item) =>
                            item.id === product.id &&
                            item.batch_number === product.batch_number &&
                            !['custom', 'reload'].includes(item.product_type)
                        );
                        if (existingProductIndex !== -1) {
                            product[0].quantity = cartState[existingProductIndex].quantity
                        }
                        else {
                            product[0].quantity = 1;
                            addToCart(product[0])
                        }

                        // This one enables the same item added multiple times and also ensure only the reload product is added, by this, we can get the last added item of reload product so we can modify the cart item. becuase we are using cartindex as an id to update cart item
                        if (product[0].product_type === "reload") {
                            const lastAddedIndex = cartState.length > 0 ? cartState.length : 0;
                            product[0].cart_index = lastAddedIndex;
                        }
                        setSelectedCartItem(product[0])
                        setCartItemModalOpen(true)
                    }
                })
                .catch((error) => {
                    console.error(error); // Log any errors
                    setLoading(false);
                });
        }
    };

    const debouncedFetchProducts = useCallback(
        _.debounce((search_query) => {
            fetchProducts(search_query);
        }, 300), // 500ms debounce delay
        []
    );

    useEffect(() => {
        if (searchRef.current) {
            searchRef.current.focus();
        }
        return () => {
            debouncedFetchProducts.cancel(); // Cleanup: Cancel pending debounced calls
        };
    }, [debouncedFetchProducts]);

    const onSearchInputChange = (e) => {
        const input = e.target.value;
        setQuery(input); // Update query state immediately for responsive UI
        debouncedFetchProducts(input); // Call the debounced fetch logic
    };

    useEffect(() => {
        document.addEventListener("keydown", detectKyDown, true);
    }, [])

    const detectKyDown = (e) => {
        if (e.key === "ArrowUp") {
            e.preventDefault();
            const searchBox = document.getElementById('searchBox');
            if (searchBox) {
                searchBox.focus();
                searchBox.select();
            }
        }
    }

    return (
        <>
            <Box
                elevation={0}
                sx={{
                    p: "2px 2px",
                    ml: { sm: "2rem", xs: '0.5rem' },
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    height: "55px",
                    backgroundColor: "white",
                    borderRadius: "5px",
                }}
            >
                <Autocomplete
                    id="searchBox"
                    disabled={return_sale}
                    fullWidth
                    disableCloseOnSelect
                    freeSolo
                    options={options}
                    inputValue={inputValue}
                    handleHomeEndKeys

                    onInputChange={(event, value) => {
                        setInputValue(value);
                    }}
                    // getOptionLabel={(option) => option.name || ''}
                    getOptionLabel={(option) =>
                        typeof option === "string"
                            ? option
                            : `${option.name} | ${option.barcode} ${option.sku ? `| ${option.sku}` : ""} | ${option.batch_number} | Rs.${option.price}`
                    }
                    getOptionKey={(option) => option.id + option.batch_id}
                    onChange={(event, product) => {
                        if (
                            product &&
                            typeof product === "object" &&
                            product.id
                        ) {
                            addToCart(product); // Add product to cart
                            product.quantity = 1

                            // This one enables the same item added multiple times and also ensure only the reload product is added, by this, we can get the last added item of reload product so we can modify the cart item. becuase we are using cartindex as an id to update cart item
                            if (product.product_type === "reload") {
                                const lastAddedIndex = cartState.length > 0 ? cartState.length : 0;
                                product.cart_index = lastAddedIndex;
                            }

                            setSelectedCartItem(product)
                            setCartItemModalOpen(true)
                        }
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            inputRef={searchRef}
                            fullWidth
                            placeholder="Search product... Use Arrow up key to focus ⬆️"
                            id="searchBox"
                            onChange={
                                onSearchInputChange
                            }
                            onFocus={(event) => {
                                event.target.select();
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": {
                                        border: "none", // Remove the border
                                    },
                                    "&:hover fieldset": {
                                        border: "none", // Remove border on hover
                                    },
                                    "&.Mui-focused fieldset": {
                                        border: "none", // Remove border when focused
                                    },
                                },
                            }}
                        />
                    )}
                />

                <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                <IconButton
                    type="button"
                    sx={{ p: "10px" }}
                    aria-label="search"
                >
                    <SearchIcon />
                </IconButton>

            </Box>
        </>
    );
}
