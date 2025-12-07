import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TasksDueToday from './components/TasksDueToday'
import './index.css'
import './App.css'

const queryClient = new QueryClient()

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-root">
        <div className="app-inner">
          <TasksDueToday />
        </div>
      </div>
    </QueryClientProvider>
  )
}

export default App