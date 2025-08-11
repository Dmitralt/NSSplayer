import { createSlice } from "@reduxjs/toolkit";

const settingsSlice = createSlice({
    name: "settings",
    initialState: {
        backgroundColor: "#ffffff",
        videoPath: null,
        myVal: null,
    },
    reducers: {
        setBackgroundColor(state, action) {
            state.backgroundColor = action.payload;
        },
        setVideoPath(state, action) {
            state.videoPath = action.payload;
        },
    },
});

export const { setBackgroundColor, setVideoPath } = settingsSlice.actions;
export default settingsSlice.reducer;


