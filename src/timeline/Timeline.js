// @flow
import _ from 'lodash';
import PropTypes from 'prop-types';
import XDate from 'xdate';
import React from 'react';
import {View, Text, ScrollView, TouchableOpacity, Dimensions, TouchableWithoutFeedback} from 'react-native';
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

class Timeline extends React.PureComponent {
  static propTypes = {
    start: PropTypes.number,
    end: PropTypes.number,
    eventTapped: PropTypes.func,
    blankSpaceTapped: PropTypes.func,
    format24h: PropTypes.bool,
    events: PropTypes.arrayOf(
      PropTypes.shape({
        start: PropTypes.string.isRequired,
        end: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        summary: PropTypes.string.isRequired,
        color: PropTypes.string
      })
    ).isRequired
  };

  static defaultProps = {
    start: 0,
    end: 24,
    events: [],
    format24h: true
  };

  constructor(props) {
    super(props);

    const {start, end} = this.props;
    this.calendarHeight = (end - start) * 100;

    this.style = styleConstructor(props.styles, this.calendarHeight);

    const width = dimensionWidth - LEFT_MARGIN;
    const packedEvents = populateEvents(props.events, width, start);
    let initPosition = _.min(_.map(packedEvents, 'top')) - this.calendarHeight / (end - start);
    const verifiedInitPosition = initPosition < 0 ? 0 : initPosition;

    this.state = {
      _scrollY: verifiedInitPosition,
      packedEvents,
      clickedIndex: -1
    };
  }

  componentDidUpdate(prevProps) {
    const width = dimensionWidth - LEFT_MARGIN;
    const {events: prevEvents, start: prevStart = 0} = prevProps;
    const {events, start = 0} = this.props;

    if (prevEvents !== events || prevStart !== start) {
      this.setState({
        packedEvents: populateEvents(events, width, start)
      });
    }
  }

  componentDidMount() {
    this.props.scrollToFirst && this.scrollToFirst();
  }

  scrollToFirst() {
    setTimeout(() => {
      if (this.state && this.state._scrollY && this._scrollView) {
        this._scrollView.scrollTo({
          x: 0,
          y: this.state._scrollY,
          animated: true
        });
      }
    }, 1);
  }

  _onBlankSpaceTapped(index) {
    this.setState({clickedIndex: this.state.clickedIndex === index ? -1 : index});
    if (this.props.blankSpaceTapped) {
      this.props.blankSpaceTapped(index);
    }
  }

  _renderLines() {
    const {format24h, start = 0, end = 24} = this.props;
    const {clickedIndex} = this.state;
    const offset = this.calendarHeight / (end - start);
    const EVENT_DIFF = 20;

    const {date} = this.props.context;

    return range(start, end + 1).map((i, index) => {
      let timeText;

      if (i === start) {
        timeText = '';
      } else if (i < 10) {
        timeText = !format24h ? `0${i} AM` : `0${i}:00`;
      } else if (i >= 10 && i < 12) {
        timeText = !format24h ? `${i} AM` : `${i}:00`;
      } else if (i === 12) {
        timeText = !format24h ? `${i} PM` : `${i}:00`;
      } else if (i === 24) {
        timeText = !format24h ? '12 AM' : '23:59';
      } else {
        timeText = !format24h ? `${i - 12} PM` : `${i}:00`;
      }

      return [
        <Text key={`timeLabel${i}`} style={[this.style.timeLabel, {top: offset * index - 6}]}>
          {timeText}
        </Text>,
        i === start ? null : (
          <View key={`line${i}`} style={[this.style.line, {top: offset * index, width: dimensionWidth - EVENT_DIFF}]} />
        ),
        isToday(date) && <NowLine offset={offset / 2} />,
        <TouchableWithoutFeedback key={`touch${i}`} onPress={() => this._onBlankSpaceTapped(index)}>
          <View
            style={[
              this.style.blankSpaceBorder,
              // eslint-disable-next-line react-native/no-inline-styles
              {
                top: offset * index,
                width: dimensionWidth - LEFT_MARGIN - 5,
                marginLeft: LEFT_MARGIN,
                borderColor: clickedIndex === index ? '#FE41C8' : 'transparent',
                height: offset
              }
            ]}
          />
        </TouchableWithoutFeedback>,
        <View
          key={`lineHalf${i}`}
          style={[this.style.line, {top: offset * (index + 0.5), width: dimensionWidth - EVENT_DIFF}]}
        />,
        <View
          key={`lineHorizontal${i}`}
          style={[this.style.lineHorizontal, {top: offset * (index + 0.5), width: offset}]}
        />
      ];
    });
  }

  _onEventTapped(event) {
    if (this.props.eventTapped) {
      this.props.eventTapped(event);
    }
  }

  _renderEvents() {
    const {packedEvents} = this.state;
    let events = packedEvents.map((event, i) => {
      const style = {
        left: event.left,
        height: event.height,
        width: event.width,
        top: event.top,
        backgroundColor: event.color ? event.color : '#FEF5EE'
      };

      // Fixing the number of lines for the event title makes this calculation easier.
      // However it would make sense to overflow the title to a new line if needed
      const numberOfLines = Math.floor(event.height / TEXT_LINE_HEIGHT);
      const formatTime = this.props.format24h ? 'HH:mm' : 'hh:mm A';

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => this._onEventTapped(this.props.events[event.index])}
          key={i}
          style={[this.style.event, style]}
        >
          {this.props.renderEvent ? (
            this.props.renderEvent(event)
          ) : (
            <View>
              <Text numberOfLines={1} style={this.style.eventTitle}>
                {event.title || 'Event'}
              </Text>
              {numberOfLines > 1 ? (
                <Text numberOfLines={numberOfLines - 1} style={[this.style.eventSummary]}>
                  {event.summary || ' '}
                </Text>
              ) : null}
              {numberOfLines > 2 ? (
                <Text style={this.style.eventTimes} numberOfLines={1}>
                  {XDate(event.start).toString(formatTime)} - {XDate(event.end).toString(formatTime)}
                </Text>
              ) : null}
            </View>
          )}
        </TouchableOpacity>
      );
    });

    return (
      <View>
        <View style={{marginLeft: LEFT_MARGIN}}>{events}</View>
      </View>
    );
  }

  onDayPress(value) {
    // {year: 2019, month: 4, day: 22, timestamp: 1555977600000, dateString: "2019-04-23"}
    _.invoke(this.props.context, 'setDate', value.toISOString().split('T')[0], 'PAGE_SCROLL');
  }

  render() {
    const {date} = this.props.context;
    return (
      <ScrollView
        ref={ref => (this._scrollView = ref)}
        contentContainerStyle={[this.style.contentStyle, {width: dimensionWidth}]}
      >
        <GestureRecognizer
          onSwipeLeft={() => this.onDayPress(new Date(new Date(date).getTime() + 1000 * 60 * 60 * 24))}
          onSwipeRight={() => this.onDayPress(new Date(new Date(date).getTime() - 1000 * 60 * 60 * 24))}
        >
          {/* eslint-disable-next-line react-native/no-inline-styles */}
          <View style={{height: this.calendarHeight, borderWidth: 1, borderColor: 'transparent'}}>
            {this._renderLines()}
            {this._renderEvents()}
          </View>
        </GestureRecognizer>
      </ScrollView>
    );
  }
}

export default asCalendarConsumer(Timeline);
