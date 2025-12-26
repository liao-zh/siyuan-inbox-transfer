/**
 * 图标列表
 */

const svgsList = {
    iconInbox: `<symbol id="iconInboxTransfer1" viewBox="0 0 32 32"><path d="M32 6.4c0-1.76-1.44-3.2-3.2-3.2h-25.6c-1.76 0-3.2 1.44-3.2 3.2v19.2c0 1.76 1.44 3.2 3.2 3.2h25.6c1.76 0 3.2-1.44 3.2-3.2v-19.2zM28.8 6.4l-12.8 8-12.8-8h25.6zM28.8 25.6h-25.6v-16l12.8 8 12.8-8v16z" stroke="currentColor" stroke-width="0.2"></path></symbol>`,
    iconRefresh: `<symbol id="iconInboxTransfer2" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="white" fill-opacity="0.8"/><path d="M16 4.364v-4.364l5.818 5.818-5.818 5.818v-4.364c-4.815 0-8.727 3.913-8.727 8.727 0 1.469 0.364 2.865 1.018 4.073l-2.124 2.124c-1.135-1.789-1.804-3.913-1.804-6.196 0-6.429 5.207-11.636 11.636-11.636zM16 24.727c4.815 0 8.727-3.913 8.727-8.727 0-1.469-0.364-2.865-1.018-4.073l2.124-2.124c1.135 1.789 1.804 3.913 1.804 6.196 0 6.429-5.207 11.636-11.636 11.636v4.364l-5.818-5.818 5.818-5.818v4.364z" stroke="currentColor" stroke-width="1.2"></path></symbol>`,
    iconInboxTransfer: `<symbol id="iconInboxTransfer" viewBox="0 0 50 50"><use href="#iconInboxTransfer1" x="0" y="10" width="42" height="42"/><use href="#iconInboxTransfer2" x="23.5" y="1.5" width="30" height="30"/></symbol>`
}

export const svgs = Object.values(svgsList).join('');
