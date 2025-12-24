import PluginInboxLight from "@/index";
import DockComponent from "@/dockComponent.svelte";
import { mount } from "svelte";
import { adaptHotkey } from "siyuan";

export class DockService {
    private plugin: PluginInboxLight;

    constructor(plugin: PluginInboxLight) {
        this.plugin = plugin;
        this.initDock();
    }

    initDock() {
        this.plugin.addDock({
            config: {
                position: "LeftBottom",
                size: { width: 200, height: 0 },
                icon: "iconInbox",
                title: this.plugin.i18n.dock["title"],
                hotkey: adaptHotkey("⇧⌥6"),
            },
            data: {
                plugin: this.plugin,
            },
            type: "dock_tab",
            resize() {},
            update() {},
            init() {
                // 清空容器
                this.element.innerHTML = '';
                // 使用Svelte组件
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