// Elemen input dan daftar file
const mergeInput = document.getElementById('mergeInput');
const fileList = document.getElementById('fileList');

// Render list file bernomor
function renderFileList(files) {
  fileList.innerHTML = '';
  if (files.length > 0) {
    const ol = document.createElement('ol');
    for (let i = 0; i < files.length; i++) {
      const li = document.createElement('li');
      li.innerHTML = '<span style="margin-right: 6px;">📄</span>' + files[i].name;
      ol.appendChild(li);
    }
    fileList.appendChild(ol);
  } else {
    fileList.textContent = 'Belum ada file dipilih.';
  }
}

// Event file input
mergeInput?.addEventListener('change', () => {
  const files = Array.from(mergeInput.files);
  renderFileList(files);
});

// Tombol Merge
const mergeBtn = document.getElementById('mergeBtn');
mergeBtn?.addEventListener('click', async () => {
  const files = Array.from(mergeInput.files);
  const downloadBar = document.getElementById('downloadBar');
  const loading = document.getElementById('loading'); // Ambil elemen loading

  if (!files || files.length < 2) {
    alert("Pilih minimal 2 file PDF untuk digabung.");
    return;
  }

  // Tampilkan loading spinner
  loading.style.display = 'block';

  try {
    const mergedPdf = await PDFLib.PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Form CM Merge.pdf";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();

    downloadBar.style.display = 'block';
    setTimeout(() => { downloadBar.style.display = 'none'; }, 3000);
  } catch (error) {
    alert("Terjadi kesalahan saat menggabungkan file PDF.");
    console.error(error);
  } finally {
    // Sembunyikan loading spinner
    loading.style.display = 'none';
  }
});
