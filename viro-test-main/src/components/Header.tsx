import React from 'react';
import {Text, View, TouchableHighlight} from 'react-native';
import {WithLocalSvg} from 'react-native-svg';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import styled from 'styled-components/native';

// Icons
const Notifi = require('../assets/icons/notification.svg');
const Setting_icon = require('../assets/icons/setting.svg');
const logo = require('../assets/logo.svg');

// Styled component
const HeaderContainer = styled.View`
  flex-direction: row;
  height: 48px;
  align-items: center;
  justify-content: space-between;
  padding-left: 16px;
  padding-right: 8px;
`;

const IconContainer = styled.View`
  flex-direction: row;
`;

const IconArea = styled.TouchableOpacity`
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
`;

const LogoArea = styled(IconArea)`
  height: auto;
`;

const Header = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <HeaderContainer>
      <LogoArea onPress={() => navigation.navigate('Home')}>
        <WithLocalSvg asset={logo} height={24} />
      </LogoArea>
      <IconContainer>
        <IconArea
          onPress={() => navigation.navigate('Notification')}
          activeOpacity={0.6}>
          <WithLocalSvg asset={Notifi} width={24} height={24} />
        </IconArea>
        <IconArea
          onPress={() => navigation.navigate('Setting')}
          activeOpacity={0.6}>
          <WithLocalSvg asset={Setting_icon} width={24} height={24} />
        </IconArea>
      </IconContainer>
    </HeaderContainer>
  );
};

export default Header;
