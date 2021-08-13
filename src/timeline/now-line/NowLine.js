import React from 'react';
import {View, Animated} from 'react-native';
import PropTypes from 'prop-types';

import styles from './NowLine.styles';

const UPDATE_EVERY_MILLISECONDS = 60 * 1000; // 1 minute
const CONTENT_OFFSET = 0;

const getCurrentTop = offset => {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes * (offset / 30) + CONTENT_OFFSET;
};

class NowLine extends React.Component {
  constructor(props) {
    super(props);

    this.initialTop = getCurrentTop(this.props.offset);

    this.state = {
      currentTranslateY: new Animated.Value(0)
    };

    this.intervalCallbackId = null;
  }

  componentDidMount() {
    this.intervalCallbackId = setInterval(() => {
      const newTop = getCurrentTop(this.props.offset);
      Animated.timing(this.state.currentTranslateY, {
        toValue: newTop - this.initialTop,
        duration: 1000,
        useNativeDriver: true,
        isInteraction: false
      }).start();
    }, UPDATE_EVERY_MILLISECONDS);
  }

  componentWillUnmount() {
    if (this.intervalCallbackId) {
      clearInterval(this.intervalCallbackId);
    }
  }

  render() {
    const {color} = this.props;

    return (
      <Animated.View
        style={[
          styles.container,
          {
            top: this.initialTop,
            transform: [{translateY: this.state.currentTranslateY}],
            borderColor: color
          }
        ]}
      >
        <View
          style={[
            styles.circle,
            {
              backgroundColor: color
            }
          ]}
        />
      </Animated.View>
    );
  }
}

NowLine.propTypes = {
  offset: PropTypes.number.isRequired,
  color: PropTypes.string
};

NowLine.defaultProps = {
  color: '#333333'
};

export default React.memo(NowLine);
