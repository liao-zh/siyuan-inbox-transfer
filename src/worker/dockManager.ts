import { adaptHotkey } from "siyuan";
import PluginInboxLight from "@/index";
import DockComponent from "@/dock.svelte";
import { mount } from "svelte";


const DOCK_TYPE = "dock_tab";


export class DockManager {
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
                hotkey: "⌥⌘W",
            },
            data: {
                text: "测试45"
            },
            type: DOCK_TYPE,
            resize() {
                console.log(DOCK_TYPE + " resize");
            },
            update() {
                console.log(DOCK_TYPE + " update");
            },
            init: (dock) => {
                // 清空容器
                dock.element.innerHTML = '';

                // 使用Svelte组件
                const component = mount(DockComponent, {
                    target: dock.element,
                    props: {
                        title: this.plugin.i18n.dock["title"],
                        text: dock.data.text
                    }
                });

            },
            destroy() {
                console.log("destroy dock:", DOCK_TYPE);
            }
        });
    }
}