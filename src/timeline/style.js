// @flow
import {Platform, StyleSheet} from 'react-native';

// const eventPaddingLeft = 4
const leftMargin = 50 - 1;

export default function styleConstructor(theme = {}, calendarHeight) {
  let style = {
    container: {
      flex: 1,
      backgroundColor: '#ffff',
      ...theme.container
    },
    contentStyle: {
      backgroundColor: '#ffff',
      height: calendarHeight + 10,
      ...theme.contentStyle
    },
    header: {
      paddingHorizontal: 30,
      height: 50,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#E6E8F0',
      backgroundColor: '#F5F5F6',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      ...theme.header
    },
    headerTextContainer: {
      justifyContent: 'center'
    },
    headerText: {
      fontSize: 16,
      ...theme.headerText
    },
    arrow: {
      width: 15,
      height: 15,
      resizeMode: 'contain'
    },
    arrowButton: {
      width: 50,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.arrowButton
    },
    event: {
      position: 'absolute',
      backgroundColor: '#F0F4FF',
      borderRadius: 3,
      paddingLeft: 4,
      minHeight: 25,
      flex: 1,
      opacity: 1,
      paddingTop: 5,
      paddingBottom: 0,
      flexDirection: 'column',
      alignItems: 'flex-start',
      overflow: 'hidden',
      ...theme.event
    },
    eventTitle: {
      color: '#615B73',
      fontWeight: '600',
      minHeight: 15,
      ...theme.eventTitle
    },
    eventSummary: {
      color: '#615B73',
      fontSize: 12,
      flexWrap: 'wrap',
      ...theme.eventSummary
    },
    eventTimes: {
      marginTop: 3,
      fontSize: 10,
      fontWeight: 'bold',
      color: '#615B73',
      flexWrap: 'wrap',
      ...theme.eventTimes
    },
    line: {
      height: 1,
      position: 'absolute',
      left: leftMargin,
      backgroundColor: 'rgb(216,216,216)',
      ...theme.line
    },
    lineHorizontal: {
      height: 1,
      position: 'absolute',
      left: 3,
      backgroundColor: 'rgb(216,216,216)',
      transform: [{rotate: '90deg'}]
    },
    lineNow: {
      height: 1,
      position: 'absolute',
      left: leftMargin,
      backgroundColor: 'red',
      ...theme.lineNow
    },
    timeLabel: {
      position: 'absolute',
      left: 15,
      color: '#333333',
      fontSize: 10,
      fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
      fontWeight: '700',
      ...theme.timeLabel
    },
    timeLinesContainer: {borderWidth: 1, borderColor: 'transparent'},
    blankSpaceBorder: {
      position: 'absolute',
      borderWidth: 2,
      borderBottomLeftRadius: 10,
      borderTopRightRadius: 10,
      backgroundColor: 'rgba(52, 52, 52, 0.0)'
    },
    dotButtonLeft: {
      position: 'absolute',
      left: -7,
      width: 14,
      height: 14,
      backgroundColor: '#DD6390',
      borderRadius: 6,
      borderColor: 'rgb(231, 173, 195)',
      borderWidth: 3
    },
    dotButtonRight: {
      position: 'absolute',
      right: -7,
      width: 14,
      height: 14,
      backgroundColor: '#DD6390',
      borderRadius: 6,
      borderColor: 'rgb(231, 173, 195)',
      borderWidth: 3
    }
  };
  return StyleSheet.create(style);
}
