import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js"
import { io, userSocketMap } from "../server.js";


// Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        // Use .lean() to get plain JavaScript objects that we can modify
        let filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password").lean();

        const unseenMessages = {}

        const promises = filteredUsers.map(async (user) => {
            // Count unseen messages
            const messages = await Message.find({ senderId: user._id, receiverId: userId, seen: false })
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }

            // Get last message for sorting
            const lastMessage = await Message.findOne({
                $or: [
                    { senderId: userId, receiverId: user._id },
                    { senderId: user._id, receiverId: userId }
                ]
            }).sort({ createdAt: -1 });

            // Attach lastMessageTime to the user object (since it's a lean object now)
            user.lastMessageTime = lastMessage ? new Date(lastMessage.createdAt).getTime() : 0;
        })

        await Promise.all(promises);

        // Sort users by lastMessageTime descending
        filteredUsers.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

        res.json({ success: true, users: filteredUsers, unseenMessages })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ]
        })
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId, seen: false }, { seen: true });

        const receiverSocketId = userSocketMap[selectedUserId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messagesSeen", { userId: myId });
        }

        res.json({ success: true, messages })


    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// api to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findByIdAndUpdate(id, { seen: true }, { new: true })

        const receiverSocketId = userSocketMap[message.senderId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageSeen", { messageId: message._id });
        }

        res.json({ success: true })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image, audio } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }

        let audioUrl;
        if (audio) {
            const uploadResponse = await cloudinary.uploader.upload(audio, { resource_type: "video" })
            audioUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            audio: audioUrl,
            seen: false
        })

        // Emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.json({ success: true, newMessage });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Delete message
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const senderId = req.user._id;

        const message = await Message.findById(id);
        if (!message) return res.status(404).json({ success: false, message: "Message not found" });

        if (message.senderId.toString() !== senderId.toString()) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        await Message.findByIdAndDelete(id);

        const receiverSocketId = userSocketMap[message.receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeleted", id);
        }

        res.json({ success: true, message: "Message deleted" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Edit message
export const editMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const senderId = req.user._id;

        const message = await Message.findById(id);
        if (!message) return res.status(404).json({ success: false, message: "Message not found" });

        if (message.senderId.toString() !== senderId.toString()) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const updatedMessage = await Message.findByIdAndUpdate(id, { text }, { new: true });

        const receiverSocketId = userSocketMap[message.receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageUpdated", updatedMessage);
        }

        res.json({ success: true, updatedMessage });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

export const deleteConversation = async (req, res) => {
    try {
        const { id: otherUserId } = req.params;
        const myId = req.user._id;

        await Message.deleteMany({
            $or: [
                { senderId: myId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: myId }
            ]
        });

        const receiverSocketId = userSocketMap[otherUserId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("conversationDeleted", myId);
        }

        res.json({ success: true, message: "Conversation deleted successfully" });
    } catch (error) {
        console.log("Error in deleteConversation controller: ", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


