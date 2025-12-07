import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage, deleteMessage, editMessage } from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id", protectRoute, sendMessage)
messageRouter.delete("/:id", protectRoute, deleteMessage);
messageRouter.put("/edit/:id", protectRoute, editMessage);

export default messageRouter;