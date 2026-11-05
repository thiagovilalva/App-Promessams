const { withAndroidManifest } = require('expo/config-plugins');
module.exports = function withPlaybackOnly(config) {
  return withAndroidManifest(config, config => {
    const manifest = config.modResults.manifest;
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const application = manifest.application[0];
    application.service = (application.service || []).filter(service => service.$['android:name'] !== 'expo.modules.audio.service.AudioRecordingService');
    application.service.push({ $: { 'android:name': 'expo.modules.audio.service.AudioRecordingService', 'tools:node': 'remove' } });
    // Playback is never resumed by boot or scheduled broadcasts. The module's
    // MediaSession service is activated by an explicit Play action only.
    application.receiver = (application.receiver || []).filter(receiver => !receiver.$['android:name']?.startsWith('expo.modules.audio.'));
    return config;
  });
};
