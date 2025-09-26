// import React, { memo } from 'react';
// import { TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
// import { getStatusBarHeight } from 'react-native-status-bar-height';

// interface BackButtonProps {
//   goBack: () => void;
//   style?: object; // optional style prop for flexibility
// }

// const BackButton: React.FC<BackButtonProps> = ({ goBack, style }) => {
//   return (
//     <TouchableOpacity
//       onPress={goBack}
//       style={[styles.container, style]}
//       activeOpacity={0.7} // smoother touch feedback
//     >
//       <Image
//         source={require('../assets/arrow_back.png')}
//         style={styles.image}
//         resizeMode="contain"
//       />
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 10 + getStatusBarHeight() : 10, // safer for Android
//     left: 10,
//     zIndex: 10,
//   },
//   image: {
//     width: 24,
//     height: 24,
//   },
// });

// export default memo(BackButton);
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface BackButtonProps {
  goBack: () => void;
  style?: object;
}

const BackButton: React.FC<BackButtonProps> = ({ goBack, style }) => {
  return (
    <TouchableOpacity onPress={goBack} style={[styles.container, style]}>
      <Icon name="arrow-left" size={28} color="black" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {

    padding: 0,
    marginBottom: 0,
  },
});

export default BackButton;

