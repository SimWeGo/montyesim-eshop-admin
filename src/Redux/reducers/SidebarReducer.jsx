import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  open: true,
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.open = !state.open;
    },
    openSidebar: (state) => {
      state.open = true;
    },
    closeSidebar: (state) => {
      state.open = false;
    },
  },
});

// Export actions
export const { toggleSidebar, openSidebar, closeSidebar } =
  sidebarSlice.actions;

// Export the reducer
export default sidebarSlice.reducer;
