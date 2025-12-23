import { openTab, expandDocTree } from "siyuan";
import PluginInboxLight from "@/index";
import { request, sql, getNotebookConf, removeDoc } from "@/utils/api";
import * as logger from "@/utils/logger";

export interface ITarget {
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
    path: string;
}

export class FileManager {
    private plugin: PluginInboxLight;
    targetId: string = "";
    targetIsValid: boolean = false;
    targetInfo: null|ITarget = null;
    childDocs: IChildDoc[] = [];

    constructor(plugin: PluginInboxLight) {
        this.plugin = plugin;
    }

    /**
     * 设置目标文档信息
     * @param targetId - 目标文档ID
     */
    async setTarget(targetId: string) {
        // id
        this.targetId = targetId;
        // 文档信息
        this.targetInfo = await this.getTargetInfo(targetId);
        // 文档是否有效
        if (this.targetInfo) {
            this.targetIsValid = true;
        } else {
            this.targetIsValid = false;
        }
        logger.logDebug("设置目标路径", this.targetInfo);
    }

    /**
     * 获取目标文档信息
     * @param targetId 目标文档ID
     * @returns 目标文档信息
     */
    private async getTargetInfo(targetId: string): Promise<null|ITarget> {
        // sql查询目标文档的笔记本和路径
        const data = await sql(`SELECT box, path, hpath FROM blocks WHERE id="${targetId}" and type="d"`);
        // 结果为空，则返回null
        if (data.length === 0) {
            return null;
        }
        // 结果不为空，则返回目标文档信息
        else {
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

    /**
     * 获取目标文档的子文档列表
     * @returns 子文档列表
     */
    async getChildDocs(): Promise<IChildDoc[]> {
        // 目标文档无效，返回空列表
        if (!this.targetIsValid) {
            this.childDocs = [];
            return this.childDocs;
        }

        // 查询子文档
        const data = await request(
            "/api/filetree/listDocsByPath",
            {
                notebook: this.targetInfo?.notebookId,
                path: this.targetInfo?.path,
            }
        );
        // 提取子文档的信息
        this.childDocs = data.files.map(item => ({
            name: item.name.replace(/\.sy$/, ''),
            id: item.id,
            path: item.path
        }));
        logger.logDebug("获取文档列表", this.childDocs);
        return this.childDocs
    }

    /**
     * 删除单个子文档
     * @param docId 子文档ID
     * @returns 无
     */
    private async removeChildDoc(docId: string) {
        // 目标文档无效，返回
        if (!this.targetIsValid) {
            return;
        }
        // 查找子文档
        const doc = this.childDocs.find(item => item.id === docId);
        if (doc) {
            // 删除子文档
            await removeDoc(this.targetInfo.notebookId, doc.path);
        }
    }

    /**
     * 删除多个子文档
     * @param docIds 子文档ID列表
     * @returns 无
     */
    async removeChildDocs(docIds: string[]) {
        // 目标文档无效，返回
        if (!this.targetIsValid) {
            return;
        }
        // 删除多个子文档
        logger.logDebug("删除文档", docIds);
        await Promise.all(docIds.map(docId => this.removeChildDoc(docId)));
        // 更新子文档列表
        await this.getChildDocs();
    }

    /**
     * 打开多个文档
     * @param docIds 文档ID列表
     * @param event - 鼠标事件
     * @returns 无
     */
    openChildDocs(docIds: string[], event: MouseEvent) {
        // 阻止事件其他行为
        event.stopPropagation();
        event.preventDefault();

        // log
        logger.logDebug("打开文档", docIds);

        // 同时打开多个文档
        docIds.forEach((docId, index) => {
            // 延迟打开，避免同时打开过多标签页导致性能问题
            setTimeout(() => {
                openTab({
                    app: this.plugin.app,
                    doc: {
                        id: docId,
                    },
                    // 条件属性：只有在按下辅助按键时才添加position属性
                    ...(event.altKey && { position: "right" }), // alt+单击时，在右侧打开页签
                    keepCursor: event.ctrlKey ? true : false, // ctrl+单击时，在后台打开页签
                });
            }, index * 10); // 每个文档间隔10ms打开
        });
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

}