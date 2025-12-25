/**
 * 插件入口
 */
import { Plugin } from "siyuan";
import { FileManager } from "@/worker/fileManager";
import { InboxManager } from "@/worker/inboxManager";
import { SettingService } from "@/worker/settingService";
import { DockService } from "@/worker/dockService";
import { svgs } from "@/icons/svgs";
import { ReplaceBuiltIn } from "@/utils/replaceBuiltIn";
import * as logger from "@/utils/logger";


/**
 * 插件主类
 */
export default class PluginInboxTransfer extends Plugin {
    fileManager: FileManager;
    inboxManager: InboxManager;
    settingService: SettingService;
    dockService: DockService;
    private replaceBuiltIn: ReplaceBuiltIn;

    async onload() {
        logger.logInfo("加载插件");

        // 添加图标
        this.addIcons(svgs);

        // 构建模块
        this.settingService = new SettingService(this);
        this.inboxManager = new InboxManager(this);
        this.fileManager = new FileManager(this);
        this.dockService = new DockService(this);
        this.replaceBuiltIn = new ReplaceBuiltIn(this);

        // 初始化
        await this.settingService.load();
        await this.fileManager.setTarget(this.settingService.get("targetId"));
        this.fileManager.bindHandler();
        await this.fileManager.updateDocs();

        // 替换内置收集箱
        if (this.settingService.get("replaceBuiltIn")) {
            this.replaceBuiltIn.replaceOnLoad();
        }

    }

    async onLayoutReady() {
        logger.logInfo("布局就绪");
        // 替换内置收集箱
        if (this.settingService.get("replaceBuiltIn")) {
            this.replaceBuiltIn.replaceOnLayoutReady();
        }
    }

    async onunload() {
        logger.logInfo("关闭插件");
        // 插件清理
        this.fileManager.unbindHandler();
        this.replaceBuiltIn.restore();
    }

    async uninstall() {
        logger.logInfo("卸载插件");
        await this.onunload();
    }

}
