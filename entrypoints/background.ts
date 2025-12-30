export default defineBackground(() => {
  const sidePanel = (browser as any).sidePanel;

  if (sidePanel?.setPanelBehavior) {
    sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }

  if (browser.action?.onClicked && sidePanel?.open) {
    browser.action.onClicked.addListener(async (tab) => {
      try {
        await sidePanel.open({ tabId: tab.id });
      } catch {
        // Ignore failures if side panels are unavailable.
      }
    });
  }
});
