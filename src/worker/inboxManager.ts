/**
 * 收集箱管理器
 */
import { get } from "svelte/store";
import PluginInboxTransfer from "@/index";
import { request } from "@/utils/api";
import * as logger from "@/utils/logger";

/**
 * 收集箱条目接口
 * 参考：siyuan/app/src/layout/dock/Inbox.ts:IInbox
 * @property oId 条目的ID，用于标识条目
 * @property shorthandContent 条目的内容
 * @property shorthandMd 条目的Markdown内容，用于新建文档填充内容
 * @property shorthandDesc 条目的描述
 * @property shorthandFrom 条目的来源
 * @property shorthandTitle 条目的标题，用于新建文档标题
 * @property shorthandURL 条目的URL
 * @property hCreated 条目的创建时间（YYYY-MM-DD HH:mm）
 */
interface IShorthand {
    oId: string;
    shorthandContent: string;
    shorthandMd: string;
    shorthandDesc: string;
    shorthandFrom: number;
    shorthandTitle: string;
    shorthandURL: string;
    hCreated: string;
}

/**
 * 收集箱管理器
 * @param plugin 插件实例
 * @method updateAndMove 更新收集箱并移动到目标文件夹
 */
export class InboxManager {
    private plugin: PluginInboxTransfer;
    private shorthands: IShorthand[] = [];

    constructor(plugin: PluginInboxTransfer) {
        this.plugin = plugin;
    }

    /**
     * 对所有收集箱条目：更新拉取-移动生成文档（-依据设置决定是否删除）
     * @returns 无
     */
    async updateAndMove() {
        // 清空收集箱条目
        this.shorthands = [];
        // 获取所有收集箱条目
        await this.getShorthands();
        // 对所有收集箱条目创建文档
        await this.moveShorthands();
        // 删除所有收集箱条目
        if (this.plugin.settingService.get("delShorthands")) {
            await this.removeShorthands();
        }
    }

    /**
     * 获取所有收集箱条目
     * 参考：siyuan/app/src/layout/dock/Inbox.ts:Inbox.update()
     * @returns 收集箱条目数组
     */
    private async getShorthands() {
        // 收集第一页条目，获取页数
        let currentPage = 1;
        const data = await request("/api/inbox/getShorthands", {page: currentPage});
        let pageCount = data.data.pagination.paginationPageCount;
        this.shorthands = this.shorthands.concat(data.data.shorthands);

        // 收集后续页条目
        while (currentPage < pageCount) {
            currentPage++;
            const data = await request("/api/inbox/getShorthands", {page: currentPage});
            this.shorthands = this.shorthands.concat(data.data.shorthands);
        }

        logger.logDebug("收集箱刷新", this.shorthands);
    }

    /**
     * 对所有收集箱条目创建文档
     * @returns 无
     */
    private async moveShorthands() {
        const targetIsValid = get(this.plugin.fileManager.targetIsValid);
        // 目标无效，不移动
        if (!targetIsValid) {
            logger.logWarn("收集箱移动", this.plugin.i18n.common["targetInvalid"]);
        }
        // 移动所有文档
        else {
            Promise.all(
                this.shorthands.map(
                    shorthand => this.createDoc(shorthand)
                )
            );
        }
    }

    /**
     * 从单个收集箱条目创建文档
     * 参考：siyuan/app/src/layout/dock/Inbox.ts:Inbox.move()
     * @param shorthand 收集箱条目
     */
    private async createDoc(shorthand: IShorthand) {
        // 检查目标是否有效
        const targetIsValid = get(this.plugin.fileManager.targetIsValid);
        if (!targetIsValid) {
            logger.logWarn("收集箱移动", this.plugin.i18n.common["targetInvalid"]);
            return;
        }

        // 设置文档信息
        const targetInfo = this.plugin.fileManager.targetInfo;
        // 设置标题
        let title: string;
        const docTimePrefix = this.plugin.settingService.get("docTimePrefix");
        switch (docTimePrefix) {
            case "1": // 无前缀
                title = shorthand.shorthandTitle;
                break;
            case "2": // YYYY-MM-DD
                title = shorthand.hCreated.split(" ")[0] + " " + shorthand.shorthandTitle;
                break;
            case "3": // YYYY-MM-DD HH:mm
                title = shorthand.hCreated + " " + shorthand.shorthandTitle;
                break;
            default:
                title = shorthand.shorthandTitle;
                break;
        }
        // 设置路径
        let hpath = `${targetInfo.hpath}/${title}`;
        // 处理空md的情况，参考了思源源码
        let md = shorthand.shorthandMd;
        if ("" === md && "" === shorthand.shorthandContent && "" != shorthand.shorthandURL) {
            md = "[" + title + "](" + shorthand.shorthandURL + ")";
        }

        // 创建文档
        logger.logDebug("从收集箱条目创建文档", hpath);
        await request(
            '/api/filetree/createDocWithMd',
            {
                notebook: targetInfo.notebookId,
                path: hpath,
                parentID: targetInfo.id,
                markdown: md,
            }
        );
    }

    /**
     * 删除所有收集箱条目
     * @returns 无
     */
    private async removeShorthands() {
        // 所有收集箱条目ID
        let oIds = this.shorthands.map(shorthand => shorthand.oId);
        // 删除所有条目
        logger.logDebug("删除收集箱条目", oIds);
        await request("/api/inbox/removeShorthands", {ids: oIds});
        // 更新条目列表
        this.shorthands = [];
    }
}
