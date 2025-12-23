import { openTab, expandDocTree } from "siyuan";
import PluginInboxLight from "@/index";
import { request, sql, getNotebookConf } from "@/utils/api";
import * as logger from "@/utils/logger";

export interface ITargetInfo {
    id: string;
    notebookId: string;
    notebookName: string;
    path: string;
    hpath: string;
}

/**
 * 子文档接口
 * @property {string} name - 子文档名称
 * @property {string} id - 子文档ID
 */
export interface IChildDoc {
    name: string;
    id: string;
}

export class FileManager {
    private plugin: PluginInboxLight;
    targetId: string = "";
    targetIsValid: boolean = false;
    targetInfo: null|ITargetInfo = null;
    childDocs: IChildDoc[] = [];

    constructor(plugin: PluginInboxLight) {
        this.plugin = plugin;
    }

    async setTarget(targetId: string) {
        this.targetId = targetId;
        this.targetInfo = await this.getTargetInfo(targetId);
        if (this.targetInfo) {
            this.targetIsValid = true;
        } else {
            this.targetIsValid = false;
        }
        logger.logDebug("setTarget", this.targetInfo);
    }

    async getTargetInfo(targetId: string): Promise<null|ITargetInfo> {
        const data = await sql(`SELECT box, path, hpath FROM blocks WHERE id="${targetId}" and type="d"`);
        if (data.length === 0) {
            return null;
        } else {
            const notebookId = data[0]["box"] as string;
            const notebookConf = await getNotebookConf(notebookId);
            return {
                id: targetId,
                notebookId,
                notebookName: notebookConf.name,
                path: data[0]["path"] as string,
                hpath: data[0]["hpath"] as string,
            };
        }
    }

    async getChildDocs(): Promise<IChildDoc[]> {
        if (!this.targetIsValid) {
            this.childDocs = [];
            return this.childDocs;
        }

        const data = await request(
            "/api/filetree/listDocsByPath",
            {
                notebook: this.targetInfo?.notebookId,
                path: this.targetInfo?.path,
            }
        );

        // 提取子文档的名字和ID
        this.childDocs = data.files.map(item => ({
            name: item.name.replace(/\.sy$/, ''),
            id: item.id,
        }));
        return this.childDocs
    }

    // // 参考：siyuan-plugin-doctree-focus/src/index.ts:DocTreeFocusPlugin.focusOnDocument
    // expandDocTree({ id: this.fileManager.targetId, isSetCurrent: true});
    // async focusOnTarget() {
    //     const focusedElements = document.querySelectorAll(".file-tree.sy__file li.doctree-focused");
    //     focusedElements.forEach(el => {
    //         el.classList.remove("doctree-focused");
    //     });

    //     // Get all document elements in the file tree
    //     const allDocElements = document.querySelectorAll(".file-tree .b3-list-item");

    //     // Mark all documents as hidden
    //     allDocElements.forEach(el => {
    //         el.classList.add("doctree-hidden");
    //     });

    //     const docElement = document.querySelector(`.file-tree.sy__file li[data-node-id="${this.targetId}"]`);
    //     // Show the selected document and mark it as focused
    //     docElement.classList.remove("doctree-hidden");
    //     docElement.classList.add("doctree-focused");

    //     // Change tooltip direction for more-file and new buttons in focused document
    //     const moreFileBtn = docElement.querySelector('[data-type="more-file"]');
    //     const newBtn = docElement.querySelector('[data-type="new"]');
    //     const popoverBtn = docElement.querySelector('span.popover__block.counter');

    //     if (moreFileBtn && moreFileBtn.classList.contains('b3-tooltips__nw')) {
    //         moreFileBtn.classList.remove('b3-tooltips__nw');
    //         moreFileBtn.classList.add('b3-tooltips__w');
    //     }

    //     if (newBtn && newBtn.classList.contains('b3-tooltips__nw')) {
    //         newBtn.classList.remove('b3-tooltips__nw');
    //         newBtn.classList.add('b3-tooltips__w');
    //     }
    //     if (popoverBtn && popoverBtn.classList.contains('b3-tooltips__nw')) {
    //         popoverBtn.classList.remove('b3-tooltips__nw');
    //         popoverBtn.classList.add('b3-tooltips__w');
    //     }

    //     // Show all child documents
    //     const childDocs = Array.from(docElement.nextElementSibling?.querySelectorAll(".b3-list-item") || []);
    //     childDocs.forEach(el => {
    //         el.classList.remove("doctree-hidden");
    //     });

    //     // Add doctree-focus-active class to the file tree to hide specific buttons
    //     const fileTree = document.querySelector('.file-tree.sy__file');
    //     if (fileTree) {
    //         fileTree.classList.add('doctree-focus-active');
    //     }
    // }

    /**
     * 点击事件：打开文档
     * @param docId - 文档id
     * @param event - 鼠标事件
     */
    openDocHandler(docId: string, event: MouseEvent) {
        // 阻止事件其他行为
        event.stopPropagation();
        event.preventDefault();

        // log
        logger.logDebug(`打开文档：docId=${docId}`);

        // 打开新标签页
        openTab({
            app: this.plugin.app,
            doc: {
                id: docId,
            },
            // 条件属性：只有在按下辅助按键时才添加position属性
            // 如果多个键同时按下，后面属性覆盖前面
            ...(event.altKey && { position: "right" }), // alt+单击时，在右侧打开页签
            // ...(e.shiftKey && { position: "bottom" }),
            keepCursor: event.ctrlKey ? true : false, // ctrl+单击时，在后台打开页签
        });
    }
}