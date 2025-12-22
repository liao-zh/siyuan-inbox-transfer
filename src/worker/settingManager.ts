// 管理设置
import { showMessage } from "siyuan";
import PluginInboxLight from "@/index";
import { SettingUtils } from "@/libs/setting-utils";
import { CONSTANTS as C } from "@/constants";
import { getHPathByID } from "@/utils/api";
import * as logger from "@/utils/logger";

/**
 * 管理插件设置
 */
export class SettingManager {
    private settingUtils: SettingUtils;
    // private plugin = getPluginInstance();
    private plugin: PluginInboxLight;

    constructor(plugin: PluginInboxLight) {
        this.plugin = plugin;
        // 初始化设置
        this.initSettingUtils();
        // 从存储加载设置
        this.settingUtils.load();
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
                    let value = await this.settingUtils.takeAndSave(C.SETTING_KEY_INBOXDOCID);
                    logger.logDebug(`设置：${C.SETTING_KEY_INBOXDOCID}`, value);

                    // // 尝试更新描述文本，但不大成功
                    // const textElem = document.querySelector('div.b3-label__text');
                    // logger.logDebug(`textElem: ${textElem?.innerHTML}`)
                    // const hint = i18nSetting[C.SETTING_KEY_INBOXDOCID]
                    // if (textElem && textElem.innerHTML.includes(hint["description"])) {
                    //     const hpath = await getHPathByID(value);
                    //     if (hpath) {
                    //         textElem.innerHTML = `${hint["description"]} ${hint["hpathHint"]}${hpath}`;
                    //     } else {
                    //         textElem.innerHTML = `${hint["description"]} ${hint["hpathHint"]}${hint["hpathInvaid"]}`;
                    //     }
                    // }
                    const i18nHint = i18nSetting[C.SETTING_KEY_INBOXDOCID]
                    const hpath = await getHPathByID(value);
                    if (hpath) {
                        showMessage(`${i18nHint["hpathHint"]}${hpath}`, 0, "info");
                    }
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
     * 获取设置值
     * @param key 设置键
     * @returns 设置值
     */
    get(key: string) {
        return this.settingUtils.get(key);
    }
}