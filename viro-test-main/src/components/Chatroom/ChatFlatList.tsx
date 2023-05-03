import React from 'react';
import {FlatList, View} from 'react-native';
import MessageItem from './MessageItem';

import {MessageData} from '../../types/index';

type ChatFlatListProp = {
  data: MessageData[];
};

function ChatFlatList({data}: ChatFlatListProp) {
  return (
    <View>
      <FlatList
        data={data}
        renderItem={({item}) => <MessageItem message={item} />}
      />
    </View>
  );
}

export default ChatFlatList;
