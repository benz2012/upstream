'use strict'
const Alexa = require('alexa-sdk')
const moment = require('moment')

const APP_ID = 'amzn1.ask.skill.20b56d1a-0616-4c72-90d5-34a061f0b873'
const SKILL_NAME = 'Upstream'
const HELP_MESSAGE = "You can say, what's coming out this week, or, you can say exit. What can I help you with?"
const HELP_REPROMPT = 'What can I help you with?'
const STOP_MESSAGE = 'Goodbye!'

const localReleases = {
  "netflix": {
    "GLOW": "2017-06-23T04:00:00.000Z",
    "Castlevania": "2017-07-07T04:00:00.000Z",
    "Friends From College": "2017-07-14T04:00:00.000Z",
    "Gypsy": "2017-06-30T04:00:00.000Z",
    "El Chapo": "2017-06-16T04:00:00.000Z",
    "The Ranch": "2017-06-16T04:00:00.000Z",
    "Ozark": "2017-07-21T04:00:00.000Z"
  }
}

const defaultSlots = {
  "TimePeriod": {
    "name": "TimePeriod"
  },
  "Service": {
    "name": "Service"
  },
  "NumberToRead": {
    "name": "NumberToRead"
  }
}

exports.handler = function (event, context, callback) {
  const alexa = Alexa.handler(event, context)
  alexa.appId = APP_ID
  alexa.registerHandlers(handlers)
  alexa.execute()
}

const handlers = {
  'LaunchRequest': function () {
    console.log('about to emit trigger for GetReleases')
    this.emit('GetReleases')
  },
  'GetReleases': function () {
    console.log(this.event.request)
    let slots = null
    if (!this.event.request.intent) {
      slots = defaultSlots
    } else {
      if (!this.event.request.intent.slots) {
        slots = defaultSlots
      } else {
        slots = this.event.request.intent.slots
      }
    }

    let timeMoment = moment(moment().isoWeekYear() + '-W' + moment().isoWeek())
    let timeFilter = 'week'
    const time = slots.TimePeriod.value
    if (time) {
      if (time.length === 4 && parseInt(time)) {
        // Date was given as a year, which is invalid acording to ISO format
        timeMoment = moment(slots.TimePeriod.value + '-01')
        timeFilter = 'year'
      } else {
        timeMoment = moment(slots.TimePeriod.value)
      }
    }
    if (!timeMoment.isValid()) {
      const speechOutput = 'Date Invalid. Ask again.'
      console.log('about to emit :ask \n with content: \n ' + speechOutput)
      this.emit(':ask', speechOutput, speechOutput)
    } else {
      // Date is Vaild, determine what type of date user gave
      const timeFormat = timeMoment._f
      if (!timeFormat) {
        const speechOutput = 'Date Invalid. Ask again.'
        console.log('about to emit :ask \n with content: \n ' + speechOutput)
        this.emit(':ask', speechOutput, speechOutput)
      } else {
        if (timeFilter !== 'year') {
          if (rightTwo(timeFormat) === 'MM') {
            // Date was given as a month
            timeFilter = 'month'
          } else if (rightTwo(timeFormat) === 'WW') {
            // Date was given as a week
            timeFilter = 'week'
          } else if (rightTwo(timeFormat) === 'DD') {
            // Date was given as a day
            timeFilter = 'day'
          }
        }
      }
    }
    const timeBeginFilter = moment(timeMoment).startOf(timeFilter)
    const timeEndFilter = moment(timeMoment).endOf(timeFilter)

    if (slots.Service.value) {
      const releaseResults = filterReleasesOfService(
        localReleases, timeBeginFilter, timeEndFilter, slots.Service.value
      )
      if (releaseResults.length < 1) {
        const speechOutput = `I found no releases ${timeFrame(timeMoment, timeFilter)}. Try a different Time Frame.`
        const repromptSpeech = 'You can ask about new releases for a different time frame. '
        console.log('about to emit :ask \n with content: \n ' + speechOutput)
        this.emit(':ask', speechOutput, repromptSpeech)
      } else {
        const joined = releaseResults.join(', ')
        const speechOutput = releaseResults.length > 1 ? addAnd(joined) : joined
        console.log('about to emit :tell \n with content: \n ' + speechOutput)
        this.emit(':tell', speechOutput)
      }
    } else {
      const releaseResults = filterReleases(
        localReleases, timeBeginFilter, timeEndFilter
      )
      if (releaseResults.length < 1) {
        const speechOutput = `I found no releases ${timeFrame(timeMoment, timeFilter)}. Try a different Time Frame.`
        const repromptSpeech = 'You can ask about new releases for a different time frame. '
        console.log('about to emit :ask \n with content: \n ' + speechOutput)
        this.emit(':ask', speechOutput, repromptSpeech)
      }
      if (!slots.NumberToRead.value) {
        const frame = timeFrame(timeMoment, timeFilter)
        const originalIntent = this.event.request.intent
        const speechOutput = `There are <emphasis>${releaseResults.length}</emphasis> new releases ${frame}. How many would you like to hear?`
        const repromptSpeech = `How many of new releases would you like to hear?`
        console.log('about to emit :elicitSlot \n with content: \n ' + speechOutput)
        this.emit(':elicitSlot', 'NumberToRead', speechOutput, repromptSpeech, originalIntent)
      } else {
        const trimmed = releaseResults.slice(0, slots.NumberToRead.value).join(', ')
        const speechOutput = slots.NumberToRead.value > 1 ? addAnd(trimmed) : trimmed
        console.log('about to emit :tell \n with content: \n ' + speechOutput)
        this.emit(':tell', speechOutput)
      }
    }
  },
  'GetReleaseDate': function () {
    const { slots } = this.event.request.intent
    if (!slots.Series.value) {
      const originalIntent = this.event.request.intent
      const speechOutput = `I didn't understand. Which series are you asking for?`
      const repromptSpeech = `Which series are you asking for?`
      console.log('about to emit :elicitSlot \n with content: \n ' + speechOutput)
      this.emit(':elicitSlot', 'Series', speechOutput, repromptSpeech, originalIntent)
    } else {
      const allReleases = flatten(localReleases)
      const found = Object.keys(allReleases)
        .filter(series => series.toLowerCase() === slots.Series.value)
      if (found.length > 0) {
        const foundSeries = found[0]
        const when = moment(allReleases[foundSeries]).calendar(null, {
          sameDay: '[releases Today]',
          nextDay: '[releases Tomorrow]',
          nextWeek: '[releases this] dddd, MMMM Do',
          lastDay: '[released Yesterday]',
          lastWeek: '[released last] dddd, MMMM Do',
          sameElse: function (now) {
            if (this.isBefore(now)) {
              return '[released on] MM/DD/YYYY'
            } else {
              return '[releases on] MM/DD/YYYY'
            }
          }
        })
        const speechOutput = `<emphasis>${slots.Series.value}</emphasis> ${when}`
        console.log('about to emit :tell \n with content: \n ' + speechOutput)
        this.emit(':tell', speechOutput)
      } else {
        const speechOutput = `I'm sorry, I don't know when that show releases.`
        console.log('about to emit :tell \n with content: \n ' + speechOutput)
        this.emit(':tell', speechOutput)
      }
    }
  },
  'AMAZON.HelpIntent': function () {
    const speechOutput = HELP_MESSAGE
    const reprompt = HELP_REPROMPT
    console.log('about to emit :ask \n with content: \n ' + speechOutput)
    this.emit(':ask', speechOutput, reprompt)
  },
  'AMAZON.CancelIntent': function () {
    const speechOutput = STOP_MESSAGE
    console.log('about to emit :tell \n with content: \n ' + speechOutput)
    this.emit(':tell', speechOutput) },
  'AMAZON.StopIntent': function () {
    const speechOutput = STOP_MESSAGE
    console.log('about to emit :tell \n with content: \n ' + speechOutput)
    this.emit(':tell', speechOutput) },
  'Unhandled': function () {
    const speechOutput = "I didn't understand that."
    console.log('about to emit :tell \n with content: \n ' + speechOutput)
    this.emit(':tell', speechOutput) }
}


