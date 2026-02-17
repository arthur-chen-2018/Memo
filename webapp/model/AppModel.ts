import JSONModel from "sap/ui/model/json/JSONModel";
import MemoService from "./MemoService";
import ErrorService from "./ErrorService";
import { Memo, MemoStatus, NewMemoData } from "./types";

export interface AppData {
	memos: Memo[];
	loading: boolean;
	unreadCount: number;
	errorCount: number;
}

export default class AppModel extends JSONModel {
	constructor() {
		super({
			memos: [],
			loading: true,
			unreadCount: 0,
			errorCount: 2
		} as AppData);
		this.setSizeLimit(500);
	}

	async refreshMemos(): Promise<void> {
		this.setProperty("/loading", true);
		try {
			const memos = await MemoService.getMemos();
			this.setProperty("/memos", memos);
			const unreadCount = memos.reduce((sum: number, m: Memo) => sum + m.unreadCount, 0);
			this.setProperty("/unreadCount", unreadCount);
		} finally {
			this.setProperty("/loading", false);
		}
	}

	async refreshErrorCount(): Promise<void> {
		const errors = await ErrorService.getErrors();
		const unresolvedCount = errors.filter(e => e.status !== "Resolved").length;
		this.setProperty("/errorCount", unresolvedCount);
	}

	async updateMemoStatus(id: string, status: MemoStatus): Promise<void> {
		await MemoService.updateMemoStatus(id, status);
		await this.refreshMemos();
	}

	markAsRead(id: string): void {
		MemoService.markAsRead(id);
		const memos = this.getProperty("/memos") as Memo[];
		const idx = memos.findIndex(m => m.id === id);
		if (idx !== -1) {
			this.setProperty(`/memos/${idx}/unreadCount`, 0);
			const unreadCount = memos.reduce((sum, m, i) => sum + (i === idx ? 0 : m.unreadCount), 0);
			this.setProperty("/unreadCount", unreadCount);
		}
	}

	async addMemo(data: NewMemoData): Promise<Memo> {
		const newMemo = await MemoService.createMemo(data);
		await this.refreshMemos();
		return newMemo;
	}
}
