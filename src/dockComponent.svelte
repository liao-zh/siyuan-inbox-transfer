<!--
 FilePath     : /src/dock.svelte
 Description  : Dock component for inbox light plugin
-->
<script lang="ts">
    import { adaptHotkey, expandDocTree } from "siyuan";
    import { onDestroy } from 'svelte';
    import PluginInboxLight from "@/index";
    import { type IChildDoc } from "@/worker/fileManager";
    import { CONSTANTS as C } from "@/constants";
    import * as logger from "@/utils/logger";

    // 组件属性
    let { plugin }: { plugin: PluginInboxLight } = $props();

    // i18n文本
    let i18nDock = $derived(plugin.i18n.dock);
    // 文档列表变量与监听
    let docs = $state<IChildDoc[]>([]);
    let cleanupDocs: (() => void) | null = null;
    $effect(() => {
        const unsubscribe = plugin.fileManager.childDocs.subscribe(value => {
            docs = value;
        });
        cleanupDocs = unsubscribe; // 保存清理函数
        return unsubscribe; // 清理函数
    });

    // 目标存在性变量和监听
    let targetIsValid = $state(false);
    let cleanupTarget: (() => void) | null = null;
    $effect(() => {
        const unsubscribe = plugin.fileManager.targetIsValid.subscribe(value => {
            targetIsValid = value;
        });
        cleanupTarget = unsubscribe; // 保存清理函数
        return unsubscribe; // 清理函数
    });

    // 处理多选
    // 多选相关的变量
    let selectedIds = $state(new Set<string>());
    let isAllSelected = $derived(
        docs.length > 0 && selectedIds.size === docs.length
    );
    // 选中/取消选中
    function toggleSelect(docId: string) {
        if (selectedIds.has(docId)) {
            selectedIds.delete(docId);
        } else {
            selectedIds.add(docId);
        }
        selectedIds = new Set(selectedIds);
    }
    // 全选/取消全选
    function toggleSelectAll() {
        if (isAllSelected) {
            selectedIds.clear();
            selectedIds = new Set();
        } else {
            selectedIds = new Set(docs.map(doc => doc.id));
        }
    }
    // 取消选中所有
    function unSelectAll() {
        selectedIds.clear();
        selectedIds = new Set();
    }

    // 整体事件
    // 刷新
    let isRefreshing = $state(false);
    async function refreshHandler(event: MouseEvent) {
        event.stopPropagation();

        if (isRefreshing) return; // 防止重复点击

        isRefreshing = true;
        try {
            // 更新子文档列表，以免收集箱没有新条目时不触发更新
            await plugin.fileManager.updateChildDocs();
            // 更新并移动收集箱条目
            await plugin.inboxManager.updateAndMove();
        } finally {
            isRefreshing = false;
        }
    }
    // 打开
    function openHandler(event: MouseEvent) {
        event.stopPropagation();
        // 打开选中的文档
        plugin.fileManager.openChildDocs(Array.from(selectedIds), event);
        // 打开后取消选中
        unSelectAll();
    }
    // 删除
    async function deleteHandler(event: MouseEvent) {
        event.stopPropagation();
        // 删除选中的文档
        await plugin.fileManager.removeChildDocs(Array.from(selectedIds));
        // 删除后取消选中
        unSelectAll();
    }
    // 定位
    function locateHandler(event: MouseEvent) {
        event.stopPropagation();
        // 打开文档树栏
        // document.querySelector('.file-tree')?.classList.add('layout__tab--active');
        // 定位选中的文档
        expandDocTree({id: plugin.fileManager.targetInfo.id, isSetCurrent: true});
    }

    // 单个列表项事件
    function itemHandler(event: MouseEvent) {
        event.stopPropagation();
        // 获取元素和数据
        const target = event.target as Element;
        const docId = (event.currentTarget as HTMLElement).dataset.id as string;
        // 点击了checkbox区域，切换选中状态
        if (target.closest('.b3-list-item__action')) {
            toggleSelect(docId);
        }
        // 点击了文本区域，打开文档
        else if (target.closest('.b3-list-item__text')) {
            plugin.fileManager.openChildDocs([docId], event);
        }
    }

    // 组件销毁时的清理
    onDestroy(() => {
        // 清理文档列表订阅
        if (cleanupDocs) {
            cleanupDocs();
            cleanupDocs = null;
        }
        // 清理目标有效性订阅
        if (cleanupTarget) {
            cleanupTarget();
            cleanupTarget = null;
        }
        logger.logDebug('Dock组件已销毁');
    });
</script>

