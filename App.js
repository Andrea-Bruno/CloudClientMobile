import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuProvider } from 'react-native-popup-menu';
import PolyfillCrypto from 'react-native-webview-crypto';
import { Provider } from 'react-redux';
import { BottomSheetNative } from './src/components/bottom-sheet';
import { ContextApiProvider } from './src/context/ContextApi';
import Router from './src/navigation/Router';
import { store } from './src/store'
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
SplashScreen.preventAutoHideAsync();

export default App = () => {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {

    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <PolyfillCrypto />
      <Provider store={store}>
        <ContextApiProvider>
          <MenuProvider>
            <Router />
            <BottomSheetNative />
          </MenuProvider>
        </ContextApiProvider>
      </Provider>
    </GestureHandlerRootView>
  )
}

        // eas build -p android --profile preview