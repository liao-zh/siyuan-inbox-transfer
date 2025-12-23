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

    // 使用的变量
    let i18nDock = $derived(plugin.i18n.dock);
    let docs = $state<IChildDoc[]>([]);
    $effect(() => {
        docs = plugin.fileManager.childDocs;
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

    // 处理操作
    // 刷新
    async function refreshHandler() {
        await plugin.inboxManager.updateAndMove();
        await plugin.fileManager.getChildDocs();
    }
    // 打开
    function openHandler(event: MouseEvent) {
        plugin.fileManager.openChildDocs(Array.from(selectedIds), event);
        unSelectAll();
    }
    // 删除
    async function deleteHandler() {
        await plugin.fileManager.removeChildDocs(Array.from(selectedIds));
        unSelectAll();
        logger.logDebug("删除文档", Array.from(selectedIds));
        logger.logDebug("删除文档后", docs);
    }
</script>

<div class="fn__flex-column file-tree sy__inbox">
    <!-- dock顶栏 -->
    <div class="block__icons">
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
            onclick={async () => refreshHandler()}>
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
            onclick={(event) => openHandler(event)}>
            <svg><use xlink:href="#iconOpen"></use></svg>
        </button>
        <span class="fn__space"></span>
        <!-- 删除 -->
        <button
            class="block__icon b3-tooltips b3-tooltips__w"
            aria-label="{window.siyuan.languages.delete}"
            onclick={async () => deleteHandler()}>
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
    <div class="fn__flex-column">
        <ul class="b3-list b3-list--background">
            {#if docs.length === 0}
                <li class="b3-list--empty" style="opacity: 0.5;">{i18nDock["inboxEmpty"]}</li>
            {:else}
                {#each docs as doc (doc.id)}
                    <li
                        class="b3-list-item"
                        data-id="{doc.id}"
                        class:b3-list-item--focus={selectedIds.has(doc.id)}>
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <span
                            class="b3-list-item__action"
                            role="checkbox"
                            tabindex="0"
                            aria-checked={selectedIds.has(doc.id)}
                            aria-label="{window.siyuan.languages.select}"
                            onclick={() => toggleSelect(doc.id)}>
                            <svg><use xlink:href="#icon{selectedIds.has(doc.id) ? 'Check' : 'Uncheck'}"></use></svg>
                        </span>
                        <span class="fn__space--small"></span>
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <span
                            class="b3-list-item__text"
                            title="{doc.name}"
                            onclick={(event) => plugin.fileManager.openChildDocs([doc.id], event)}>
                            {doc.name}
                        </span>
                    </li>
                {/each}
            {/if}
        </ul>
    </div>
</div>