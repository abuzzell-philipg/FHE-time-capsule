import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { Toaster } from 'react-hot-toast'
import { config } from './config/wagmi'
import { FHEProvider } from './contexts/FHEContext'
import Header from './components/Header'
import FHEStatus from './components/FHEStatus'
import Home from './pages/Home'
import Create from './pages/Create'
import Dashboard from './pages/Dashboard'

import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <FHEProvider>
            <Router>
              <div className="min-h-screen">
                <Header />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/create" element={<Create />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
              </div>
              <FHEStatus />
              <Toaster 
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#FEF3C7',
                    color: '#78350F',
                    borderRadius: '12px',
                    padding: '16px',
                    fontWeight: '500',
                  },
                  success: {
                    iconTheme: {
                      primary: '#F59E0B',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </Router>
          </FHEProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App

