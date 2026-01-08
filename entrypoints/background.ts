export default defineBackground(() => {
  const sidePanel = (browser as any).sidePanel;
  const sidebarAction = (browser as any).sidebarAction;
  const action = (browser as any).action ?? (browser as any).browserAction;

  if (sidePanel?.setPanelBehavior) {
    sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }

  if (action?.onClicked) {
    action.onClicked.addListener(async (tab: any) => {
      try {
        if (sidePanel?.open && tab?.id !== undefined) {
          await sidePanel.open({ tabId: tab.id });
          return;
        }

        if (sidebarAction?.open) {
          if (tab?.windowId !== undefined) {
            await sidebarAction.open({ windowId: tab.windowId });
          } else {
            await sidebarAction.open();
          }
        }
      } catch {
        // Ignore failures if side panels are unavailable.
      }
    });
  }
});
