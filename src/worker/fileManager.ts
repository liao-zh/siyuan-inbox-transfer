/**
 * 中转文件管理器
 */
import { openTab, type IEventBusMap, confirm } from "siyuan";
import { writable, get } from "svelte/store";
import PluginInboxLight from "@/index";
import { request, sql, getNotebookConf, removeDoc } from "@/utils/api";
import * as logger from "@/utils/logger";

/**
 * 中转站信息接口
 * @property {string} id - 中转站ID
 * @property {string} notebookId - 中转站笔记本ID
 * @property {string} notebookName - 中转站笔记本名称
 * @property {string} path - 中转站路径
 * @property {string} hpath - 中转站hpath
 */
export interface ITarget {
    id: string;
    notebookId: string;
    notebookName: string;
    path: string;
    hpath: string;
}

/**
 * 中转文档接口
 * @property {string} name - 子文档名称
 * @property {string} id - 子文档ID
 */
export interface IDoc {
    name: string;
    id: string;
    path: string;
}

/**
 * 中转站文件管理器
 * @param plugin 插件实例
 * @attr targetIsValid {writable<boolean>} - 中转站是否有效
 * @attr targetInfo {ITarget} - 中转站信息
 * @attr childDocs {writable<IDoc[]>} - 中转文档列表
 * @method setTarget(targetId) 设置中转站信息
 * @method bindHandler() 绑定需要更新中转文档列表的事件处理器
 * @method unbindHandler() 解绑事件处理器
 * @method getChildDocs() 获取中转文档列表
 * @method removeChildDocs(childDocIds) 删除子文档列表
 * @method openChildDocs(childDocIds) 打开子文档列表
 */
export class FileManager {
    private plugin: PluginInboxLight;
    targetIsValid = writable<boolean>(false);
    targetInfo: null|ITarget = null;
    docs = writable<IDoc[]>([]);
    private updateHandlerRef = this.updateHandler.bind(this);

    constructor(plugin: PluginInboxLight) {
        this.plugin = plugin;
    }

    /**
     * 设置中转站信息
     * @param targetId - 中转站ID
     */
    async setTarget(targetId: string) {
        // 文档信息
        this.targetInfo = await this.getTargetInfo(targetId);
        // 文档是否有效
        if (this.targetInfo) {
            this.targetIsValid.set(true);
        } else {
            this.targetIsValid.set(false);
        }
        logger.logDebug("设置中转站", this.targetInfo);
    }

    /**
     * 获取中转站信息
     * @param targetId 中转站ID
     * @returns 中转站信息
     */
    private async getTargetInfo(targetId: string): Promise<null|ITarget> {
        // sql查询中转站的笔记本和路径
        const data = await sql(`SELECT box, path, hpath FROM blocks WHERE id="${targetId}" and type="d"`);
        // 结果为空，则返回null
        if (data.length === 0) {
            return null;
        }
        // 结果不为空，则返回中转站信息
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
     * 绑定事件处理器
    */
    bindHandler() {
        this.plugin.eventBus.on("ws-main", this.updateHandlerRef);
    }

    /**
     * 解绑事件处理器
     */
    unbindHandler() {
        this.plugin.eventBus.off("ws-main", this.updateHandlerRef);
    }

    /**
     * 发生事件时更新中转文档列表
     * @param event - 主WebSocket事件
     */
    async updateHandler(event: CustomEvent<IEventBusMap["ws-main"]>) {
        // logger.logDebug("ws-main事件：", event.detail.cmd);
        const cmdTypes = ["create", "removeDoc", "moveDoc", "rename"];
        if (cmdTypes.includes(event.detail.cmd)) {
            logger.logDebug(`触发事件：ws-main(${event.detail.cmd})"`, event);
            await this.updateDocs();
        }
    }

    /**
     * 获取中转文档列表
     * @returns 空
     */
    async updateDocs() {
        // 中转站无效，返回空列表
        if (!get(this.targetIsValid) || !this.targetInfo) {
            this.docs.set([]);
            return;
        }

        // 查询中转站中的文档
        const data = await request(
            "/api/filetree/listDocsByPath",
            {
                notebook: this.targetInfo.notebookId,
                path: this.targetInfo.path,
            }
        );
        // 提取文档信息
        this.docs.set(data.files.map(item => ({
            name: item.name.replace(/\.sy$/, ''),
            id: item.id,
            path: item.path
        })));
        logger.logDebug("获取中转文档列表", get(this.docs));
    }

    /**
     * 删除单个中转文档
     * @param docId 中转文档ID
     * @returns 无
     */
    private async removeDoc(docId: string) {
        if (!get(this.targetIsValid)) {
            return;
        }
        // const doc = this.childDocs.find(item => item.id === docId);
        const doc = get(this.docs).find(item => item.id === docId);
        if (doc) {
            await removeDoc(this.targetInfo.notebookId, doc.path);
        }
    }

    /**
     * 删除多个中转文档
     * @param docIds 中转文档ID列表
     * @returns 无
     */
    async removeDocs(docIds: string[]) {
        // 中转站无效，返回
        if (!get(this.targetIsValid)) {
            logger.logWarn("无法删除中转文档", this.plugin.i18n.common["targetInvalid"]);
        }
        else {
            // 删除多个中转文档
            if (this.plugin.settingService.get("delDocConfirm")) {
                confirm(
                    window.siyuan.languages.deleteOpConfirm,
                    this.plugin.i18n.common["delDocConfirmDesc"],
                    async () => {
                        logger.logDebug("删除中转文档", docIds);
                        await Promise.all(docIds.map(docId => this.removeDoc(docId)));
                    }
                )
            } else {
                logger.logDebug("删除中转文档", docIds);
                await Promise.all(docIds.map(docId => this.removeDoc(docId)));
            }
        }
    }

    /**
     * 打开多个中转文档
     * @param docIds 中转文档ID列表
     * @param event - 鼠标事件
     * @returns 无
     */
    openDocs(docIds: string[], event: MouseEvent) {
        logger.logDebug("打开中转文档", docIds);
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

}