let hasilData = [];
let fileInput, fileInfo;

document.addEventListener("DOMContentLoaded", function () {
  fileInput = document.getElementById("pdfInput");
  fileInfo = document.getElementById("fileInfo");

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const jumlah = fileInput.files.length;
      if (jumlah > 0) {
        fileInfo.style.display = "block";
document.getElementById("fileCountText").textContent = `${jumlah} file dipilih`;
      }
    });
  }
});


function formatTanggal(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

async function prosesPDF() {
  const tanggalSerah = document.getElementById("tanggalSerah").value;
  const files = fileInput.files;

  if (!tanggalSerah || files.length === 0) {
    alert("Silakan pilih tanggal dan unggah file PDF terlebih dahulu.");
    return;
  }

  document.getElementById("loading").style.display = "block";

  const tglSerahFormatted = formatTanggal(tanggalSerah);
  hasilData = [];

  for (let i = 0; i < files.length; i++) {
    const buffer = await files[i].arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let text = "";

    for (let j = 1; j <= pdf.numPages; j++) {
      const page = await pdf.getPage(j);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ") + "\n";
    }

    const namaUkerMatch = text.match(/Unit Kerja\s*[:\-]?\s*(.+?)\s+(?:Kantor Cabang|Perangkat|Pelapor)/i);
    const namaUker = namaUkerMatch ? namaUkerMatch[1].trim() : "";

    const tanggalMatch = text.match(/(?:Tanggal(?:\/Jam)?|Tanggal Tiket)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i);
    const tanggalPekerjaan = tanggalMatch ? tanggalMatch[1] : "";

    hasilData.push({
      no: i + 1,
      tanggalSerah: tglSerahFormatted,
      namaUker,
      tanggalPekerjaan
    });
  }

  tampilkanPreview();
  document.getElementById("downloadBtn").style.display = "inline-block";
  document.getElementById("loading").style.display = "none";
}

function tampilkanPreview() {
  const tbody = document.getElementById("tabelData");
  tbody.innerHTML = "";
  hasilData.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.no}</td>
      <td>${item.tanggalSerah}</td>
      <td>${item.namaUker}</td>
      <td>${item.tanggalPekerjaan}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("hasilContainer").style.display = "block";
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");
  const chunkSize = 25;
  const chunks = [];

  for (let i = 0; i < hasilData.length; i += chunkSize) {
    chunks.push(hasilData.slice(i, i + chunkSize));
  }

  let globalIndex = 1;

  chunks.forEach((chunk, index) => {
    if (index > 0) doc.addPage();

  const pageWidth = doc.internal.pageSize.getWidth();
doc.setFontSize(25);
doc.setFont(undefined, "bold");
doc.text("FORM TANDA TERIMA CM", pageWidth / 2, 25, { align: "center" });


  doc.autoTable({
  head: [['NO.', 'TANGGAL SERAH TERIMA', 'NAMA UKER', 'TANGGAL PEKERJAAN']],
  body: chunk.map(() => {
    const item = hasilData[globalIndex - 1];
    return [
      globalIndex++,
      item.tanggalSerah,
      item.namaUker,
      item.tanggalPekerjaan
    ];
  }),
  startY: 35,
  styles: {
    fontSize: 7,
    halign: "center",
    valign: "middle",
    lineColor: [0, 0, 0],
    lineWidth: 0.3,
    textColor: [0, 0, 0]
  },
  headStyles: {
    fillColor: false,
    fontSize: 10,
    fontStyle: "bold"
  },
  bodyStyles: {
    fontSize: 7,
    textColor: [0, 0, 0],
    lineColor: [0, 0, 0]
  },
  columnStyles: {
    0: { cellWidth: 10 },  // NO
    1: { cellWidth: 40 },  // TANGGAL SERAH
    2: { cellWidth: 90 },  // NAMA UKER
    3: { cellWidth: 40 }   // TANGGAL PEKERJAAN
  },
  theme: "grid",
  margin: { left: 15, right: 15 }  // Tambahkan ini!
});



   const yAfter = doc.lastAutoTable.finalY + 10;

  doc.autoTable({
  head: [['TTD TEKNISI', 'TTD LEADER', 'TTD CALL CENTER']],
  body: [['', '', '']],
  startY: yAfter,
  styles: {
    fontSize: 10,
    halign: "center",
    valign: "middle",
    lineColor: [0, 0, 0],
    lineWidth: 0.3,
    textColor: [0, 0, 0]
  },
  headStyles: {
    fontStyle: "bold",
    fontSize: 10,
    textColor: [0, 0, 0],
    fillColor: false,
    minCellHeight: 5
  },
  bodyStyles: {
    minCellHeight: 30
  },
  columnStyles: {
    0: { cellWidth: 60 },
    1: { cellWidth: 60 },
    2: { cellWidth: 60 }
  },
  theme: "grid",
  margin: { left: 15, right: 15 }  // Sama dengan tabel atas
  });
});

  doc.save("FORM TANDA TERIMA CM.pdf");
}
