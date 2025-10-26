import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Link } from "@inertiajs/react";
import {
    Button,
    Box,
} from "@mui/material";
import AddBoxIcon from "@mui/icons-material/AddBox";
import Select2 from "react-select";
import axios from "axios";
import _ from "lodash";

import AddToPurchase from "./AddToPurchase";

import { usePurchase } from "@/Context/PurchaseContext";
import { useCurrencyStore } from "@/stores/currencyStore";

export default function ProductSearch() {
    const { addToCart } = usePurchase();
    const { settings: currencySettings } = useCurrencyStore();

    const [productOptions, setProductOptions] = useState([]); // Stores the options from the API
    const [selectedProductOption, setSelectedProductOption] = useState(null); // Stores the selected option
    const [inputValue, setInputValue] = useState("");
    const [addToPurchaseOpen, setAddToPurchaseOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState([]);

    // Function to fetch product data based on the input value (user's search query)
    const fetchProducts = (search_query) => {
        const is_purchase = 1;
        if (!search_query) {
            setProductOptions([]); // Clear options if input is empty
            return;
        }

        axios
            .get(`/products/search`, {
                params: { search_query, is_purchase },
            }) // Send input as a query to your API
            .then((response) => {
                const products = response.data.products;
                setProductOptions(products);

                // setSelectedProducts(response.data.products);
                // setAddToPurchaseOpen(true);
            })
            .catch((error) => {
                console.error("Error fetching products:", error);
            });
    };

    // Create the debounced function only once
    const debouncedFetchProducts = useCallback(
        _.debounce((search_query) => {
            fetchProducts(search_query);
        }, 500),
        []
    );

    useEffect(() => {
        // Cleanup on component unmount
        return () => {
            debouncedFetchProducts.cancel(); // Cancel any pending debounced calls
        };
    }, [debouncedFetchProducts]);

    // Handle input change (this is called when user types in the input field)
    const handleInputChange = (newValue) => {
        setInputValue(newValue); // Update the input value state
        // Trigger fetch only if barcode is not checked
        debouncedFetchProducts(newValue); // Fetch products based on the new input value
    };

    // Handle selection change (when the user selects an option from the dropdown)
    const handleChange = (selectedOption) => {
        setSelectedProductOption(selectedOption);
        if (selectedOption) {
            setSelectedProduct(selectedOption); //This option will be used for add to purchase cart form
            setAddToPurchaseOpen(true);
        }
    };

    return (
        <Box
            elevation={0}
            sx={{
                p: "2px 2px",
                display: "flex",
                alignItems: "center",
                width: "100%",
                height: "55px",
                backgroundColor: "white",
                borderRadius: "5px",
            }}
        >
            <Select2
                className="w-full"
                placeholder="Select a product..."
                styles={{
                    control: (baseStyles, state) => ({
                        ...baseStyles,
                        height: "50px",
                    }),
                }}
                options={productOptions} // Options to display in the dropdown
                value={selectedProductOption} // The currently selected option
                onChange={handleChange} // Triggered when an option is selected
                onInputChange={handleInputChange}
                inputValue={inputValue} // Current value of the input field
                isClearable // Allow the user to clear the selected option
                noOptionsMessage={() => "No products found"}
                getOptionLabel={(option) =>
                    `${option.name} | ${option.batch_number} | ${currencySettings.currency_symbol}${option.cost}  | ${currencySettings.currency_symbol}${option.price} | ${option.quantity} | ${option.barcode} ${option.sku ? `| ${option.sku}` : ""}`
                }
                getOptionValue={(option) => option.batch_id}
            ></Select2>

            <Link href="/products/create">
                <Button
                    variant="contained"
                    size="large"
                    sx={{ minWidth: "200px", ml:'1rem' }}
                    startIcon={<AddBoxIcon />}
                >
                    Add Product
                </Button>
            </Link>
            <AddToPurchase
                addToPurchaseOpen={addToPurchaseOpen}
                setAddToPurchaseOpen={setAddToPurchaseOpen}
                product={selectedProduct}
            />
        </Box>
    );
}
