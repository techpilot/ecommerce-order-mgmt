import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  email: string;
}
export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'unauthenticated';

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null as AuthUser | null, status: 'idle' as AuthStatus },
  reducers: {
    setAuthLoading: (state) => {
      state.status = 'loading';
    },
    setAuthenticated: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.status = 'authenticated';
    },
    setUnauthenticated: (state) => {
      state.user = null;
      state.status = 'unauthenticated';
    },
  },
});

export const { setAuthLoading, setAuthenticated, setUnauthenticated } =
  authSlice.actions;
export default authSlice.reducer;
