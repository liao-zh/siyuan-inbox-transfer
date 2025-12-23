// 管理设置
import { showMessage } from "siyuan";
import PluginInboxLight from "@/index";
import { SettingUtils } from "@/libs/setting-utils";
import { CONSTANTS as C } from "@/constants";
import * as logger from "@/utils/logger";

/**
 * 管理插件设置
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
    initSettingUtils() {
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
                    await this.plugin.fileManager.getChildDocs();
                    // 提示结果
                    if (this.plugin.fileManager.targetIsValid) {
                        showMessage(`${i18nSetting[C.SETTING_KEY_INBOXDOCID]["targetHint"]}${this.plugin.fileManager.targetInfo.notebookName}/${this.plugin.fileManager.targetInfo.hpath}`, 2000, "info");
                        // logger.logDebug("childDocs", this.fileManager.childDocs);
                    } else {
                        showMessage(`${i18nSetting[C.SETTING_KEY_INBOXDOCID]["targetInvalid"]}`, 2000, "error");
                    }
                    // // 尝试更新描述文本，但不大成功
                    // const textElem = document.querySelector('div.b3-label__text');
                    // logger.logDebug(`textElem: ${textElem?.innerHTML}`)
                    // const hint = i18nSetting[C.SETTING_KEY_INBOXDOCID]
                    // if (textElem && textElem.innerHTML.includes(hint["description"])) {
                    //     const hpath = await getHPathByID(value);
                    //     if (hpath) {
                    //         textElem.innerHTML = `${hint["description"]} ${hint["targetHint"]}${hpath}`;
                    //     } else {
                    //         textElem.innerHTML = `${hint["description"]} ${hint["targetHint"]}${hint["hpathInvaid"]}`;
                    //     }
                    // }
                    // const i18nHint = i18nSetting[C.SETTING_KEY_INBOXDOCID]
                    // const hpath = await getHPathByID(value);
                    // if (hpath) {
                    //     showMessage(`${i18nHint["targetHint"]}${hpath}`, 0, "info");
                    // }
                    // const data = await sql(`SELECT box, path, hpath FROM blocks WHERE id="${value}" and type="d"`);
                    // logger.logDebug(`checkTarget: ${JSON.stringify(data)}`);


                }
            }
        });
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