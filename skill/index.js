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

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context)
  alexa.appId = APP_ID
  alexa.registerHandlers(handlers)
  alexa.execute()
}

const handlers = {
  'LaunchRequest': function () { this.emit('GetReleases') },
  'GetReleases': function () {
    let speechOutput = ''
    const { slots } = this.event.request.intent

    let timeMoment = moment().week()
    let timeFilter = 'week'

    if (slots.TimePeriod.value) {
      timeMoment = moment(slots.TimePeriod.value)
    }
    if (!timeMoment.isValid()) {
      askDateInvalid()
    } else {
      // Date is Vaild, determine what type of date user gave
      const timeFormat = timeMoment._f
      if (!timeFormat) {
        if (timeMoment._i.length === 4 && parseInt(timeMoment)) {
          // Date was given as a year
          timeFilter = 'year'
        }
      } else {
        askDateInvalid()
      } else {
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
    const timeBeginFilter = timeMoment.startOf(timeFilter)
    const timeEndFilter = timeMoment.endOf(timeFilter)

    let releaseResults = {}
    if (slots.Service.value) {
      releaseResults = filterReleasesOfService(
        localReleases, timeBeginFilter, timeEndFilter, slots.Service.value
      )
      if (releaseResults.length < 1) {
        askNoReleasesForTime()
      } else {
        tellReleases(releaseResults)
      }
    } else {
      releaseResults = filterReleases(
        localReleases, timeBeginFilter, timeEndFilter
      )
      if (releaseResults.length < 1) {
        askNoReleasesForTime()
      }
      if (!slots.NumberToRead.value) {
        tellReleasesAskForNumber(
          releaseResults.length, timeMoment.format(), this.event.request.intent
        )
      } else {
        tellReleases(
          releaseResults.slice(0, slots.NumberToRead.value)
        )
      }
    }
  },
  'GetReleaseDate': function () {
    const { slots } = this.event.request.intent
    const slotVals = Object.keys(slots).map(slot => slots[slot].value)
    const slotList = slotVals.join(', ')
    this.emit(':tell', slotList)
  },
  'AMAZON.HelpIntent': function () {
    const speechOutput = HELP_MESSAGE
    const reprompt = HELP_REPROMPT
    this.emit(':ask', speechOutput, reprompt)
  },
  'AMAZON.CancelIntent': function () { this.emit(':tell', STOP_MESSAGE) },
  'AMAZON.StopIntent': function () { this.emit(':tell', STOP_MESSAGE) }
}

// ALEXA SPEACH EMITTERS
const askDateInvalid = function() {
  const speechOutput = 'Date Invalid. Ask again.'
  this.emit(':ask', speechOutput, speechOutput)
}
const askNoReleasesForTime = function() {
  const speechOutput = 'There are no releases for that time period. You can ask for new releases for a different time period.'
  const repromptSpeech = 'You can ask for new releases for a different time period.'
  this.emit(':ask', speechOutput, repromptSpeech)
}
const tellReleasesAskForNumber = function(number, timePeriod, originalIntent) {
  const speechOutput = `There are ${number} new releases ${timePeriod}. How many would you like to hear?`
  const repromptSpeech = `How many of ${timePeriod}'s new releases would you like to hear?`
  this.emit(':elicitSlot', 'NumberToRead', speechOutput, repromptSpeech, originalIntent)
}
const tellReleases = function(releases) {
  const speechOutput = Object.keys(releases).join(', ')
  this.emit(':tell', speechOutput)
}

// UTILITY FUNCTIONS
const rightTwo = (str) => str.substring(str.length - 2)

const filterReleases(releases, start, end) => {
  const filtered = []
  Object.keys(releases).forEach(service => {
    filtered.concat(filterReleasesOfService(releases, start, end, service))
  })
  return filtered
}

const filterReleasesOfService = (releases, start, end, service) => {
  const focus = releases[service]
  const filtered = Object.keys(focus)
    .filter(series => moment(focus[series]).isBetween(start, end, null, '[]'))
    .sort((a, b) => {
      const compare = moment(focus[a]).isSameOrBefore(focus[b])
      return (!compare * -1) + (compare * 1) // 1 for true, -1 for false
    })
    .reduce((obj, key) => {
      obj[key] = focus[key]
      return obj
    }, [])
  return filtered
}
