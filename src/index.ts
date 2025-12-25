/**
 * 插件入口
 */
import { Plugin } from "siyuan";
import { FileManager } from "@/worker/fileManager";
import { InboxManager } from "@/worker/inboxManager";
import { SettingService } from "@/worker/settingService";
import { DockService } from "@/worker/dockService";
import { Svgs } from "@/icons/svgs";
import { useSiyuanInbox } from "@/utils/replaceBuiltIn";
import * as logger from "@/utils/logger";


// 用于内置收集箱的替换和恢复
const inboxKeymap = useSiyuanInbox();

/**
 * 插件主类
 */
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

        // 初始化
        await this.settingService.load();
        await this.fileManager.setTarget(this.settingService.get("targetId"));
        this.fileManager.bindHandler();
        await this.fileManager.updateDocs();

        // 替换内置收集箱
        if (this.settingService.get("replaceBuiltIn")) {
            logger.logDebug("替换默认收集箱");
            // 关闭内置收集箱
            inboxKeymap.replaceBuiltIn();
            // 添加自定义的快捷键打开本插件
            this.addCommand({
                langKey: "Plugin:InboxTransfer",
                langText: "Inbox Transfer",
                hotkey: inboxKeymap.initial,
                callback: () => {
                    const ele = document.querySelector(`span[data-type="${this.name}::dock"]`) as HTMLElement;
                    ele?.click();
                }
            });
        }
    }

    async onLayoutReady() {
        logger.logInfo("布局就绪");
    }

    async onunload() {
        logger.logInfo("关闭插件");
        // 插件清理
        this.fileManager.unbindHandler();
        inboxKeymap.restoreBuiltIn(inboxKeymap.initial);
    }

    async uninstall() {
        logger.logInfo("卸载插件");
        await this.onunload();
    }

}
