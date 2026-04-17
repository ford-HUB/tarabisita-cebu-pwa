import React from 'react'
import { useAuth } from '../../../hooks/useAuth.hook'

const Home = () => {
  const { user } = useAuth()
  return (
    <div>
        <h1>Hi {user ? user.name : 'unauthorized access'}</h1>
        <p>your account role {user ? user.role.name : 'N/A'}</p>
    </div>
  )
}

export default Home