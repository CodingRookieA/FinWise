import { Navigate, Outlet } from "react-router-dom"

export const ProtectedRoutes = ({ loggedIn, user }) => {
    if(!loggedIn) return <Navigate to='/' />
    if(!user.isVerified) return <Navigate to='/email-verification'/>

    return (<Outlet />)
}

export const EmailVerificationRoutes = ({ loggedIn, user }) => {
    if(!loggedIn) return <Navigate to='/' />
    if(user.isVerified) return <Navigate to='/questionnaire'/>

    return (<Outlet />)
}
