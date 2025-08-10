import { createSlice } from "@reduxjs/toolkit";

const settingsSlice = createSlice({
    name: "settings",
    initialState: {
        backgroundColor: "#ffffff",
    },
    reducers: {
        setBackgroundColor(state, action) {
            state.backgroundColor = action.payload;
        },
    },
});

export const { setBackgroundColor } = settingsSlice.actions;
export default settingsSlice.reducer;


