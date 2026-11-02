/**
 * react-native-maps renders its native views (AIRMap*) through React
 * Native's legacy/Fabric interop layer — without declaring them here,
 * the New Architecture (newArchEnabled: true in app.json) never mounts
 * them at all. No crash, no error, just a permanently blank MapView
 * that never even issues a tile request.
 * https://github.com/react-native-maps/react-native-maps#react-native-configuration-for-fabric--new-architecture
 */
const AIR_MAP_COMPONENTS = [
  'AIRMap',
  'AIRMapCallout',
  'AIRMapCalloutSubview',
  'AIRMapCircle',
  'AIRMapHeatmap',
  'AIRMapLocalTile',
  'AIRMapMarker',
  'AIRMapOverlay',
  'AIRMapPolygon',
  'AIRMapPolyline',
  'AIRMapUrlTile',
  'AIRMapWMSTile',
];

module.exports = {
  project: {
    android: {
      unstable_reactLegacyComponentNames: AIR_MAP_COMPONENTS,
    },
    ios: {
      unstable_reactLegacyComponentNames: AIR_MAP_COMPONENTS,
    },
  },
};
