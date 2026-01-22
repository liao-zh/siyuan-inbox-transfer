# SiYuan Note - Inbox Transfer Plugin

Author: liao-zh

Links: [GitHub Repository](https://github.com/liao-zh/siyuan-inbox-transfer), [Gitee Repository](https://gitee.com/liao_zh/siyuan-inbox-transfer)

## Origin

This plugin is designed to make using SiYuan Note's inbox smoother. The idea is simple: set a fixed document path as a transfer station, and when using it, convert all inbox items into documents and move them to that path. This allows you to use the editor's powerful features for editing, or easily copy and paste by block.

The intended workflow is that the transfer documents mainly serve as temporary storage. After filtering and organizing the content into diaries and other documents, the transfer documents are usually deleted. This plugin is mainly designed to simplify this workflow. If you adopt other workflows, you can at least operate these transfer documents in the document tree.

## How to Use

Setup before workflow:
1. Create or select a document path as the transfer station
2. Fill in the transfer station ID in the settings (click the document header menu or right-click the document in the document tree -> Copy -> Copy ID)

Daily workflow:
1. Refresh: Will complete the following operations in the background: get all inbox items, convert to documents and move to the transfer station, delete moved items from the inbox (optional)
2. Transfer files: All files in the transfer station will be displayed in the dock panel for centralized operation. Note that inbox items are not displayed because they have been transferred
3. File single selection/multiple selection/select all: Batch open files, organize content, and then batch delete files
4. Locate the transfer station in the document tree (optional): Use the document tree's richer features to operate files

Other settings:
- Whether to use collection time as prefix when converting to document: You can use prefix to mark collection time
- Whether to delete all inbox items after they are moved: You can choose not to delete when testing the plugin, so you need to delete them in the built-in inbox. It is recommended to choose to delete after the plugin is used stably
- Replace built-in inbox: You can choose to replace the built-in inbox's dock and shortcut key (default Alt+6), which takes effect after restart

Other function descriptions:
- Dock shortcut key: Default is Shift+Alt+6, after replacing the built-in inbox, it is Alt+6, which can be modified in settings
- Open document: Alt+click to open in a new tab on the right, Ctrl+click to open in the background, both can be used at the same time

## Version Updates

For the complete update history, see: [CHANGELOG](https://github.com/liao-zh/siyuan-inbox-transfer/blob/master/CHANGELOG.md) (requires network access to GitHub).

Main and recent update history:
- 0.3.0: Improved basic functions, including inbox transfer and transfer file operations.
- 0.4.0: Uploaded to the bazaar.

Existing issues:
- Mobile frontend is not supported.

## Acknowledgments

[plugin-sample-vite-svelte](https://github.com/siyuan-note/plugin-sample-vite-svelte): Plugin template, this plugin is developed based on this template.

SiYuan Note source code's inbox module (`siyuan/app/src/layout/dock/Inbox.ts`): Implementation of inbox-related functions.

[Bookmark+ Plugin](https://github.com/frostime/sy-bookmark-plus): Referenced the implementation of replacing the built-in bookmark.

[Document Navigation Plugin](https://github.com/OpaqueGlass/syplugin-hierarchyNavigate): Referenced the code architecture.

## Code Description

Code structure: (Unlisted parts are the same as the plugin template)
```txt
src/
├── index.ts：Plugin entry
├── worker/：Used to execute main functions
│   ├── settingService.ts：Setting menu and its processing
│   ├── inboxManager.ts：Inbox manager, responsible for obtaining inbox items and creating transfer documents
│   ├── fileManager.ts：File manager, responsible for obtaining transfer station information and handling operations such as updating, opening, and deleting transfer documents
|   ├── dockComponent.svelte：Specific content of the dock component
├── utils/：Provide tools
│   ├── api.ts：Encapsulation of SiYuan API (from template)
│   ├── logger.ts：Logging tool
│   ├── replaceBuiltIn.ts：Replace built-in inbox (referenced bookmark+ plugin code)
```

Manual installation of the plugin:
- Download and unzip package.zip, rename it to `siyuan-inbox-transfer`, and move it to `<SiYuan workspace>/data/plugins/` directory.
- In SiYuan Note, click `Settings->Marketplace->Downloaded->Plugins`, find `Inbox Transfer (siyuan-inbox-transfer)`, and click `Enable`.