<div class="fn__flex-column file-tree sy__inbox" style="height: 100%; overflow: hidden;">
    <!-- dock顶栏 -->
    <div class="block__icons" style="flex-shrink: 0; overflow-x: auto; white-space: nowrap;">
        <!-- 标题 -->
        <div class="block__logo">{i18nDock["title"]}</div>
        <span class="fn__flex-1"></span>
        <!-- 目标有效时才显示功能按钮 -->
        {#if targetIsValid}
        <!-- 刷新 -->
        <span class="fn__space"></span>
        <button
            class="block__icon b3-tooltips b3-tooltips__w"
            class:refreshing={isRefreshing}
            disabled={isRefreshing}
            style="{isRefreshing ? 'opacity: ' + C.STYLE_DISABLED_OPACITY + ';' + 'cursor: default; pointer-events: none;' : ''}"
            aria-label="{window.siyuan.languages.refresh}"
            onclick={refreshHandler}>
            <svg><use xlink:href="#iconRefresh"></use></svg>
        </button>
        <!-- 全选 -->
        <span class="fn__space"></span>
        <button
            class="block__icon b3-tooltips b3-tooltips__w"
            aria-label="{isAllSelected ? i18nDock["unSelectAll"] : i18nDock["selectAll"]}"
            onclick={toggleSelectAll}>
            <svg><use xlink:href="#icon{isAllSelected ? 'Check' : 'Uncheck'}"></use></svg>
        </button>
        <!-- 打开 -->
        <span class="fn__space"></span>
        <button
            class="block__icon b3-tooltips b3-tooltips__w"
            aria-label="{window.siyuan.languages.openBy}"
            onclick={openHandler}>
            <svg><use xlink:href="#iconOpen"></use></svg>
        </button>
        <!-- 删除 -->
        <span class="fn__space"></span>
        <button
            class="block__icon b3-tooltips b3-tooltips__w"
            aria-label="{window.siyuan.languages.delete}"
            onclick={deleteHandler}>
            <svg><use xlink:href="#iconTrashcan"></use></svg>
        </button>
        <!-- 定位 -->
        <span class="fn__space"></span>
        <button
            class="block__icon b3-tooltips b3-tooltips__w"
            aria-label="{i18nDock["locate"]}"
            onclick={locateHandler}>
            <svg><use xlink:href="#iconFocus"></use></svg>
        </button>
        {/if}
        <!-- 最小化 -->
        <span class="fn__space"></span>
        <span
            data-type="min"
            class="block__icon b3-tooltips b3-tooltips__w"
            aria-label="{window.siyuan.languages.min} {adaptHotkey(window.siyuan.config.keymap.general.closeTab.custom)}">
            <svg><use xlink:href="#iconMin"></use></svg>
        </span>
    </div>
    <!-- 文档列表 -->
    <div class="fn__flex-column" style="flex: 1; overflow-y: auto;">
        <ul class="b3-list b3-list--background">
            <!-- 目标无效 -->
            {#if !targetIsValid}
            <li class="b3-list--empty" style="opacity: {C.STYLE_DISABLED_OPACITY};">{i18nDock["targetInvalid"]}</li>
            <!-- 空列表 -->
            {:else if docs.length === 0}
                <li class="b3-list--empty" style="opacity: {C.STYLE_DISABLED_OPACITY};">{i18nDock["inboxEmpty"]}</li>
            {:else}
            {#each docs as doc (doc.id)}
                    <!-- 列表项 -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <li
                        class="b3-list-item"
                        data-id="{doc.id}"
                        class:b3-list-item--focus={selectedIds.has(doc.id)}
                        onclick={itemHandler}>
                        <span
                            class="b3-list-item__action"
                            role="checkbox"
                            tabindex="0"
                            aria-checked={selectedIds.has(doc.id)}
                            aria-label="{window.siyuan.languages.select}">
                            <svg><use xlink:href="#icon{selectedIds.has(doc.id) ? 'Check' : 'Uncheck'}"></use></svg>
                        </span>
                        <span class="fn__space--small"></span>
                        <span
                            class="b3-list-item__text"
                            title="{doc.name}">
                            {doc.name}
                        </span>
                    </li>
                {/each}
            {/if}
        </ul>
    </div>
</div>

<style>
    /* 刷新按钮旋转动画 */
    .block__icon.refreshing svg {
        animation: rotate 2s linear infinite;
        transform-origin: center;
        animation-delay: 0.5s; /* 给浏览器一点准备时间，否则刚开始时旋转有些飘 */
        transform: rotate(0deg);
    }

    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
</style>