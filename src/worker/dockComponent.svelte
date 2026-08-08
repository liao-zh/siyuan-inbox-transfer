<!--
    dock栏内容svelte组件
-->
<script lang="ts">
    import { adaptHotkey, expandDocTree } from "siyuan";
    import { onDestroy } from 'svelte';
    import PluginInboxTransfer from "@/index";
    import { type IDoc } from "@/worker/fileManager";
    import { sortModeStore } from "@/worker/sortModeStore";
    import * as logger from "@/utils/logger";

    // 组件属性
    let { plugin }: { plugin: PluginInboxTransfer } = $props();

    // i18n文本
    let i18nDock = $derived(plugin.i18n.dock);

    // 中转文档列表变量与监听
    let docs = $state<IDoc[]>([]);
    let cleanupDocs: (() => void) | null = null;
    $effect(() => {
        const unsubscribe = plugin.fileManager.docs.subscribe(value => {
            docs = value;
        });
        cleanupDocs = unsubscribe; // 保存清理函数
        return unsubscribe; // 清理函数
    });

    // 中转站变量和监听
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
    // 当前列表中选中的文档数（按当前列表过滤，避免选中已删除文档时计数超总数）
    let selectedCount = $derived(
        docs.filter(doc => selectedIds.has(doc.id)).length
    );
    let isAllSelected = $derived(
        docs.length > 0 && selectedCount === docs.length
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

    // 排序相关
    // 初始排序方式从持久化设置读取（懒初始化闭包，仅取初始值，之后由共享状态订阅更新）
    let sortMode = $state<string>(() => plugin.settingService.get("sortMode") ?? "docTree");
    // 按排序方式处理后的文档列表（仅影响面板显示顺序）
    let sortedDocs = $derived(sortDocs(docs, sortMode));
    // 订阅共享排序状态：设置面板保存、Dock 下拉变更均通过 store 同步
    let cleanupSortMode: (() => void) | null = null;
    $effect(() => {
        const unsubscribe = sortModeStore.subscribe(value => {
            sortMode = value;
        });
        cleanupSortMode = unsubscribe; // 保存清理函数
        return unsubscribe; // 清理函数
    });
    // 按指定方式排序；收集时间未记录时回退按创建时间
    function sortDocs(list: IDoc[], mode: string): IDoc[] {
        const arr = [...list];
        switch (mode) {
            case "collectedDesc":
                return arr.sort((a, b) => (b.collectedAt ?? b.created) - (a.collectedAt ?? a.created));
            case "collectedAsc":
                return arr.sort((a, b) => (a.collectedAt ?? a.created) - (b.collectedAt ?? b.created));
            case "nameAsc":
                return arr.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
            case "nameDesc":
                return arr.sort((a, b) => b.name.localeCompare(a.name, "zh-Hans-CN"));
            default: // docTree：文档树顺序
                return arr;
        }
    }
    // 排序下拉变更：写入共享状态并持久化
    function sortChangeHandler(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        sortModeStore.set(value);
        plugin.settingService.setAndSave("sortMode", value);
    }

    // 整体事件
    // 刷新中转站
    let isRefreshing = $state(false);
    async function refreshHandler(event: MouseEvent) {
        event.stopPropagation();

        if (isRefreshing) return; // 防止重复点击

        isRefreshing = true;
        try {
            // 更新中转文档列表，以免收集箱没有新条目时不触发更新
            await plugin.fileManager.updateDocs();
            // 更新并移动收集箱条目
            await plugin.inboxManager.updateAndMove();
        } finally {
            isRefreshing = false;
        }
    }
    // 打开中转文档
    function openHandler(event: MouseEvent) {
        event.stopPropagation();
        // 打开选中的文档
        plugin.fileManager.openDocs(Array.from(selectedIds), event);
        // 打开后取消选中
        unSelectAll();
    }
    // 删除中转文档
    async function deleteHandler(event: MouseEvent) {
        event.stopPropagation();
        // 删除选中的文档
        await plugin.fileManager.removeDocs(Array.from(selectedIds));
        // 删除后取消选中
        unSelectAll();
    }
    // 定位中转站
    function locateHandler(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();

        // 打开文档树面板
        // 尝试每个dock位置
        let success = false;
        const posList = ["leftDock", "rightDock", "bottomDock"];
        for (const pos of posList) {
            if (window.siyuan.layout[pos].data.hasOwnProperty("file")) {
                // 函数：toggleModel(type, show, close, hide, isSaveLayout)
                window.siyuan.layout[pos].toggleModel("file", true, false, false);
                success = true;
            }
        }

        // 打开面板的后处理
        if (success) {
            // 设置高亮（toggleModel后没有自动设置高亮）
            const iconPlugin = document.querySelector(`div.dock span[data-type="${plugin.name}__dock-tab"]`) as HTMLElement;
            const iconFile = document.querySelector(`div.dock span[data-type="file"]`) as HTMLElement;
            setTimeout(() => {
                iconPlugin?.classList.remove("dock__item--activefocus");
                iconFile?.classList.add("dock__item--activefocus");
            }, 10);
        }
        else {
            logger.logWarn("未在dock栏找到文档树面板，请手动打开");
        };

        // 定位选中的文档
        expandDocTree({ id: plugin.fileManager.targetInfo.id, isSetCurrent: true });
    }

    // 单个列表项事件
    function itemHandler(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();

        // 获取元素和数据
        const target = event.target as Element;
        const docId = (event.currentTarget as HTMLElement).dataset.id as string;
        // 点击了checkbox区域，切换选中状态
        if (target.closest('.b3-list-item__action')) {
            toggleSelect(docId);
        }
        // 点击了文本区域，打开文档
        else if (target.closest('.b3-list-item__text')) {
            plugin.fileManager.openDocs([docId], event);
        }
    }

    // 组件销毁时的清理
    onDestroy(() => {
        if (cleanupDocs) {
            cleanupDocs();
            cleanupDocs = null;
        }
        if (cleanupTarget) {
            cleanupTarget();
            cleanupTarget = null;
        }
        if (cleanupSortMode) {
            cleanupSortMode();
            cleanupSortMode = null;
        }
        // logger.logDebug('Dock组件已销毁');
    });
</script>

<!-- 容器元素 -->
<!-- dock顶栏 -->
<div class="block__icons" style="flex-shrink: 0; overflow-x: auto; white-space: nowrap;">
    <!-- 标题 -->
    <div class="block__logo">
        <svg class="block__logoicon"><use xlink:href="#iconInboxTransfer"></use></svg>
        {i18nDock["title"]}
    </div>
    <span class="fn__flex-1"></span>
    <!-- 中转站有效时才显示功能按钮 -->
    {#if targetIsValid}
    <!-- 刷新 -->
    <span class="fn__space"></span>
    <button
        class="block__icon b3-tooltips b3-tooltips__w"
        class:refreshing={isRefreshing}
        disabled={isRefreshing}
        style="{isRefreshing ? 'opacity: 0.5; cursor: default; pointer-events: none;' : ''}"
        aria-label="{window.siyuan.languages.refresh}"
        onclick={refreshHandler}>
        <svg><use xlink:href="#iconRefresh"></use></svg>
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
<!-- 中转文档列表 -->
<div class="fn__flex-1 fn__flex-column" style="min-height: 0;">
    <!-- 第二行工具栏：全选 + 打开 + 删除（中转站有效时显示） -->
    {#if targetIsValid}
    <div class="block__icons dock-toolbar" style="flex-shrink: 0; flex-wrap: wrap;">
        <!-- 全选 -->
        <span class="fn__space"></span>
        <button
            class="block__icon b3-tooltips b3-tooltips__s"
            aria-label="{isAllSelected ? i18nDock["unSelectAll"] : i18nDock["selectAll"]}"
            onclick={toggleSelectAll}>
            <svg><use xlink:href="#icon{isAllSelected ? 'Check' : 'Uncheck'}"></use></svg>
            {#if docs.length > 0}
            <span class="dock__select-count">{selectedCount}/{docs.length}</span>
            {/if}
        </button>
        <!-- 打开 -->
        <span class="fn__space"></span>
        <button
            class="block__icon b3-tooltips b3-tooltips__s"
            aria-label="{window.siyuan.languages.openBy}"
            onclick={openHandler}>
            <svg><use xlink:href="#iconOpen"></use></svg>
        </button>
        <!-- 删除 -->
        <span class="fn__space"></span>
        <button
            class="block__icon b3-tooltips b3-tooltips__s"
            aria-label="{window.siyuan.languages.delete}"
            onclick={deleteHandler}>
            <svg><use xlink:href="#iconTrashcan"></use></svg>
        </button>
        <!-- 排序 -->
        <span class="fn__space"></span>
        <span class="b3-tooltips b3-tooltips__s dock__sort-wrap" aria-label="{i18nDock["sort"]}">
            <select
                class="b3-select dock__sort-select"
                onchange={sortChangeHandler}>
                <option value="docTree" selected={sortMode === "docTree"}>{plugin.i18n.setting["sortMode"]["docTree"]}</option>
                <option value="collectedDesc" selected={sortMode === "collectedDesc"}>{plugin.i18n.setting["sortMode"]["collectedDesc"]}</option>
                <option value="collectedAsc" selected={sortMode === "collectedAsc"}>{plugin.i18n.setting["sortMode"]["collectedAsc"]}</option>
                <option value="nameAsc" selected={sortMode === "nameAsc"}>{plugin.i18n.setting["sortMode"]["nameAsc"]}</option>
                <option value="nameDesc" selected={sortMode === "nameDesc"}>{plugin.i18n.setting["sortMode"]["nameDesc"]}</option>
            </select>
        </span>
    </div>
    {/if}
    <!-- 滚动列表 -->
    <div class="fn__flex-1" style="min-height: 0; overflow-y: auto;">
        <ul class="b3-list b3-list--background">
            <!-- 中转站无效 -->
            {#if !targetIsValid}
            <li class="b3-list--empty" style="opacity: 0.5;">{i18nDock["targetInvalid"]}</li>
            <!-- 中转文档列表为空 -->
            {:else if docs.length === 0}
                <li class="b3-list--empty" style="opacity: 0.5;">{i18nDock["inboxEmpty"]}</li>
            {:else}
            {#each sortedDocs as doc (doc.id)}
                    <!-- 中转文档列表项 -->
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
        animation-delay: 0.5s; /* 给一点准备时间，否则刚开始时旋转有些飘 */
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

    /* 第二行工具栏常显：覆盖思源 .file-tree 对 .block__icons 按钮的 hover 隐藏规则 */
    :global(.dock-toolbar .block__icon) {
        display: flex !important;
        opacity: 1 !important;
    }

    :global(.dock-toolbar .fn__space) {
        display: block !important;
    }

    /* 全选按钮计数文本 */
    .dock__select-count {
        font-size: 12px;
        line-height: 1;
        margin-left: 4px;
        opacity: 0.7;
        user-select: none;
    }

    /* 排序下拉：外包 span 推到工具栏右端，限制宽度避免撑破第二行工具栏 */
    .dock__sort-wrap {
        margin-left: auto;
    }
    .dock__sort-select {
        width: 128px;
        height: 24px;
        line-height: 24px;
        padding: 0 6px;
        font-size: 12px;
    }
</style>