import { ErrorLog } from "./types";
import { errorLogs as mockErrors } from "./mockData";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let errorsList = [...mockErrors];

function formatNow(): string {
	return new Date().toLocaleString("en-AU", {
		day: "2-digit", month: "2-digit", year: "numeric",
		hour: "2-digit", minute: "2-digit", hour12: false
	}).replace(",", "");
}

const ErrorService = {
	async getErrors(filters?: Record<string, string>): Promise<ErrorLog[]> {
		await delay(200);
		let result = [...errorsList];
		if (filters) {
			if (filters.status) {
				result = result.filter(e => e.status === filters.status);
			}
			if (filters.errorType) {
				result = result.filter(e => e.errorType === filters.errorType);
			}
			if (filters.workOrderNumber) {
				result = result.filter(e => e.workOrderNumber.includes(filters.workOrderNumber));
			}
		}
		return result;
	},

	async retryError(id: string): Promise<ErrorLog> {
		await delay(500);
		const idx = errorsList.findIndex(e => e.id === id);
		if (idx === -1) throw new Error("Error not found");
		errorsList[idx] = {
			...errorsList[idx],
			status: "Retrying",
			retryHistory: [
				...errorsList[idx].retryHistory,
				{
					timestamp: formatNow(),
					result: "Retrying..."
				}
			]
		};
		return errorsList[idx];
	},

	async resolveError(id: string): Promise<ErrorLog> {
		await delay(200);
		const idx = errorsList.findIndex(e => e.id === id);
		if (idx === -1) throw new Error("Error not found");
		errorsList[idx] = { ...errorsList[idx], status: "Resolved" };
		return errorsList[idx];
	}
};

export default ErrorService;
