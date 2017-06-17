'use strict'
const Alexa = require('alexa-sdk')
const moment = require('moment')

const APP_ID = 'amzn1.ask.skill.20b56d1a-0616-4c72-90d5-34a061f0b873'
const SKILL_NAME = 'Upstream'
const HELP_MESSAGE = "You can say what's coming this week, or, you can say exit... What can I help you with?"
const HELP_REPROMPT = 'What can I help you with?'
const STOP_MESSAGE = 'Goodbye!'

const releases = {
  "00d38e6a-acb7-4e30-a82d-99b67f992d5f": {
    "date": "2017-06-23T04:00:00.000Z",
    "name": "GLOW",
    "service": "Netlfix"
  },
  "00f35edc-2411-4fd3-99c1-307ec4c96782": {
    "date": "2017-07-07T04:00:00.000Z",
    "name": "Castlevania",
    "service": "Netlfix"
  },
  "05ee20a4-2b1f-47fa-b780-e67f6b934b7a": {
    "date": "2017-07-14T04:00:00.000Z",
    "name": "Friends From College",
    "service": "Netlfix"
  },
  "8bf242fa-b614-41a0-a9bc-0d1a8c666dbc": {
    "date": "2017-06-30T04:00:00.000Z",
    "name": "Gypsy",
    "service": "Netlfix"
  },
  "b4c90dc8-5804-4fe3-b729-e16a77c15ba4": {
    "date": "2017-06-16T04:00:00.000Z",
    "name": "El Chapo",
    "service": "Netlfix"
  },
  "bc254d7c-4345-44ba-8d72-f1f9b9697acd": {
    "date": "2017-06-16T04:00:00.000Z",
    "name": "The Ranch",
    "service": "Netlfix"
  },
  "d50a6e34-7015-4128-8b38-cd8c90893aa0": {
    "date": "2017-07-21T04:00:00.000Z",
    "name": "Ozark",
    "service": "Netlfix"
  }
}

exports.handler = function(event, context, callback) {
    const alexa = Alexa.handler(event, context)
    alexa.appId = APP_ID
    alexa.registerHandlers(handlers)
    alexa.execute()
}

const handlers = {
    'LaunchRequest': function () { this.emit('GetReleasesIntent') },
    'GetReleasesIntent': function () {
        const intentDate = this.event.request.intent.slots.Date.value
        const intentMoment = moment(intentDate)
        // console.log(intentDateObj)

        // const randomIndex = Math.floor(Math.random() * Object.keys(releases).length)
        // const randomReleaseKey = Object.keys(releases)[randomIndex]
        // const randomRelease = releases[randomReleaseKey]['name']
        // const speechOutput = "A random show releasing soon is: " + randomRelease
        this.emit(':tell', new String(intentMoment))
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = HELP_MESSAGE
        const reprompt = HELP_REPROMPT
        this.emit(':ask', speechOutput, reprompt)
    },
    'AMAZON.CancelIntent': function () { this.emit(':tell', STOP_MESSAGE) },
    'AMAZON.StopIntent': function () { this.emit(':tell', STOP_MESSAGE) }
}
