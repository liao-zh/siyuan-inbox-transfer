
# 思源笔记-收集箱中转站插件

作者：liao-zh

链接：[GitHub仓库](https://github.com/liao-zh/siyuan-inbox-transfer)，[Gitee仓库](https://gitee.com/liao_zh/siyuan-inbox-transfer)

## 缘起

本插件是为了使用思源笔记收集箱时更流畅而作。思路很简单，把一个固定的文档路径设置为中转站，使用时将收集箱所有条目转换成文档并移动到该路径，这样就可以利用编辑器的强大功能进行编辑，或以块为单位方便地复制粘贴。

所设想的工作流是，中转文档主要作为暂存，将其中内容进行筛选并整理到日记等其它文档之后，该文档一般会被删除。本插件主要为简化这一工作流程而设计。如果采用其他工作流，至少也可以在文档树中操作这些中转文档。


## 如何使用

工作流前的设置：
1. 新建或选择一个文档路径作为中转站
2. 在本插件设置中填入中转站ID（点击文档头菜单或在文档树中右击该文档->复制->复制ID）

日常的工作流：
1. 刷新：会在后台完成如下操作，获取收集箱所有条目，转成文档移动到中转站中，从收集箱删除已移动的条目（可选）
2. 中转文件：所有中转站中的文件会显示在停靠栏面板中，便于集中操作，注意收集箱的条目是不显示的，因为已经被中转
3. 文件单选/多选/全选：批量打开文件，整理内容后，批量删除文件
4. 在文档树中定位中转站（可选）：利用文档树更丰富的功能对文件进行操作

其它设置：
- 转换成文档时是否将收集时间作为前缀：可用前缀标记收集时间
- 收集箱条目被移动后是否全部删除：在测试插件时可选不删除，这样需要在内置收集箱中删除，插件使用稳定后建议选择删除
- 替换内置收集箱：可选择替换内置收集箱的停靠栏和快捷键（默认Alt+6），重启后生效

其它功能说明：
- 停靠栏快捷键：默认Shift+Alt+6，替换内置收集箱后为Alt+6，可在设置中修改
- 打开文档：Alt+单击时在右侧新页签打开，Ctrl+单击时在后台打开，二者可同时使用

## 版本更新

完整更新历史参见：[CHANGELOG](https://github.com/liao-zh/siyuan-inbox-transfer/blob/master/CHANGELOG.md)（需要网络能访问github）。

主要和近期更新历史：
- 0.3.0：完善了基本功能，包括收集箱中转和中转文件的操作
- 0.4.0：上架集市

存在的问题：
- 不支持移动端

## 致谢

[plugin-sample-vite-svelte](https://github.com/siyuan-note/plugin-sample-vite-svelte)：插件模板，本插件基于此模板开发。

思源笔记源码的收集箱模块（`siyuan/app/src/layout/dock/Inbox.ts`）：收集箱相关功能的实现。

[书签+插件](https://github.com/frostime/sy-bookmark-plus)：参考了替换内置书签的实现。

[文档导航插件](https://github.com/OpaqueGlass/syplugin-hierarchyNavigate)：参考了代码架构。

## 代码说明

代码结构：（未列出的部分与插件模板相同）
```txt
src/
├── index.ts：插件入口
├── worker/：用于执行主要功能
│   ├── settingService.ts：设置菜单及其处理
│   ├── inboxManager.ts：收集箱管理器，负责获取收集箱条目，并新建为中转文档
│   ├── fileManager.ts：文件管理器，负责获取中转站信息，并处理中转文档的更新、打开、删除等操作
|   ├── dockComponent.svelte：停靠栏组件的具体内容
├── utils/：提供工具
│   ├── api.ts：思源API的封装（来自模板）
│   ├── logger.ts：日志工具
│   ├── replaceBuiltIn.ts：替换内置收集箱（参考了书签+插件代码）
```

手动安装插件：
- 下载并解压package.zip，重命名为`siyuan-inbox-transfer`，移动到`<思源工作空间>/data/plugins/`目录下。
- 在思源笔记中，点击`设置->集市->已下载->插件`，找到`收集箱中转站（siyuan-inbox-transfer）`，点击`启用`。

