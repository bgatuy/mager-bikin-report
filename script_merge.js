document.getElementById('mergeInput')?.addEventListener('change', () => {
      const list = document.getElementById('fileList');
      list.innerHTML = '';
      const files = document.getElementById('mergeInput').files;

      if (files.length > 0) {
        const ul = document.createElement('ul');
        for (let i = 0; i < files.length; i++) {
          const li = document.createElement('li');
          li.textContent = '📄 ' + files[i].name;
          ul.appendChild(li);
        }
        list.appendChild(ul);
      } else {
        list.textContent = 'Belum ada file dipilih.';
      }
    });

    document.getElementById('mergeBtn')?.addEventListener('click', async () => {
      const input = document.getElementById('mergeInput');
      const files = input.files;
      const downloadBar = document.getElementById('downloadBar');

      if (!files || files.length < 2) {
        alert("Pilih minimal 2 file PDF untuk digabung.");
        return;
      }

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

      // Tampilkan notif
      downloadBar.style.display = 'block';
      setTimeout(() => { downloadBar.style.display = 'none'; }, 3000);
    });