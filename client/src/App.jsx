import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/home/HomePage'
import { PortfolioPage } from './pages/portfolio/PortfolioPage'
import { PlaidConnectPage } from './pages/plaid/PlaidConnectPage'
import { QuestionnairePage } from './pages/questionnaire/QuestionnairePage'
import ProfilePage from './pages/profile/ProfilePage'
import { GoogleRedirectPage } from './pages/googleRedirectPage/GoogleRedirectPage'
import { ChatPage } from './pages/chat/ChatPage'
import { useEffect } from 'react'
import { useState } from 'react'
import { NotFoundPage } from './pages/notFound/NotFoundPage'
import { EmailVerificationPage } from './pages/emailVerification/EmailVerificationPage'
import { VerifyingEmailPage } from './pages/emailVerification/VerifyingEmailPage'
import { Toaster } from 'react-hot-toast';
import { SERVERURL } from './utils/constants'
import { EmailVerificationRoutes, ProtectedRoutes } from './utils/routes'

function App() {
    const [loading, setLoading] = useState(true)
    const [loggedIn, setLoggedIn] = useState(false)
    const [user, setUser] = useState({})

    const logout = async () => {
        await fetch(
            `${SERVERURL}/api/users/logout`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            }
        )

        setLoggedIn(false)
        setUser({})
        window.location.href = '/'
    }

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${SERVERURL}/api/users/checkUserAuth`, {
                    method: 'GET',
                    credentials: 'include',
                })

                if (response.ok) {
                    const result = await response.json()
                    setLoggedIn(true)
                    setUser(result)
                } else {
                    setLoggedIn(false)
                    setUser({})
                }
            } catch {
                setLoggedIn(false)
                setUser({})
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    if(loading) return <h1>Loading...</h1>

    return (
        <BrowserRouter>
            <Toaster />
            <Routes>
                <Route path='/' element={<HomePage user={user} logout={logout} />}/>
                <Route path='/chat' element={<ChatPage user={user} logout={logout} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />}/> 
                <Route path='/google-redirect' element={<GoogleRedirectPage setLoggedIn={setLoggedIn} />}/>
                <Route path='/verifying-email' element={<VerifyingEmailPage/> } />
                
                <Route element={<EmailVerificationRoutes user={user} loggedIn={loggedIn} />}>
                    <Route path='/email-verification' element={<EmailVerificationPage/>} />
                </Route>
                
                {/* Protected routes */}
                <Route element={<ProtectedRoutes user={user} loggedIn={loggedIn} />}>
                    <Route path='/portfolio' element={<PortfolioPage user={user} logout={logout} />}/>
                    <Route path="/questionnaire" element={<QuestionnairePage/>} />
                    <Route path="/profile" element={<ProfilePage user={user} logout={logout} />} />
                    <Route path="/connect-plaid" element={<PlaidConnectPage user={user} logout={logout} />} />
                </Route>

                {/* Catch-all route for 404 page*/}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
