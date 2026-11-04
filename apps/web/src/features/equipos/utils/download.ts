/**
 * Descarga un Blob directamente en el navegador del usuario asignando un nombre de archivo dinámico.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

/** Imprime un PDF en un iframe oculto (el PDF ya trae su tamaño de página). */
export function printBlob(blob: Blob): void {
  const url = window.URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  iframe.onload = () => {
    iframe.contentWindow?.print();
    // shortcut: limpieza diferida fija, el diálogo de impresión no avisa cuándo termina
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      iframe.remove();
    }, 60_000);
  };
  document.body.appendChild(iframe);
}
