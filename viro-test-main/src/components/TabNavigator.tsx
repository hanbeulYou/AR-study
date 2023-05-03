import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Home from '../pages/Home';
import CreateMoim from '../pages/CreateMoim';
import MyPage from '../pages/MyPage';
import styled from 'styled-components/native';
import {WithLocalSvg} from 'react-native-svg';
import {
  SafeAreaView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
} from 'react-native';

// Styled component
const CreateIcon = styled.TouchableOpacity`
  padding-top: 0;
`;

// Tab Icons
const home_active = require('../assets/tabIcons/home_active.svg');
const home_inactive = require('../assets/tabIcons/home_inactive.svg');
const mypage_active = require('../assets/tabIcons/mypage_active.svg');
const mypage_inactive = require('../assets/tabIcons/mypage_inactive.svg');

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <SafeAreaView style={{flex: 1}}>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({focused, color, size}) => {
            if (route.name === 'Home')
              return (
                <WithLocalSvg asset={focused ? home_active : home_inactive} />
              );
            if (route.name === 'Mypage')
              return (
                <WithLocalSvg
                  asset={focused ? mypage_active : mypage_inactive}
                />
              );
          },
          headerShown: false,
          tabBarActiveTintColor: '#5968F2',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            height: 68,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 8,
            paddingBottom: 8,
          },
          tabBarLabelStyle: {
            fontSize: 8,
          },
        })}>
        <Tab.Screen
          name="Home"
          component={Home}
          options={{tabBarLabel: '홈'}}
        />
        <Tab.Screen
          name="Create"
          component={CreateMoim}
          options={({navigation}) => ({
            tabBarButton: props => (
              <CreateIcon
                {...props}
                onPress={() => navigation.navigate('CreateMoim')}
                activeOpacity={0.6}>
                <WithLocalSvg
                  asset={require('../assets/tabIcons/moim_create.svg')}
                />
              </CreateIcon>
            ),
          })}
        />
        <Tab.Screen
          name="Mypage"
          component={MyPage}
          options={{tabBarLabel: '마이페이지'}}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

export default TabNavigator;
