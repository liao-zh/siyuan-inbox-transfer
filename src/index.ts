/**
 * 插件入口
 */
import { Plugin } from "siyuan";
import { mount } from "svelte";
import { FileManager } from "@/worker/fileManager";
import { InboxManager } from "@/worker/inboxManager";
import { SettingService } from "@/worker/settingService";
import DockComponent from "@/worker/dockComponent.svelte";
import { svgs } from "@/icons/svgs";
import { updateStyleDom, removeStyleDom } from "@/utils/DOMUtils";
import * as logger from "@/utils/logger";


const ReplaceBuiltIn = () => {
    const inboxKeymap = window.siyuan.config.keymap.general.inbox;
    const keyInit = inboxKeymap.custom || inboxKeymap.default;

    return {
        keyInit,
        // 替换内置收集箱：在插件加载时执行
        replaceOnLoad: () => {
            inboxKeymap.custom = '';
        },
        // 替换内置收集箱：在布局就绪时执行
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
        // 恢复内置收集箱
        restore: () => {
            inboxKeymap.custom = keyInit;
            removeStyleDom('hide-inbox');
        }
    }
}

const replaceBuiltin = ReplaceBuiltIn();

/**
 * 插件主类
 */
export default class PluginInboxTransfer extends Plugin {
    fileManager: FileManager;
    inboxManager: InboxManager;
    settingService: SettingService;

    async onload() {
        logger.logInfo("加载插件");

        // 添加图标
        this.addIcons(svgs);

        // 构建模块
        this.settingService = new SettingService(this);
        this.inboxManager = new InboxManager(this);
        this.fileManager = new FileManager(this);

        // 初始化
        await this.settingService.load();
        await this.fileManager.setTarget(this.settingService.get("targetId"));
        this.fileManager.bindHandler();
        await this.fileManager.updateDocs();

        // 替换内置收集箱
        let hotkey = "⌥⇧6";
        if (this.settingService.get("replaceBuiltIn")) {
            replaceBuiltin.replaceOnLoad();
            hotkey = replaceBuiltin.keyInit;
        }

        // 初始化dock栏
        this.addDock({
            config: {
                position: "LeftBottom",
                size: { width: 300, height: 300 },
                icon: "iconInboxTransfer",
                title: this.i18n.dock["title"],
                hotkey: hotkey,
            },
            data: {
                plugin: this,
            },
            type: "__dock-tab",
            resize() { },
            update() { },
            init() {
                logger.logWarn("初始化dock栏");
                // 创建容器类，会自动加上.sy__${this.plugin.name}__dock-tab
                this.element.classList.add("fn__flex-column", "file-tree");
                // 清空容器
                this.element.innerHTML = '';
                // 加载svelte组件
                mount(DockComponent, {
                    target: this.element,
                    props: {
                        plugin: this.data.plugin,
                    }
                });
            },
            destroy() { },
        });
    }

    onLayoutReady() {
        logger.logInfo("布局就绪");
        // 替换内置收集箱
        if (this.settingService.get("replaceBuiltIn")) {
            replaceBuiltin.replaceOnLayoutReady();
        }
    }

    onunload() {
        logger.logInfo("关闭插件");
        // 插件清理
        this.fileManager.unbindHandler();
        replaceBuiltin.restore();
    }

    uninstall() {
        logger.logInfo("卸载插件");
        this.onunload();
    }

}
