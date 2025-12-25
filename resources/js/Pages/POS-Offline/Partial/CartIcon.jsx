import {
    Badge
} from "@mui/material";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

import { useSales as useCart } from '@/Context/SalesContext';

export default function CartIcon() {
    const { cartState, cartTotal, totalQuantity } = useCart();
    return (
        <Badge badgeContent={cartState.length} color="error">
        <ShoppingCartIcon />
    </Badge>
    );
}


