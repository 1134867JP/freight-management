// @deprecated — use useConfirm() de ConfirmModal.jsx
export function confirmAction(message) {
  console.warn('[deprecated] confirmAction: use useConfirm() do ConfirmModal');
  return window.confirm(message);
}
