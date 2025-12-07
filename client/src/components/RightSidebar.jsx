import React, { useContext, useEffect, useState } from 'react'
import assets, { imagesDummyData } from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'

const RightSidebar = () => {

    const { selectedUser, messages } = useContext(ChatContext)
    const { logout, onlineUsers } = useContext(AuthContext)
    const [msgImages, setMsgImages] = useState([])

    // Get all the images from the messages and set them to state
    useEffect(() => {
        setMsgImages(
            messages.filter(msg => msg.image).map(msg => msg.image)
        )
    }, [messages])

    return selectedUser && (
        <div className={`bg-black/10 text-white w-full relative overflow-y-scroll border-l border-white/10 ${selectedUser ? "max-md:hidden" : ""}`}>

            <div className='pt-12 flex flex-col items-center gap-3 text-sm font-light mx-auto'>
                <img src={selectedUser?.profilePic || assets.avatar_icon} alt=""
                    className='w-24 h-24 rounded-full object-cover border-4 border-black/20 shadow-xl' />
                <div className="text-center">
                    <h1 className='text-xl font-medium flex items-center justify-center gap-2'>
                        {selectedUser.fullName}
                        {onlineUsers.includes(selectedUser._id) && <span className='w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'></span>}
                    </h1>
                    <p className="text-gray-400 text-xs mt-1">{onlineUsers.includes(selectedUser._id) ? "Active now" : "Offline"}</p>
                </div>
                <p className='px-8 text-center text-gray-300 leading-relaxed font-light italic opacity-80'>"{selectedUser.bio}"</p>
            </div>

            <hr className="border-white/10 my-6 mx-6" />

            <div className="px-6 text-sm">
                <p className="font-medium text-gray-300 mb-3">Shared Media</p>
                {msgImages.length > 0 ? (
                    <div className='max-h-[200px] overflow-y-auto grid grid-cols-2 gap-3 custom-scrollbar pr-2'>
                        {msgImages.map((url, index) => (
                            <div key={index} onClick={() => window.open(url)} className='cursor-pointer rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors'>
                                <img src={url} alt="" className='w-full h-full object-cover hover:scale-110 transition-transform duration-500' />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-xs text-center py-4 bg-black/20 rounded-lg">No media shared yet</p>
                )}
            </div>


        </div>
    )
}

export default RightSidebar
