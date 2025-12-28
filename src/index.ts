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
import { ReplaceBuiltIn } from "@/utils/replaceBuiltIn";
import * as logger from "@/utils/logger";





/**
 * 插件主类
*/
export default class PluginInboxTransfer extends Plugin {
    fileManager = new FileManager(this); // 文件管理器
    inboxManager = new InboxManager(this); // 收集箱管理器
    settingService = new SettingService(this); // 设置服务
    private replaceBuiltin = new ReplaceBuiltIn(); // 替换内置收集箱

    async onload() {
        logger.logInfo("加载插件");

        // 添加图标
        this.addIcons(svgs);

        // 初始化
        await this.settingService.load();
        await this.fileManager.setTarget(this.settingService.get("targetId"));
        await this.fileManager.updateDocs();

        // 替换内置收集箱
        let hotkey = "⌥⇧6";
        if (this.settingService.get("replaceBuiltIn")) {
            this.replaceBuiltin.replaceOnLoad();
            hotkey = this.replaceBuiltin.keyInit;
        }

        // 添加dock栏
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
        // 文档管理器
        this.fileManager.bindHandler();
        // 替换内置收集箱
        if (this.settingService.get("replaceBuiltIn")) {
            this.replaceBuiltin.replaceOnLayoutReady();
        }
    }

    onunload() {
        logger.logInfo("关闭插件");
        // 文档管理器
        this.fileManager.unbindHandler();
        // 恢复内置收集箱
        this.replaceBuiltin.restore();
    }

    uninstall() {
        logger.logInfo("卸载插件");
        this.onunload();
    }

}
