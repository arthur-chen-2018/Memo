import { Message } from "./types";
import { messages as mockMessages } from "./mockData";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let messagesList = [...mockMessages];
let nextMsgId = 6;

function formatNow(): string {
	return new Date().toLocaleString("en-AU", {
		day: "2-digit", month: "2-digit", year: "numeric",
		hour: "2-digit", minute: "2-digit", hour12: false
	}).replace(",", "");
}

const MessageService = {
	async getMessages(memoId: string): Promise<Message[]> {
		await delay(150);
		return messagesList.filter(m => m.memoId === memoId);
	},

	async sendMessage(memoId: string, body: string, messageType: "Reply" | "Info Update" = "Reply"): Promise<Message> {
		await delay(300);
		const newMsg: Message = {
			id: `msg-${nextMsgId++}`,
			memoId,
			sender: "VOC",
			senderName: "Current User",
			messageType,
			subject: messageType === "Reply" ? "Re: Response" : "Info Update",
			body,
			timestamp: formatNow(),
			attachments: []
		};
		messagesList = [...messagesList, newMsg];
		return newMsg;
	}
};

export default MessageService;
