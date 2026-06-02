import { useState, useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import AuthScreen from './pages/AuthScreen'
import AppShell from './pages/AppShell'
import ToastContainer from './components/ToastContainer'
import Particles from './components/Particles'

function Inner() {
  const { user, token } = useApp()
  return (
    <>
      <Particles />
      {(!user || !token) ? <AuthScreen /> : <AppShell />}
      <ToastContainer />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Inner />
    </AppProvider>
  )
}
