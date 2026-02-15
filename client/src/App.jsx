import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/home/HomePage'
import { PortfolioPage } from './pages/portfolio/PortfolioPage'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<HomePage/>}/>

                <Route path='/portfolio' element={<PortfolioPage/>}/>
            </Routes>
        </BrowserRouter>
    )
}

export default App