// UTILITY FUNCTIONS
const rightTwo = (str) => str.substring(str.length - 2)
const leftTwo = (str) => str.substring(0, 2)

const timeFrame = (m, granularity) => {
  const timeAddKey = granularity === 'month' ? 'M' : granularity.substring(0, 1)
  if (m.isSame(moment.now(), granularity)) {
    return `this ${granularity}`
  } else if (m.isBefore(moment.now())) {
    if (moment(m).add(1, timeAddKey).isSame(moment.now(), granularity)) {
      return `last ${granularity}`
    }
  } else if (m.isAfter(moment.now())) {
    if (moment(m).subtract(1, timeAddKey).isSame(moment.now(), granularity)) {
      return `next ${granularity}`
    }
  }
  if (granularity === 'month' && m.isSame(moment.now(), 'year')) {
    return `in ${m.format('MMMM')}`
  } else if (granularity === 'year') {
    return `in ${m.format('YYYY')}`
  }
  return `for that ${granularity}`
}

const filterReleases = (releases, start, end) => {
  const filtered = []
  Object.keys(releases).forEach(service => {
    Array.prototype.push.apply(filtered, filterReleasesOfService(releases, start, end, service))
  })
  console.log(filtered)
  return filtered
}

const filterReleasesOfService = (releases, start, end, service) => {
  const focus = releases[service.toLowerCase()]
  const filtered = Object.keys(focus)
    .filter(series => moment(focus[series]).isBetween(start, end, null, '[]'))
    .sort((a, b) => {
      if (moment(focus[a]).isBefore(focus[b])) { return -1 }
      if (moment(focus[a]).isAfter(focus[b])) { return 1 }
      return 0
    })
  console.log(filtered)
  return filtered
}

const flatten = (o) => Object.assign(
  {},
  ...function _flatten(o) {
    return [].concat(...Object.keys(o)
      .map(k =>
        typeof o[k] === 'object' ?
          _flatten(o[k]) :
          ({[k]: o[k]})
      )
    )
  }(o)
)

const addAnd = (str) => {
  const begining = str.substring(0, str.lastIndexOf(','))
  const ending = str.substring(str.lastIndexOf(',') + 2)
  return `${begining} and ${ending}`
}
