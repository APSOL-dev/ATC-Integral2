import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const exportToPDF = async (elementId, filename) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Alta calidad
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#F8FAFC',
      windowWidth: window.innerWidth || 1400,
      windowHeight: window.innerHeight || 900,
      onclone: (clonedDoc) => {
        const clonedRoot = clonedDoc.getElementById(elementId);
        if (!clonedRoot) return;

        // Reemplazar canvas por imágenes estáticas
        const originalCanvases = element.querySelectorAll('canvas');
        const clonedCanvases = clonedRoot.querySelectorAll('canvas');
        
        clonedCanvases.forEach((clonedCanvas, index) => {
          const originalCanvas = originalCanvases[index];
          if (originalCanvas) {
            try {
              const imgData = originalCanvas.toDataURL('image/png');
              const img = clonedDoc.createElement('img');
              img.src = imgData;
              img.style.width = '100%';
              img.style.height = '100%';
              img.style.display = 'block';
              clonedCanvas.parentNode.replaceChild(img, clonedCanvas);
            } catch (e) {
              console.error('Error al capturar gráfico:', e);
            }
          }
        });
      }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'l' : 'p',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}_${new Date().toLocaleDateString()}.pdf`);
  } catch (error) {
    console.error('Error en exportación PDF:', error);
  }
};
