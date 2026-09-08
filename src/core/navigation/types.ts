export type RootStackParamList = {
  Splash: undefined;
  Presentation: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OnboardingChat: { skipIntro?: boolean; nameOnly?: boolean } | undefined;
  PhotoCount: { albumTitle?: string } | undefined;
  PhotoSelector: { maxPhotos: number; existingPhotos?: string[]; returnTo?: 'Wow' | 'Editor' };
  Creating: undefined;
  Wow: undefined;
  Editor: undefined;
  Checkout: undefined;
  MainTabs: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Orders: undefined;
  Projects: undefined;
  ReorderAlbum: { orderId: string };
};
