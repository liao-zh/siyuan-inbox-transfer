/**
 * dock栏设置服务
 */
import { mount } from "svelte";
// import { adaptHotkey } from "siyuan";
import PluginInboxLight from "@/index";
import DockComponent from "@/worker/dockComponent.svelte";

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
                size: { width: 300, height: 300 },
                icon: "iconInboxTransfer",
                title: this.plugin.i18n.dock["title"],
                // hotkey: adaptHotkey("⇧⌥6"),
            },
            data: {
                plugin: this.plugin,
            },
            type: "::dock",
            resize() {},
            update() {},
            init() {
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