const jwt = require('jsonwebtoken')
const axios = require('axios').default

const { JWT_SECRET } = process.env

module.exports = config => async (req, res, next) => {
  console.log('[MIDDLEWARE]', 'Authenticate the user')

  // For now the authentication middleware will only support Bearer JWT Token authentication
  const authenticationString = req.headers.authorization
  if (!authenticationString) return res.status(400).json({ reason: 'No authentication header found' })

  const token = authenticationString.split(' ')[1]

  let decodedToken
  try {
    decodedToken = jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return res.status(400).json({ reason: 'Token is malformed' })
  }

  // Token is not valid
  if (!decodedToken) return res.status(400).json({ reason: 'Not a valid token' })

  console.log('[DEBUG]', 'Decoded token', decodedToken)

  try {
    const { data } = await axios.get(
      'https://' +
        config.authentication.host +
        ':' +
        config.authentication.port +
        '/' +
        config.authentication.path +
        '/' +
        token
    )

    req.user = {
      id: data.userId,
      scopes: decodedToken.scopes
    }

    return next()
  } catch (err) {
    console.log('[DEBUG]', 'Token seems not be valid')
    return res.status(400).json({ reason: 'Token seems not be valid' })
  }
}
