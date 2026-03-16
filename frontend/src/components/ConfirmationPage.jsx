import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import { renderToStaticMarkup } from 'react-dom/server';
import Header from './Header';
import Footer from './Footer';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  CheckCircle2,
  Download,
  Mail,
  User,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { usePurchase } from '../context/PurchaseContext';
import logoProntoTicketLiveLarge from '../assets/logo-prontoticketlive-large.png';

const ConfirmationPage = () => {
  const { id, orderId: orderIdFromUrl } = useParams();
  const navigate = useNavigate();
  const { clearPurchase, formatPrice } = usePurchase();

  const [confirmationData, setConfirmationData] = useState(null);
  const [generatedTickets, setGeneratedTickets] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('prontoticket_confirmation');
    if (!stored) {
      navigate('/');
      return;
    }

    try {
      const data = JSON.parse(stored);
      const finalOrderId = orderIdFromUrl || data.orderId;
      const normalized = { ...data, orderId: finalOrderId };

      setConfirmationData(normalized);

      const backendTickets = Array.isArray(normalized.backendTickets)
        ? normalized.backendTickets
        : [];

      setGeneratedTickets(backendTickets);
      clearPurchase();
    } catch (e) {
      console.error('[ConfirmationPage] Failed to parse confirmation data:', e);
      navigate('/');
    }
  }, [clearPurchase, navigate, orderIdFromUrl]);

  const handleCopyOrderId = () => {
    if (confirmationData?.orderId) {
      navigator.clipboard.writeText(confirmationData.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const buildQrPayload = (ticket, orderData) => {
    return (
      ticket?.qrCode ||
      JSON.stringify({
        ticketId: ticket.id,
        orderId: orderData.orderId,
        eventId: orderData.event?.id || id,
        functionId: ticket.functionId || orderData.selectedFunction?.id || null,
        ticketTypeId: ticket.ticketTypeId,
        seatId: ticket.seatId || null,
      })
    );
  };

  const getTicketTypeLabel = (ticket, orderData) => {
    if (ticket?.ticketTypeName) return ticket.ticketTypeName;
    if (ticket?.ticketType) return ticket.ticketType;
    if (ticket?.type) return ticket.type;
    if (ticket?.ticketType?.name) return ticket.ticketType.name;

    const selectedTickets = Array.isArray(orderData?.tickets) ? orderData.tickets : [];
    const match = selectedTickets.find((t) => t.id === ticket.ticketTypeId);

    if (match?.name) return match.name;
    if (match?.type) return match.type;

    return ticket?.ticketTypeId || '';
  };

  const loadImageAsDataUrl = async (src) => {
    if (!src) return null;

    try {
      const response = await fetch(src);
      const blob = await response.blob();

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('[ConfirmationPage] No pude cargar imagen para PDF:', src, error);
      return null;
    }
  };

  const qrSvgToPngDataUrl = async (value, size = 220) => {
    const svgString = renderToStaticMarkup(
      <QRCodeSVG value={value} size={size} level="M" includeMargin={true} />
    );

    const svgWithNamespace = svgString.includes('xmlns=')
      ? svgString
      : svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');

    const svgBlob = new Blob([svgWithNamespace], {
      type: 'image/svg+xml;charset=utf-8',
    });

    const blobUrl = URL.createObjectURL(svgBlob);

    return await new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(blobUrl);
            reject(new Error('No se pudo crear el contexto del canvas para el QR.'));
            return;
          }

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);

          const pngDataUrl = canvas.toDataURL('image/png');
          URL.revokeObjectURL(blobUrl);
          resolve(pngDataUrl);
        } catch (err) {
          URL.revokeObjectURL(blobUrl);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        reject(new Error('No se pudo convertir el SVG del QR a imagen PNG.'));
      };

      img.src = blobUrl;
    });
  };

  const generateTicketPDF = async (
    ticket,
    orderData,
    ticketIndex,
    totalTickets,
    existingDoc = null
  ) => {
    const doc =
      existingDoc || new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const logoDataUrl = await loadImageAsDataUrl(logoProntoTicketLiveLarge);
    const eventImageDataUrl = await loadImageAsDataUrl(
      orderData.event?.image || orderData.event?.imageUrl
    );
    const qrPayload = buildQrPayload(ticket, orderData);
    const qrPngDataUrl = await qrSvgToPngDataUrl(qrPayload, 240);

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFillColor(10, 10, 10);
    doc.roundedRect(margin, 10, contentWidth, 34, 4, 4, 'F');

    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', margin + 6, 15, 70, 18, undefined, 'FAST');
      } catch (error) {
        console.warn('[ConfirmationPage] No pude insertar logo en PDF:', error);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Ticket ${ticketIndex + 1} de ${totalTickets}`, pageWidth - margin - 6, 20, {
      align: 'right',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Orden: ${orderData.orderId || ''}`, pageWidth - margin - 6, 27, {
      align: 'right',
    });
    doc.text(`Ticket ID: ${ticket.id || ''}`, pageWidth - margin - 6, 33, {
      align: 'right',
    });

    let currentY = 52;

    if (eventImageDataUrl) {
      try {
        doc.addImage(eventImageDataUrl, 'PNG', margin, currentY, contentWidth, 52, undefined, 'FAST');
        currentY += 58;
      } catch (error) {
        console.warn('[ConfirmationPage] No pude insertar imagen del evento en PDF:', error);
        currentY += 4;
      }
    }

    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(orderData.event?.title || 'Evento', margin, currentY);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Fecha: ${orderData.selectedFunction?.date || orderData.event?.date || ''}`, margin, currentY);
    currentY += 6;
    doc.text(`Hora: ${orderData.selectedFunction?.time || orderData.event?.time || ''}`, margin, currentY);
    currentY += 6;
    doc.text(`Lugar: ${orderData.event?.venue || ''}`, margin, currentY);
    currentY += 6;
    doc.text(`Ciudad: ${orderData.event?.city || ''}`, margin, currentY);
    currentY += 10;

    doc.setFillColor(248, 249, 251);
    doc.roundedRect(margin, currentY, contentWidth, 34, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text('Datos del ticket', margin + 5, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      `Comprador: ${orderData.buyer?.firstName || ''} ${orderData.buyer?.lastName || ''}`.trim(),
      margin + 5,
      currentY + 16
    );
    doc.text(`Email: ${orderData.buyer?.email || ''}`, margin + 5, currentY + 22);
    doc.text(
      `Tipo de entrada: ${getTicketTypeLabel(ticket, orderData)}`,
      margin + 5,
      currentY + 28
    );

    if (ticket.seatId) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 149, 0);
      doc.text(`Asiento: ${ticket.seatId}`, pageWidth - margin - 5, currentY + 16, {
        align: 'right',
      });
      doc.setTextColor(20, 20, 20);
      doc.setFont('helvetica', 'normal');
    }

    currentY += 42;

    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(margin, currentY, contentWidth, 78, 3, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Código QR de acceso', margin + 5, currentY + 8);

    if (qrPngDataUrl) {
      try {
        const qrSize = 52;
        doc.addImage(qrPngDataUrl, 'PNG', margin + 5, currentY + 14, qrSize, qrSize, undefined, 'FAST');
      } catch (error) {
        console.error('[ConfirmationPage] No pude insertar QR en PDF:', error);
        throw error;
      }
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    doc.text(
      'Presenta este código QR en la entrada del evento. Cada ticket es único y solo puede usarse una vez.',
      margin + 64,
      currentY + 24,
      { maxWidth: contentWidth - 70 }
    );

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(qrPayload, margin + 64, currentY + 48, {
      maxWidth: contentWidth - 70,
    });

    doc.setDrawColor(230, 230, 230);
    doc.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text('ProntoTicketLive.com', margin, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Ticket generado automáticamente por la plataforma.', margin, pageHeight - 9);

    return doc;
  };

  const handleDownloadTickets = async () => {
    if (!confirmationData || isGeneratingPDF || generatedTickets.length === 0) return;

    setIsGeneratingPDF(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      const combinedDoc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      for (let i = 0; i < generatedTickets.length; i++) {
        const t = generatedTickets[i];
        console.log('[ConfirmationPage] Generando PDF para ticket:', t.id);

        if (i > 0) {
          combinedDoc.addPage();
        }

        await generateTicketPDF(
          t,
          confirmationData,
          i,
          generatedTickets.length,
          combinedDoc
        );
      }

      combinedDoc.save(`ProntoTicketLive_Tickets_${confirmationData.orderId}.pdf`);
    } catch (error) {
      console.error('[ConfirmationPage] Error generating PDF:', error);
      alert('Error al generar los tickets. Por favor, intenta de nuevo.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleBackToHome = () => {
    sessionStorage.removeItem('prontoticket_confirmation');
    navigate('/');
  };

  if (!confirmationData) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#007AFF]" />
      </div>
    );
  }

  const { orderId, event, selectedFunction, buyer, total, currency } = confirmationData;

  return (
    <div className="min-h-screen bg-[#0A0A0A]" data-testid="confirmation-page">
      <Header />

      <div className="pt-28 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <h1
              className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              ¡Compra exitosa!
            </h1>
            <p className="text-white/60">
              Se generaron {generatedTickets.length} entrada(s)
            </p>
          </div>

          <div className="bg-gradient-to-r from-[#007AFF]/20 to-[#FF9500]/20 rounded-2xl border border-white/10 p-4 mb-6 text-center">
            <p className="text-white/60 text-sm mb-1">Número de pedido</p>
            <div className="flex items-center justify-center space-x-2">
              <p className="text-xl sm:text-2xl font-bold text-white tracking-wider font-mono">
                {orderId}
              </p>
              <button
                onClick={handleCopyOrderId}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                data-testid="copy-order-id"
                type="button"
              >
                {copied ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} className="text-white/60" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 mb-6">
            <h2
              className="text-lg font-bold text-white mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Detalles del evento
            </h2>

            <h3 className="text-white font-semibold text-lg mb-3">{event?.title}</h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-white/70">
                <Calendar size={14} className="text-[#007AFF]" />
                <span>{selectedFunction?.date || event?.date}</span>
              </div>
              <div className="flex items-center space-x-2 text-white/70">
                <Clock size={14} className="text-[#FF9500]" />
                <span>{selectedFunction?.time || event?.time} hrs</span>
              </div>
              <div className="flex items-center space-x-2 text-white/70">
                <MapPin size={14} className="text-[#007AFF]" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${event?.venue}, ${event?.city}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#007AFF] transition-colors"
                >
                  {event?.venue}, {event?.city}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Ticket size={18} className="text-[#007AFF]" />
              <h2
                className="text-lg font-bold text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Tus entradas ({generatedTickets.length})
              </h2>
            </div>

            {generatedTickets.length === 0 ? (
              <div className="text-white/60 text-sm">
                No llegaron tickets desde el backend. Revisa que CheckoutPage esté guardando
                <code className="mx-1 px-1 rounded bg-white/10">backendTickets</code>
                en sessionStorage.
              </div>
            ) : (
              <div className="space-y-4">
                {generatedTickets.map((t, idx) => {
                  const qrData = buildQrPayload(t, confirmationData);

                  return (
                    <div
                      key={t.id || idx}
                      className="bg-[#1E1E1E] rounded-xl p-4 border border-white/5"
                      data-testid={`ticket-${t.id || idx}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold">Entrada {idx + 1}</p>
                          <p className="text-white/40 text-xs font-mono mt-1">{t.id}</p>
                          <p className="text-white/60 text-xs mt-1">
                            Tipo de entrada:{' '}
                            <span className="font-semibold">
                              {getTicketTypeLabel(t, confirmationData)}
                            </span>
                          </p>
                          {t.seatId && (
                            <p className="text-[#FF9500] text-xs mt-1">
                              Asiento: <span className="font-mono">{t.seatId}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-center pt-3 border-t border-white/10">
                        <div className="bg-white p-2 rounded-lg">
                          <QRCodeSVG value={qrData} size={110} level="M" includeMargin={false} />
                        </div>
                        <p className="text-white/50 text-xs mt-2 text-center">
                          Presenta este QR en la entrada
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-baseline">
              <span className="text-white font-bold">Total pagado</span>
              <div className="text-right">
                <div
                  className="text-2xl font-bold text-[#FF9500]"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {formatPrice(total)}
                </div>
                <div className="text-white/40 text-xs">{currency?.code || 'MXN'}</div>
              </div>
            </div>
          </div>

          <div className="bg-[#121212] rounded-2xl border border-white/10 p-5 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <User size={16} className="text-[#007AFF]" />
              <h3 className="text-white font-semibold">Comprador</h3>
            </div>
            <p className="text-white/80">
              {buyer?.firstName} {buyer?.lastName}
            </p>
            <p className="text-white/60 text-sm">{buyer?.email}</p>
          </div>

          <div className="bg-[#007AFF]/10 rounded-xl border border-[#007AFF]/20 p-4 mb-6 flex items-start space-x-3">
            <Mail size={18} className="text-[#007AFF] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm">Descarga tus entradas</p>
              <p className="text-white/60 text-sm">
                El envío automático por correo será habilitado en la siguiente fase.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDownloadTickets}
              disabled={isGeneratingPDF || generatedTickets.length === 0}
              className="w-full py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-bold rounded-xl transition-all duration-300 hover:brightness-110 flex items-center justify-center space-x-2 disabled:opacity-70"
              data-testid="download-tickets-button"
              type="button"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Generando tickets...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Descargar {generatedTickets.length} entrada(s)</span>
                </>
              )}
            </button>

            <button
              onClick={handleBackToHome}
              className="w-full py-3 text-white/70 hover:text-white font-semibold transition-colors text-sm"
              data-testid="back-to-home"
              type="button"
            >
              Volver al inicio
            </button>
          </div>

          <p className="mt-6 text-center text-white/40 text-xs">
            Cada código QR es único y solo puede usarse una vez.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ConfirmationPage;