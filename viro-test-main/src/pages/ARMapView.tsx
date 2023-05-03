import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {
  ViroARScene,
  ViroText,
  ViroARSceneNavigator,
  ViroBox,
  ViroMaterials,
  ViroAnimations,
  Viro3DObject,
  ViroAmbientLight,
} from '@viro-community/react-viro';

const MyScene = props => {
  let data = props.sceneNavigator.viroAppProps;

  const [text, setText] = useState('Initializing AR...');

  function onInitialized(state, reason) {
    console.log('guncelleme', state, reason);
    setText('Hello World!');
  }

  // material 생성
  ViroMaterials.createMaterials({
    block: {
      diffuseTexture: require('../assets/block-texture.jpg'),
    },
  });

  // 애니메이션
  ViroAnimations.registerAnimations({
    rotate: {
      duration: 2500,
      properties: {
        rotateZ: '+=45',
      },
    },
  });

  return (
    <ViroARScene onTrackingUpdated={onInitialized}>
      <ViroAmbientLight color="#ffffff" />
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
      )}
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
        autofocus={true}
        initialScene={{
          scene: MyScene,
        }}
        viroAppProps={{object: object}}
        style={styles.f1}
      />
      <View style={styles.controlsView}>
        <TouchableOpacity onPress={() => setObject('dog')}>
          <Text style={styles.text}>Display Dog</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setObject('cat')}>
          <Text style={styles.text}>Display Cat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default ARMapView;
