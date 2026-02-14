import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/home/HomePage'
import { QuestionnairePage } from './pages/questionnaire/QuestionnairePage'
import ProfilePage from './pages/profile/ProfilePage'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<HomePage/>}/>
                <Route path="/questionnaire" element={<QuestionnairePage/>} />
                <Route path="/profile" element={<ProfilePage/>} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
