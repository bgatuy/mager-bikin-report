const pdfInput = document.getElementById("pdfFile");
const output = document.getElementById("output");
const copyBtn = document.getElementById("copyBtn");
const lokasiSelect = document.getElementById("inputLokasi");

let lokasiTerpilih = "";
let unitKerja = "-";
let kantor = "-";
let tanggal = "-";
let problem = "-";
let berangkat = "-";
let tiba = "-";
let mulai = "-";
let selesai = "-";
let progress = "-";
let jenis = "-";
let sn = "-";
let merk = "-";
let tipe = "-";
let pic = "-";
let status = "-";

// Format tanggal dari 03/03/2025 → 03 Maret 2025
function formatTanggalIndo(tanggalStr) {
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const [dd, mm, yyyy] = tanggalStr.split("/");
  return `${dd} ${bulan[parseInt(mm) - 1]} ${yyyy}`;
}

// Regex helper
function ambil(text, regex, fallback = "-") {
  const match = text.match(regex);
  return match?.[1]?.trim() || fallback;
}

// Jam cleaner: 09.20.00 → 09:20
function cleanJam(text) {
  if (!text || text === "-") return "-";
  const match = text.match(/\d{2}[.:]\d{2}/);
  return match ? match[0].replace(/\./g, ":") : "-";
}

function generateLaporan() {
  const unitKerjaLengkap = (lokasiTerpilih && unitKerja !== "-") ? `${unitKerja} (${lokasiTerpilih})` : unitKerja;

  const laporanBaru = `Selamat Pagi/Siang/Sore Petugas Call Center, Update Pekerjaan

Unit Kerja : ${unitKerjaLengkap}
Kantor Cabang : ${kantor}

Tanggal : ${tanggal}

Jenis Pekerjaan (Problem) : ${problem}

Berangkat : ${berangkat}
Tiba : ${tiba}
Mulai : ${mulai}
Selesai : ${selesai}

Progress : ${progress}

Jenis Perangkat : ${jenis}
Serial Number : ${sn}
Merk Perangkat : ${merk}
Type Perangkat : ${tipe}

PIC : ${pic}
Status : ${status}`;

  output.textContent = laporanBaru;
}

lokasiSelect.addEventListener("change", () => {
  lokasiTerpilih = lokasiSelect.value;
  generateLaporan();
});

pdfInput.addEventListener("change", async () => {
  const file = pdfInput.files[0];
  if (!file) return;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let rawText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    rawText += content.items.map(i => i.str).join(" ") + "\n";
  }

  rawText = rawText.replace(/\s+/g, " ").trim();

  unitKerja = ambil(rawText, /Unit Kerja\s*:\s*(.+?)\s+(Perangkat|Kantor Cabang)/);
  kantor = ambil(rawText, /Kantor Cabang\s*:\s*(.+?)\s+(Tanggal|Asset ID|Tanggal\/Jam)/);
  const tglRaw = ambil(rawText, /Tanggal\/Jam\s*:\s*(\d{2}\/\d{2}\/\d{4})/);
  tanggal = tglRaw !== "-" ? formatTanggalIndo(tglRaw) : "-";

  problem = ambil(rawText, /Trouble Dilaporkan\s*:\s*(.+?)\s+(Solusi|Progress|KETERANGAN)/i);
  if (problem === "-") problem = ambil(rawText, /Problem\s*[:\-]?\s*(.+?)\s+(Solusi|Progress|KETERANGAN)/i);

  berangkat = cleanJam(ambil(rawText, /BERANGKAT\s+(\d{2}[.:]\d{2})/));
  tiba = cleanJam(ambil(rawText, /TIBA\s+(\d{2}[.:]\d{2})/));
  mulai = cleanJam(ambil(rawText, /MULAI\s+(\d{2}[.:]\d{2})/));
  selesai = cleanJam(ambil(rawText, /SELESAI\s+(\d{2}[.:]\d{2})/));

  progress = ambil(rawText, /Solusi\s*\/?\s*Perbaikan\s*:\s*(.+?)\s+(KETERANGAN|Status|$)/i);
  jenis = ambil(rawText, /Perangkat\s*[:\-]?\s*(Notebook Highend|PC|Printer|.+?)\s+(Kantor Cabang|SN|Asset ID)/i);
  sn = ambil(rawText, /SN\s*[:\-]?\s*([A-Za-z0-9\-]+)/i);
  tipe = ambil(rawText, /Type\s*[:\-]?\s*([A-Za-z0-9\s\-]+?)(?=\s+(SN|PW|Status|PIC|$))/i);
  merk = ambil(rawText, /Merk\s*[:\-]?\s*([A-Za-z]+)/i);

  // Fallback gabungan Merk + Type
  if (merk === "-" && tipe !== "-") {
    const matchGabung = rawText.match(/Merk\s*[:\-]?\s*([A-Za-z]+)\s+Type\s*[:\-]?\s*([A-Za-z0-9\s\-]+)/i);
    if (matchGabung) {
      merk = matchGabung[1].trim();
      tipe = matchGabung[2].trim();
    }
  }

  // Auto detect merk dari tipe
  if ((merk === "-" || !merk) && tipe !== "-") {
    const tipeUpper = tipe.toUpperCase();
    if (tipeUpper.includes("THINKPAD") || tipeUpper.includes("LENOVO")) merk = "LENOVO";
    else if (tipeUpper.includes("DELL")) merk = "DELL";
    else if (tipeUpper.includes("HP")) merk = "HP";
    else if (tipeUpper.includes("ASUS") || tipeUpper.includes("EXPERTBOOK")) merk = "ASUS";
    else if (tipeUpper.includes("ACER")) merk = "ACER";
    else if (tipeUpper.includes("AXIOO")) merk = "AXIOO";
    else if (tipeUpper.includes("MSI")) merk = "MSI";
    else if (tipeUpper.includes("ZYREX")) merk = "ZYREX";
  }

  pic = ambil(rawText, /Pelapor\s*:\s*(.+?)\s+(Type|Status|$)/);
  if (pic.includes("(")) pic = pic.split("(")[0].trim();

  status = ambil(rawText, /Status Pekerjaan\s*:?\s*(Done|Pending|On\s?Progress)/i);

  generateLaporan();
});

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
