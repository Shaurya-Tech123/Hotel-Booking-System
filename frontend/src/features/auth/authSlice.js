import { createSlice } from "@reduxjs/toolkit";

function loadStoredSession() {
  try {
    const stored = localStorage.getItem("hbs_session");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

const parsed = loadStoredSession();

const initialState = {
  role: parsed?.role || null,
  token: parsed?.token || "",
  profile: parsed?.profile || null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      const { role, token, profile } = action.payload;
      if (!token || !profile) return;

      state.role = role;
      state.token = token;
      state.profile = {
        ...profile,
        id: profile.id != null ? String(profile.id) : profile.id
      };

      localStorage.setItem(
        "hbs_session",
        JSON.stringify({ role: state.role, token: state.token, profile: state.profile })
      );
      localStorage.setItem("hbs_token", state.token);
    },
    clearAuth: state => {
      state.role = null;
      state.token = "";
      state.profile = null;
      localStorage.removeItem("hbs_session");
      localStorage.removeItem("hbs_token");
    }
  }
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
