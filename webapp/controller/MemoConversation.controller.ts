import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import formatter from "../model/formatter";
import MemoService from "../model/MemoService";
import MessageService from "../model/MessageService";
import AttachmentService from "../model/AttachmentService";
import { getActivityLogForMemo } from "../model/mockData";
import { VALID_STATUS_TRANSITIONS, Memo, Message, Attachment, ActivityLogEntry, MemoStatus, NewMemoData, MemoType, Priority } from "../model/types";
import Fragment from "sap/ui/core/Fragment";
import Dialog from "sap/m/Dialog";
import MessageToast from "sap/m/MessageToast";
import MessageBox from "sap/m/MessageBox";
import VBox from "sap/m/VBox";
import HBox from "sap/m/HBox";
import Text from "sap/m/Text";
import HTML from "sap/ui/core/HTML";
import Icon from "sap/ui/core/Icon";
import Button from "sap/m/Button";
import MessageStrip from "sap/m/MessageStrip";
import AppModel from "../model/AppModel";

/**
 * @namespace memo.app.controller
 */
export default class MemoConversationController extends BaseController {
	public formatter = formatter;
	private _statusDialog: Dialog;
	private _newMemoDialog: Dialog;
	private _viewerDialog: Dialog;

	public onInit(): void {
		const viewModel = new JSONModel({
			memo: null as Memo,
			messages: [] as Message[],
			attachments: [] as Attachment[],
			activityLog: [] as ActivityLogEntry[],
			woMemos: [] as Memo[],
			currentMemoId: "",
			openMemoCount: 0,
			openMemoWarningText: "",
			replyText: "",
			sending: false,
			newStatus: "",
			validTransitions: [] as string[],
			// Viewer state
			viewerAttachment: null as Attachment,
			viewerAttachments: [] as Attachment[],
			viewerIndex: 0,
			viewerHasPrev: false,
			viewerHasNext: false,
			// New memo from conversation
			newMemo: this._getEmptyMemo(),
			newMemoErrors: { memoType: "None", subject: "None", message: "None" },
			newMemoFiles: [] as File[]
		});
		this.setModel(viewModel, "viewModel");

		this.getRouter().getRoute("memoConversation").attachPatternMatched(this._onRouteMatched, this);
	}

	/* ===== Route handling ===== */

	private async _onRouteMatched(event: any): Promise<void> {
		const memoId = event.getParameter("arguments").memoId;
		await this._loadMemoData(memoId);
	}

	private async _loadMemoData(memoId: string): Promise<void> {
		const vm = this.getModel("viewModel") as JSONModel;
		vm.setProperty("/currentMemoId", memoId);

		const [memo, msgs, atts] = await Promise.all([
			MemoService.getMemoById(memoId),
			MessageService.getMessages(memoId),
			AttachmentService.getAttachments(memoId)
		]);

		if (!memo) {
			this.navTo("memoList");
			return;
		}

		// Mark as read
		this._getAppModel().markAsRead(memoId);

		const woMemos = await MemoService.getMemosForWorkOrder(memo.workOrderNumber);
		const openCount = woMemos.filter(m => m.status !== "Closed").length;
		const activity = getActivityLogForMemo(memoId);

		vm.setProperty("/memo", memo);
		vm.setProperty("/messages", msgs);
		vm.setProperty("/attachments", atts);
		vm.setProperty("/activityLog", activity);
		vm.setProperty("/woMemos", woMemos);
		vm.setProperty("/openMemoCount", openCount);
		vm.setProperty("/openMemoWarningText", `This work order has ${openCount} open memo(s) requiring attention.`);
		vm.setProperty("/validTransitions", VALID_STATUS_TRANSITIONS[memo.status] || []);

		this._renderMessages(msgs);
	}

	/* ===== Render Messages Programmatically ===== */

