/**
 * 替换默认收集箱
 * 代码参考：[书签+插件](https://github.com/frostime/sy-bookmark-plus)
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

const removeStyleDom = (domId: string) => {
    const style = document.querySelector(`style#${domId}`);
    style?.remove();
}

export const useSiyuanInbox = () => {
    const inboxKeymap = window.siyuan.config.keymap.general.inbox;
    const initial = inboxKeymap.custom || inboxKeymap.default;

    return {
        initial,
        // 替换内置收集箱
        replaceBuiltIn: () => {
            inboxKeymap.custom = '';
            updateStyleDom('hide-inbox', `
                .dock span[data-type="inbox"] {
                    display: none;
                }
            `);
            const min = document.querySelector('div.file-tree.sy__inbox:not(.plugin__inbox_transfer) span[data-type="min"]') as HTMLElement;
            min?.click();
        },
        // 恢复内置收集箱
        restoreBuiltIn: (initial: string) => {
            inboxKeymap.custom = initial;
            removeStyleDom('hide-inbox');
        }
    }
}
