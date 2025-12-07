import React, { useContext, useEffect, useRef, useState } from 'react'
import EmojiPicker from "emoji-picker-react"
import assets, { messagesDummyData } from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const ChatContainer = () => {

    const { messages, selectedUser, setSelectedUser, sendMessage,
        getMessages, isTyping, deleteMessage, editMessage } = useContext(ChatContext)

    const { authUser, onlineUsers, socket } = useContext(AuthContext)

    const scrollEnd = useRef()

    const [input, setInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const typingTimeoutRef = useRef(null);

    // Edit/Delete state
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editText, setEditText] = useState("");
    const [showMenuId, setShowMenuId] = useState(null);

    const handleEditSave = async (id) => {
        if (editText.trim() === "") return;
        await editMessage(id, editText);
        setEditingMessageId(null);
        setEditText("");
    }

    const handleInputChange = (e) => {
        setInput(e.target.value);

        if (!socket) return;

        socket.emit("typing", { senderId: authUser._id, receiverId: selectedUser._id });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stopTyping", { senderId: authUser._id, receiverId: selectedUser._id });
        }, 1000);
    }

    // Handle sending a message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === "") return null;
        await sendMessage({ text: input.trim() });
        setInput("")
    }

    // Handle sending an image
    const handleSendImage = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith("image/")) {
            toast.error("select an image file")
            return;
        }
        const reader = new FileReader();

        reader.onloadend = async () => {
            await sendMessage({ image: reader.result })
            e.target.value = ""
        }
        reader.readAsDataURL(file)
    }

    // Handle start recording
    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    await sendMessage({ audio: reader.result });
                };
                // Stop all tracks to release mic
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast.error("Could not access microphone");
        }
    };

    // Handle stop recording
    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id)
        }
    }, [selectedUser])

    useEffect(() => {
        if (scrollEnd.current && messages) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    return selectedUser ? (
        <div className='h-full overflow-hidden relative flex flex-col bg-transparent'>
            {/* ------- header ------- */}
            <div className='flex items-center gap-4 py-4 px-6 border-b border-white/10 bg-black/5 backdrop-blur-md shadow-sm z-10'>
                <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='w-6 cursor-pointer opacity-70 hover:opacity-100 transition-opacity invert' />
                <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className="w-10 h-10 rounded-full object-cover border border-white/20" />
                <div className='flex-1 flex flex-col leading-tight'>
                    <p className='text-lg font-medium text-white tracking-wide'>
                        {selectedUser.fullName}
                    </p>
                    <div className='flex items-center gap-2'>
                        {onlineUsers.includes(selectedUser._id) && !isTyping && <span className="text-xs text-emerald-400 font-light">Active now</span>}
                        {isTyping && <span className="text-xs text-purple-400 font-light italic flex items-center gap-1">
                            typing
                            <span className="flex gap-0.5">
                                <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce delay-0"></span>
                                <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce delay-150"></span>
                                <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce delay-300"></span>
                            </span>
                        </span>}
                    </div>
                </div>
                <img src={assets.help_icon} alt="" className='max-md:hidden w-5 cursor-pointer opacity-50 hover:opacity-100 transition-opacity' />
            </div>

            {/* ------- chat area ------- */}
            <div className='flex-1 overflow-y-auto p-6 pb-4 flex flex-col gap-4 custom-scrollbar'>
                {messages.map((msg, index) => (
                    <div key={index}
                        className={`flex items-end gap-3 ${msg.senderId === authUser._id ? 'flex-row-reverse' : ''} animate-fade-in group relative`}
                        onMouseLeave={() => setShowMenuId(null)}
                    >
                        <img src={msg.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-8 h-8 rounded-full object-cover shadow-md' />

                        <div className={`flex flex-col max-w-[70%] ${msg.senderId === authUser._id ? 'items-end' : 'items-start'}`}>
                            {msg.image && (
                                <img src={msg.image} alt="" className='max-w-[280px] rounded-2xl border-2 border-white/10 shadow-lg mb-1 hover:scale-105 transition-transform cursor-pointer' />
                            )}
                            {msg.audio && (
                                <audio controls src={msg.audio} className='mb-1 max-w-[250px]' />
                            )}

                            {editingMessageId === msg._id ? (
                                <div className="flex items-center gap-2 mb-1">
                                    <input
                                        type="text"
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="bg-black/40 text-white border border-white/20 rounded-lg px-3 py-1 text-sm outline-none focus:border-purple-500"
                                        autoFocus
                                    />
                                    <button onClick={() => handleEditSave(msg._id)} className="text-emerald-400 hover:text-emerald-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </button>
                                    <button onClick={() => setEditingMessageId(null)} className="text-red-400 hover:text-red-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ) : (
                                msg.text && (
                                    <p className={`px-5 py-3 text-[15px] font-light shadow-md relative ${msg.senderId === authUser._id
                                        ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-tr-none'
                                        : 'bg-white/10 backdrop-blur-md text-gray-100 border border-white/5 rounded-2xl rounded-tl-none'
                                        }`}
                                        onMouseEnter={() => msg.senderId === authUser._id && setShowMenuId(msg._id)}
                                    >
                                        {msg.text}

                                        {/* Edit/Delete Menu */}
                                        {showMenuId === msg._id && !msg.image && !msg.audio && (
                                            <div className="absolute -top-8 right-0 bg-black/80 backdrop-blur-md text-white text-xs rounded-lg shadow-xl border border-white/10 flex overflow-hidden z-20">
                                                <button
                                                    onClick={() => { setEditingMessageId(msg._id); setEditText(msg.text); setShowMenuId(null); }}
                                                    className="px-3 py-1.5 hover:bg-white/10 transition-colors flex items-center gap-1"
                                                >
                                                    Edit
                                                </button>
                                                <div className="w-[1px] bg-white/10"></div>
                                                <button
                                                    onClick={() => { if (confirm("Delete message?")) deleteMessage(msg._id); }}
                                                    className="px-3 py-1.5 hover:bg-white/10 text-red-400 transition-colors flex items-center gap-1"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                        {/* For media messages, only show delete */}
                                        {showMenuId === msg._id && (msg.image || msg.audio) && (
                                            <div className="absolute -top-8 right-0 bg-black/80 backdrop-blur-md text-white text-xs rounded-lg shadow-xl border border-white/10 flex overflow-hidden z-20">
                                                <button
                                                    onClick={() => { if (confirm("Delete message?")) deleteMessage(msg._id); }}
                                                    className="px-3 py-1.5 hover:bg-white/10 text-red-400 transition-colors flex items-center gap-1"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </p>
                                )
                            )}

                            <div className='flex items-center justify-end gap-1 mt-1'>
                                <span className='text-[10px] text-gray-400'>{formatMessageTime(msg.createdAt)}</span>
                                {msg.senderId === authUser._id && (
                                    <div className="flex -space-x-1">
                                        {/* Simple double check mark SVG */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={msg.seen ? "#3b82f6" : "#6b7280"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={msg.seen ? "#3b82f6" : "#6b7280"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="-ml-2">
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={scrollEnd}></div>
            </div>

            {/* ------- bottom area ------- */}
            <div className='p-4 bg-transparent relative'>
                {showEmoji && (
                    <div className='absolute bottom-20 left-4 z-50 shadow-xl border border-white/20 rounded-xl'>
                        <EmojiPicker
                            onEmojiClick={(emojiObject) => setInput((prev) => prev + emojiObject.emoji)}
                            theme="dark"
                            searchDisabled
                            skinTonesDisabled
                            width={300}
                            height={400}
                        />
                    </div>
                )}
                <div className='flex items-center gap-3 bg-black/30 p-2 pr-3 rounded-full border border-white/10 shadow-lg focus-within:border-purple-500/50 focus-within:bg-black/40 transition-all'>

                    <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
                    <label htmlFor="image" className="p-2 hover:bg-white/10 rounded-full cursor-pointer transition-colors group">
                        <img src={assets.gallery_icon} alt="" className="w-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </label>

                    {isRecording ? (
                        <div className="flex-1 flex items-center justify-between bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
                            <span className="text-red-400 text-sm animate-pulse font-medium">Recording...</span>
                            <button onClick={handleStopRecording} className="p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors ${showEmoji ? 'text-yellow-400' : 'text-gray-400 group-hover:text-yellow-400'}`}>
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                                </svg>
                            </button>

                            <input onChange={handleInputChange} value={input} onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null} type="text" placeholder="Type a message..."
                                className='flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm py-2' />

                            <button onClick={handleStartRecording} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hover:text-white"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                            </button>

                            <button onClick={handleSendMessage} disabled={!input.trim()} className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-500/20">
                                <img src={assets.send_button} alt="" className="w-4 h-4 ml-0.5 invert" />
                            </button>
                        </>
                    )}
                </div>
            </div>


        </div>
    ) : (
        <div className='flex flex-col items-center justify-center gap-1 text-center h-full bg-black/5 backdrop-blur-sm max-md:hidden'>
            <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-[50px] opacity-20 rounded-full animate-pulse"></div>
                <img src={assets.logo_icon} className='w-32 relative z-10 drop-shadow-2xl' alt="" />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-white mb-1">Welcome to FlashTalk</h3>
                <p className='text-gray-400 font-light'>Select a chat to start messaging</p>
            </div>
        </div>
    )
}

export default ChatContainer
