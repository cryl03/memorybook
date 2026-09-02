import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CaptureProtection } from 'react-native-capture-protection';
import { Provider } from 'react-redux';
import { store } from '@core/store';
import { RootNavigator } from '@core/navigation';

function App() {
  useEffect(() => {
    // TEMP: allow screenshots. Restore prevent({ screenshot, record, appSwitcher }) before release.
    void CaptureProtection.allow({
      screenshot: true,
      record: true,
      appSwitcher: true,
    }).catch(() => {});
  }, []);

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" />
          <RootNavigator />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}

export default App;
