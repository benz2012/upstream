const request = require('request')

function server_rendered_html(url, callback) {
  request(url, (err, res, body) => {
    if (err) { callback(err, null) }
    if (res) { console.log('Request status:', res.statusCode) }
    if (!body) { callback('no html was receieved', null) }
    callback(null, body)
  })
}

module.exports = server_rendered_html
