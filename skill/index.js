'use strict'
const Alexa = require('alexa-sdk')
const moment = require('moment')
const util = require('util') // for logging objects

const APP_ID = 'amzn1.ask.skill.20b56d1a-0616-4c72-90d5-34a061f0b873'
const SKILL_NAME = 'Upstream'
const HELP_MESSAGE = "You can say, what's coming out this week, or, you can say exit. What can I help you with?"
const HELP_REPROMPT = 'What can I help you with?'
const STOP_MESSAGE = 'Goodbye!'

const services = [
  'cbs',
  'acorn',
  'cinemax',
  'showtime',
  'hulu',
  'amazon',
  'hbo',
  'netflix',
]
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
  Service: {
    name: 'Service',
    confirmationStatus: 'NONE'
  },
  TimePeriod: {
    name: 'TimePeriod',
    confirmationStatus: 'NONE'
  },
  NumberToRead: {
    name: 'NumberToRead',
    confirmationStatus: 'NONE'
  }
}
const defaultIntent = {
  name: 'GetReleases',
  confirmationStatus: 'NONE',
  slots: Object.assign({}, defaultSlots)
}

exports.handler = function (event, context, callback) {
  const alexa = Alexa.handler(event, context)
  alexa.appId = APP_ID
  alexa.registerHandlers(handlers)
  alexa.execute()
}

const handlers = {
  'LaunchRequest': function () {
    // console.log('about to emit trigger for GetReleases')
    const speechOutput = `Hello, ask me about new releases for your favorite streaming service.`
    const repromptSpeech = `What release information can I get you?`
    return this.emit(':ask', speechOutput, repromptSpeech)
  },
  'GetReleases': function () {
    console.log(util.inspect(this.event.request, false, null))
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
    const timeFrameValue = timeFrame(timeMoment, timeFilter)

    if (slots.Service.value) {
      if (services.indexOf(slots.Service.value.toLowerCase()) === -1) {
        const speechOutput = `Sorry, ${slots.Service.value} is not a streaming service I can check.`
        console.log('about to emit :tell \n with content: \n ' + speechOutput)
        this.emit(':tell', speechOutput)
      }
      const releaseResults = filterReleasesOfService(
        localReleases, timeBeginFilter, timeEndFilter, slots.Service.value
      )
      if (releaseResults.length < 1) {
        const speechOutput = `I found no ${slots.Service.value} releases ${timeFrameValue}.`
        const repromptSpeech = speechOutput
        console.log('about to emit :ask \n with content: \n ' + speechOutput)
        this.emit(':ask', speechOutput, repromptSpeech)
      } else if (releaseResults.length === 1) {
        const oneRelease = releaseResults[0]
        const speechOutput = `${oneRelease}, is the only release ${timeFrameValue}`
        console.log('about to emit :tell \n with content: \n ' + speechOutput)
        this.emit(':tell', speechOutput)
        //glow is the only release this week
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
        const speechOutput = `I found no ${slots.Service.value} releases ${timeFrameValue}.`
        const repromptSpeech = speechOutput
        console.log('about to emit :ask \n with content: \n ' + speechOutput)
        this.emit(':ask', speechOutput, repromptSpeech)
      }
      if (!slots.NumberToRead.value) {
        const originalIntent = this.event.request.intent
        const speechOutput = `There are <emphasis>${releaseResults.length}</emphasis> new releases ${timeFrameValue}. How many would you like to hear?`
        const repromptSpeech = `How many new releases would you like to hear?`
        if (!originalIntent) {
          console.log('about to emit :elicitSlot \n with: \n ' + speechOutput)
          console.log('defaultIntent: ' + util.inspect(defaultIntent, false, null))
          this.emit(':elicitSlot', 'NumberToRead', speechOutput, repromptSpeech, defaultIntent)
        } else {
          console.log('about to emit :elicitSlot \n with content: \n ' + speechOutput)
          console.log('originalIntent: ' + util.inspect(originalIntent, false, null))
          this.emit(':elicitSlot', 'NumberToRead', speechOutput, repromptSpeech, originalIntent)
        }
      } else {
        let numToRead
        if (slots.NumberToRead.value) {
          numToRead = parseInt(slots.NumberToRead.value)
        } else {
          numToRead = releaseResults.length
        }
        if (numToRead === 0) {
          this.emit(':tell', 'Okay, bye.')
        }
        if (releaseResults.length === 1) {
          const speechOutput = `${releaseResults[0]}, is the only release ${timeFrameValue}`
          console.log('about to emit :tell \n with content: \n ' + speechOutput)
          this.emit(':tell', speechOutput)
        }
        const trimmed = releaseResults.slice(0, numToRead).join(', ')
        const speechOutput = slots.NumberToRead.value > 1 ? addAnd(trimmed) : trimmed
        console.log('about to emit :tell \n with content: \n ' + speechOutput)
        this.emit(':tell', speechOutput)
      }
    }
  },
  'GetReleaseDate': function () {
    console.log(util.inspect(this.event.request, false, null))
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
        const speechOutput = `I'm sorry, I don't know when ${slots.Series.value} releases.`
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
  if (!focus) { return [] }
  const filtered = Object.keys(focus)
    .filter(series => moment(focus[series]).isBetween(start, end, null, '[]'))
    .sort((a, b) => {
      if (moment(focus[a]).isBefore(focus[b])) { return -1 }
      if (moment(focus[a]).isAfter(focus[b])) { return 1 }
      return 0
    })
    // .map(series => `<emphasis>${series}</emphasis>`)
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
  return `${begining}, and ${ending}`
}
