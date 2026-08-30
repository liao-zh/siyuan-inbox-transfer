/**
 * 面板文档列表的纯函数工具（排序、区间命中、选中集运算）
 */
import type { IDoc } from "@/worker/fileManager";

/**
 * 按指定方式排序；收集时间未记录时回退按创建时间
 */
export function sortDocs(list: IDoc[], mode: string): IDoc[] {
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

/**
 * 计算拖选区间 [start, cur] 内的文档；按索引返回子列表
 */
export function rangeDocs(list: IDoc[], start: number, cur: number): IDoc[] {
    const lo = Math.min(start, cur);
    const hi = Math.max(start, cur);
    return list.slice(lo, hi + 1);
}

/**
 * 按拖动模式将区间内文档加入或剔除出选中集，返回新集合（不改入参）
 * remove=false → base ∪ range；remove=true → base − range
 */
export function applyDragRange(base: Set<string>, range: IDoc[], remove: boolean): Set<string> {
    const ids = new Set(base);
    for (const doc of range) {
        if (remove) {
            ids.delete(doc.id);
        } else {
            ids.add(doc.id);
        }
    }
    return ids;
}

/**
 * 指针所在行索引：先按 DOM 命中定位，未命中时按 Y 相对列表位置钳制到首/末行
 * @returns 行索引；找不到且坐标在列表内时返回 fallback（当前行）
 */
export function hitRowIndex(opts: {
    clientX: number;
    clientY: number;
    list: IDoc[];
    listEl: HTMLElement | null;
    fallback: number;
}): number {
    const { clientX, clientY, list, listEl, fallback } = opts;
    const el = document.elementFromPoint(clientX, clientY);
    const li = el?.closest<HTMLElement>(".b3-list-item[data-id]");
    if (li?.dataset.id) {
        const idx = list.findIndex(doc => doc.id === li.dataset.id);
        if (idx >= 0) return idx;
    }
    if (listEl) {
        const rect = listEl.getBoundingClientRect();
        if (clientY < rect.top) return 0;
        if (clientY > rect.bottom) return list.length - 1;
    }
    return fallback;
}
