import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  Platform,
  ToastAndroid,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  ViroARScene,
  ViroText,
  ViroARSceneNavigator,
  ViroBox,
  ViroMaterials,
  ViroAnimations,
  Viro3DObject,
  ViroAmbientLight,
  ViroImage,
  ViroNode,
  ViroFlexView,
} from '@viro-community/react-viro';
import Geolocation from '@react-native-community/geolocation';
import CompassHeading from 'react-native-compass-heading';
// import {requestMultiple, PERMISSIONS, RESULTS} from 'react-native-permissions';

// Geo 처리를 위한 세팅
const MAPS_API_KEY = '';
const PlacesAPIURL = (lat, lng) =>
  `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50&key=${MAPS_API_KEY}`;

// Toast로 메시지 쏘기
const Toast = message => {
  ToastAndroid.showWithGravityAndOffset(
    message,
    ToastAndroid.LONG,
    ToastAndroid.BOTTOM,
    25,
    50,
  );
};

const distanceBetweenPoints = (p1, p2) => {
  if (!p1 || !p2) {
    return 0;
  }

  let R = 6371; // Radius of the Earth in km
  let dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  let dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;
  return d;
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

  const [state, setState] = useState({
    cameraReady: false,
    locationReady: false,
    location: undefined,
    nearbyPlaces: [],
    tracking: false,
    compassHeading: 0,
  });

  const listener = useRef(null);

  // compassHeading 처리를 위한 useEffect, mount시 설정, unmount시 해제
  useEffect(() => {
    CompassHeading.start(3, heading => {
      setState(prevState => ({...prevState, compassHeading: heading}));
    });
    return () => {
      if (listener.current) {
        Geolocation.clearWatch(listener.current);
      }
      CompassHeading.stop();
    };
  }, []);

  // 최근 위치 받아오기
  const getCurrentLocation = useCallback(() => {
    if (state.cameraReady && state.locationReady) {
      const geoSuccess = result => {
        setState(prevState => ({
          ...prevState,
          location: result.coords,
        }));
        getNearbyPlaces();
      };

      listener.current = Geolocation.watchPosition(geoSuccess, error => {}, {
        distanceFilter: 10,
      });
    }
  }, [state.cameraReady, state.locationReady, getNearbyPlaces]);

  // 근처 값 받아오기
  const getNearbyPlaces = useCallback(async () => {
    const URL = PlacesAPIURL(state.location.latitude, state.location.longitude);
    try {
      const response = await fetch(URL);
      const responseJson = await response.json();

      if (responseJson.status === 'OK') {
        const places = responseJson.results.map(rawPlace => {
          return {
            id: rawPlace.place_id,
            title: rawPlace.name,
            lat: rawPlace.geometry.location.lat,
            lng: rawPlace.geometry.location.lng,
            icon: rawPlace.icon,
          };
        });
        setState(prevState => ({...prevState, nearbyPlaces: places}));
      } else {
        console.warn(responseJson.status);
      }
    } catch (error) {
      console.error(error);
    }
  }, [state.location]);

  // 위도, 경도 값을 m 단위로로 계산
  const latLongToMerc = useCallback((latDeg, longDeg) => {
    // From: https://gist.github.com/scaraveos/5409402
    const longRad = (longDeg / 180.0) * Math.PI;
    const latRad = (latDeg / 180.0) * Math.PI;
    const smA = 6378137.0;
    const xmeters = smA * longRad;
    const ymeters = smA * Math.log((Math.sin(latRad) + 1) / Math.cos(latRad));
    return {x: xmeters, y: ymeters};
  }, []);

  // GPS를 AR로 찍기
  const transformGpsToAR = useCallback(
    (lat, lng) => {
      const isAndroid = Platform.OS === 'android';
      const latObj = lat;
      const longObj = lng;
      const latMobile = state.location.latitude;
      const longMobile = state.location.longitude;

      const deviceObjPoint = latLongToMerc(latObj, longObj);
      const mobilePoint = latLongToMerc(latMobile, longMobile);
      const objDeltaY = deviceObjPoint.y - mobilePoint.y;
      const objDeltaX = deviceObjPoint.x - mobilePoint.x;

      if (isAndroid) {
        let degree = state.compassHeading;
        let angleRadian = (degree * Math.PI) / 180;
        let newObjX =
          objDeltaX * Math.cos(angleRadian) - objDeltaY * Math.sin(angleRadian);
        let newObjY =
          objDeltaX * Math.sin(angleRadian) + objDeltaY * Math.cos(angleRadian);
        return {x: newObjX, z: -newObjY};
      }

      return {x: objDeltaX, z: -objDeltaY};
    },
    [latLongToMerc, state.compassHeading, state.location],
  );

  // 메인 함수
  const placeARObjects = useCallback(() => {
    if (state.nearbyPlaces.length === 0) {
      return undefined;
    }

    return state.nearbyPlaces.map(item => {
      const coords = transformGpsToAR(item.lat, item.lng);
      const scale = Math.abs(Math.round(coords.z / 15));
      const distance = distanceBetweenPoints(state.location, {
        latitude: item.lat,
        longitude: item.lng,
      });

      return (
        <ViroNode
          key={item.id}
          scale={[scale, scale, scale]}
          rotation={[0, 0, 0]}
          position={[coords.x, 0, coords.z]}>
          <ViroFlexView
            style={{alignItems: 'center', justifyContent: 'center'}}>
            <ViroText
              width={4}
              height={0.5}
              text={item.title}
              style={styles.helloWorldTextStyle}
            />
            <ViroText
              width={4}
              height={0.5}
              text={`${Number(distance).toFixed(2)} km`}
              style={styles.helloWorldTextStyle}
              position={[0, -0.75, 0]}
            />
            <ViroImage
              width={1}
              height={1}
              source={{uri: '../assets/logo.svg'}}
              position={[0, -1.5, 0]}
            />
          </ViroFlexView>
        </ViroNode>
      );
    });
  }, [state.nearbyPlaces, state.location, transformGpsToAR]);

  return (
    <ViroARScene onTrackingUpdated={onInitialized}>
      {state.locationReady && state.cameraReady && placeARObjects()}
      {/* <ViroAmbientLight color="#ffffff" />
      {data.object === 'dog' ? (
        <Viro3DObject
          source={require('../assets/3dObj/stuffed_animal_v1_L2.123c64d38a59-f755-4bbb-bd3f-8116fb11f93f/11706_stuffed_animal_L2.obj')}
          scale={[0.05, 0.05, 0.05]}
          position={[0, 0, -10]}
          rotation={[90, 150, 180]}
          type="OBJ"
        />
      ) : (
        <Viro3DObject
          source={require('../assets/3dObj/Cat_v1_L3.123cb1b1943a-2f48-4e44-8f71-6bbe19a3ab64/12221_Cat_v1_l3.obj')}
          scale={[0.05, 0.05, 0.05]}
          position={[0, 0, -10]}
          rotation={[90, 150, 180]}
          type="OBJ"
        />
      )} */}
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
  controlsView: {
    width: '100%',
    height: 100,
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    margin: 20,
    padding: 10,
    fontWeight: 'bold',
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
      {/* <View style={styles.controlsView}>
        <TouchableOpacity onPress={() => setObject('dog')}>
          <Text style={styles.text}>Display Dog</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setObject('cat')}>
          <Text style={styles.text}>Display Cat</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
}

export default ARMapView;
