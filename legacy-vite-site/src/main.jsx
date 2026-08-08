import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { EventsProvider } from './store/EventsContext.jsx'
import { RegistrationsProvider } from './store/RegistrationsContext.jsx'
import { AttendanceProvider } from './store/AttendanceContext.jsx'
import { MarksProvider } from './store/MarksContext.jsx'
import { SubjectsProvider } from './store/SubjectsContext.jsx'
import { ClassesProvider } from './store/ClassesContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <EventsProvider>
        <RegistrationsProvider>
          <ClassesProvider>
            <SubjectsProvider>
              <AttendanceProvider>
                <MarksProvider>
                  <App />
                </MarksProvider>
              </AttendanceProvider>
            </SubjectsProvider>
          </ClassesProvider>
        </RegistrationsProvider>
      </EventsProvider>
    </HashRouter>
  </React.StrictMode>
)
