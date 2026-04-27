import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const DEFAULT_COMPANY_NAME = 'One Step Solution (OSS) Bali';
const COLORS = {
  text: rgb(0.06, 0.09, 0.16),
  muted: rgb(0.37, 0.41, 0.47),
  border: rgb(0.44, 0.47, 0.52),
  divider: rgb(0.8, 0.82, 0.86),
  labelFill: rgb(0.78, 0.84, 0.93),
  white: rgb(1, 1, 1),
};

function normalizeText(value) {
  return String(value || '').trim();
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatBulan(value) {
  const map = {
    JANUARI: 'Januari',
    FEBRUARI: 'Februari',
    MARET: 'Maret',
    APRIL: 'April',
    MEI: 'Mei',
    JUNI: 'Juni',
    JULI: 'Juli',
    AGUSTUS: 'Agustus',
    SEPTEMBER: 'September',
    OKTOBER: 'Oktober',
    NOVEMBER: 'November',
    DESEMBER: 'Desember',
  };

  return map[normalizeText(value).toUpperCase()] || '-';
}

function formatPeriodeLabel(periode) {
  if (!periode) return '-';
  return `${formatBulan(periode.bulan)} ${periode.tahun || '-'}`;
}

function formatJenisHubungan(value) {
  const map = {
    PKWTT: 'PKWTT',
    PKWT: 'PKWT',
    FREELANCE: 'Freelance',
    INTERNSHIP: 'Internship',
  };

  return map[normalizeText(value).toUpperCase()] || value || '-';
}

function buildDetailItems(groups = []) {
  return groups.flatMap((group) =>
    (Array.isArray(group?.items) ? group.items : []).map((item) => ({
      ...item,
      sign: group?.key === 'POTONGAN' ? '-' : '',
    })),
  );
}

function resolveDetailTypeLabel(item) {
  return item?.definisi_komponen?.tipe_komponen?.nama_tipe_komponen || item?.tipe_komponen_label || item?.tipe_komponen || '';
}

function resolveDetailTypeId(item) {
  return item?.definisi_komponen?.tipe_komponen?.id_tipe_komponen_payroll || '';
}

function normalizeDetailIdentity(value) {
  return normalizeText(value).toLowerCase();
}

function isSnapshotBackedDetail(item, snapshotKey) {
  const itemName = normalizeDetailIdentity(item?.nama_komponen);
  const itemType = normalizeText(resolveDetailTypeLabel(item)).toUpperCase();

  if (snapshotKey === 'gaji_pokok') {
    return itemType === 'GAJI_POKOK' || itemName.includes('gaji pokok');
  }

  if (snapshotKey === 'tunjangan_bpjs') {
    return itemName.includes('tunjangan bpjs') || itemName.includes('bpjs');
  }

  if (snapshotKey === 'pph21') {
    return itemType === 'PAJAK' || itemName.includes('pph 21') || itemName.includes('pph21');
  }

  return false;
}

function buildDetailRows(slip) {
  const detailItems = buildDetailItems(slip?.groups);
  const gajiPokokSnapshot = Number(slip?.payroll?.gaji_pokok_snapshot || 0);
  const tunjanganBpjsSnapshot = Number(slip?.payroll?.tunjangan_bpjs_snapshot || 0);
  const pph21Nominal = Number(slip?.summary?.pph21_nominal ?? slip?.payroll?.pph21_nominal ?? 0);

  const snapshotRows = [
    ...(gajiPokokSnapshot > 0
      ? [
          {
            snapshotKey: 'gaji_pokok',
            label: 'Gaji Pokok',
            value: formatCurrency(gajiPokokSnapshot),
          },
        ]
      : []),
    ...(tunjanganBpjsSnapshot > 0
      ? [
          {
            snapshotKey: 'tunjangan_bpjs',
            label: 'Tunjangan BPJS',
            value: `-${formatCurrency(tunjanganBpjsSnapshot)}`,
          },
        ]
      : []),
    ...(pph21Nominal > 0
      ? [
          {
            snapshotKey: 'pph21',
            label: 'PPh %',
            value: `-${formatCurrency(pph21Nominal)}`,
          },
        ]
      : []),
  ];

  const filteredDetailItems = detailItems.filter((item) => !snapshotRows.some((row) => isSnapshotBackedDetail(item, row.snapshotKey)));

  const rows =
    snapshotRows.length > 0 || filteredDetailItems.length > 0
      ? [
          ...snapshotRows,
          ...filteredDetailItems.map((item) => ({
            typeId: resolveDetailTypeId(item),
            type: resolveDetailTypeLabel(item),
            label: item?.nama_komponen || '-',
            value: `${item?.sign || ''}${formatCurrency(item?.nominal_number)}`,
          })),
        ]
      : [{ label: 'Detail Komponen', value: 'Tidak ada detail komponen payroll.' }];

  return rows;
}

function fitText(text, font, size, maxWidth) {
  const safeText = normalizeText(text) || '-';
  if (!maxWidth || font.widthOfTextAtSize(safeText, size) <= maxWidth) return safeText;

  const ellipsis = '...';
  let result = safeText;

  while (result.length > 0 && font.widthOfTextAtSize(`${result}${ellipsis}`, size) > maxWidth) {
    result = result.slice(0, -1);
  }

  return result ? `${result}${ellipsis}` : ellipsis;
}

function drawTextInCell(page, text, { x, y, width, height, font, size, color, align = 'left', paddingX = 8 }) {
  const finalText = fitText(text, font, size, Math.max(width - paddingX * 2, 12));
  const textWidth = font.widthOfTextAtSize(finalText, size);
  const textHeight = size;

  let textX = x + paddingX;
  if (align === 'right') {
    textX = x + width - paddingX - textWidth;
  } else if (align === 'center') {
    textX = x + (width - textWidth) / 2;
  }

  const textY = y + (height - textHeight) / 2 + 1;
  page.drawText(finalText, {
    x: textX,
    y: textY,
    font,
    size,
    color,
  });
}

function drawMetaLine(page, { label, value, xRight, y, font, size }) {
  const labelText = label || '-';
  const valueText = normalizeText(value) || '-';
  const colonText = ':';
  const gap = 6;

  const valueWidth = font.widthOfTextAtSize(valueText, size);
  const colonWidth = font.widthOfTextAtSize(colonText, size);
  const labelWidth = font.widthOfTextAtSize(labelText, size);

  const valueX = xRight - valueWidth;
  const colonX = valueX - gap - colonWidth;
  const labelX = colonX - gap - labelWidth;

  page.drawText(labelText, { x: labelX, y, font, size, color: COLORS.muted });
  page.drawText(colonText, { x: colonX, y, font, size, color: COLORS.muted });
  page.drawText(valueText, { x: valueX, y, font, size, color: COLORS.muted });
}

function drawKeyValueTable(page, rows, { x, topY, width, labelWidth, rowHeight, labelFont, valueFont, textSize, valueAlign = 'left' }) {
  const valueWidth = width - labelWidth;
  let cursorY = topY;

  rows.forEach((row) => {
    const rowBottom = cursorY - rowHeight;

    page.drawRectangle({
      x,
      y: rowBottom,
      width: labelWidth,
      height: rowHeight,
      color: COLORS.labelFill,
      borderColor: COLORS.border,
      borderWidth: 1,
    });

    page.drawRectangle({
      x: x + labelWidth,
      y: rowBottom,
      width: valueWidth,
      height: rowHeight,
      color: COLORS.white,
      borderColor: COLORS.border,
      borderWidth: 1,
    });

    drawTextInCell(page, row?.label || '-', {
      x,
      y: rowBottom,
      width: labelWidth,
      height: rowHeight,
      font: labelFont,
      size: textSize,
      color: COLORS.text,
    });

    drawTextInCell(page, row?.value || '-', {
      x: x + labelWidth,
      y: rowBottom,
      width: valueWidth,
      height: rowHeight,
      font: valueFont,
      size: textSize,
      color: COLORS.text,
      align: valueAlign,
    });

    cursorY = rowBottom;
  });

  return cursorY;
}

function prepareDetailRows(rows = []) {
  const hasTypeColumn = rows.some((row) => row?.type);
  let lastMergedTypeId = null;
  let lastMergedTypeIndex = -1;
  const preparedRows = [];

  rows.forEach((row) => {
    const preparedRow = {
      ...row,
      shouldRenderTypeCell: false,
      typeRowSpan: 1,
      labelColSpan: hasTypeColumn && !row?.type ? 2 : 1,
    };

    if (!hasTypeColumn || !row?.type) {
      lastMergedTypeId = null;
      lastMergedTypeIndex = -1;
      preparedRows.push(preparedRow);
      return;
    }

    if (row?.typeId && row.typeId === lastMergedTypeId && lastMergedTypeIndex >= 0) {
      preparedRows[lastMergedTypeIndex].typeRowSpan += 1;
      lastMergedTypeId = row.typeId;
      preparedRows.push(preparedRow);
      return;
    }

    preparedRow.shouldRenderTypeCell = true;
    lastMergedTypeId = row?.typeId || null;
    lastMergedTypeIndex = preparedRows.length;
    preparedRows.push(preparedRow);
  });

  return { hasTypeColumn, preparedRows };
}

function drawDetailTable(page, rows, { x, topY, width, typeWidth, labelWidth, rowHeight, labelFont, valueFont, textSize }) {
  const { hasTypeColumn, preparedRows } = prepareDetailRows(rows);
  const reservedLeftWidth = hasTypeColumn ? typeWidth + labelWidth : labelWidth;
  const valueWidth = width - reservedLeftWidth;
  let cursorY = topY;

  preparedRows.forEach((row) => {
    const rowBottom = cursorY - rowHeight;

    if (hasTypeColumn && row?.shouldRenderTypeCell) {
      const mergedHeight = rowHeight * row.typeRowSpan;
      const mergedBottom = cursorY - mergedHeight;

      page.drawRectangle({
        x,
        y: mergedBottom,
        width: typeWidth,
        height: mergedHeight,
        color: COLORS.labelFill,
        borderColor: COLORS.border,
        borderWidth: 1,
      });

      drawTextInCell(page, row?.type || '-', {
        x,
        y: mergedBottom,
        width: typeWidth,
        height: mergedHeight,
        font: labelFont,
        size: textSize,
        color: COLORS.text,
      });
    }

    const labelX = hasTypeColumn ? (row?.labelColSpan === 2 ? x : x + typeWidth) : x;

    const labelCellWidth = hasTypeColumn ? (row?.labelColSpan === 2 ? typeWidth + labelWidth : labelWidth) : labelWidth;

    page.drawRectangle({
      x: labelX,
      y: rowBottom,
      width: labelCellWidth,
      height: rowHeight,
      color: COLORS.labelFill,
      borderColor: COLORS.border,
      borderWidth: 1,
    });

    page.drawRectangle({
      x: x + reservedLeftWidth,
      y: rowBottom,
      width: valueWidth,
      height: rowHeight,
      color: COLORS.white,
      borderColor: COLORS.border,
      borderWidth: 1,
    });

    drawTextInCell(page, row?.label || '-', {
      x: labelX,
      y: rowBottom,
      width: labelCellWidth,
      height: rowHeight,
      font: labelFont,
      size: textSize,
      color: COLORS.text,
    });

    drawTextInCell(page, row?.value || '-', {
      x: x + reservedLeftWidth,
      y: rowBottom,
      width: valueWidth,
      height: rowHeight,
      font: valueFont,
      size: textSize,
      color: COLORS.text,
      align: 'right',
    });

    cursorY = rowBottom;
  });

  return cursorY;
}

function inferPdfKind(url, contentType) {
  const normalizedUrl = normalizeText(url).toLowerCase();
  const normalizedType = normalizeText(contentType).toLowerCase();

  if (normalizedType.includes('application/pdf')) return 'pdf';
  if (normalizedType.includes('image/png')) return 'png';
  if (normalizedType.includes('image/jpeg') || normalizedType.includes('image/jpg')) return 'jpg';

  if (/\.pdf(\?|#|$)/i.test(normalizedUrl)) return 'pdf';
  if (/\.png(\?|#|$)/i.test(normalizedUrl)) return 'png';
  if (/\.(jpe?g)(\?|#|$)/i.test(normalizedUrl)) return 'jpg';

  return null;
}

async function fetchBinaryAsset(url) {
  const res = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Gagal mengambil asset template (${res.status}).`);
  }

  return {
    bytes: await res.arrayBuffer(),
    contentType: res.headers.get('content-type') || '',
  };
}

function drawImageContain(page, image, x, y, width, height) {
  const ratio = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  page.drawImage(image, {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight,
  });
}

async function createPdfDocument(templateUrl) {
  const normalizedTemplateUrl = normalizeText(templateUrl);

  if (!normalizedTemplateUrl) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    return { pdfDoc, background: { kind: 'blank' } };
  }

  try {
    const asset = await fetchBinaryAsset(normalizedTemplateUrl);
    const assetKind = inferPdfKind(normalizedTemplateUrl, asset.contentType);

    if (assetKind === 'pdf') {
      const sourceDoc = await PDFDocument.load(asset.bytes);
      const pdfDoc = await PDFDocument.create();
      const [firstPage] = await pdfDoc.copyPages(sourceDoc, [0]);
      pdfDoc.addPage(firstPage);
      return { pdfDoc, background: { kind: 'pdf', sourceDoc } };
    }

    if (assetKind === 'png' || assetKind === 'jpg') {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      const image = assetKind === 'png' ? await pdfDoc.embedPng(asset.bytes) : await pdfDoc.embedJpg(asset.bytes);
      drawImageContain(page, image, 0, 0, A4_WIDTH, A4_HEIGHT);

      return {
        pdfDoc,
        background: {
          kind: 'image',
          bytes: asset.bytes,
          imageKind: assetKind,
        },
      };
    }
  } catch (err) {
    console.warn('Slip PDF preview gagal membaca template, fallback ke halaman kosong:', err);
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  return { pdfDoc, background: { kind: 'blank' } };
}

async function addTemplateBackedPage(pdfDoc, background, pageIndex = 0) {
  if (background?.kind === 'pdf' && background.sourceDoc) {
    const pageCount = background.sourceDoc.getPageCount();
    const safePageIndex = Math.min(Math.max(pageIndex, 0), Math.max(pageCount - 1, 0));
    const [templatePage] = await pdfDoc.copyPages(background.sourceDoc, [safePageIndex]);
    pdfDoc.addPage(templatePage);
    return templatePage;
  }

  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

  if (background?.kind === 'image' && background.bytes) {
    const image = background.imageKind === 'png' ? await pdfDoc.embedPng(background.bytes) : await pdfDoc.embedJpg(background.bytes);
    drawImageContain(page, image, 0, 0, A4_WIDTH, A4_HEIGHT);
  }

  return page;
}

async function loadSignatureImages(pdfDoc, steps = []) {
  const cache = new Map();

  for (const step of steps) {
    const signatureUrl = getApprovalSignatureUrl(step);
    if (!signatureUrl || cache.has(signatureUrl)) continue;

    try {
      const asset = await fetchBinaryAsset(signatureUrl);
      const assetKind = inferPdfKind(signatureUrl, asset.contentType);

      if (assetKind === 'png') {
        cache.set(signatureUrl, await pdfDoc.embedPng(asset.bytes));
        continue;
      }

      if (assetKind === 'jpg') {
        cache.set(signatureUrl, await pdfDoc.embedJpg(asset.bytes));
        continue;
      }
    } catch (err) {
      console.warn('Gagal memuat tanda tangan approval slip PDF:', err);
    }

    cache.set(signatureUrl, null);
  }

  return cache;
}

function getApprovalSignatureUrl(step) {
  const isVerified = step?.decision === 'disetujui' && Boolean(step?.otp_verified_at);
  if (!isVerified) return '';

  return normalizeText(step?.approver?.ttd_url);
}

async function appendPaymentProofPage(pdfDoc, slip, background) {
  const proofUrl = normalizeText(slip?.payment?.bukti_bayar_url);
  if (!proofUrl) return;

  try {
    const asset = await fetchBinaryAsset(proofUrl);
    const assetKind = inferPdfKind(proofUrl, asset.contentType);
    if (!['pdf', 'png', 'jpg'].includes(assetKind)) return;

    const page = await addTemplateBackedPage(pdfDoc, background, 1);
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const marginX = (42 / A4_WIDTH) * pageWidth;
    const marginY = (58 / A4_HEIGHT) * pageHeight;
    const proofX = marginX;
    const proofY = marginY;
    const proofWidth = pageWidth - marginX * 2;
    const proofHeight = pageHeight - marginY * 2;

    if (assetKind === 'pdf') {
      const [proofPage] = await pdfDoc.embedPdf(asset.bytes, [0]);
      const ratio = Math.min(proofWidth / proofPage.width, proofHeight / proofPage.height);
      const drawWidth = proofPage.width * ratio;
      const drawHeight = proofPage.height * ratio;

      page.drawPage(proofPage, {
        x: proofX + (proofWidth - drawWidth) / 2,
        y: proofY + (proofHeight - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight,
      });
      return;
    }

    if (assetKind === 'png' || assetKind === 'jpg') {
      const image = assetKind === 'png' ? await pdfDoc.embedPng(asset.bytes) : await pdfDoc.embedJpg(asset.bytes);
      drawImageContain(page, image, proofX, proofY, proofWidth, proofHeight);
      return;
    }
  } catch (err) {
    console.warn('Gagal memuat bukti bayar slip PDF:', err);
  }
}

export async function buildSlipPdf(slip) {
  const templateUrl = slip?.period?.template?.file_template_url || '';
  const hasTemplate = Boolean(normalizeText(templateUrl));
  const { pdfDoc, background } = await createPdfDocument(templateUrl);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const page = pdfDoc.getPage(0);
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const scaleX = (value) => (value / A4_WIDTH) * pageWidth;
  const scaleY = (value) => (value / A4_HEIGHT) * pageHeight;
  const marginX = scaleX(42);
  const contentWidth = pageWidth - marginX * 2;
  const xRight = pageWidth - marginX;
  const companyName = slip?.document?.company_name_snapshot || DEFAULT_COMPANY_NAME;

  let cursorY = pageHeight - (hasTemplate ? scaleY(116) : scaleY(68));

  const metadataSize = scaleY(8.8);
  drawMetaLine(page, {
    label: 'Date of Issue',
    value: formatDate(slip?.document?.issued_at),
    xRight,
    y: cursorY,
    font: italicFont,
    size: metadataSize,
  });
  cursorY -= scaleY(14);

  drawMetaLine(page, {
    label: 'Company Issue',
    value: companyName,
    xRight,
    y: cursorY,
    font: italicFont,
    size: metadataSize,
  });
  cursorY -= scaleY(14);

  drawMetaLine(page, {
    label: 'Number of Issue',
    value: slip?.document?.issue_number || '-',
    xRight,
    y: cursorY,
    font: italicFont,
    size: metadataSize,
  });
  cursorY -= scaleY(hasTemplate ? 28 : 24);

  if (!hasTemplate) {
    const companyTitle = fitText(companyName, boldFont, scaleY(16), contentWidth);
    const companyWidth = boldFont.widthOfTextAtSize(companyTitle, scaleY(16));
    page.drawText(companyTitle, {
      x: marginX + (contentWidth - companyWidth) / 2,
      y: cursorY,
      font: boldFont,
      size: scaleY(16),
      color: COLORS.text,
    });
    cursorY -= scaleY(22);
  }

  const statementTitle = 'PAYSLIP STATEMENT';
  const statementSize = scaleY(hasTemplate ? 14 : 13);
  const statementWidth = boldFont.widthOfTextAtSize(statementTitle, statementSize);
  page.drawText(statementTitle, {
    x: marginX + (contentWidth - statementWidth) / 2,
    y: cursorY,
    font: boldFont,
    size: statementSize,
    color: COLORS.text,
  });
  cursorY -= scaleY(18);

  page.drawLine({
    start: { x: marginX, y: cursorY },
    end: { x: pageWidth - marginX, y: cursorY },
    color: COLORS.divider,
    thickness: 1,
  });
  cursorY -= scaleY(18);

  const sectionTitleSize = scaleY(11);
  const cellTextSize = scaleY(8.8);
  const standardRowHeight = scaleY(18);
  const detailRows = buildDetailRows(slip);
  const detailRowHeight = detailRows.length > 12 ? scaleY(15.5) : detailRows.length > 9 ? scaleY(16.5) : standardRowHeight;

  page.drawText('Biodata :', {
    x: marginX,
    y: cursorY,
    font: boldFont,
    size: sectionTitleSize,
    color: COLORS.text,
  });
  cursorY -= scaleY(14);

  cursorY = drawKeyValueTable(
    page,
    [
      { label: 'Name', value: slip?.employee?.nama_karyawan || '-' },
      { label: 'Position', value: slip?.employee?.nama_jabatan || '-' },
      { label: 'Department', value: slip?.employee?.nama_departement || '-' },
      { label: 'Employee Status', value: formatJenisHubungan(slip?.employee?.jenis_hubungan_kerja) },
    ],
    {
      x: marginX,
      topY: cursorY,
      width: contentWidth,
      labelWidth: scaleX(150),
      rowHeight: standardRowHeight,
      labelFont: regularFont,
      valueFont: regularFont,
      textSize: cellTextSize,
    },
  );
  cursorY -= scaleY(14);

  page.drawText('Detail :', {
    x: marginX,
    y: cursorY,
    font: boldFont,
    size: sectionTitleSize,
    color: COLORS.text,
  });
  cursorY -= scaleY(14);

  cursorY = drawDetailTable(page, detailRows, {
    x: marginX,
    topY: cursorY,
    width: contentWidth,
    typeWidth: scaleX(150),
    labelWidth: scaleX(175),
    rowHeight: detailRowHeight,
    labelFont: regularFont,
    valueFont: regularFont,
    textSize: detailRows.length > 12 ? scaleY(8.1) : cellTextSize,
  });
  cursorY -= scaleY(14);

  page.drawText('Summary :', {
    x: marginX,
    y: cursorY,
    font: boldFont,
    size: sectionTitleSize,
    color: COLORS.text,
  });
  cursorY -= scaleY(14);

  cursorY = drawKeyValueTable(
    page,
    [
      { label: 'Total Pendapatan', value: formatCurrency(slip?.summary?.total_pendapatan_bruto) },
      { label: 'Total Potongan', value: formatCurrency(slip?.summary?.total_potongan) },
      { label: 'Take Home Pay', value: formatCurrency(slip?.summary?.pendapatan_bersih) },
    ],
    {
      x: marginX,
      topY: cursorY,
      width: contentWidth,
      labelWidth: scaleX(180),
      rowHeight: standardRowHeight,
      labelFont: regularFont,
      valueFont: regularFont,
      textSize: cellTextSize,
      valueAlign: 'right',
    },
  );
  cursorY -= scaleY(14);

  page.drawText('TERM :', {
    x: marginX,
    y: cursorY,
    font: boldFont,
    size: sectionTitleSize,
    color: COLORS.text,
  });
  cursorY -= scaleY(14);

  cursorY = drawKeyValueTable(
    page,
    [
      { label: 'Periode', value: formatPeriodeLabel(slip?.period) },
      { label: 'Note', value: normalizeText(slip?.payroll?.catatan) || '-' },
    ],
    {
      x: marginX,
      topY: cursorY,
      width: contentWidth,
      labelWidth: scaleX(150),
      rowHeight: standardRowHeight,
      labelFont: regularFont,
      valueFont: regularFont,
      textSize: cellTextSize,
    },
  );
  cursorY -= scaleY(16);

  const approvalSteps = Array.isArray(slip?.approval?.steps) ? slip.approval.steps.filter(Boolean) : [];
  const approvalColumns =
    approvalSteps.length > 0
      ? approvalSteps.map((step) => ({
          title: step?.approver_role ? `Approve By ${normalizeText(step.approver_role) || '-'}` : `Approval Level ${step?.level || '-'}`,
          step,
        }))
      : [{ title: 'Approval', step: null }];

  const signatureCache = await loadSignatureImages(pdfDoc, approvalSteps);
  const columnWidth = contentWidth / approvalColumns.length;
  const headerHeight = scaleY(18);
  const signatureHeight = scaleY(56);
  const footerHeight = scaleY(18);
  const approvalTop = cursorY;

  approvalColumns.forEach((column, index) => {
    const columnX = marginX + columnWidth * index;
    const headerBottom = approvalTop - headerHeight;
    const signatureBottom = headerBottom - signatureHeight;
    const footerBottom = signatureBottom - footerHeight;
    const signatureUrl = getApprovalSignatureUrl(column?.step);
    const signatureImage = signatureUrl ? signatureCache.get(signatureUrl) : null;
    const approverName = column?.step?.approver_nama_snapshot || column?.step?.approver?.nama_pengguna || '-';

    page.drawRectangle({
      x: columnX,
      y: headerBottom,
      width: columnWidth,
      height: headerHeight,
      color: COLORS.white,
      borderColor: COLORS.divider,
      borderWidth: 1,
    });

    drawTextInCell(page, column?.title || 'Approval', {
      x: columnX,
      y: headerBottom,
      width: columnWidth,
      height: headerHeight,
      font: boldFont,
      size: scaleY(8.4),
      color: COLORS.text,
      align: 'center',
    });

    page.drawRectangle({
      x: columnX,
      y: signatureBottom,
      width: columnWidth,
      height: signatureHeight,
      color: COLORS.white,
      borderColor: COLORS.divider,
      borderWidth: 1,
    });

    if (signatureImage) {
      drawImageContain(page, signatureImage, columnX + scaleX(8), signatureBottom + scaleY(6), columnWidth - scaleX(16), signatureHeight - scaleY(12));
    } else {
      drawTextInCell(page, '[Tanda tangan]', {
        x: columnX,
        y: signatureBottom,
        width: columnWidth,
        height: signatureHeight,
        font: regularFont,
        size: scaleY(8.2),
        color: COLORS.muted,
        align: 'center',
      });
    }

    page.drawRectangle({
      x: columnX,
      y: footerBottom,
      width: columnWidth,
      height: footerHeight,
      color: COLORS.white,
      borderColor: COLORS.divider,
      borderWidth: 1,
    });

    drawTextInCell(page, approverName, {
      x: columnX,
      y: footerBottom,
      width: columnWidth,
      height: footerHeight,
      font: regularFont,
      size: scaleY(8.2),
      color: COLORS.text,
      align: 'center',
    });
  });

  await appendPaymentProofPage(pdfDoc, slip, background);

  return pdfDoc.save();
}

export function buildSlipFilename(slip, id = '') {
  const employeeSlug =
    normalizeText(slip?.employee?.nama_karyawan || id || 'payslip')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'payslip';

  const periodLabel = formatPeriodeLabel(slip?.period);
  const periodSlug =
    periodLabel && periodLabel !== '-'
      ? normalizeText(periodLabel)
          .replace(/[^a-zA-Z0-9_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .toLowerCase()
      : '';

  return ['slip-payroll', employeeSlug, periodSlug].filter(Boolean).join('-') + '.pdf';
}
