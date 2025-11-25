import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import "dayjs/locale/en-gb";
import dayjs from "dayjs";

export default function MUITimePicker({ name, label, value, onChange, size = "medium" }) {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
            <MobileTimePicker
                name={name}
                label={label}
                className="w-full"
                format="hh:mm A"
                ampm={true}
                views={['hours', 'minutes']}
                slotProps={{
                    textField: {
                        size: size,
                        fullWidth: true
                    }
                }}
                value={value ? dayjs(`2000-01-01 ${value}`, 'YYYY-MM-DD HH:mm') : null}
                onChange={(newValue) =>
                    onChange(newValue ? newValue.format('HH:mm') : '')
                }
            />
        </LocalizationProvider>
    );
}