	private _renderMessages(messages: Message[]): void {
		const thread = this.byId("messagesThread") as VBox;
		if (!thread) return;
		thread.destroyItems();

		const allAttachments = messages.flatMap(m => m.attachments);

		messages.forEach(msg => {
			const isHV = msg.sender === "Homes Victoria";
			const cardClass = `messageCard ${isHV ? "messageCardHV" : "messageCardVOC"}`;

			// Build card content
			const card = new VBox({ class: cardClass });

			// Header: avatar + meta
			const avatarHtml = new HTML({
				content: `<div class="messageAvatar ${isHV ? "avatarHV" : "avatarVOC"}">${msg.senderName.charAt(0)}</div>`
			});

			const senderText = new Text({
				text: `${msg.sender} \u2014 ${msg.senderName}`,
				class: `messageSender ${isHV ? "senderHV" : "senderVOC"}`
			});

			const typeChipHtml = new HTML({
				content: `<span class="messageTypeChip ${formatter.messageTypeClass(msg.messageType)}">${msg.messageType}</span>`
			});

			const senderRow = new HBox({ alignItems: "Center", items: [senderText, typeChipHtml] }).addStyleClass("sapUiTinyMarginBegin");
			const timestampText = new Text({ text: msg.timestamp, class: "messageTimestamp" });
			const metaBox = new VBox({ items: [senderRow, timestampText] });
			const headerBox = new HBox({ alignItems: "Center", items: [avatarHtml, metaBox] }).addStyleClass("sapUiSmallMarginBottom");
			card.addItem(headerBox);

			// Delivery failed strip
			if (msg.isDeliveryFailed) {
				const failedStrip = new MessageStrip({
					text: "Delivery failed \u2014 message was not sent to Homes Victoria.",
					type: "Error",
					showCloseButton: false,
					class: "sapUiSmallMarginBottom"
				});
				card.addItem(failedStrip);
			}

			// Subject + Body
			const subjectHtml = new HTML({ content: `<div class="messageSubject">${this._escapeHtml(msg.subject)}</div>` });
			const bodyHtml = new HTML({ content: `<div class="messageBody">${this._escapeHtml(msg.body)}</div>` });
			card.addItem(subjectHtml);
			card.addItem(bodyHtml);

			// Attachments
			if (msg.attachments.length > 0) {
				const attBox = new HBox({ wrap: "Wrap" }).addStyleClass("sapUiSmallMarginTop");
				msg.attachments.forEach(att => {
					const chip = new HBox({
						alignItems: "Center",
						items: [
							new Icon({ src: "sap-icon://attachment" }),
							new Text({ text: att.fileName }).addStyleClass("sapUiTinyMarginBegin")
						]
					}).addStyleClass("messageAttachmentChip");
					chip.attachBrowserEvent("click", () => {
						this._openAttachmentViewer(att, allAttachments);
					});
					attBox.addItem(chip);
				});
				card.addItem(attBox);
			}

			thread.addItem(card);
		});
	}

	private _escapeHtml(text: string): string {
		const div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	}

	/* ===== Sidebar ===== */

	public onSidebarItemPress(event: any): void {
		const item = event.getParameter("listItem");
		const ctx = item.getBindingContext("viewModel");
		const memoId = ctx.getProperty("id");
		this.navTo("memoConversation", { memoId });
	}

	/* ===== Navigation ===== */

	public onNavigateToAttachments(): void {
		const oObjectPageLayout = this.byId("objectPageLayout") as any;
		const aSections = oObjectPageLayout.getSections();
		const oAttSection = aSections.find((s: any) => s.getTitle?.().includes("Attachments"));
		if (oAttSection) {
			oObjectPageLayout.setSelectedSection(oAttSection);
		}
	}

	/* ===== Compose ===== */

	public onFocusCompose(): void {
		const textArea = this.byId("composeTextArea");
		if (textArea) {
			(textArea as any).focus();
		}
	}

	public async onSendMessage(): Promise<void> {
		const vm = this.getModel("viewModel") as JSONModel;
		const replyText = vm.getProperty("/replyText");
		if (!replyText?.trim()) return;

		const memoId = vm.getProperty("/currentMemoId");
		vm.setProperty("/sending", true);
		try {
			await MessageService.sendMessage(memoId, replyText);
			vm.setProperty("/replyText", "");
			MessageToast.show("Message sent successfully");
			await this._loadMemoData(memoId);
		} finally {
			vm.setProperty("/sending", false);
		}
	}

	/* ===== Status Change ===== */

	public async onChangeStatusPress(): Promise<void> {
		if (!this._statusDialog) {
			this._statusDialog = (await Fragment.load({
				id: this.getView().getId(),
				name: "memo.app.fragment.StatusChangeDialog",
				controller: this
			})) as Dialog;
			this.getView().addDependent(this._statusDialog);
		}
		const vm = this.getModel("viewModel") as JSONModel;
		vm.setProperty("/newStatus", "");
		this._statusDialog.open();
	}

	public async onStatusConfirm(): Promise<void> {
		const vm = this.getModel("viewModel") as JSONModel;
		const newStatus = vm.getProperty("/newStatus") as MemoStatus;
		const memoId = vm.getProperty("/currentMemoId");
		if (!newStatus) return;

		await this._getAppModel().updateMemoStatus(memoId, newStatus);
		this._statusDialog.close();
		MessageToast.show(`Status changed to ${newStatus}`);
		await this._loadMemoData(memoId);
	}

