const fileInput = document.getElementById('pdfFile');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const lokasiSelect = document.getElementById('inputLokasi');

function formatTanggalIndonesia(tanggal) {
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const [dd, mm, yyyy] = tanggal.split('/');
  return `${dd} ${bulan[parseInt(mm) - 1]} ${yyyy}`;
}

function potongJamMenit(waktu) {
  return waktu?.substring(0, 5) || '';
}

function extractFlexibleBlock(lines, startLabel, stopLabels = []) {
  const startIndex = lines.findIndex(line => line.toLowerCase().includes(startLabel.toLowerCase()));
  if (startIndex === -1) return '';
  let result = '';
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const isStop = stopLabels.some(label => line.toLowerCase().includes(label.toLowerCase()));
    if (isStop) break;
    result += ' ' + line;
  }
  return result.replace(/^:+/, '').replace(/:+$/, '').replace(/^:+\s*/, '').replace(/\s*:+\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

let unitKerja = "-";
let kantorCabang = "-";
let tanggalFormatted = "-";
let problem = "-";
let berangkat = "-";
let tiba = "-";
let mulai = "-";
let selesai = "-";
let solusi = "-";
let jenisPerangkat = "-";
let serial = "-";
let merk = "-";
let type = "-";
let pic = "-";
let status = "-";

lokasiSelect.addEventListener("change", () => {
  updateOutput();
});

fileInput.addEventListener('change', async function () {
  const file = fileInput.files[0];
  if (!file || file.type !== 'application/pdf') return;

  const reader = new FileReader();
  reader.onload = async function () {
    const typedarray = new Uint8Array(reader.result);
    const pdf = await pdfjsLib.getDocument(typedarray).promise;

    let rawText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      rawText += strings.join('\n') + '\n';
    }

    const clean = (text) => text?.replace(/\s+/g, ' ').trim() || '';
    const lines = rawText.split('\n');

    unitKerja = extractFlexibleBlock(lines, 'Unit Kerja', ['Kantor Cabang', 'Tanggal']);
    kantorCabang = extractFlexibleBlock(lines, 'Kantor Cabang', ['Tanggal', 'Pelapor']);
    const tanggal = rawText.match(/Tanggal(?:\sTiket)?\s*:\s*(\d{2}\/\d{2}\/\d{4})/)?.[1];
    tanggalFormatted = tanggal ? formatTanggalIndonesia(tanggal) : '';
    problem = clean(rawText.match(/Trouble Dilaporkan\s*:\s*(.+)/)?.[1]);
    berangkat = potongJamMenit(rawText.match(/Berangkat\s+(\d{2}:\d{2}:\d{2})/)?.[1]);
    tiba = potongJamMenit(rawText.match(/Tiba\s+(\d{2}:\d{2}:\d{2})/)?.[1]);
    mulai = potongJamMenit(rawText.match(/Mulai\s+(\d{2}:\d{2}:\d{2})/)?.[1]);
    selesai = potongJamMenit(rawText.match(/Selesai\s+(\d{2}:\d{2}:\d{2})/)?.[1]);
    solusi = clean(rawText.match(/Solusi\/Perbaikan\s*:\s*(.+)/)?.[1]);
    jenisPerangkat = clean(rawText.match(/Jenis Perangkat\s*:\s*(.+)/)?.[1]);
    serial = clean(rawText.match(/SN\s*:\s*(.+)/)?.[1]);
    merk = clean(rawText.match(/Merk\s*:\s*(.+)/)?.[1]);
    type = clean(rawText.match(/Type\s*:\s*(.+)/)?.[1]);
    pic = clean(rawText.match(/Pelapor\s*:\s*([^\(]+)/)?.[1]);
    status = clean(rawText.match(/STATUS PEKERJAAN\s*:\s*(.+)/)?.[1]);

    updateOutput();
  };
  reader.readAsArrayBuffer(file);
});

function updateOutput() {
  const lokasiTerpilih = lokasiSelect.value;
  const unitKerjaLengkap = (lokasiTerpilih && unitKerja !== '-') ? `${unitKerja} (${lokasiTerpilih})` : unitKerja;

  const finalOutput = `Selamat Pagi/Siang/Sore Petugas Call Center, Update Pekerjaan

Unit Kerja : ${unitKerjaLengkap}
Kantor Cabang : ${kantorCabang}

Tanggal : ${tanggalFormatted}

Jenis Pekerjaan (Problem) : ${problem}

Berangkat : ${berangkat}
Tiba : ${tiba}
Mulai : ${mulai}
Selesai : ${selesai}

Progress : ${solusi}

Jenis Perangkat : ${jenisPerangkat}
Serial Number : ${serial}
Merk Perangkat : ${merk}
Type Perangkat : ${type}

PIC : ${pic}
Status : ${status}`;

  output.textContent = finalOutput;
}

copyBtn.addEventListener("click", () => {
  const textarea = document.createElement("textarea");
  textarea.value = output.textContent;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  copyBtn.textContent = "✔ Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
});
