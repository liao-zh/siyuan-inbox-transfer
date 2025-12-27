/**
 * 替换默认收集箱
 * 代码参考：[书签+插件](https://github.com/frostime/sy-bookmark-plus)
 */
import * as logger from "@/utils/logger";

/**
 * 更新样式DOM
 */
const updateStyleDom = (domId: string, css: string) => {
    let style: HTMLStyleElement = document.getElementById(domId) as HTMLStyleElement;
    if (!style) {
        style = document.createElement('style');
        style.id = domId;
        document.head.appendChild(style);
    }
    style.innerHTML = css;
}

/**
 * 移除样式DOM
 */
const removeStyleDom = (domId: string) => {
    const style = document.querySelector(`style#${domId}`);
    style?.remove();
}

/**
 * 替换内置收集箱
 * @method replace 替换内置收集箱
 * @method restore 恢复内置收集箱
 */
export class ReplaceBuiltIn {
    private keyInbox = window.siyuan.config.keymap.general.inbox;
    keyOriginal = this.keyInbox.custom || this.keyInbox.default;

    /**
     * 替换内置收集箱：在插件加载时执行
     */
    replaceOnLoad = () => {
        // 清空内置收集箱快捷键
        this.keyInbox.custom = "";
    }

    /**
     * 替换内置收集箱：在布局就绪时执行
     */
    replaceOnLayoutReady = () => {
        // 点击最小化内置收集箱图标
        const elem = document.querySelector(`div.file-tree.sy__inbox span[data-type="min"]`) as HTMLElement;
        elem?.click();
        // 隐藏内置收集箱图标
        updateStyleDom('hide-inbox', `
            div.dock span[data-type="inbox"] {
                display: none;
            }
        `);
    }

    /**
     * 恢复内置收集箱
     */
    restore = () => {
        this.keyInbox.custom = this.keyOriginal;
        removeStyleDom('hide-inbox');
    }


}
