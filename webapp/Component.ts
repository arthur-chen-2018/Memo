import UIComponent from "sap/ui/core/UIComponent";
import Device from "sap/ui/Device";
import AppModel from "./model/AppModel";
import JSONModel from "sap/ui/model/json/JSONModel";
import BindingMode from "sap/ui/model/BindingMode";

/**
 * @namespace memo.app
 */
export default class Component extends UIComponent {
	public static metadata = {
		manifest: "json",
		interfaces: ["sap.ui.core.IAsyncContentCreation"]
	};

	private contentDensityClass: string;

	public init(): void {
		super.init();

		// Device model
		const deviceModel = new JSONModel(Device);
		deviceModel.setDefaultBindingMode(BindingMode.OneWay);
		this.setModel(deviceModel, "device");

		// App model (replaces React AppContext)
		const appModel = new AppModel();
		this.setModel(appModel, "app");
		appModel.refreshMemos();

		// Initialize router
		this.getRouter().initialize();
	}

	public getAppModel(): AppModel {
		return this.getModel("app") as AppModel;
	}

	public getContentDensityClass(): string {
		if (this.contentDensityClass === undefined) {
			if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
				this.contentDensityClass = "";
			} else if (!Device.support.touch) {
				this.contentDensityClass = "sapUiSizeCompact";
			} else {
				this.contentDensityClass = "sapUiSizeCozy";
			}
		}
		return this.contentDensityClass;
	}
}
