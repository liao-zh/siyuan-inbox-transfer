/**
 * 插件入口
 */
import { Plugin } from "siyuan";
import { FileManager } from "@/worker/fileManager";
import { InboxManager } from "@/worker/inboxManager";
import { SettingService } from "@/worker/settingService";
import { DockService } from "@/worker/dockService";
import { svgs } from "@/icons/svgs";
import { updateStyleDom, removeStyleDom } from "@/utils/replaceBuiltIn";
import * as logger from "@/utils/logger";

const useSiyuanInbox = () => {
    const inboxKeymap = window.siyuan.config.keymap.general.inbox;
    const initial = inboxKeymap.custom || inboxKeymap.default;

    return {
        initial,
        replaceOnLoad: () => {
            // 替换默认的快捷键
            inboxKeymap.custom = '';
        },
        replaceOnLayoutReady: () => {
            // 点击最小化内置收集箱图标
            const elem = document.querySelector(`div.file-tree.sy__inbox span[data-type="min"]`) as HTMLElement;
            elem?.click();
            // 隐藏内置收集箱图标
            updateStyleDom('hide-inbox', `
                div.dock span[data-type="inbox"] {
                    display: none;
                }
            `);
        },
        // 恢复
        restore: () => {
            // 恢复默认的快捷键
            inboxKeymap.custom = initial;
            removeStyleDom('hide-inbox');
        }
    }
}

/**
 * 插件主类
 */
export default class PluginInboxTransfer extends Plugin {
    fileManager: FileManager;
    inboxManager: InboxManager;
    settingService: SettingService;
    dockService: DockService;
    private inboxKeymap = useSiyuanInbox();

    async onload() {
        logger.logInfo("加载插件");

        // 添加图标
        this.addIcons(svgs);

        // 构建模块
        this.settingService = new SettingService(this);
        this.inboxManager = new InboxManager(this);
        this.fileManager = new FileManager(this);
        this.dockService = new DockService(this);
        // this.replaceBuiltIn = new ReplaceBuiltIn(this);

        // 初始化
        await this.settingService.load();
        await this.fileManager.setTarget(this.settingService.get("targetId"));
        this.fileManager.bindHandler();
        await this.fileManager.updateDocs();

        // 替换内置收集箱
        if (this.settingService.get("replaceBuiltIn")) {
            this.inboxKeymap.replaceOnLoad();
            this.dockService.initDock(this.inboxKeymap.initial);
        } else {
            this.dockService.initDock();
        }

    }

    onLayoutReady() {
        logger.logInfo("布局就绪");
        // 替换内置收集箱
        if (this.settingService.get("replaceBuiltIn")) {
            this.inboxKeymap.replaceOnLayoutReady();
        }
    }

    onunload() {
        logger.logInfo("关闭插件");
        // 插件清理
        this.fileManager.unbindHandler();
        this.inboxKeymap.restore();
    }

    uninstall() {
        logger.logInfo("卸载插件");
        this.onunload();
    }

}
