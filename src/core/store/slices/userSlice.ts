import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  name: string;
  isOnboarded: boolean;
  preferences: {
    style: string;
    story: string;
  };
}

const initialState: UserState = {
  name: '',
  isOnboarded: false,
  preferences: {
    style: '',
    story: '',
  },
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    completeOnboarding(
      state,
      action: PayloadAction<{ name: string; style: string; story: string }>,
    ) {
      state.name = action.payload.name;
      state.preferences.style = action.payload.style;
      state.preferences.story = action.payload.story;
      state.isOnboarded = true;
    },
    resetUser() {
      return initialState;
    },
    hydrateUser(_state, action: PayloadAction<UserState>) {
      return action.payload;
    },
  },
});

export const { setUserName, completeOnboarding, resetUser, hydrateUser } =
  userSlice.actions;

export default userSlice.reducer;
