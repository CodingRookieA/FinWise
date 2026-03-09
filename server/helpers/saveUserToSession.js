export const saveUserToSession = (session, user) => {
    session.userId = user._id
    session.email = user.email
    session.name = user.name
    session.picture = user.picture
    session.isVerified = user.isVerified
}
