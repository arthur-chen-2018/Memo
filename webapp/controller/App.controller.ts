import BaseController from "./BaseController";

/**
 * @namespace memo.app.controller
 */
export default class AppController extends BaseController {
	public onInit(): void {
		this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
	}

	public onHomePress(): void {
		this.navTo("memoList");
	}

	public onErrorsPress(): void {
		this.navTo("errorMonitor");
	}
}
