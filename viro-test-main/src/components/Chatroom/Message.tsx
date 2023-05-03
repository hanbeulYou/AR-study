import React from 'react';
import {Text, View} from 'react-native';

type MessageProp = {
  text: string;
};

function Message({text}: MessageProp) {
  return (
    <View>
      <Text>{text}</Text>
    </View>
  );
}

export default Message;
