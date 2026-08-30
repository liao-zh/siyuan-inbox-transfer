<!--
    dock栏内容svelte组件
-->
<script lang="ts">
    import { adaptHotkey, expandDocTree } from "siyuan";
    import { onDestroy } from 'svelte';
    import PluginInboxTransfer from "@/index";
    import { type IDoc } from "@/worker/fileManager";
    import { sortModeStore } from "@/worker/sortModeStore";
import { sortDocs, rangeDocs, applyDragRange as applyDragRangePure, hitRowIndex as hitRowIndexPure } from "@/worker/dockList";
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

    // 拖过即选（Pointer Events 实现）
    const DRAG_THRESHOLD = 8; // 移动超过该像素数才判定为拖选，兼顾触摸板轻点抖动
    let pointerDown = false; // 指针是否按下（列表内）
    let pointerStartX = 0;
    let pointerStartY = 0;
    let dragActive = $state(false); // 是否已超过移动阈值进入拖选（模板 dock--selecting 依赖，需响应式）
    let dragStartIdx = -1; // 拖选开始条目的 sortedDocs 索引
    let dragCurIdx = -1; // 当前指针所在条目的索引
    let dragBaseIds = new Set<string>(); // 拖动开始时刻的选中集快照（并集语义基准）
    let dragRemoveMode = false; // 本次拖动模式：true=剔除，false=加入（按下瞬间由 ctrlKey 决定）
    let suppressNextClick = false; // 拖选结束时抑制本次 click 的打开/勾选动作
    let listEl = $state<HTMLElement | null>(null); // 列表滚动容器

    // 按下：记录起始点与起始行，并挂载 window 级指针监听（不捕获指针，避免 click 的 target 被重定向到 li 导致勾选框点击失效）
    function dragStart(e: PointerEvent, idx: number) {
        // 仅响应主按键（左键），避免右键/中键拖动干扰
        if (e.button !== 0) return;
        if (pointerDown) return;
        pointerDown = true;
        dragStartIdx = idx;
        dragCurIdx = idx;
        // 快照当前选中：拖选为并集语义，多次拖动只追加、不清空已有选中
        dragBaseIds = new Set(selectedIds);
        // 按下瞬间固化拖动模式：Ctrl 按住为剔除，否则为加入；拖动中途按/松 Ctrl 不影响本次
        dragRemoveMode = e.ctrlKey;
        pointerStartX = e.clientX;
        pointerStartY = e.clientY;
        window.addEventListener('pointermove', dragMove);
        window.addEventListener('pointerup', dragEnd);
        window.addEventListener('pointercancel', dragCancel);
    }

    // 移除 window 级指针监听
    function removeDragListeners() {
        window.removeEventListener('pointermove', dragMove);
        window.removeEventListener('pointerup', dragEnd);
        window.removeEventListener('pointercancel', dragCancel);
    }

    // 移动：超过阈值进入拖选；实时将 [起点, 当前] 区间写入选中集合
    function dragMove(e: PointerEvent) {
        if (!pointerDown) return;
        // 未超过阈值：保持普通单击语义（轻点抖动不会误触发）
        if (!dragActive) {
            const dist = Math.hypot(e.clientX - pointerStartX, e.clientY - pointerStartY);
            if (dist <= DRAG_THRESHOLD) return;
            dragActive = true;
        }
        dragCurIdx = hitRowIndex(e.clientX, e.clientY);
        applyDragRange(dragStartIdx, dragCurIdx);
    }

    // 松开：结束拖选；若发生过拖动则抑制本次 click（触摸板轻点按住松手后会补发 click）
    function dragEnd() {
        if (!pointerDown) return;
        pointerDown = false;
        if (dragActive) {
            dragActive = false;
            suppressNextClick = true;
        }
        removeDragListeners();
    }

    // 系统打断（手势抢占等）：结束拖选但保留已选区
    function dragCancel() {
        if (!pointerDown) return;
        pointerDown = false;
        dragActive = false;
        removeDragListeners();
    }

    // 按拖选区间重设选中集合：基于按下时刻快照（dragBaseIds），按拖动模式加/减 [起点, 当前] 区间
    function applyDragRange(start: number, cur: number) {
        selectedIds = applyDragRangePure(dragBaseIds, rangeDocs(sortedDocs, start, cur), dragRemoveMode);
    }

    // 定位指针当前所在行；指针不在任何条目上时按 Y 相对列表位置钳制
    function hitRowIndex(clientX: number, clientY: number): number {
        return hitRowIndexPure({ clientX, clientY, list: sortedDocs, listEl, fallback: dragCurIdx });
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

        // 拖选结束后的补发 click（触摸板轻点按住松手等）：抑制本次打开/勾选动作
        if (suppressNextClick) {
            suppressNextClick = false;
            return;
        }

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
        // 兜底：组件销毁时若仍处于指针按下状态，移除残留的 window 监听
        if (pointerDown) {
            removeDragListeners();
            pointerDown = false;
            dragActive = false;
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
        <!-- 全选 (自绘多行气泡说明) -->
        <span class="fn__space"></span>
        <span class="dock-tip-wrap">
            <button
                class="block__icon"
                aria-label="{isAllSelected ? i18nDock["unSelectAll"] : i18nDock["selectAll"]}"
                onclick={toggleSelectAll}>
                <svg><use xlink:href="#icon{isAllSelected ? 'Check' : 'Uncheck'}"></use></svg>
                {#if docs.length > 0}
                <span class="dock__select-count">{selectedCount}/{docs.length}</span>
                {/if}
            </button>
            <span class="dock-tip"><span class="dock-tip__text">{i18nDock["selectHint"]}</span></span>
        </span>
        <!-- 打开 (自绘多行气泡说明) -->
        <span class="fn__space"></span>
        <span class="dock-tip-wrap">
            <button
                class="block__icon"
                aria-label="{window.siyuan.languages.openBy}"
                onclick={openHandler}>
                <svg><use xlink:href="#iconOpen"></use></svg>
            </button>
            <span class="dock-tip"><span class="dock-tip__text">{i18nDock["openHint"]}</span></span>
        </span>
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
    <div
        bind:this={listEl}
        class="fn__flex-1"
        class:dock--selecting={dragActive}
        style="min-height: 0; overflow-y: auto;">
        <ul class="b3-list b3-list--background dock__doc-list">
            <!-- 中转站无效 -->
            {#if !targetIsValid}
            <li class="b3-list--empty" style="opacity: 0.5;">{i18nDock["targetInvalid"]}</li>
            <!-- 中转文档列表为空 -->
            {:else if docs.length === 0}
                <li class="b3-list--empty" style="opacity: 0.5;">{i18nDock["inboxEmpty"]}</li>
            {:else}
            {#each sortedDocs as doc, idx (doc.id)}
                    <!-- 中转文档列表项 -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <li
                        class="b3-list-item"
                        data-id="{doc.id}"
                        class:b3-list-item--focus={selectedIds.has(doc.id)}
                        onpointerdown={(event) => dragStart(event, idx)}
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

    /* 拖过即选：列表行禁用原生文本选择（触摸板轻点拖动也不会选中文本） */
    .dock__doc-list .b3-list-item {
        user-select: none;
        -webkit-user-select: none;
    }
    /* 触摸不抢占事件：竖向滚动放行（纯鼠标无影响，卫生习惯） */
    .dock__doc-list {
        touch-action: pan-y;
    }
    /* 拖选中：全局禁止文本选择，光标改为抓取 */
    :global(.dock--selecting) {
        user-select: none;
    }
    :global(.dock--selecting .b3-list-item) {
        cursor: grabbing;
    }

    /* 顶栏按钮：自绘多行气泡（white-space: pre-line 渲染 i18n 换行符分行） */
    .dock-tip-wrap {
        position: relative;
        display: flex;
        align-items: center;
    }
    .dock-tip {
        display: none;
        position: absolute;
        left: 0;
        top: calc(100% + 6px);
        z-index: 20;
        pointer-events: none;
        padding: 6px 8px;
        border-radius: 4px;
        font-size: 12px;
        line-height: 1.6;
        /* 每条提示不折行：width: max-content 绕过 containing block 对 shrink-to-fit 的宽度限制，pre 保留 \n 且禁止自动换行 */
        width: max-content;
        white-space: pre;
        background: var(--b3-tooltip-background, rgba(0, 0, 0, 0.75));
        color: var(--b3-tooltip-color, #fff);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    .dock-tip-wrap:hover .dock-tip {
        display: block;
    }
    .dock-tip__text {
        display: block;
    }
</style>