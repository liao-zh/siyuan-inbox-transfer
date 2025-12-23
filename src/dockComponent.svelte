<!--
 FilePath     : /src/dock.svelte
 Description  : Dock component for inbox light plugin
-->
<script lang="ts">
    import { adaptHotkey, updateHotkeyAfterTip } from "siyuan";

    let title: string;
    let text: string;
</script>
<!--
<div class="block__icons">
    <div class="block__logo">
        <svg class="block__logoicon"><use xlink:href="#iconInbox"></use></svg>${window.siyuan.languages.inbox}&nbsp;
        <span class="inboxSelectCount"></span>
    </div>
    <span class="fn__flex-1"></span>
    <span class="fn__space"></span>
    <span data-type="selectall" class="block__icon"><svg><use xlink:href="#iconUncheck"></use></svg></span>
    <span class="fn__space"></span>
    <span data-type="previous" class="block__icon b3-tooltips b3-tooltips__w" disabled="disabled" aria-label="${window.siyuan.languages.previousLabel}"><svg><use xlink:href="#iconLeft"></use></svg></span>
    <span class="fn__space"></span>
    <span data-type="next" class="block__icon b3-tooltips b3-tooltips__w" disabled="disabled" aria-label="${window.siyuan.languages.nextLabel}"><svg><use xlink:href="#iconRight"></use></svg></span>
    <span class="fn__space"></span>
    <span data-type="more" data-menu="true" class="block__icon b3-tooltips b3-tooltips__w" aria-label="${window.siyuan.languages.more}"><svg><use xlink:href="#iconMore"></use></svg></span>
    <span class="fn__space"></span>
    <span data-type="min" class="block__icon b3-tooltips b3-tooltips__w" aria-label="${window.siyuan.languages.min}${updateHotkeyAfterTip(window.siyuan.config.keymap.general.closeTab.custom)}"><svg><use xlink:href="#iconMin"></use></svg></span>
</div>
<div class="fn__loading fn__none">
    <img width="64px" src="/stage/loading-pure.svg"></div>
</div>
<div class="fn__flex-1 fn__none inboxDetails fn__flex-column" style="min-height: auto;background-color: var(--b3-theme-background)"></div>
<div class="fn__flex-1"></div>`; -->