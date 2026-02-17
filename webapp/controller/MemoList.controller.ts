import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import formatter from "../model/formatter";
import MemoService from "../model/MemoService";
import Fragment from "sap/ui/core/Fragment";
import Dialog from "sap/m/Dialog";
import MessageToast from "sap/m/MessageToast";
import MessageBox from "sap/m/MessageBox";
import Input from "sap/m/Input";
import MultiComboBox from "sap/m/MultiComboBox";
import Select from "sap/m/Select";
import AppModel from "../model/AppModel";
import { ColumnListItem$PressEvent } from "sap/m/ColumnListItem";
import { NewMemoData, MemoType, Priority } from "../model/types";

/**
 * @namespace memo.app.controller
 */
export default class MemoListController extends BaseController {
	public formatter = formatter;
	private _newMemoDialog: Dialog;

	public onInit(): void {
		const viewModel = new JSONModel({
			newMemo: this._getEmptyMemo(),
			newMemoErrors: { memoType: "None", subject: "None", message: "None" },
			newMemoFiles: [] as File[]
		});
		this.setModel(viewModel, "viewModel");
	}

	/* ===== Filtering ===== */

	public async onFilterGo(): Promise<void> {
		const filters: Record<string, string> = {};

		const jobInput = this.byId("filterJobNumber") as Input;
		if (jobInput?.getValue()) filters.jobNumber = jobInput.getValue();

		const woInput = this.byId("filterWorkOrder") as Input;
		if (woInput?.getValue()) filters.workOrderNumber = woInput.getValue();

		const streamInput = this.byId("filterStream") as Input;
		if (streamInput?.getValue()) filters.streamNumber = streamInput.getValue();

		const statusMCB = this.byId("filterStatus") as MultiComboBox;
		if (statusMCB?.getSelectedKeys().length) {
			filters.status = statusMCB.getSelectedKeys().join(",");
		}

		const typeSelect = this.byId("filterMemoType") as Select;
		if (typeSelect?.getSelectedKey()) filters.memoType = typeSelect.getSelectedKey();

		const hasFilters = Object.values(filters).some(v => v);
		if (!hasFilters) {
			this._getAppModel().refreshMemos();
			return;
		}

		const result = await MemoService.getMemos(filters);
		this._getAppModel().setProperty("/memos", result);
	}

	public onFilterClear(): void {
		const jobInput = this.byId("filterJobNumber") as Input;
		jobInput?.setValue("");
		const woInput = this.byId("filterWorkOrder") as Input;
		woInput?.setValue("");
		const streamInput = this.byId("filterStream") as Input;
		streamInput?.setValue("");
		const statusMCB = this.byId("filterStatus") as MultiComboBox;
		statusMCB?.setSelectedKeys([]);
		const typeSelect = this.byId("filterMemoType") as Select;
		typeSelect?.setSelectedKey("");

		this._getAppModel().refreshMemos();
	}

	/* ===== Row click ===== */

	public onMemoPress(event: ColumnListItem$PressEvent): void {
		const item = event.getSource();
		const ctx = item.getBindingContext("app");
		const memoId = ctx.getProperty("id");
		this.navTo("memoConversation", { memoId });
	}

	/* ===== New Memo ===== */

	public async onNewMemoPress(): Promise<void> {
		if (!this._newMemoDialog) {
			this._newMemoDialog = (await Fragment.load({
				id: this.getView().getId(),
				name: "memo.app.fragment.NewMemoDialog",
				controller: this
			})) as Dialog;
			this.getView().addDependent(this._newMemoDialog);
		}
		// Reset form
		const vm = this.getModel("viewModel") as JSONModel;
		vm.setProperty("/newMemo", this._getEmptyMemo());
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

		// Validate
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
		} catch {
			MessageBox.error("Failed to create memo. Please try again.");
		} finally {
			vm.setProperty("/newMemo/submitting", false);
		}
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
