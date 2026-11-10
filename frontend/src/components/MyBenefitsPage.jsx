
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Gift,
  Download,
  Loader2,
  Calendar,
  MapPin,
  Store,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  QrCode,
} from "lucide-react";

import icono2026 from "../assets/icono_2026.png";
import logoProntoTicketLiveLarge from "../assets/logo-prontoticketlive-large.png";

const API_URL =
  process.env.REACT_APP_API_URL?.trim() ||
  "http://localhost:3000/api";

const BLUE = "#007AFF";
const ORANGE = "#FF9500";

const MyBenefitsPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadBenefits = async () => {
      setLoading(true);
      setError("");
      setData(null);

      try {
        if (!token) {
          throw new Error("El enlace de beneficios no es válido.");
        }

        const response = await fetch(
          `${API_URL}/beneficios/customer/coupons/${encodeURIComponent(token)}`,
          {
            method: "GET",
            credentials: "omit",
            cache: "no-store",
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error(
              "Este enlace de beneficios no es válido o ha vencido."
            );
          }

          throw new Error(
            "No pudimos consultar tus beneficios. Intenta nuevamente."
          );
        }

        const result = await response.json();

        const payload =
          result?.data?.data ||
          result?.data ||
          result;

        if (!payload || !Array.isArray(payload.coupons)) {
          throw new Error(
            "La información de los beneficios no está disponible."
          );
        }

        if (controller.signal.aborted) return;
        setData(payload);
      } catch (err) {
        if (err.name !== "AbortError" && !controller.signal.aborted) {
          setError(
            err.message || "Ocurrió un error al cargar tus beneficios."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadBenefits();

    return () => controller.abort();
  }, [token]);

  const formatDate = (value) => {
    if (!value) return "Sin fecha definida";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Sin fecha definida";

    return new Intl.DateTimeFormat("es-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getCouponStatus = (coupon) => {
    const status = String(coupon.status || "").toUpperCase();

    if (status === "REDEEMED") {
      return {
        label: "UTILIZADO",
        valid: false,
        className:
          "bg-blue-500/10 border-blue-400/20 text-blue-300",
      };
    }

    if (status === "CANCELLED") {
      return {
        label: "CANCELADO",
        valid: false,
        className:
          "bg-red-500/10 border-red-400/20 text-red-300",
      };
    }

    if (
      status === "EXPIRED" ||
      (coupon.expiresAt &&
        new Date(coupon.expiresAt).getTime() <= Date.now())
    ) {
      return {
        label: "VENCIDO",
        valid: false,
        className:
          "bg-orange-500/10 border-orange-400/20 text-orange-300",
      };
    }

    if (status === "CLAIMED") {
      return {
        label: "DISPONIBLE",
        valid: true,
        className:
          "bg-green-500/10 border-green-400/20 text-green-300",
      };
    }

    return {
      label: "NO DISPONIBLE",
      valid: false,
      className:
        "bg-zinc-500/10 border-zinc-400/20 text-zinc-300",
    };
  };

  // Convierte imágenes PNG, JPEG o WebP a PNG para jsPDF.
  // Para imágenes externas, Cloudinary debe permitir CORS.
  const loadImage = async (src) => {
    if (!src) return null;

    try {
      const response = await fetch(src, {
        mode: "cors",
        credentials: "omit",
      });

      if (!response.ok) return null;

      const blob = await response.blob();

      const objectUrl = URL.createObjectURL(blob);

      try {
        const image = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = objectUrl;
        });

        const canvas = document.createElement("canvas");

        const maxSize = 1000;
        const scale = Math.min(
          1,
          maxSize / Math.max(image.width, image.height)
        );

        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const ctx = canvas.getContext("2d");

        if (!ctx) return null;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        return {
          data: canvas.toDataURL("image/png"),
          width: canvas.width,
          height: canvas.height,
        };
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch (err) {
      console.warn("No se pudo preparar una imagen para el PDF:", err);
      return null;
    }
  };

  // Genera el mismo QR del cupón y añade el icono corporativo
  // directamente sobre el canvas para asegurar su presencia en PDF.
  const qrToImage = async (value, iconImage) => {
    const size = 300;

    const svgString = renderToStaticMarkup(
      <QRCodeSVG
        value={String(value)}
        size={size}
        level="H"
        includeMargin={true}
        bgColor="#FFFFFF"
        fgColor="#000000"
      />
    );

    const svgWithNamespace = svgString.includes("xmlns=")
      ? svgString
      : svgString.replace(
          "<svg",
          '<svg xmlns="http://www.w3.org/2000/svg"'
        );

    const blob = new Blob([svgWithNamespace], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    try {
      const qrImage = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(new Error("No se pudo convertir el código QR."));
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("No se pudo crear el código QR.");
      }

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(qrImage, 0, 0, size, size);

      if (iconImage?.data) {
        const icon = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = iconImage.data;
        });

        // Tamaño reducido y fondo blanco para proteger la lectura.
        const iconSize = 43;
        const padding = 5;
        const center = size / 2;

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(
          center - iconSize / 2 - padding,
          center - iconSize / 2 - padding,
          iconSize + padding * 2,
          iconSize + padding * 2
        );

        ctx.drawImage(
          icon,
          center - iconSize / 2,
          center - iconSize / 2,
          iconSize,
          iconSize
        );
      }

      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  // Inserta una imagen en el PDF conservando sus proporciones.
  const addImageContained = (
    doc,
    image,
    x,
    y,
    maxWidth,
    maxHeight
  ) => {
    if (!image?.data || !image.width || !image.height) {
      return false;
    }

    const ratio = Math.min(
      maxWidth / image.width,
      maxHeight / image.height
    );

    const width = image.width * ratio;
    const height = image.height * ratio;

    const imageX = x + (maxWidth - width) / 2;
    const imageY = y + (maxHeight - height) / 2;

    try {
      doc.addImage(
        image.data,
        "PNG",
        imageX,
        imageY,
        width,
        height,
        undefined,
        "FAST"
      );

      return true;
    } catch (err) {
      console.warn("No se pudo insertar una imagen en el PDF:", err);
      return false;
    }
  };

  // Carga del logo con el metodo utilizado en MyTicketsPage.
  const loadImageAsDataUrl = async (src) => {
    if (!src) return null;
    try {
      const response = await fetch(src);
      if (!response.ok) return null;
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn(error);
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    if (!data?.coupons?.length || generatingPDF) return;

    setGeneratingPDF(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const margin = 16;
      const contentWidth = pageWidth - margin * 2;
      const total = data.coupons.length;

      const logoDataUrl = await loadImageAsDataUrl(logoProntoTicketLiveLarge);
      const brandIcon = await loadImage(icono2026);

      for (let index = 0; index < total; index++) {
        const coupon = data.coupons[index];
        const promotion = coupon.promotion || {};
        const merchant = promotion.merchant || {};
        const status = getCouponStatus(coupon);

        const merchantLogo = merchant.logoUrl
          ? await loadImage(merchant.logoUrl)
          : null;

        if (index > 0) {
          doc.addPage();
        }

        // Fondo de página.
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, "F");

        // Encabezado corporativo.
        doc.setFillColor(10, 25, 45);
        doc.roundedRect(
          margin,
          12,
          contentWidth,
          34,
          4,
          4,
          "F"
        );

        if (logoDataUrl) {
          try {
            doc.addImage(logoDataUrl, "PNG", margin + 6, 17, 70, 18, undefined, "FAST");
          } catch (error) {
            console.warn("No se pudo insertar el logo:", error);
          }
        } else {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(17);
          doc.setTextColor(255, 255, 255);
          doc.text("ProntoTicketLive", margin + 7, 32);
        }


        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);

        doc.text(
          `Beneficio ${index + 1} de ${total}`,
          pageWidth - margin - 6,
          26,
          { align: "right" }
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(210, 220, 235);

        doc.text(
          "CUPÓN DE BENEFICIOS",
          pageWidth - margin - 6,
          33,
          { align: "right" }
        );

        // Franja de identidad.
        doc.setFillColor(0, 122, 255);
        doc.rect(margin, 48, contentWidth / 2, 2, "F");

        doc.setFillColor(255, 149, 0);
        doc.rect(
          margin + contentWidth / 2,
          48,
          contentWidth / 2,
          2,
          "F"
        );

        // Título de la promoción.
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(10, 40, 75);

        const title = doc.splitTextToSize(
          promotion.title || "Beneficio ProntoTicketLive",
          contentWidth
        );

        doc.text(title, margin, 62);

        let y = 62 + title.length * 7 + 5;

        // Recuadro del comercio.
        const merchantBoxHeight = 34;

        doc.setFillColor(246, 248, 251);
        doc.setDrawColor(224, 230, 238);

        doc.roundedRect(
          margin,
          y,
          contentWidth,
          merchantBoxHeight,
          3,
          3,
          "FD"
        );

        // Fondo blanco para el logo.
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(
          margin + 4,
          y + 4,
          26,
          26,
          2,
          2,
          "F"
        );

        const merchantLogoAdded = addImageContained(
          doc,
          merchantLogo,
          margin + 5,
          y + 5,
          24,
          24
        );

        if (!merchantLogoAdded) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(100, 110, 120);
          doc.text(
            "LOGO",
            margin + 17,
            y + 18,
            { align: "center" }
          );
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(110, 120, 130);

        doc.text(
          "COMERCIO PARTICIPANTE",
          margin + 35,
          y + 12
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(25, 35, 50);

        const merchantName = doc.splitTextToSize(
          merchant.name || "Comercio participante",
          contentWidth - 44
        );

        doc.text(
          merchantName.slice(0, 2),
          margin + 35,
          y + 21
        );

        y += merchantBoxHeight + 9;

        // Descripción.
        if (promotion.description) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(75, 75, 75);

          const description = doc.splitTextToSize(
            promotion.description,
            contentWidth
          );

          doc.text(description.slice(0, 4), margin, y);
          y += Math.min(description.length, 4) * 5 + 6;
        }

        // Estado.
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);

        if (status.valid) {
          doc.setTextColor(0, 135, 70);
        } else {
          doc.setTextColor(180, 80, 35);
        }

        doc.text(`Estado: ${status.label}`, margin, y);
        y += 7;

        // Vigencia.
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(65, 65, 65);

        doc.text(
          `Válido hasta: ${formatDate(
            coupon.expiresAt || promotion.validUntil
          )}`,
          margin,
          y
        );

        y += 7;

        // Ubicación del comercio.
        if (
          merchant.address ||
          merchant.city ||
          merchant.country
        ) {
          const address = [
            merchant.address,
            merchant.city,
            merchant.country,
          ]
            .filter(Boolean)
            .join(", ");

          const addressLines = doc.splitTextToSize(
            address,
            contentWidth
          );

          doc.text(addressLines.slice(0, 2), margin, y);
          y += Math.min(addressLines.length, 2) * 4.5 + 5;
        }

        // QR corporativo.
        if (coupon.code) {
          const qrImage = await qrToImage(
            coupon.code,
            brandIcon
          );

          const qrSize = 60;

          // Mantener el QR dentro de la página.
          const qrY = Math.min(
            Math.max(y + 3, 149),
            195
          );

          const qrX = (pageWidth - qrSize) / 2;

          // Marco corporativo redondeado azul y naranja.
          doc.setLineWidth(0.9);
          doc.setDrawColor(0, 122, 255);
          doc.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6, 4, 4, "S");
          doc.setDrawColor(255, 149, 0);
          doc.line(qrX + qrSize / 2, qrY - 3, qrX + qrSize + 1, qrY - 3);
          doc.line(qrX + qrSize + 3, qrY + qrSize / 2, qrX + qrSize + 3, qrY + qrSize - 1);
          doc.line(qrX + 2, qrY + qrSize + 3, qrX + qrSize / 2, qrY + qrSize + 3);

          doc.addImage(
            qrImage,
            "PNG",
            qrX,
            qrY,
            qrSize,
            qrSize,
            undefined,
            "FAST"
          );

          y = qrY + qrSize + 9;

          doc.setFont("courier", "bold");
          doc.setFontSize(10);
          doc.setTextColor(10, 40, 75);

          const codeLines = doc.splitTextToSize(
            coupon.code,
            contentWidth
          );

          doc.text(
            codeLines,
            pageWidth / 2,
            y,
            { align: "center" }
          );

          y += codeLines.length * 5 + 5;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);

          doc.text(
            status.valid
              ? "Presenta este código en el comercio participante."
              : "Este beneficio no está disponible para su utilización.",
            pageWidth / 2,
            y,
            { align: "center" }
          );

          y += 9;
        }

        // Condiciones del beneficio.
        if (promotion.terms) {
          const termsY = Math.max(y + 3, 245);

          if (termsY < 272) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(30, 30, 30);

            doc.text(
              "Condiciones del beneficio",
              margin,
              termsY
            );

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(90, 90, 90);

            const terms = doc.splitTextToSize(
              promotion.terms,
              contentWidth
            );

            const availableLines = Math.max(
              0,
              Math.floor((276 - (termsY + 6)) / 4.2)
            );

            if (availableLines > 0) {
              doc.text(
                terms.slice(0, availableLines),
                margin,
                termsY + 6
              );
            }
          }
        }

        // Pie de página.
        doc.setDrawColor(225, 225, 225);
        doc.setLineWidth(0.2);
        doc.line(
          margin,
          283,
          pageWidth - margin,
          283
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);

        doc.text(
          "ProntoTicketLive.com - Beneficios",
          margin,
          289
        );

        doc.setTextColor(0, 122, 255);
        doc.text(
          `${index + 1} / ${total}`,
          pageWidth - margin,
          289,
          { align: "right" }
        );
      }

      const safeOrderId = String(data.orderId || "orden")
        .replace(/[^a-zA-Z0-9_-]/g, "");

      doc.save(
        `ProntoTicketLive_Beneficios_${safeOrderId}.pdf`
      );
    } catch (err) {
      console.error("Error generando PDF:", err);

      alert(
        "No pudimos generar el PDF. Intenta nuevamente."
      );
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center text-white/70">
          <Loader2
            size={34}
            className="animate-spin mx-auto mb-4"
          />
          <p>Cargando tus beneficios...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-xl mx-auto px-4 pt-32 pb-20 text-center">
          <AlertCircle
            size={48}
            className="text-orange-400 mx-auto mb-5"
          />

          <h1 className="text-3xl font-bold mb-4">
            No pudimos cargar tus beneficios
          </h1>

          <p className="text-white/60 mb-8">
            {error || "Verifica el enlace recibido por correo."}
          </p>

          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-2xl bg-[#007AFF] font-semibold"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const coupons = data.coupons || [];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <main className="max-w-6xl mx-auto px-4 pt-28 pb-20">
        <div className="text-center mb-10">
          <img
            src={icono2026}
            alt="ProntoTicketLive"
            className="w-20 h-20 object-contain mx-auto mb-5"
          />

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/20 text-blue-300 text-sm mb-5">
            <ShieldCheck size={16} />
            Beneficios de ProntoTicketLive
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold mb-4">
            Mis Beneficios
          </h1>

          <p className="text-white/60 max-w-2xl mx-auto">
            Descubre los beneficios que recibiste con tu compra.
            Presenta el código QR en el comercio participante.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#0d2340] to-[#3a2410] p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div>
              <p className="text-white/50 text-sm mb-2">
                Número de orden
              </p>

              <p className="font-mono text-sm break-all">
                {data.orderId}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Gift size={24} className="text-[#FF9500]" />

              <div>
                <p className="text-white/50 text-xs">
                  Beneficios recibidos
                </p>

                <p className="text-2xl font-bold">
                  {coupons.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {coupons.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#121212] p-10 text-center">
            <Gift
              size={40}
              className="mx-auto mb-4 text-white/40"
            />

            <h2 className="text-xl font-bold mb-3">
              No hay beneficios disponibles
            </h2>

            <p className="text-white/50">
              Esta compra no tiene cupones asociados.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {coupons.map((coupon, index) => {
              const promotion = coupon.promotion || {};
              const merchant = promotion.merchant || {};
              const status = getCouponStatus(coupon);

              return (
                <article
                  key={coupon.id || index}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-[#121212]"
                >
                  <div className="h-1.5 bg-gradient-to-r from-[#007AFF] to-[#FF9500]" />

                  <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="p-5 sm:p-7">
                      <div className="flex items-center gap-3 mb-5">
                        {merchant.logoUrl ? (
                          <img
                            src={merchant.logoUrl}
                            alt={merchant.name || "Comercio"}
                            className="w-16 h-16 object-contain bg-white rounded-xl p-2"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center">
                            <Store size={28} />
                          </div>
                        )}

                        <div>
                          <p className="text-white/50 text-xs mb-1">
                            Comercio participante
                          </p>

                          <h3 className="font-bold text-lg">
                            {merchant.name || "Comercio"}
                          </h3>
                        </div>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                        {promotion.title || "Beneficio especial"}
                      </h2>

                      {promotion.description && (
                        <p className="text-white/65 mb-5 leading-relaxed">
                          {promotion.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 mb-5">
                        <span
                          className={`px-4 py-2 rounded-full border text-sm font-semibold ${status.className}`}
                        >
                          {status.valid ? (
                            <CheckCircle2
                              size={15}
                              className="inline mr-2"
                            />
                          ) : (
                            <AlertCircle
                              size={15}
                              className="inline mr-2"
                            />
                          )}
                          {status.label}
                        </span>

                        <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/70">
                          <Calendar
                            size={15}
                            className="inline mr-2"
                          />
                          {formatDate(
                            coupon.expiresAt ||
                              promotion.validUntil
                          )}
                        </span>
                      </div>

                      {(merchant.address || merchant.city) && (
                        <div className="flex items-start gap-2 text-sm text-white/60 mb-5">
                          <MapPin
                            size={17}
                            className="text-[#007AFF] shrink-0"
                          />

                          <span>
                            {[
                              merchant.address,
                              merchant.city,
                              merchant.country,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}

                      {promotion.terms && (
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                          <p className="font-semibold text-sm mb-2">
                            Condiciones del beneficio
                          </p>

                          <p className="text-white/60 text-sm whitespace-pre-line">
                            {promotion.terms}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t lg:border-t-0 lg:border-l border-white/10 p-6 flex flex-col items-center justify-center bg-white/[0.02]">
                      <div className="flex items-center gap-2 text-white/50 text-sm mb-5">
                        <QrCode size={17} />
                        Código QR del beneficio
                      </div>

                      <div
                        className="relative rounded-3xl p-[3px]"
                        style={{
                          background:
                            "linear-gradient(135deg, #007AFF 0%, #007AFF 50%, #FF9500 50%, #FF9500 100%)",
                        }}
                      >
                        <div className="bg-white p-4 rounded-[21px] relative">
                          <div
                            className={
                              status.valid
                                ? ""
                                : "opacity-30 grayscale"
                            }
                          >
                            {coupon.code ? (
                              <QRCodeSVG
                                value={coupon.code}
                                size={180}
                                level="H"
                                includeMargin={true}
                                imageSettings={{
                                  src: icono2026,
                                  height: 28,
                                  width: 28,
                                  excavate: true,
                                }}
                              />
                            ) : (
                              <div className="w-[180px] h-[180px]" />
                            )}
                          </div>

                          {!status.valid && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-black/80 text-white font-bold px-4 py-2 rounded-xl -rotate-12">
                                {status.label}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="font-mono text-sm text-[#FFB347] mt-5 break-all text-center">
                        {coupon.code || "Sin código"}
                      </p>

                      <p className="text-white/45 text-xs text-center mt-4 max-w-xs">
                        {status.valid
                          ? "Presenta este código en el comercio participante."
                          : "Este beneficio no está disponible para su utilización."}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}

            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] font-bold flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {generatingPDF ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Descargar mis beneficios en PDF
                </>
              )}
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-10 text-white/40 text-xs">
          <Clock size={14} />
          Los beneficios están sujetos a sus condiciones de uso.
        </div>
      </main>
    </div>
  );
};

export default MyBenefitsPage;
