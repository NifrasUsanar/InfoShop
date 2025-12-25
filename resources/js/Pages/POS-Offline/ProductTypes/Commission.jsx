import {  Grid, TextField, InputAdornment } from "@mui/material";

export default function Commission({ handleChange, formState }) {
    return (
        <>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    label="Fixed Commission"
                    name="fixed_commission"
                    required
                    value={formState.meta_data.fixed_commission}
                    onChange={handleChange}
                    fullWidth
                    type="number"
                    sx={{mt: "0.5rem",}}
                    slotProps={{
                        inputLabel: {
                            shrink: true,
                        },
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    Rs.
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Grid>
        </>
    );
}