	public onStatusCancel(): void {
		this._statusDialog?.close();
	}

	/* ===== New Memo from Conversation ===== */

	public async onNewMemoPress(): Promise<void> {
		if (!this._newMemoDialog) {
			this._newMemoDialog = (await Fragment.load({
				id: this.getView().getId(),
				name: "memo.app.fragment.NewMemoDialog",
				controller: this
			})) as Dialog;
			this.getView().addDependent(this._newMemoDialog);
		}
		const vm = this.getModel("viewModel") as JSONModel;
		const memo = vm.getProperty("/memo");
		vm.setProperty("/newMemo", {
			...this._getEmptyMemo(),
			workOrderNumber: memo?.workOrderNumber || "40001234"
		});
		vm.setProperty("/newMemoErrors", { memoType: "None", subject: "None", message: "None" });
		vm.setProperty("/newMemoFiles", []);
		this._newMemoDialog.open();
	}

	public onNewMemoCancel(): void {
		this._newMemoDialog?.close();
	}

	public onNewMemoFieldChange(): void {
		const vm = this.getModel("viewModel") as JSONModel;
		vm.setProperty("/newMemoErrors", { memoType: "None", subject: "None", message: "None" });
	}

	public onNewMemoFileChange(event: any): void {
		const files = event.getParameter("files") as FileList;
		if (!files?.length) return;
		const vm = this.getModel("viewModel") as JSONModel;
		const existing = vm.getProperty("/newMemoFiles") as File[];
		vm.setProperty("/newMemoFiles", [...existing, ...Array.from(files)]);
	}

	public async onNewMemoSubmit(): Promise<void> {
		const vm = this.getModel("viewModel") as JSONModel;
		const memo = vm.getProperty("/newMemo");
		const files = vm.getProperty("/newMemoFiles") as File[];

		const errors = { memoType: "None", subject: "None", message: "None" };
		let valid = true;
		if (!memo.memoType) { errors.memoType = "Error"; valid = false; }
		if (!memo.subject?.trim()) { errors.subject = "Error"; valid = false; }
		if (!memo.message?.trim()) { errors.message = "Error"; valid = false; }
		vm.setProperty("/newMemoErrors", errors);
		if (!valid) return;

		vm.setProperty("/newMemo/submitting", true);
		try {
			const data: NewMemoData = {
				workOrderNumber: memo.workOrderNumber,
				jobNumber: memo.jobNumber,
				notificationNumber: memo.notificationNumber,
				memoType: memo.memoType as MemoType,
				priority: memo.priority as Priority,
				subject: memo.subject,
				message: memo.message,
				attachments: files
			};
			await this._getAppModel().addMemo(data);
			this._newMemoDialog.close();
			MessageToast.show("Memo created successfully");
			const memoId = vm.getProperty("/currentMemoId");
			await this._loadMemoData(memoId);
		} catch {
			MessageBox.error("Failed to create memo. Please try again.");
		} finally {
			vm.setProperty("/newMemo/submitting", false);
		}
	}

	/* ===== Attachments Tab ===== */

	public onAttachmentPress(event: any): void {
		const ctx = event.getSource().getBindingContext("viewModel");
		const att = ctx.getObject() as Attachment;
		const vm = this.getModel("viewModel") as JSONModel;
		const allAtts = vm.getProperty("/attachments") as Attachment[];
		this._openAttachmentViewer(att, allAtts);
	}

	public async onUploadAttachment(event: any): Promise<void> {
		const files = event.getParameter("files") as FileList;
		if (!files?.length) return;
		const vm = this.getModel("viewModel") as JSONModel;
		const memoId = vm.getProperty("/currentMemoId");
		for (let i = 0; i < files.length; i++) {
			await AttachmentService.uploadAttachment(memoId, files[i]);
		}
		MessageToast.show("Attachment uploaded");
		await this._loadMemoData(memoId);
	}

	public async onDeleteAttachment(event: any): Promise<void> {
		const ctx = event.getSource().getBindingContext("viewModel");
		const attId = ctx.getProperty("id");
		await AttachmentService.deleteAttachment(attId);
		const vm = this.getModel("viewModel") as JSONModel;
		const memoId = vm.getProperty("/currentMemoId");
		MessageToast.show("Attachment deleted");
		await this._loadMemoData(memoId);
	}

	/* ===== Attachment Viewer ===== */

	private _viewerKeyHandler: ((e: KeyboardEvent) => void) | null = null;

