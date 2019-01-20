module.exports = scopes => (req, res, next) => {
  console.log('[MIDDLEWARE]', 'Authorizing the user')

  console.log('[DEBUG]', 'Given scopes', scopes)
  console.log('[DEBUG]', 'Authenticated user', req.user)

  if (!scopes.includes(req.user.decodedToken.scopes)) return res.status(401).json({ reason: 'Not authorized' })

  return next()
}
