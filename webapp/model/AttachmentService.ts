import { Attachment } from "./types";
import { attachments as mockAttachments } from "./mockData";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let attachmentsList = [...mockAttachments];

function formatNow(): string {
	return new Date().toLocaleString("en-AU", {
		day: "2-digit", month: "2-digit", year: "numeric",
		hour: "2-digit", minute: "2-digit", hour12: false
	}).replace(",", "");
}

const AttachmentService = {
	async getAttachments(memoId: string): Promise<Attachment[]> {
		await delay(100);
		return attachmentsList.filter(a => a.memoId === memoId);
	},

	async uploadAttachment(memoId: string, file: File): Promise<Attachment> {
		await delay(500);
		const newAtt: Attachment = {
			id: `att-${Date.now()}`,
			memoId,
			fileName: file.name,
			fileType: file.type,
			fileSize: `${(file.size / 1024).toFixed(0)} KB`,
			uploadedBy: "VOC",
			uploadDate: formatNow(),
			url: URL.createObjectURL(file)
		};
		attachmentsList = [...attachmentsList, newAtt];
		return newAtt;
	},

	async deleteAttachment(id: string): Promise<void> {
		await delay(200);
		attachmentsList = attachmentsList.filter(a => a.id !== id);
	}
};

export default AttachmentService;
