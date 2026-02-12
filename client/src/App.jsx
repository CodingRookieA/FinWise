import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/home/HomePage'
import { QuestionnairePage } from './pages/questionnaire/QuestionnairePage'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<HomePage/>}/>
                <Route path="/questionnaire" element={<QuestionnairePage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
