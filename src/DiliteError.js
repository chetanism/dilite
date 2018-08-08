class DiliteError extends Error {
  constructor(msg) {
    super(`Dilite: ${msg}`)
  }
}

module.exports = DiliteError
