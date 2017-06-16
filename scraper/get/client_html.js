const phantom = require('phantom')

function client_rendered_html(url, callback) {
  let _ph, _page, _content;
  phantom.create().then(ph => {
    _ph = ph
    return _ph.createPage()
  }).then(page => {
    _page = page
    return _page.property('viewportSize', {width: 1920})
  }).then(() => {
    return _page.open(url)
  }).then(status => {
    console.log('Phantom status: ' + status)
    return _page.property('content')
  }).then(content => {
    _content = content
    return _page.close()
  }).then(() => {
    return _ph.exit()
  }).then(() => {
    callback(null, _content)
  })
  .catch(err => callback(err, null))
}

module.exports = client_rendered_html
