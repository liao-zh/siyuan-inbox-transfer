import PluginInboxLight from "@/index";
import { request } from "@/utils/api";
import * as logger from "@/utils/logger";

/**
 * 收集箱条目接口
 * 参考：siyuan/app/src/layout/dock/Inbox.ts:IInbox
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
    private plugin: PluginInboxLight;
    private shorthands: IShorthand[] = [];

    constructor(plugin: PluginInboxLight) {
        this.plugin = plugin;
    }

    /**
     * 对所有收集箱条目：更新拉取-移动生成文档-删除
     * @returns 无
     */
    async updateAndMove() {
        await this.getShorthands();
        await this.moveShorthands();
        await this.removeShorthands();
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
        Promise.all(
            this.shorthands.map(
                shorthand => this.createDocFromShorthand(shorthand)
            )
        );
    }

    /**
     * 从单个收集箱条目创建文档
     * @param shorthand 收集箱条目
     */
    private async createDocFromShorthand(shorthand: IShorthand) {
        const targetInfo = this.plugin.fileManager.targetInfo;
        // 设置文档信息
        let hpath = `${targetInfo.hpath}/${shorthand.shorthandTitle}`;
        // 处理空md的情况，参考了思源源码
        let md = shorthand.shorthandMd;
        if ("" === md && "" === shorthand.shorthandContent && "" != shorthand.shorthandURL) {
            md = "[" + shorthand.shorthandTitle + "](" + shorthand.shorthandURL + ")";
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
