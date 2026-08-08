/**
 * 面板排序方式共享 store
 * 用于在设置面板、Dock 下拉与面板组件之间双向同步 sortMode
 */
import { writable } from "svelte/store";

export const sortModeStore = writable<string>("docTree");
