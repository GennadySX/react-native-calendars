// @flow
import _ from 'lodash';
import XDate from 'xdate';
import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  PanResponder,
  Vibration
} from 'react-native';
import {TouchableWithoutFeedback as TouchableButton} from 'react-native-gesture-handler';
import styleConstructor from './style';
import populateEvents from './Packer';
import {isToday} from '../dateutils';
import NowLine from './now-line/NowLine';
import asCalendarConsumer from '../expandableCalendar/asCalendarConsumer';
import GestureRecognizer from 'react-native-swipe-gestures';

const LEFT_MARGIN = 60 - 1;
const TEXT_LINE_HEIGHT = 17;

function range(from, to) {
  return Array.from(Array(to), (_, i) => from + i);
}

let {width: dimensionWidth} = Dimensions.get('window');

type Event = {
  start: string;
  end: string;
  title: string;
  summary: string;
  color: string;
};

type TimelineProps = {
  start?: number;
  end?: number;
  context: any;
  eventTapped: (event: Event) => {};
  blankSpaceTapped: (index: number) => {};
  onTimeIntervalSelected: (start: number, end: number) => {};
  renderEvent: () => {};
  onScroll: () => {};
  format24h?: boolean;
  styles?: ViewStyle;
  events?: Event[];
};

const Timeline = ({
  start = 0,
  end = 24,
  context,
  onScroll,
  renderEvent,
  eventTapped,
  onTimeIntervalSelected,
  blankSpaceTapped,
  format24h = true,
  styles,
  events
}: TimelineProps) => {
  const calendarHeight = (end - start) * 100;
  const offset = calendarHeight / (end - start);
  const style = styleConstructor(styles, calendarHeight);
  let _scrollView = useRef();
  let eventsRef = useRef(events);

  const width = dimensionWidth - LEFT_MARGIN;
  const packedEventsCalculated = useCallback(() => populateEvents(events, width, start), [events, start]);
  let initPosition = _.min(_.map(packedEventsCalculated, 'top')) - offset;
  const verifiedInitPosition = initPosition < 0 ? 0 : initPosition;

  const [_scrollY, set_ScrollY] = useState<number>(verifiedInitPosition);
  const [packedEvents, setPackedEvents] = useState<any>(packedEventsCalculated);
  const [clickedIndex, setClickedIndex] = useState<number>(-1);
  const [selectedTopTimeIndex, setSelectedTopTimeIndex] = useState<number>(-1);
  const [selectedBottomTimeIndex, setSelectedBottomTimeIndex] = useState<number>(-1);
  const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);

  const height = useRef(offset);

  const heightAnim = useRef(new Animated.Value(height.current)).current;

  const panTopButton = useRef(new Animated.ValueXY()).current;
  const panBottomButton = useRef(new Animated.ValueXY()).current;

  const topButtonPosition = useRef(new Animated.Value(-7)).current;
  const bottomButtonPosition = useRef(new Animated.Value(height.current - 9)).current;

  const panTopButtonResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (_, gestureState) => {
          setScrollEnabled(false);
          Vibration.vibrate(100);
          panTopButton.setOffset({
            x: panTopButton.x._value,
            y: panTopButton.y._value
          });
        },
        onPanResponderMove: (_, gestureState) => {
          if (heightAnim._value > 25) {
            selectedBottomTimeIndex === -1
              ? setSelectedTopTimeIndex(
                  Math.round((clickedIndex * offset + gestureState.dy - 25 - height.current + 100) / 25)
                )
              : setSelectedTopTimeIndex(
                  Math.round((selectedBottomTimeIndex * 25 + gestureState.dy - height.current) / 25)
                );
            panTopButton.setValue({
              x: gestureState.dx,
              y: gestureState.dy
            });
            heightAnim.setValue(height.current - gestureState.dy);
            bottomButtonPosition.setValue(height.current - gestureState.dy - 9);
          } else {
            if (height.current - gestureState.dy > 25) heightAnim.setValue(height.current - gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          setScrollEnabled(true);
          height.current = height.current - gestureState.dy;
          panTopButton.flattenOffset();
          onTimeIntervalSelected && onTimeIntervalSelected(selectedTopTimeIndex, selectedBottomTimeIndex);
        },
        onPanResponderTerminationRequest: () => false
      }),
    [clickedIndex, height.current, selectedBottomTimeIndex]
  );

  const panBottomButtonResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setScrollEnabled(false);
          Vibration.vibrate(100);
          panBottomButton.setOffset({
            x: panBottomButton.x._value,
            y: panBottomButton.y._value
          });
        },
        onPanResponderMove: (_, gestureState) => {
          if (heightAnim._value > 25) {
            selectedTopTimeIndex === -1
              ? setSelectedBottomTimeIndex(Math.round((offset * (clickedIndex + 1) + gestureState.dy - 25) / 25))
              : setSelectedBottomTimeIndex(
                  Math.floor((selectedTopTimeIndex * 25 + height.current + gestureState.dy) / 25)
                );
            panBottomButton.setValue({
              x: gestureState.dx,
              y: gestureState.dy
            });
            heightAnim.setValue(height.current + gestureState.dy);
            bottomButtonPosition.setValue(height.current + gestureState.dy - 9);
          } else {
            if (height.current + gestureState.dy > 25) heightAnim.setValue(height.current + gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          setScrollEnabled(true);
          height.current = height.current + gestureState.dy;
          panBottomButton.flattenOffset();
          onTimeIntervalSelected && onTimeIntervalSelected(selectedTopTimeIndex, selectedBottomTimeIndex);
        },
        onPanResponderTerminationRequest: () => false
      }),
    [clickedIndex, height.current, selectedTopTimeIndex]
  );

  const scrollToFirst = () => {
    setTimeout(() => {
      if (_scrollY && _scrollView) {
        _scrollView.scrollTo({
          x: 0,
          y: _scrollY,
          animated: true
        });
      }
    }, 1);
  };

  useEffect(() => {
    if (eventsRef.current !== events) {
      setPackedEvents(populateEvents(events, width, start));
      eventsRef.current = events;
      scrollToFirst && scrollToFirst();
    }
  }, [events, start, scrollToFirst]);

  const onBlankSpaceTapped = (index: number) => {
    setClickedIndex(clickedIndex === index ? -1 : index);
    setSelectedTopTimeIndex(clickedIndex === index ? -1 : 4 * index);
    setSelectedBottomTimeIndex(clickedIndex === index ? -1 : 4 * (index + 1));
    height.current = offset;
    heightAnim.setValue(offset);
    bottomButtonPosition.setValue(offset - 8);
    index && panTopButton.y.setValue(0);
    blankSpaceTapped && blankSpaceTapped(clickedIndex === index ? -1 : index);
  };

  const _renderLines = () => {
    const EVENT_DIFF = 20;

    const {date} = context;

    return range(start, end + 1).map((i, index) => {
      return [
        i === start ? null : (
          <View key={`line${i}`} style={[style.line, {top: offset * index, width: dimensionWidth - EVENT_DIFF}]} />
        ),
        isToday(date) && <NowLine offset={offset / 2} key={`nowLine${i}`} color={'#DD6390'} />,
        <View
          key={`lineHalf${i}`}
          style={[style.line, {top: offset * (index + 0.5), width: dimensionWidth - EVENT_DIFF}]}
        />,
        <TouchableWithoutFeedback key={`frame_${i}`} onPress={() => onBlankSpaceTapped(index)}>
          <Animated.View
            style={[
              style.blankSpaceBorder,
              // eslint-disable-next-line react-native/no-inline-styles
              {
                top: offset * index,
                width: dimensionWidth - LEFT_MARGIN - 10,
                marginLeft: LEFT_MARGIN,
                borderColor: clickedIndex === index ? '#DD6390' : 'transparent',
                height: heightAnim,
                zIndex: clickedIndex === index ? 1000 : 1
              },
              {transform: [{translateY: panTopButton.y}]}
            ]}
          >
            {clickedIndex === index && (
              <Animated.View
                style={[
                  style.dotButtonLeft,
                  {
                    top: topButtonPosition
                  }
                ]}
                {...panTopButtonResponder.panHandlers}
              />
            )}
            {clickedIndex === index && (
              <Animated.View
                style={[
                  style.dotButtonRight,
                  {
                    top: bottomButtonPosition
                  }
                ]}
                {...panBottomButtonResponder.panHandlers}
              />
            )}
          </Animated.View>
        </TouchableWithoutFeedback>,
        <View key={`lineHorizontal${i}`} style={[style.lineHorizontal, {top: offset * (index + 0.5), width: offset}]} />
      ];
    });
  };

  const _renderEvents = () => {
    let events = packedEvents.map((event, i: number) => {
      const style = {
        left: event.left,
        height: event.height,
        width: event.width,
        top: event.top,
        backgroundColor: event.color ? event.color : '#FCF3F7'
      };

      // Fixing the number of lines for the event title makes this calculation easier.
      // However it would make sense to overflow the title to a new line if needed
      const numberOfLines = Math.floor(event.height / TEXT_LINE_HEIGHT);
      const formatTime = format24h ? 'HH:mm' : 'hh:mm A';

      return (
        <View style={[style.event, style]} key={`event${i}`}>
          <TouchableButton activeOpacity={0.9} onPress={() => eventTapped && eventTapped(event)} key={i}>
            {renderEvent ? (
              renderEvent(event)
            ) : (
              <View>
                <Text numberOfLines={1} style={style.eventTitle}>
                  {event.title || 'Event'}
                </Text>
                {numberOfLines > 1 ? (
                  <Text numberOfLines={numberOfLines - 1} style={[style.eventSummary]}>
                    {event.summary || ' '}
                  </Text>
                ) : null}
                {numberOfLines > 2 ? (
                  <Text style={style.eventTimes} numberOfLines={1}>
                    {new XDate(event.start).toString(formatTime)} - {new XDate(event.end).toString(formatTime)}
                  </Text>
                ) : null}
              </View>
            )}
          </TouchableButton>
        </View>
      );
    });

    return <View style={{marginLeft: LEFT_MARGIN, zIndex: 2, elevation: 3, height: 1}}>{events}</View>;
  };

  const onSwipeLeft = () => {
    const value = new Date(new Date(date).getTime() + 1000 * 60 * 60 * 24);
    _.invoke(context, 'setDate', value.toISOString().split('T')[0], 'PAGE_SCROLL');
  };

  const onSwipeRight = () => {
    const value = new Date(new Date(date).getTime() - 1000 * 60 * 60 * 24);
    _.invoke(context, 'setDate', value.toISOString().split('T')[0], 'PAGE_SCROLL');
  };

  const {date} = context;
  return (
    <ScrollView
      ref={_scrollView}
      contentContainerStyle={[style.contentStyle, {width: dimensionWidth}]}
      onScroll={onScroll}
      scrollEventThrottle={100}
      scrollEnabled={scrollEnabled}
      showsVerticalScrollIndicator={false}
    >
      <GestureRecognizer
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
        config={{
          velocityThreshold: 0.5,
          directionalOffsetThreshold: 80
        }}
      >
        {/* eslint-disable-next-line react-native/no-inline-styles */}
        <View style={{height: calendarHeight, borderWidth: 1, borderColor: 'transparent'}}>
          <Times
            top={selectedTopTimeIndex}
            bottom={selectedBottomTimeIndex}
            start={start}
            end={end}
            offset={offset / 4}
            format24h={format24h}
            style={style}
          />
          {_renderLines()}
          {_renderEvents()}
        </View>
      </GestureRecognizer>
    </ScrollView>
  );
};

