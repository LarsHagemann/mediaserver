export const preventInputHandling = () => {
  const active = document.activeElement as HTMLElement | null;

  const isTypingElement =
    active &&
    (active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      active.tagName === "SELECT" ||
      active.isContentEditable);

  return isTypingElement;
};
