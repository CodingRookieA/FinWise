import './App.css'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/home/HomePage'
import { GoogleRedirectPage } from './pages/googleRedirectPage/GoogleRedirectPage'
import { useEffect } from 'react'
import { useState } from 'react'

const mode = import.meta.env.MODE
const serverURL = mode === 'production' 
    ? import.meta.env.VITE_SERVER_URL 
    : import.meta.env.VITE_SERVER_URL_DEVELOPMENT

function App() {
    const [loading, setLoading] = useState(true)
    const [loggedIn, setLoggedIn] = useState(false)
    const [user, setUser] = useState({})

    const logout = async () => {
        try {
            await fetch(
                `${serverURL}/api/users/logout`,
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
        } catch (error) {
            
        }
    }

    const ProtectedRoutes = () => {
        if(!loggedIn) return <Navigate to='/' />

        return (<Outlet />)
    }

    useEffect(() => {
        const checkAuth = async () => {
            const response = await fetch(`${serverURL}/api/users/checkUserAuth`,{
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const result = await response.json();
                setLoggedIn(true)
                setUser(result)
            } else {
                setLoggedIn(false)
                setUser({})
            }
            setLoading(false)
        }

        checkAuth()
    }, [])

    if(loading) return <h1>Loading...</h1>

    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<HomePage user={user} logout={logout} />}/>
                <Route path='/google-redirect' element={<GoogleRedirectPage setLoggedIn={setLoggedIn} />}/>
                
                {/* Protected routes */}
                <Route element={<ProtectedRoutes/>}>
                    <Route path='/test' element={<h1>ihi</h1>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
