import React, {useState, useEffect, useCallback, useRef} from 'react';
import {View, Platform, ToastAndroid, StyleSheet} from 'react-native';
import {
  ViroARScene,
  ViroARSceneNavigator,
  ViroARPlaneSelector,
  ViroBox,
  ViroNode,
  ViroFlexView,
  ViroText,
  ViroImage,
  ViroARPlane,
  ViroMaterials,
  ViroPolyline,
} from '@viro-community/react-viro';
import Geolocation from '@react-native-community/geolocation';
import CompassHeading, {start} from 'react-native-compass-heading';
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

ViroMaterials.createMaterials({
  coloredLine: {
    diffuseColor: 'rgba(255, 0, 0, 1)',
  },
});

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
    locationReady: false,
    location: undefined,
    nearbyPlaces: [],
    tracking: false,
    compassHeading: 0,
  });

  const [lineState, setLineState] = useState([]);

  const listener = useRef(null);

  const getLines = useCallback(() => {
    console.log('getLines 들어옴');
    if (
      geoState.nearbyPlaces.length === 0 ||
      lineState.length === geoState.nearbyPlaces.length
    ) {
      console.log('하지만 리턴 당함');
      return [];
    }

    // const initGeo = geoState.nearbyPlaces[0];
    // const initCoords = transformGpsToAR(initGeo.lat, initGeo.lng);
    // const newLineState = [
    //   [0, 0, 0],
    //   [initCoords.x, 0, initCoords.z],
    // ];
    const newLineState = [];
    for (let i = 0; i < geoState.nearbyPlaces.length - 1; i++) {
      const startGeo = geoState.nearbyPlaces[i];
      const endGeo = geoState.nearbyPlaces[i + 1];
      const startGeoCoords = transformGpsToAR(startGeo.lat, startGeo.lng);
      const endGeoCoords = transformGpsToAR(endGeo.lat, endGeo.lng);
      const startPosition = [startGeoCoords.x, 0, startGeoCoords.z];
      const relativePosition = [
        endGeoCoords.x - startGeoCoords.x,
        0,
        endGeoCoords.z - startGeoCoords.z,
      ];
      newLineState.push([[...startPosition], [...relativePosition]]);
    }
    setLineState(newLineState);
  }, [geoState.nearbyPlaces, lineState.length, transformGpsToAR]);

  // compassHeading 처리를 위한 useEffect, mount시 설정, unmount시 해제
  useEffect(() => {
    CompassHeading.start(3, heading => {
      if (geoState.compassHeading === 0) {
        const newGeoState = {...geoState};
        newGeoState.compassHeading = heading.heading;
        newGeoState.locationReady = true;
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
        isNode: true,
      },
      {
        id: 1,
        title: 'Hanti',
        lat: 37.49622987173077,
        lng: 127.05284412135079,
        isNode: true,
      },
      {
        id: 2,
        title: 'Samsung',
        lat: 37.50835257973258,
        lng: 127.06271517820785,
        isNode: true,
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

  useEffect(() => {
    if (geoState.nearbyPlaces && geoState.nearbyPlaces.length > 0) {
      getLines();
    }
  }, [geoState.nearbyPlaces, getLines]);

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

  // GPS를 AR을 위한 값으로 변경
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

  // 지도 좌표값 위치 찍기
  const placeARObjects = useCallback(() => {
    if (geoState.nearbyPlaces.length === 0) {
      return undefined;
    }

    const placePoints = geoState.nearbyPlaces.map((item, idx) => {
      const coords = transformGpsToAR(item.lat, item.lng);
      const scale = Math.abs(Math.round(coords.z / 15));
      // const scale = 100;
      const distance = distanceBetweenPoints(geoState.location, {
        latitude: item.lat,
        longitude: item.lng,
      });
      console.log(`${idx + 1}번째 포인트`);
      console.log('coords :', coords);
      console.log('distance :', distance);
      console.log('scale :', scale);

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
            <ViroBox width={2} length={2} height={2} position={[0, -1.5, 0]} />
          </ViroFlexView>
        </ViroNode>
      );
    });
    return placePoints;
  }, [geoState.nearbyPlaces, geoState.location, transformGpsToAR]);

  // 지도 길 그리기
  const polyLines = useCallback(() => {
    if (lineState.length === 0) {
      return undefined;
    }

    const drawLines = lineState.map((line, idx) => {
      const startPoint = line[0];
      const endPoint = line[1];
      console.log('start :', startPoint);
      console.log('end :', endPoint);

      return (
        <ViroPolyline
          key={idx}
          position={startPoint}
          points={[startPoint, endPoint]}
          thickness={3}
          materials={['coloredLine']}
        />
      );
    });
    return drawLines;
  }, [lineState]);

  // AR 요소들 출력
  return (
    <ViroARScene onTrackingUpdated={onInitialized}>
      {/* // onAnchorFound={() => console.log('onAnchorFound')}
      // onAnchorUpdated={() => console.log('onAnchorUpdated')}
      // onAnchorRemoved={() => console.log('onAnchorRemoved')}> */}
      {/* <ViroARPlane minHeight={0.5} minWidth={0.5} alignment={'Horizontal'}> */}
      {geoState.locationReady && geoState.cameraReady && placeARObjects()}
      {lineState && lineState.length > 0 && polyLines()}
      {/* </ViroARPlane> */}
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
