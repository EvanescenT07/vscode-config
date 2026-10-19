export async function copyText(value: string): Promise<boolean> {
  if (!value) {
    return false;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (error) {
    if (!(error instanceof DOMException) && !(error instanceof Error)) {
      throw error;
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch (error) {
    if (error instanceof DOMException || error instanceof Error) {
      return false;
    }
    throw error;
  }
}
