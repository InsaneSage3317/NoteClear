// ─── Expo Config Plugin: NotificationListenerService ─────────
// This plugin modifies AndroidManifest.xml to register our
// NotificationListenerService so Android grants us access
// to read/dismiss notifications from all apps.
//
// After running `npx expo prebuild`, it also copies the native
// Java service + bridge module into the android project.

const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// ── 1. Manifest: register the service + permission ──
function addNotificationListenerService(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults;
    const app = manifest.manifest.application[0];

    // Add BIND_NOTIFICATION_LISTENER_SERVICE permission
    if (!manifest.manifest['uses-permission']) {
      manifest.manifest['uses-permission'] = [];
    }

    const permExists = manifest.manifest['uses-permission'].some(
      (p) => p.$?.['android:name'] === 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE'
    );
    if (!permExists) {
      manifest.manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE' },
      });
    }

    // Register NotificationListenerService
    if (!app.service) app.service = [];

    const svcExists = app.service.some(
      (s) => s.$?.['android:name'] === '.NotificationListener'
    );
    if (!svcExists) {
      app.service.push({
        $: {
          'android:name': '.NotificationListener',
          'android:exported': 'true',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.service.notification.NotificationListenerService' } },
            ],
          },
        ],
      });
    }

    return mod;
  });
}

// ── 2. Copy native Java files into android/ project ──
function copyNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const packageName = 'com.antigravity.agent';
      const packagePath = packageName.replace(/\./g, '/');
      const targetDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        ...packagePath.split('/')
      );

      // Ensure target directory exists
      fs.mkdirSync(targetDir, { recursive: true });

      // Read and write native files
      const nativeSrcDir = path.join(projectRoot, 'native-src');
      if (fs.existsSync(nativeSrcDir)) {
        const files = fs.readdirSync(nativeSrcDir).filter((f) => f.endsWith('.java'));
        for (const file of files) {
          const content = fs.readFileSync(path.join(nativeSrcDir, file), 'utf-8');
          fs.writeFileSync(path.join(targetDir, file), content);
        }
      }

      return mod;
    },
  ]);
}

// ── 3. Modify MainApplication to register the Native Module ──
function registerPackage(config) {
  return withMainApplication(config, (config) => {
    let mainApp = config.modResults.contents;
    
    // Inject the add(NotificationBridgePackage()) into the .apply block of getPackages()
    if (!mainApp.includes('add(NotificationBridgePackage())')) {
      // Find the apply block in Kotlin
      mainApp = mainApp.replace(
        '// add(MyReactNativePackage())',
        '// add(MyReactNativePackage())\n              add(NotificationBridgePackage())'
      );
    }

    config.modResults.contents = mainApp;
    return config;
  });
}

module.exports = function withNotificationListener(config) {
  config = addNotificationListenerService(config);
  config = copyNativeFiles(config);
  config = registerPackage(config);
  return config;
};