	private async _openAttachmentViewer(attachment: Attachment, allAttachments: Attachment[]): Promise<void> {
		if (!this._viewerDialog) {
			this._viewerDialog = (await Fragment.load({
				id: this.getView().getId(),
				name: "memo.app.fragment.AttachmentViewer",
				controller: this
			})) as Dialog;
			this.getView().addDependent(this._viewerDialog);

			this._viewerDialog.attachAfterOpen(() => {
				this._viewerKeyHandler = (e: KeyboardEvent) => {
					if (e.key === "Escape") this.onViewerClose();
					if (e.key === "ArrowLeft") this.onViewerPrev();
					if (e.key === "ArrowRight") this.onViewerNext();
				};
				document.addEventListener("keydown", this._viewerKeyHandler);
			});
			this._viewerDialog.attachAfterClose(() => {
				if (this._viewerKeyHandler) {
					document.removeEventListener("keydown", this._viewerKeyHandler);
					this._viewerKeyHandler = null;
				}
			});
		}
		const vm = this.getModel("viewModel") as JSONModel;
		const index = allAttachments.findIndex(a => a.id === attachment.id);
		vm.setProperty("/viewerAttachment", attachment);
		vm.setProperty("/viewerAttachments", allAttachments);
		vm.setProperty("/viewerIndex", index);
		vm.setProperty("/viewerHasPrev", index > 0);
		vm.setProperty("/viewerHasNext", index < allAttachments.length - 1);
		this._renderViewerThumbs(allAttachments, index);
		this._viewerDialog.open();
	}

	private _renderViewerThumbs(allAttachments: Attachment[], activeIndex: number): void {
		const thumbStrip = this.byId("viewerThumbStrip") as HBox;
		if (!thumbStrip) return;
		thumbStrip.destroyItems();
		allAttachments.forEach((att, i) => {
			const isActive = i === activeIndex;
			const thumb = new VBox({
				alignItems: "Center",
				items: [
					new Icon({ src: "sap-icon://document" }),
					new Text({ text: att.fileName.substring(0, 12) }).addStyleClass("thumbName")
				]
			}).addStyleClass(`viewerThumb${isActive ? " viewerThumbActive" : ""}`);
			thumb.attachBrowserEvent("click", () => {
				this.onViewerThumbSelect(i);
			});
			thumbStrip.addItem(thumb);
		});
	}

	public onViewerThumbSelect(index: number): void {
		const vm = this.getModel("viewModel") as JSONModel;
		const atts = vm.getProperty("/viewerAttachments") as Attachment[];
		vm.setProperty("/viewerIndex", index);
		vm.setProperty("/viewerAttachment", atts[index]);
		vm.setProperty("/viewerHasPrev", index > 0);
		vm.setProperty("/viewerHasNext", index < atts.length - 1);
		this._renderViewerThumbs(atts, index);
	}

	public onViewerPrev(): void {
		const vm = this.getModel("viewModel") as JSONModel;
		const atts = vm.getProperty("/viewerAttachments") as Attachment[];
		const idx = vm.getProperty("/viewerIndex") as number;
		if (idx > 0) {
			vm.setProperty("/viewerIndex", idx - 1);
			vm.setProperty("/viewerAttachment", atts[idx - 1]);
			vm.setProperty("/viewerHasPrev", idx - 1 > 0);
			vm.setProperty("/viewerHasNext", true);
			this._renderViewerThumbs(atts, idx - 1);
		}
	}

	public onViewerNext(): void {
		const vm = this.getModel("viewModel") as JSONModel;
		const atts = vm.getProperty("/viewerAttachments") as Attachment[];
		const idx = vm.getProperty("/viewerIndex") as number;
		if (idx < atts.length - 1) {
			vm.setProperty("/viewerIndex", idx + 1);
			vm.setProperty("/viewerAttachment", atts[idx + 1]);
			vm.setProperty("/viewerHasPrev", true);
			vm.setProperty("/viewerHasNext", idx + 1 < atts.length - 1);
			this._renderViewerThumbs(atts, idx + 1);
		}
	}

	public onViewerClose(): void {
		this._viewerDialog?.close();
	}

	/* ===== Helpers ===== */

	private _getAppModel(): AppModel {
		return this.getOwnerComponent().getModel("app") as AppModel;
	}

	private _getEmptyMemo() {
		return {
			workOrderNumber: "40001234",
			jobNumber: "JOB-78901",
			notificationNumber: "20004567",
			memoType: "",
			priority: "Normal",
			subject: "",
			message: "",
			submitting: false
		};
	}
}
