<!--
 FilePath     : /src/dock.svelte
 Description  : Dock component for inbox light plugin
-->
<script lang="ts">
    import { adaptHotkey } from "siyuan";
    import PluginInboxLight from "@/index";
    import { type IChildDoc } from "./worker/fileManager";
    import * as logger from "@/utils/logger";

    // 组件属性
    let { plugin }: { plugin: PluginInboxLight } = $props();

    // i18n文本
    let i18nDock = $derived(plugin.i18n.dock);
    // 文档列表
    let docs = $state<IChildDoc[]>([]);
    // 订阅 store 变化
    $effect(() => {
        const unsubscribe = plugin.fileManager.childDocs.subscribe(value => {
            docs = value;
    });
    // // 手动更新函数
    // function updateDocs() {
    //     docs = [...plugin.fileManager.childDocs];
    // }
    // // 初始加载
    // $effect(() => {
    //     updateDocs();
    // });

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
    async function refreshHandler(event: MouseEvent) {
        event.stopPropagation();
        // 更新并移动收集箱条目
        await plugin.inboxManager.updateAndMove();
        logger.logDebug("更新文档后", docs);
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
</script>

<div class="fn__flex-column file-tree sy__inbox" style="height: 100%; overflow: hidden;">
    <!-- dock顶栏 -->
    <div class="block__icons" style="flex-shrink: 0;">
        <!-- logo和标题 -->
        <div class="block__logo">
            <svg class="block__logoicon"><use xlink:href="#iconInbox"></use></svg>
            {i18nDock["title"]}
        </div>
        <span class="fn__flex-1"></span>
        <span class="fn__space"></span>
        <!-- 刷新 -->
        <button
            class="block__icon b3-tooltips b3-tooltips__w"
            aria-label="{window.siyuan.languages.refresh}"
            onclick={refreshHandler}>
            <svg><use xlink:href="#iconRefresh"></use></svg>
        </button>
        <span class="fn__space"></span>
        <!-- 全选 -->
        <button
            class="block__icon b3-tooltips b3-tooltips__w"
            aria-label="{isAllSelected ? i18nDock["unSelectAll"] : i18nDock["selectAll"]}"
            onclick={toggleSelectAll}>
            <svg><use xlink:href="#icon{isAllSelected ? 'Check' : 'Uncheck'}"></use></svg>
        </button>
        <span class="fn__space"></span>
        <!-- 打开 -->
        <button
            class="block__icon b3-tooltips b3-tooltips__w"
            aria-label="{window.siyuan.languages.openBy}"
            onclick={openHandler}>
            <svg><use xlink:href="#iconOpen"></use></svg>
        </button>
        <span class="fn__space"></span>
        <!-- 删除 -->
        <button
            class="block__icon b3-tooltips b3-tooltips__w"
            aria-label="{window.siyuan.languages.delete}"
            onclick={deleteHandler}>
            <svg><use xlink:href="#iconTrashcan"></use></svg>
        </button>
        <span class="fn__space"></span>
        <!-- 定位 -->
        <span
            data-type="locate"
            class="block__icon b3-tooltips b3-tooltips__w"
            aria-label="{i18nDock["locate"]}">
            <svg><use xlink:href="#iconFocus"></use></svg>
        </span>
        <span class="fn__space"></span>
        <!-- 最小化 -->
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
            <!-- 空列表, 显示提示 -->
            {#if docs.length === 0}
                <li class="b3-list--empty" style="opacity: 0.5;">{i18nDock["inboxEmpty"]}</li>
            {:else}
            {#each docs as doc (doc.id)}
                    <!-- 列表项，在li元素绑定事件，统一处理在checkbox和文本处点击的不同行为 -->
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