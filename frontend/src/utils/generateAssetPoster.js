import { jsPDF } from 'jspdf';

// Same visual design as the Issue Management poster, but asset-only (no
// issue reference) — used by Public Registry and User Dashboard's Assets
// tab, where the download is about the asset itself, not a specific issue.
export const generateAssetPoster = (asset) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const pageWidth = 148;
  const centerX = pageWidth / 2;

  // ---- Header band ----
  doc.setFillColor(20, 24, 31); // --ink
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(217, 114, 15); // --hazard accent strip
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'bold');
  doc.setFontSize(22);
  doc.text('MAINTAINIQ', centerX, 15, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  doc.text('ASSET IDENTIFICATION LABEL', centerX, 22, { align: 'center' });

  // ---- Asset name ----
  doc.setTextColor(20, 24, 31);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(asset.name || 'Unnamed Asset', centerX, 45, { align: 'center' });

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 117, 112); // --muted
  doc.text(`${asset.assetCode || '—'}  •  ${asset.category || '—'}`, centerX, 53, { align: 'center' });
  doc.text(asset.location || '—', centerX, 59, { align: 'center' });

  // ---- QR code, centered and prominent ----
  const qrSize = 70;
  const qrX = centerX - qrSize / 2;
  const qrY = 68;

  if (asset.qrUrl) {
    doc.setDrawColor(215, 221, 212); // --border
    doc.setLineWidth(0.6);
    doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8); // frame around QR
    doc.addImage(asset.qrUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 92, 82); // --brand
    doc.text('SCAN TO VIEW STATUS & REPORT AN ISSUE', centerX, qrY + qrSize + 12, { align: 'center' });
  } else {
    doc.setDrawColor(168, 55, 28); // --critical
    doc.setLineWidth(0.6);
    doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(168, 55, 28);
    doc.text('QR UNAVAILABLE', centerX, qrY + qrSize / 2, { align: 'center' });
  }

  // ---- Footer ----
  doc.setDrawColor(215, 221, 212);
  doc.setLineWidth(0.3);
  doc.line(10, 195, pageWidth - 10, 195);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 117, 112);
  doc.text('Asset Identification Poster', 10, 201);
  doc.text(new Date().toLocaleDateString(), pageWidth - 10, 201, { align: 'right' });

  doc.save(`asset-poster-${asset.assetCode || 'asset'}.pdf`);
};
