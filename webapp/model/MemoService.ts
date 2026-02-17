import { Memo, MemoStatus, NewMemoData } from "./types";
import { memos as mockMemos } from "./mockData";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let memosList = [...mockMemos];
let nextMemoId = 11;
let nextStreamNum = 52;

function formatNow(): string {
	return new Date().toLocaleString("en-AU", {
		day: "2-digit", month: "2-digit", year: "numeric",
		hour: "2-digit", minute: "2-digit", hour12: false
	}).replace(",", "");
}

const MemoService = {
	async getMemos(filters?: Record<string, string>): Promise<Memo[]> {
		await delay(200);
		let result = [...memosList];
		if (filters) {
			if (filters.jobNumber) {
				result = result.filter(m => m.jobNumber.toLowerCase().includes(filters.jobNumber.toLowerCase()));
			}
			if (filters.workOrderNumber) {
				result = result.filter(m => m.workOrderNumber.includes(filters.workOrderNumber));
			}
			if (filters.notificationNumber) {
				result = result.filter(m => m.notificationNumber.includes(filters.notificationNumber));
			}
			if (filters.taskNumber) {
				result = result.filter(m => m.taskNumber.includes(filters.taskNumber));
			}
			if (filters.streamNumber) {
				result = result.filter(m => m.streamNumber.toLowerCase().includes(filters.streamNumber.toLowerCase()));
			}
			if (filters.status) {
				const statuses = filters.status.split(",");
				result = result.filter(m => statuses.includes(m.status));
			}
			if (filters.memoType) {
				result = result.filter(m => m.memoType === filters.memoType);
			}
		}
		return result;
	},

	async getMemoById(id: string): Promise<Memo | undefined> {
		await delay(100);
		return memosList.find(m => m.id === id);
	},

	async getMemosForWorkOrder(woNumber: string): Promise<Memo[]> {
		await delay(100);
		return memosList.filter(m => m.workOrderNumber === woNumber);
	},

	async createMemo(data: NewMemoData): Promise<Memo> {
		await delay(300);
		const newMemo: Memo = {
			id: String(nextMemoId++),
			jobNumber: data.jobNumber,
			workOrderNumber: data.workOrderNumber,
			notificationNumber: data.notificationNumber,
			taskNumber: "0010",
			streamNumber: `STR-${String(nextStreamNum++).padStart(4, "0")}`,
			serialNumber: `SN-${String(Math.floor(Math.random() * 999999)).padStart(6, "0")}`,
			memoType: data.memoType,
			status: "New",
			lastMessageFrom: "VOC",
			lastUpdated: formatNow(),
			messageCount: 1,
			unreadCount: 0,
			attachmentCount: data.attachments.length,
			hasFailedResponse: false,
			createdBy: "VOC \u2014 Current User",
			createdDate: new Date().toLocaleDateString("en-AU")
		};
		memosList = [newMemo, ...memosList];
		return newMemo;
	},

	async updateMemoStatus(id: string, status: MemoStatus): Promise<Memo> {
		await delay(200);
		const idx = memosList.findIndex(m => m.id === id);
		if (idx === -1) throw new Error("Memo not found");
		memosList[idx] = { ...memosList[idx], status };
		return memosList[idx];
	},

	markAsRead(id: string): void {
		const idx = memosList.findIndex(m => m.id === id);
		if (idx !== -1) {
			memosList[idx] = { ...memosList[idx], unreadCount: 0 };
		}
	}
};

export default MemoService;
