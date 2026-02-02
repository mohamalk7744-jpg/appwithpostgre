
import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { View, ViewStyle } from 'react-native';

interface Props {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function KhatthaLogo({ size = 100, color = "#7c3aed", style }: Props) {
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
      >
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0.7" />
          </LinearGradient>
        </Defs>
        
        {/* الدائرة الخلفية الناعمة */}
        <Circle cx="100" cy="100" r="90" fill={color} fillOpacity="0.05" />
        
        {/* أيقونة القلم الذكي والمسار */}
        <Path
          d="M60 140L140 60M140 60L150 70M140 60L130 50"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* مسار الخطة (الخطوط المتقطعة التي تمثل التخطيط) */}
        <Path
          d="M50 160C80 160 100 140 120 120C140 100 160 100 180 100"
          stroke={color}
          strokeWidth="6"
          strokeDasharray="10 10"
          strokeLinecap="round"
          opacity="0.4"
        />
        
        {/* رأس القلم (النقطة الذكية) */}
        <Circle cx="60" cy="140" r="10" fill={color} />
        
        {/* ومضة الذكاء الاصطناعي (النجوم الصغيرة) */}
        <Path
          d="M160 40L165 45L160 50L155 45L160 40Z"
          fill={color}
        />
        <Path
          d="M175 60L178 63L175 66L172 63L175 60Z"
          fill={color}
          opacity="0.6"
        />
      </Svg>
    </View>
  );
}
