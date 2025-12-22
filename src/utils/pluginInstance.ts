// import { Plugin } from "siyuan";
import PluginInboxLight from "@/index";
import { logError } from "@/utils/logger"

/**
 * 插件实例变量
 */
let pluginInstance: PluginInboxLight | null = null

/**
 * 设置插件实例
 * @param instance - 插件实例
 */
export function setPluginInstance(instance: PluginInboxLight) {
    pluginInstance = instance
}

/**
 * 获取插件实例
 * @returns {PluginInboxLight} - 插件实例
 */
export function getPluginInstance(): PluginInboxLight {
    if (!pluginInstance) {
        logError("getPluginInstance错误：插件实例未绑定")
    }
    return pluginInstance
}