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
                position: "LeftTop",
                size: { width: 250, height: 0 },
                icon: "iconInbox",
                title: this.plugin.i18n.dock["title"],
                hotkey: adaptHotkey("⇧⌥6"),
            },
            data: {},
            type: "dock_tab",
            resize() {},
            update() {},
            init: (dock) => {
                // 清空容器
                dock.element.innerHTML = '';
                // 使用Svelte组件
                mount(DockComponent, {
                    target: dock.element,
                    props: {
                        plugin: this.plugin,
                    }
                });
            },
            destroy() {},
        });
    }
}