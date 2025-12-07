import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { useContext } from 'react'
import { ChatContext } from '../../context/ChatContext'

const HomePage = () => {

  const { selectedUser } = useContext(ChatContext)

  return (
    <div className='border w-full h-screen sm:px-[15%] sm:py-[5%]'>
      <div className={`bg-black/20 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden h-[100%] grid grid-cols-1 relative ${selectedUser ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]' : 'md:grid-cols-2'}`}>
        <Sidebar />
        <ChatContainer />
        <RightSidebar />
      </div>
    </div>
  )
}

export default HomePage
