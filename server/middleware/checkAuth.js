export const checkAuth = async (req, res, next) => {
    const userId = req.session.userId
    console.log("sessionId checkauth: ", req.session.id)

	// If no userId, block access
	if (!userId) return res.status(401).json({ message: 'Unauthorized - please log in' })

    // Pass control to the next middleware or route handler
    next()
}
