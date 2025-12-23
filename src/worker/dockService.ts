import { adaptHotkey } from "siyuan";
import PluginInboxLight from "@/index";
import DockComponent from "@/dockComponent.svelte";
import { mount } from "svelte";

export interface II18nDock {
    title: string;
    locate: string;
    inboxEmpty: string;
}

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
                size: { width: 250, height: 0 },
                icon: "iconInbox",
                title: this.plugin.i18n.dock["title"],
                hotkey: "⌥⌘W",
            },
            data: {
                text: "测试45"
            },
            type: "dock_tab",
            resize() {},
            update() {},
            init: (dock) => {
                // 清空容器
                dock.element.innerHTML = '';

                // 使用Svelte组件
                const component = mount(DockComponent, {
                    target: dock.element,
                    props: {
                        i18nDock: this.plugin.i18n.dock as unknown as II18nDock,
                    }
                });

            },
            destroy() {},
        });
    }
}