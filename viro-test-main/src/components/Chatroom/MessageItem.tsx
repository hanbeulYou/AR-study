import React from 'react';
import {Text, View} from 'react-native';
import UserProfile from './UserProfile';
import Message from './Message';

// types
import {MessageData} from '../../types';

type MessageItemProp = {
  message: MessageData;
};

function MessageItem({message}: MessageItemProp) {
  return (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <UserProfile userImg={message.userImg} />
      <View style={{marginLeft: 12}}>
        <Text>{message.userName}</Text>
        <Message text={message.text} />
      </View>
    </View>
  );
}

export default MessageItem;
