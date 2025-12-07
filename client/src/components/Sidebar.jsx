import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';

const Sidebar = () => {

    const { getUsers, users, selectedUser, setSelectedUser,
        unseenMessages, setUnseenMessages } = useContext(ChatContext);

    const { logout, onlineUsers } = useContext(AuthContext)

    const [input, setInput] = useState(false)

    const navigate = useNavigate();

    const filteredUsers = input ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase())) : users;

    useEffect(() => {
        getUsers();
    }, [onlineUsers])

    return (
        <div className={`bg-black/10 h-full p-5 flex flex-col overflow-hidden text-white border-r border-white/10 ${selectedUser ? "max-md:hidden" : ''}`}>
            <div className='pb-5 shrink-0'>
                <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-1 transition-all hover:scale-105 cursor-pointer'>
                        <img src={assets.logo_icon} alt="logo" className='h-10 w-10 md:h-12 md:w-12' />
                        <span className="text-2xl font-bold text-white tracking-wide">FlashTalk</span>
                    </div>
                    <div className="relative py-2 group">
                        <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity' />
                        <div className='absolute top-full right-0 z-20 w-40 p-3 rounded-xl bg-black/80 border border-white/10 text-gray-100 hidden group-hover:flex flex-col gap-2 backdrop-blur-md shadow-xl animate-fade-in'>
                            <p onClick={() => navigate('/profile')} className='cursor-pointer text-sm hover:text-purple-400 p-2 rounded hover:bg-white/5 transition-colors'>Edit Profile</p>
                            <hr className="border-t border-white/10" />
                            <p onClick={() => logout()} className='cursor-pointer text-sm hover:text-red-400 p-2 rounded hover:bg-white/5 transition-colors'>Logout</p>
                        </div>
                    </div>
                </div>

                <div className='bg-black/30 rounded-xl flex items-center gap-2 py-3 px-4 mt-6 border border-white/5 focus-within:border-purple-500/50 transition-colors'>
                    <img src={assets.search_icon} alt="Search" className='w-4 opacity-50' />
                    <input onChange={(e) => setInput(e.target.value)} type="text" className='bg-transparent border-none outline-none text-white text-sm placeholder-gray-500 flex-1' placeholder='Search User...' />
                </div>

            </div>

            <div className='flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2'>
                {filteredUsers.map((user, index) => (
                    <div onClick={() => { setSelectedUser(user); setUnseenMessages(prev => ({ ...prev, [user._id]: 0 })) }}
                        key={index} className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 ${selectedUser?._id === user._id ? 'bg-white/10 border border-white/5 shadow-inner' : ''}`}>
                        <img src={user?.profilePic || assets.avatar_icon} alt="" className='w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-purple-500/50 transition-colors' />
                        <div className='flex flex-col leading-tight'>
                            <p className={`font-medium ${selectedUser?._id === user._id ? 'text-white' : 'text-gray-200'}`}>{user.fullName}</p>
                            {
                                onlineUsers.includes(user._id)
                                    ? <span className='text-emerald-400 text-xs font-light'>Online</span>
                                    : <span className='text-gray-500 text-xs font-light'>Offline</span>
                            }
                        </div>
                        {unseenMessages[user._id] > 0 && <span className='absolute top-3 right-3 text-[10px] h-5 w-5 flex justify-center items-center rounded-full bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/30'>{unseenMessages[user._id]}</span>}
                    </div>
                ))}
            </div>

        </div>
    )
}

export default Sidebar
