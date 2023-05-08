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

  usePermissions();

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

  const [geoState, setGeoState] = useState({
    cameraReady: true,
    locationReady: true,
    location: undefined,
    nearbyPlaces: [],
    tracking: false,
    compassHeading: 0,
  });

  const listener = useRef(null);

  // compassHeading 처리를 위한 useEffect, mount시 설정, unmount시 해제
  useEffect(() => {
    CompassHeading.start(3, heading => {
      if (geoState.compassHeading === 0) {
        const newGeoState = {...geoState};
        newGeoState.compassHeading = heading.heading;
        setGeoState(newGeoState);
        CompassHeading.stop();
      }
    });

    return () => {
      if (listener.current) {
        Geolocation.clearWatch(listener.current);
      }
      CompassHeading.stop();
    };
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [geoState.compassHeading]);

  // 최근 위치 받아오기
  const getCurrentLocation = useCallback(() => {
    if (
      geoState.cameraReady &&
      geoState.locationReady &&
      geoState.compassHeading
    ) {
      const geoSuccess = result => {
        console.log('geoSuccess', result);
        const newGeoState = {...geoState};
        newGeoState.location = result.coords;
        console.log('newGeo', newGeoState);
        setGeoState(newGeoState);
      };

      listener.current = Geolocation.watchPosition(
        geoSuccess,
        error => {
          console.error('geoError', error.message);
        },
        {
          distanceFilter: 10,
        },
      );
    }
  }, [geoState]);

  // 목적지 값 받아오기
  const getNearbyPlaces = useCallback(async () => {
    const places = [
      {
        id: 0,
        title: 'SSAFY',
        lat: 37.50140451172083,
        lng: 127.03979415506103,
        icon: 'https://scontent-ssn1-1.xx.fbcdn.net/v/t1.6435-9/71141193_2565410353480610_6037255603217235968_n.png?_nc_cat=101&ccb=1-7&_nc_sid=e3f864&_nc_ohc=w8_pfVyLYaMAX8EuvLt&_nc_ht=scontent-ssn1-1.xx&oh=00_AfAV95Avg9lZ9XtFFtIm_RD0NmysVmPE4TjZTG8Ij3ULhg&oe=6479FCBC',
      },
      {
        id: 1,
        title: 'Church',
        lat: 37.50230698208923,
        lng: 127.05801958547242,
        icon: 'https://scontent-ssn1-1.xx.fbcdn.net/v/t1.6435-9/71141193_2565410353480610_6037255603217235968_n.png?_nc_cat=101&ccb=1-7&_nc_sid=e3f864&_nc_ohc=w8_pfVyLYaMAX8EuvLt&_nc_ht=scontent-ssn1-1.xx&oh=00_AfAV95Avg9lZ9XtFFtIm_RD0NmysVmPE4TjZTG8Ij3ULhg&oe=6479FCBC',
      },
    ];
    const newGeoState = {...geoState};
    newGeoState.nearbyPlaces = [...places];
    setGeoState(newGeoState);
  }, [geoState.location]);

  useEffect(() => {
    if (geoState.location) {
      getNearbyPlaces();
    }
  }, [geoState.location, getNearbyPlaces]);

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
      const latMobile = geoState.location.latitude;
      const longMobile = geoState.location.longitude;

      const deviceObjPoint = latLongToMerc(latObj, longObj);
      const mobilePoint = latLongToMerc(latMobile, longMobile);
      const objDeltaY = deviceObjPoint.y - mobilePoint.y;
      const objDeltaX = deviceObjPoint.x - mobilePoint.x;

      if (isAndroid) {
        let degree = geoState.compassHeading;
        console.log('디그리는', degree);
        let angleRadian = (degree * Math.PI) / 180;
        let newObjX =
          objDeltaX * Math.cos(angleRadian) - objDeltaY * Math.sin(angleRadian);
        let newObjY =
          objDeltaX * Math.sin(angleRadian) + objDeltaY * Math.cos(angleRadian);

        return {x: newObjX, z: -newObjY};
      }

      return {x: objDeltaX, z: -objDeltaY};
    },
    [latLongToMerc, geoState.compassHeading, geoState.location],
  );

  // 메인 함수
  const placeARObjects = useCallback(() => {
    if (geoState.nearbyPlaces.length === 0) {
      return undefined;
    }

    // return geoState.nearbyPlaces.map(item => {
    //   console.log('여기서부터 item', item);
    //   const coords = transformGpsToAR(item.lat, item.lng);
    //   // const scale = Math.abs(Math.round(coords.z / 15));
    //   const scale = 1000000;
    //   const distance = distanceBetweenPoints(geoState.location, {
    //     latitude: item.lat,
    //     longitude: item.lng,
    //   });

    const item = geoState.nearbyPlaces[1];
    console.log('여기서부터 item', item);
    const coords = transformGpsToAR(item.lat, item.lng);
    const scale = Math.abs(Math.round(coords.z / 15));
    // const scale = 100;
    const distance = distanceBetweenPoints(geoState.location, {
      latitude: item.lat,
      longitude: item.lng,
    });
    console.log('heading 확인', geoState.compassHeading);
    console.log('여긴 coords', coords);
    console.log('distance', distance);

    return (
      <ViroBox
        key={geoState.nearbyPlaces[0].id}
        height={10}
        length={10}
        width={10}
        scale={[scale, scale, scale]}
        // position={[0, 0, -300]}
        position={[coords.x, 0, coords.z]}
      />
      // <ViroNode
      //   key={item.id}
      //   scale={[scale, scale, scale]}
      //   rotation={[0, 0, 0]}
      //   position={[coords.x, 0, coords.z]}>
      //   <ViroFlexView
      //     style={{alignItems: 'center', justifyContent: 'center'}}>
      //     <ViroText
      //       width={4}
      //       height={0.5}
      //       text={item.title}
      //       style={styles.helloWorldTextStyle}
      //     />
      //     <ViroText
      //       width={4}
      //       height={0.5}
      //       text={`${Number(distance).toFixed(2)} km`}
      //       style={styles.helloWorldTextStyle}
      //       position={[0, -0.75, 0]}
      //     />
      //     <ViroImage
      //       width={1}
      //       height={1}
      //       source={{uri: item.icon}}
      //       position={[0, -1.5, 0]}
      //     />
      //   </ViroFlexView>
      // </ViroNode>
    );
    // });
  }, [geoState.nearbyPlaces, geoState.location, transformGpsToAR]);

  return (
    <ViroARScene onTrackingUpdated={onInitialized}>
      {geoState.locationReady && geoState.cameraReady && placeARObjects()}
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
