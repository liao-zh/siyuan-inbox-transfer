<!--
 FilePath     : /src/dock.svelte
 Description  : Dock component for inbox light plugin
-->
<script lang="ts">
    import { adaptHotkey } from "siyuan";
    import { type II18nDock } from "./worker/dockService";

    export let i18nDock: II18nDock;
</script>

<div class="fn__flex-column file-tree sy__inbox">
    <div class="block__icons">
        <div class="block__logo">
            <svg class="block__logoicon"><use xlink:href="#iconInbox"></use></svg>{i18nDock.title}
        </div>
        <span class="fn__flex-1"></span>
        <span data-type="refresh" class="block__icon b3-tooltips b3-tooltips__w" aria-label="{window.siyuan.languages.refresh}"><svg><use xlink:href="#iconRefresh"></use></svg></span>
        <span class="fn__space"></span>
        <span data-type="selectAll" class="block__icon b3-tooltips b3-tooltips__w" aria-label="{window.siyuan.languages.selectAll}"><svg><use xlink:href="#iconUncheck"></use></svg></span>
        <span class="fn__space"></span>
        <span data-type="open" class="block__icon b3-tooltips b3-tooltips__w" aria-label="{window.siyuan.languages.openBy}"><svg><use xlink:href="#iconOpen"></use></svg></span>
         <span class="fn__space"></span>
        <span data-type="delete" class="block__icon b3-tooltips b3-tooltips__w" aria-label="{window.siyuan.languages.delete}"><svg><use xlink:href="#iconTrashcan"></use></svg></span>
        <span class="fn__space"></span>
        <span data-type="locate" class="block__icon b3-tooltips b3-tooltips__w" aria-label="{i18nDock.locate}"><svg><use xlink:href="#iconFocus"></use></svg></span>
        <span class="fn__space"></span>
        <span data-type="min" class="block__icon b3-tooltips b3-tooltips__w" aria-label="{window.siyuan.languages.min} {adaptHotkey(window.siyuan.config.keymap.general.closeTab.custom)}"><svg><use xlink:href="#iconMin"></use></svg></span>
    </div>
    <div class="fn__flex-column">
        <ul class="b3-list b3-list--background">
            <li class="b3-list--empty">{i18nDock.inboxEmpty}</li>
            <!-- `<li style="padding-left: 0" data-id="${item.oId}" class="b3-list-item">
    <span data-type="select" class="b3-list-item__action">
        <svg><use xlink:href="#icon${this.selectIds.includes(item.oId) ? "Check" : "Uncheck"}"></use></svg>
    </span>
    <span class="fn__space--small"></span>
    <span class="b3-list-item__text" title="${item.shorthandTitle}${item.shorthandTitle === item.shorthandDesc ? "" : "\n" + item.shorthandDesc}">${item.shorthandTitle}</span>
    <span class="b3-list-item__meta">${item.hCreated}</span>
</li>`; -->
        </ul>
    </div>
</div>