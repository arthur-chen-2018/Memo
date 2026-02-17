import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import formatter from "../model/formatter";
import ErrorService from "../model/ErrorService";
import MessageToast from "sap/m/MessageToast";
import Select from "sap/m/Select";
import Input from "sap/m/Input";
import { ErrorLog } from "../model/types";
import AppModel from "../model/AppModel";

/**
 * @namespace memo.app.controller
 */
export default class ErrorMonitorController extends BaseController {
	public formatter = formatter;

	public onInit(): void {
		const viewModel = new JSONModel({
			errors: [] as (ErrorLog & { expanded?: boolean })[]
		});
		this.setModel(viewModel, "viewModel");

		this.getRouter().getRoute("errorMonitor").attachPatternMatched(this._onRouteMatched, this);
	}

	private async _onRouteMatched(): Promise<void> {
		await this._loadErrors();
	}

	private async _loadErrors(filters?: Record<string, string>): Promise<void> {
		const errors = await ErrorService.getErrors(filters);
		const vm = this.getModel("viewModel") as JSONModel;
		// Preserve expanded state
		const existing = vm.getProperty("/errors") as (ErrorLog & { expanded?: boolean })[];
		const expandedMap = new Map(existing.map(e => [e.id, e.expanded]));
		const enriched = errors.map(e => ({ ...e, expanded: expandedMap.get(e.id) || false }));
		vm.setProperty("/errors", enriched);
	}

	/* ===== Filtering ===== */

	public async onFilterGo(): Promise<void> {
		const filters: Record<string, string> = {};

		const typeSelect = this.byId("errFilterType") as Select;
		if (typeSelect?.getSelectedKey()) filters.errorType = typeSelect.getSelectedKey();

		const statusSelect = this.byId("errFilterStatus") as Select;
		if (statusSelect?.getSelectedKey()) filters.status = statusSelect.getSelectedKey();

		const woInput = this.byId("errFilterWO") as Input;
		if (woInput?.getValue()) filters.workOrderNumber = woInput.getValue();

		await this._loadErrors(Object.keys(filters).length ? filters : undefined);
	}

	public async onFilterClear(): Promise<void> {
		const typeSelect = this.byId("errFilterType") as Select;
		typeSelect?.setSelectedKey("");
		const statusSelect = this.byId("errFilterStatus") as Select;
		statusSelect?.setSelectedKey("");
		const woInput = this.byId("errFilterWO") as Input;
		woInput?.setValue("");

		await this._loadErrors();
	}

	/* ===== Toggle expand ===== */

	public onToggleExpand(event: any): void {
		const ctx = event.getSource().getBindingContext("viewModel");
		const path = ctx.getPath();
		const vm = this.getModel("viewModel") as JSONModel;
		const current = vm.getProperty(path + "/expanded");
		vm.setProperty(path + "/expanded", !current);
	}

	/* ===== Actions ===== */

	public async onRetryPress(event: any): Promise<void> {
		const ctx = event.getSource().getBindingContext("viewModel");
		const id = ctx.getProperty("id");
		await ErrorService.retryError(id);
		MessageToast.show("Retry initiated");
		await this._loadErrors();
		this._getAppModel().refreshErrorCount();
	}

	public async onResolvePress(event: any): Promise<void> {
		const ctx = event.getSource().getBindingContext("viewModel");
		const id = ctx.getProperty("id");
		await ErrorService.resolveError(id);
		MessageToast.show("Error marked as resolved");
		await this._loadErrors();
		this._getAppModel().refreshErrorCount();
	}

	/* ===== WO Link ===== */

	public onWOLinkPress(event: any): void {
		const ctx = event.getSource().getBindingContext("viewModel");
		const memoId = ctx.getProperty("memoId");
		this.navTo("memoConversation", { memoId });
	}

	/* ===== Helpers ===== */

	private _getAppModel(): AppModel {
		return this.getOwnerComponent().getModel("app") as AppModel;
	}
}
