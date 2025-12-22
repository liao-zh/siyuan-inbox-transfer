<!--
 FilePath     : /src/dock.svelte
 Description  : Dock component for inbox light plugin
-->
<script lang="ts">
    import { adaptHotkey } from "siyuan";

    export let title: string;
    export let text: string = "测试";
</script>

<div class="fn__flex-1 fn__flex-column">
    <div class="block__icons">
        <div class="block__logo">
            <svg class="block__logoicon"><use xlink:href="#iconInbox"></use></svg>
            {title}
        </div>
        <span class="fn__flex-1 fn__space"></span>
        <span data-type="min" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="Min ${adaptHotkey("⌘W")}">
            <svg class="block__logoicon"><use xlink:href="#iconMin"></use></svg>
        </span>
    </div>
    <div class="fn__flex-1 plugin-sample__custom-dock">
        {text}
    </div>
</div>