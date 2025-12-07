import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";


export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null)
    const [unseenMessages, setUnseenMessages] = useState({})
    const [isTyping, setIsTyping] = useState(false);

    const { socket, axios } = useContext(AuthContext);

    // function to get all users for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // function to send message to selected user
    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, { ...data.newMessage, seen: false }])

                // Move selected user to top
                setUsers(prevUsers => {
                    const updatedUsers = prevUsers.filter(u => u._id !== selectedUser._id);
                    return [selectedUser, ...updatedUsers];
                })
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const deleteMessage = async (messageId) => {
        try {
            const { data } = await axios.delete(`/api/messages/${messageId}`);
            if (data.success) {
                setMessages(prev => prev.filter(msg => msg._id !== messageId))
                toast.success("Message deleted");
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const editMessage = async (messageId, text) => {
        try {
            const { data } = await axios.put(`/api/messages/edit/${messageId}`, { text });
            if (data.success) {
                setMessages(prev => prev.map(msg => msg._id === messageId ? data.updatedMessage : msg))
                toast.success("Message updated");
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }



    // function to subscribe to messages for selected user
    const subscribeToMessages = async () => {
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            // Move sender to top of users list
            setUsers(prevUsers => {
                const sender = prevUsers.find(u => u._id === newMessage.senderId);
                if (sender) {
                    const updatedUsers = prevUsers.filter(u => u._id !== newMessage.senderId);
                    return [sender, ...updatedUsers];
                }
                return prevUsers;
            })

            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                // Mark message as seen in backend immediately since user is on the chat
                axios.put(`/api/messages/mark/${newMessage._id}`);
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages, [newMessage.senderId]: prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1
                }))
            }
        })

        socket.on("typing", (senderId) => {
            if (selectedUser && senderId === selectedUser._id) {
                setIsTyping(true);
            }
        })

        socket.on("stopTyping", (senderId) => {
            if (selectedUser && senderId === selectedUser._id) {
                setIsTyping(false);
            }
        })

        socket.on("messagesSeen", ({ userId }) => {
            if (selectedUser && userId === selectedUser._id) {
                setMessages(prev => prev.map(msg => ({ ...msg, seen: true })))
            }
        })

        socket.on("messageSeen", ({ messageId }) => {
            setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, seen: true } : msg))
        })

        socket.on("messageDeleted", (messageId) => {
            setMessages(prev => prev.filter(msg => msg._id !== messageId))
        })

        socket.on("messageUpdated", (updatedMessage) => {
            setMessages(prev => prev.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg))
        })


    }

    // function to unsubscribe from messages
    const unsubscribeFromMessages = () => {
        if (socket) {
            socket.off("newMessage");
            socket.off("typing");
            socket.off("stopTyping");
            socket.off("messagesSeen");
            socket.off("messageSeen");
            socket.off("messageDeleted");
            socket.off("messageUpdated");

        }
    }

    useEffect(() => {
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser])

    const value = {
        messages, users, selectedUser, getUsers, getMessages, sendMessage, deleteMessage, editMessage, setSelectedUser, unseenMessages, setUnseenMessages, isTyping
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}