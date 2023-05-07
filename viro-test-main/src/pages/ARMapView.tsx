import React, {useState, useEffect, useCallback, useRef} from 'react';
import {View, Platform, ToastAndroid, StyleSheet} from 'react-native';
import {
  ViroARScene,
  ViroARSceneNavigator,
  ViroARPlaneSelector,
  ViroBox,
} from '@viro-community/react-viro';
import Geolocation from '@react-native-community/geolocation';
import CompassHeading from 'react-native-compass-heading';
import usePermissions from '../hooks/usePermissions';

const Toast = message => {
  ToastAndroid.showWithGravityAndOffset(
    message,
    ToastAndroid.LONG,
    ToastAndroid.BOTTOM,
    25,
    50,
  );
};

const MyScene = props => {
  let data = props.sceneNavigator.viroAppProps;

  // 최초 실행시 확인
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    if (tracking) {
      Toast('All set!');
    } else {
      Toast('Move your device around gently to calibrate AR and compass.');
    }
  }, [tracking]);

  const onInitialized = useCallback((state, reason) => {
    const isTracking = state === 3 || state === 4; // 3: TRACKING_NORMAL, 4: TRACKING_LIMITED
    setTracking(isTracking);
  }, []);

  return (
    <ViroARScene onTrackingUpdated={onInitialized}>
      <ViroARPlaneSelector
        minHeight={0.5}
        minWidth={0.5}
        onPlaneSelected={() => {
          console.log('click');
        }}>
        <ViroBox position={[0, 0.25, 0]} scale={[0.5, 0.5, 0.5]} />
      </ViroARPlaneSelector>
    </ViroARScene>
  );
};

let styles = StyleSheet.create({
  f1: {flex: 1},
  helloWorldTextStyle: {
    fontFamily: 'Arial',
    fontSize: 30,
    color: '#000000',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
});

function ARMapView() {
  const [object, setObject] = useState('dog');
  return (
    <View style={styles.f1}>
      <ViroARSceneNavigator
        worldAlignment={'GravityAndHeading'}
        autofocus={true}
        initialScene={{
          scene: MyScene,
        }}
        viroAppProps={{object: object}}
        style={styles.f1}
      />
    </View>
  );
}

export default ARMapView;
