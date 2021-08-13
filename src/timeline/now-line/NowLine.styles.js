import {StyleSheet} from 'react-native';

const circleSize = 8;
const lineWidth = 1;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 2,
    borderTopWidth: lineWidth,
    width: '100%',
    marginLeft: 53
  },
  circle: {
    position: 'absolute',
    top: -(circleSize + lineWidth) / 2,
    left: -4,
    borderRadius: 2,
    height: circleSize,
    width: circleSize
  }
});

export default styles;
