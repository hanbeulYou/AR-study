export type RootStackParamList = {
  // 루트이름 : 파라미터 정의
  // [name]: params;
  Tab: undefined;
  Setting: undefined;
  Notification: undefined;
  Chatroom: {roomId: number};
};

// 단일 메시지
export type MessageData = {
  id: number;
  userName: string;
  userImg: string;
  text: string;
  created: string;
};
