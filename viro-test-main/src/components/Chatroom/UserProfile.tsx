import React from 'react';
import {Image, StyleSheet, View} from 'react-native';

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 99,
    backgroundColor: 'black',
  },
});

type UserProfileProp = {
  userImg: string;
};

function UserProfile({userImg}: UserProfileProp) {
  return (
    <View>
      {/* <Image source={{uri: userImg}} style={styles.container} /> */}
      <View style={styles.container} />
    </View>
  );
}

export default UserProfile;
