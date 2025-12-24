// 管理设置
import { showMessage } from "siyuan";
import { get } from "svelte/store";
import PluginInboxLight from "@/index";
import { SettingUtils } from "@/libs/setting-utils";
import { CONSTANTS as C } from "@/constants";
import * as logger from "@/utils/logger";

/**
 * 管理插件设置
 * @param plugin 插件实例
 * @method load() 加载插件设置
 * @method get(key) 获取插件设置项值
 */
export class SettingService {
    private settingUtils: SettingUtils;
    private plugin: PluginInboxLight;

    constructor(plugin: PluginInboxLight) {
        this.plugin = plugin;
        // 初始化设置
        this.initSettingUtils();
    }

    /**
     * 初始化设置工具
     */
    private initSettingUtils() {
        const i18nSetting = this.plugin.i18n.setting;

        // 设置工具初始化
        this.settingUtils = new SettingUtils({
            plugin: this.plugin,
            name: C.SETTING_STORAGE,
            height: C.SETTING_STORAGE_HEIGHT,
            callback: (data) => {
                logger.logDebug("设置完成", data);
            }
        });

        // 添加设置项
        // 收集箱暂存文档ID
        this.settingUtils.addItem({
            key: C.SETTING_KEY_INBOXDOCID,
            value: "",
            type: "textinput",
            title: i18nSetting[C.SETTING_KEY_INBOXDOCID]["title"],
            description: i18nSetting[C.SETTING_KEY_INBOXDOCID]["description"],
            action: {
                callback: async () => {
                    // 从文本框读取设置值
                    let value = await this.settingUtils.takeAndSave(C.SETTING_KEY_INBOXDOCID);
                    logger.logDebug(`设置：${C.SETTING_KEY_INBOXDOCID}`, value);
                    // 检查并设置目标id
                    await this.plugin.fileManager.setTarget(value);
                    await this.plugin.fileManager.updateChildDocs();
                    // 提示结果
                    if (get(this.plugin.fileManager.targetIsValid)) {
                        showMessage(`${i18nSetting[C.SETTING_KEY_INBOXDOCID]["targetHint"]}${this.plugin.fileManager.targetInfo.notebookName}/${this.plugin.fileManager.targetInfo.hpath}`, 2000, "info");
                    } else {
                        showMessage(`${i18nSetting[C.SETTING_KEY_INBOXDOCID]["targetInvalid"]}`, 2000, "error");
                    }
                }
            }
        });
        // 文档名日期前缀
        this.settingUtils.addItem({
            key: C.SETTING_KEY_DOCTIMEPREFIX,
            value: true,
            type: "checkbox",
            title: i18nSetting[C.SETTING_KEY_DOCTIMEPREFIX]["title"],
            description: i18nSetting[C.SETTING_KEY_DOCTIMEPREFIX]["description"],
            action: {
                callback: () => {
                    let value = !this.settingUtils.get(C.SETTING_KEY_DOCTIMEPREFIX);
                    this.settingUtils.setAndSave(C.SETTING_KEY_DOCTIMEPREFIX, value);
                    logger.logDebug(`设置：${C.SETTING_KEY_DOCTIMEPREFIX}`, value);
                }
            }
        });
        // 替换内置收集箱
        this.settingUtils.addItem({
            key: C.SETTING_KEY_REPLACEBUILTIN,
            value: false,
            type: "checkbox",
            title: i18nSetting[C.SETTING_KEY_REPLACEBUILTIN]["title"],
            description: i18nSetting[C.SETTING_KEY_REPLACEBUILTIN]["description"],
            action: {
                callback: () => {
                    let value = !this.settingUtils.get(C.SETTING_KEY_REPLACEBUILTIN);
                    this.settingUtils.setAndSave(C.SETTING_KEY_REPLACEBUILTIN, value);
                    logger.logDebug(`设置：${C.SETTING_KEY_REPLACEBUILTIN}`, value);
                }
            }
        });

    }

    /**
     * 加载设置
     */
    async load() {
        await this.settingUtils.load();
    }

    /**
     * 获取设置值
     * @param key 设置键
     * @returns 设置值
     */
    get(key: string) {
        return this.settingUtils.get(key);
    }
}