type TimesProps = {
  top: number;
  bottom: number;
  start: number;
  end: number;
  offset: number;
  style: any;
  format24h: boolean;
};

const Times = ({top, bottom, start, end, offset, style, format24h}: TimesProps) => {
  return (
    <View>
      {range(start, 4 * (end + 1)).map(i => {
        let timeText: string;
        let j = Math.floor(i / 4);

        if (j === start) {
          timeText = '';
        } else if (j < 10) {
          timeText = !format24h ? `0${j} AM` : `0${j}:00`;
        } else if (j >= 10 && j < 12) {
          timeText = !format24h ? `${j} AM` : `${j}:00`;
        } else if (j === 12) {
          timeText = !format24h ? `${j} PM` : `${j}:00`;
        } else if (j === 24) {
          timeText = !format24h ? '12 AM' : '23:59';
        } else {
          timeText = !format24h ? `${j - 12} PM` : `${j}:00`;
        }
        if (i % 4 === 0) {
          return (
            <Text key={`timeLabel${i}`} style={[style.timeLabel, {top: offset * i - 6}]}>
              {timeText}
            </Text>
          );
        } else {
          return (
            <Text key={`timeLabel${i}`} style={[style.timeLabel, {top: offset * j * 4 + 19 + 25 * ((i % 4) - 1)}]}>
              {top === i || bottom === i
                ? `${j < 10 ? `0${j}` : j}:${i % 4 === 1 ? '15' : i % 4 === 2 ? '30' : '45'}`
                : ''}
            </Text>
          );
        }
      })}
    </View>
  );
};

export default React.memo(
  asCalendarConsumer(Timeline),
  (prevProps, nextProps) => prevProps.events.length !== nextProps.events.length
);
