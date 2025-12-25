// 管理设置
import { showMessage } from "siyuan";
import { get } from "svelte/store";
import PluginInboxLight from "@/index";
import { SettingUtils } from "@/libs/setting-utils";
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
            name: "menu_config",
            height: "600px",
            callback: (data) => {
                logger.logDebug("设置完成", data);
            }
        });

        // 添加设置项
        // 收集箱中转站ID
        this.settingUtils.addItem({
            key: "targetId",
            value: "",
            type: "textinput",
            title: i18nSetting["targetId"]["title"],
            description: i18nSetting["targetId"]["description"],
            action: {
                callback: async () => {
                    // 从文本框读取设置值
                    let value = await this.settingUtils.takeAndSave("targetId");
                    logger.logDebug(`设置：targetId`, value);
                    // 检查并设置目标id
                    await this.plugin.fileManager.setTarget(value);
                    await this.plugin.fileManager.updateDocs();
                    // 提示结果
                    let hint = "";
                    if (get(this.plugin.fileManager.targetIsValid)) {
                        hint = `${i18nSetting["targetId"]["targetHint"]}${this.plugin.fileManager.targetInfo.notebookName}/${this.plugin.fileManager.targetInfo.hpath}`;
                        showMessage(hint, 2000, "info");
                    } else {
                        hint = i18nSetting["targetId"]["targetInvalid"]
                        showMessage(hint, 2000, "error");
                    }
                }
            }
        });

        // 文档名日期前缀
        this.settingUtils.addItem({
            key: "docTimePrefix",
            value: 1,
            type: "select",
            title: i18nSetting["docTimePrefix"]["title"],
            description: i18nSetting["docTimePrefix"]["description"],
            options: {
                1: i18nSetting["docTimePrefix"]["noPrefix"],
                2: "YYYY-MM-DD",
                3: "YYYY-MM-DD HH:mm"
            },
            action: {
                callback: () => {
                    // Read data in real time
                    let value = this.settingUtils.take("docTimePrefix");
                    logger.logDebug(`设置：docTimePrefix`, value);
                }
            }
        });


        // 中转文档删除确认
        this.settingUtils.addItem({
            key: "delDocConfirm",
            value: true,
            type: "checkbox",
            title: i18nSetting["delDocConfirm"]["title"],
            description: i18nSetting["delDocConfirm"]["description"],
            action: {
                callback: () => this.actionCheckbox("delDocConfirm")
            }
        });

        // 刷新后从收集箱中删除条目
        this.settingUtils.addItem({
            key: "delShorthands",
            value: false,
            type: "checkbox",
            title: i18nSetting["delShorthands"]["title"],
            description: i18nSetting["delShorthands"]["description"],
            action: {
                callback: () => this.actionCheckbox("delShorthands")
            }
        });

        // // 替换内置收集箱
        // this.settingUtils.addItem({
        //     key: "replaceBuiltIn",
        //     value: false,
        //     type: "checkbox",
        //     title: i18nSetting["replaceBuiltIn"]["title"],
        //     description: i18nSetting["replaceBuiltIn"]["description"],
        //     action: {
        //         callback: () => this.actionCheckbox("replaceBuiltIn")
        //     }
        // });

    }

    /**
     * 处理复选框点击事件
     * @param key 设置键
     */
    private actionCheckbox(key: string) {
        let value = !this.settingUtils.get(key);
        this.settingUtils.setAndSave(key, value);
        logger.logDebug(`设置：${key}`, value);
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