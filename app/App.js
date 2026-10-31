// Space Scrapper — Expo kabuğu: oyunu WebView'da çalıştırır, kaydı telefonda tutar,
// paylaşım / titreşim / yerel bildirim isteklerini oyundan alıp yerine getirir.
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Share, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import GAME_HTML from './game/gameHtml';

const PREFIX = 'ss:';
const BG = '#0c0a1d';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

// Oyunun localStorage çağrılarını telefondaki kalıcı depoya bağlayan köprü.
// Sayfa yüklenmeden önce çalışır; kayıtlar açılışta hazır gelir.
const bridgeScript = store => `(function(){
  var data = ${JSON.stringify(store)};
  function post(o){ try { window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch (e) {} }
  var ls = {
    getItem: function(k){ return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem: function(k, v){ v = String(v); if (data[k] === v) return; data[k] = v; post({ type: 'set', k: k, v: v }); },
    removeItem: function(k){ delete data[k]; post({ type: 'remove', k: k }); },
    clear: function(){ data = {}; post({ type: 'clear' }); },
    key: function(i){ return Object.keys(data)[i] || null; },
    get length(){ return Object.keys(data).length; }
  };
  try { Object.defineProperty(window, 'localStorage', { configurable: true, get: function(){ return ls; } }); } catch (e) {}
  window.SS_NATIVE = { post: post, platform: '${Platform.OS}' };
})(); true;`;

async function shareCard({ image, text }) {
  try {
    if (image && (await Sharing.isAvailableAsync())) {
      const uri = FileSystem.cacheDirectory + `space-scrapper-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(uri, image.replace(/^data:image\/png;base64,/, ''), { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Space Scrapper' });
      return;
    }
  } catch (e) { /* görsel paylaşılamazsa metne düş */ }
  try { await Share.share({ message: text || 'Space Scrapper' }); } catch (e) {}
}

async function scheduleReminders(list) {
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const n of list || []) {
      const date = new Date(Date.now() + n.inMinutes * 60000);
      await Notifications.scheduleNotificationAsync({
        content: { title: n.title, body: n.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      });
    }
  } catch (e) { /* Expo Go bazı cihazlarda bildirimi kısıtlayabilir */ }
}

export default function App() {
  const [boot, setBoot] = useState(null);
  const web = useRef(null);

  useEffect(() => {
    (async () => {
      const store = {};
      try {
        const keys = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith(PREFIX));
        (await AsyncStorage.multiGet(keys)).forEach(([k, v]) => { if (v != null) store[k.slice(PREFIX.length)] = v; });
      } catch (e) {}
      setBoot(bridgeScript(store));
    })();
  }, []);

  const onMessage = async e => {
    let m; try { m = JSON.parse(e.nativeEvent.data); } catch { return; }
    switch (m.type) {
      case 'set': AsyncStorage.setItem(PREFIX + m.k, m.v).catch(() => {}); break;
      case 'remove': AsyncStorage.removeItem(PREFIX + m.k).catch(() => {}); break;
      case 'clear': {
        const keys = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith(PREFIX));
        AsyncStorage.multiRemove(keys).catch(() => {}); break;
      }
      case 'haptic': Haptics.impactAsync(m.strong ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light).catch(() => {}); break;
      case 'share': shareCard(m); break;
      case 'notify': scheduleReminders(m.list); break;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="light" backgroundColor={BG} />
        {!boot ? <View style={styles.center}><ActivityIndicator color="#ff5c97" size="large" /></View> : (
          <WebView
            ref={web}
            originWhitelist={['*']}
            source={{ html: GAME_HTML, baseUrl: 'https://space-scrapper.local/' }}
            injectedJavaScriptBeforeContentLoaded={boot}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            bounces={false}
            overScrollMode="never"
            setSupportMultipleWindows={false}
            textZoom={100}
            style={styles.web}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  web: { flex: 1, backgroundColor: BG },
});
