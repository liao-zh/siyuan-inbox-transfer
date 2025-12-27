/**
 * dock栏设置服务
 */
import { mount } from "svelte";
import PluginInboxTransfer from "@/index";
import DockComponent from "@/worker/dockComponent.svelte";

export class DockService {
    private plugin: PluginInboxTransfer;

    constructor(plugin: PluginInboxTransfer) {
        this.plugin = plugin;
        // this.initDock();
    }

    initDock(hotkey: string = "⌥⇧6") {
        this.plugin.addDock({
            config: {
                position: "LeftBottom",
                size: { width: 300, height: 300 },
                icon: "iconInboxTransfer",
                title: this.plugin.i18n.dock["title"],
                hotkey: hotkey,
            },
            data: {
                plugin: this.plugin,
            },
            type: "__dock-tab",
            resize() {},
            update() {},
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
            destroy() {},
        });
    }
}