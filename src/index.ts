import { Plugin } from "siyuan";
import { FileManager } from "@/worker/fileManager";
import { InboxManager } from "@/worker/inboxManager";
import { SettingService } from "@/worker/settingService";
import { DockService } from "@/worker/dockService";
import { Svgs } from "@/icons/svgs";
import * as logger from "@/utils/logger";


export default class PluginInboxLight extends Plugin {
    fileManager: FileManager;
    inboxManager: InboxManager;
    settingService: SettingService;
    dockService: DockService;

    async onload() {
        logger.logInfo("加载插件");

        // 添加图标
        let svgs = Object.values(Svgs);
        this.addIcons(svgs.join(''));

        // 构建模块
        this.settingService = new SettingService(this);
        this.inboxManager = new InboxManager(this);
        this.fileManager = new FileManager(this);
        this.dockService = new DockService(this);

    }

    async onLayoutReady() {
        logger.logInfo("开启插件");

        // 初始化
        await this.settingService.load();
        await this.fileManager.setTarget(this.settingService.get("targetId"));
        this.fileManager.bindHandler();
        await this.fileManager.updateDocs();

    }

    async onunload() {
        logger.logInfo("关闭插件");
        this.fileManager.unbindHandler();
    }

    async uninstall() {
        logger.logInfo("卸载插件");
        await this.onunload();
    }

}
