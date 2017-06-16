class Release {
  constructor(name, date, service, releaseType) {
    this.name = name
    this.date = date
    this.service = service
    this.releaseType = releaseType
  }

  valid() {
    const attrs = Object.keys(this)
      .filter(key => key !== 'date')
      .map(key => this[key])
    const v = valid_str_attrs(attrs) && valid_date_attr(this.date)
    return v
  }
  worthy() {
    // return false if release is not a tv show with an identifiable release date
    return true
  }
}

// Vailidity Checks
const valid_string = (val) => (typeof val === 'string' || val instanceof String)
const lengthy = (val) => (val.length > 0)
const valid_attribute = (val) => (valid_string(val) && lengthy(val))
const valid_str_attrs = (attrs) => (attrs.every(valid_attribute))
const valid_date_attr = (attr) => (
  Object.prototype.toString.call(attr) === '[object Date]'
)

module.exports = Release
