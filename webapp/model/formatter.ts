import { STATUS_VALUE_STATE, ERROR_STATUS_STATE, MemoStatus, ErrorStatus } from "./types";

const formatter = {
	statusState(status: MemoStatus): string {
		return STATUS_VALUE_STATE[status] || "None";
	},

	errorStatusState(status: ErrorStatus): string {
		return ERROR_STATUS_STATE[status] || "None";
	},

	orgColorClass(org: string): string {
		return org === "Homes Victoria" ? "orgHV" : "orgVOC";
	},

	messageTypeClass(type: string): string {
		const map: Record<string, string> = {
			"Request": "messageTypeRequest",
			"Reply": "messageTypeReply",
			"Rejection": "messageTypeRejection",
			"Info Update": "messageTypeInfo"
		};
		return map[type] || "";
	},

	senderInitial(name: string): string {
		return name ? name.charAt(0).toUpperCase() : "?";
	},

	isNotClosed(status: string): boolean {
		return status !== "Closed";
	},

	isNotResolved(status: string): boolean {
		return status !== "Resolved";
	},

	isVOC(org: string): boolean {
		return org === "VOC";
	},

	countText(count: number, label: string): string {
		return `${label} (${count})`;
	},

	directionColorScheme(direction: string): number {
		return direction === "Inbound" ? 6 : 1;
	}
};

export default formatter;
