import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Loader2,
  Lock,
} from 'lucide-react';
import { loadScript } from '@paypal/paypal-js';

import api from '../../api/api';

const extractApiData = (response) => {
  let current = response;

  // Axios
  if (current?.data !== undefined) {
    current = current.data;
  }

  // Desenvuelve las capas { success, data } que agrega el backend
  for (let i = 0; i < 5; i += 1) {
    if (
      current &&
      typeof current === 'object' &&
      current.data !== undefined
    ) {
      current = current.data;
    } else {
      break;
    }
  }

  return current;
};

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;
  const message = responseData?.message;

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item?.constraints) {
          return Object.values(item.constraints).join(', ');
        }

        try {
          return JSON.stringify(item);
        } catch {
          return String(item);
        }
      })
      .filter(Boolean)
      .join(' | ');
  }

  if (typeof responseData?.error === 'string') {
    return responseData.error;
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  return 'No se pudo procesar el pago con PayPal.';
};

const PayPalPayment = ({
  clientId,
  localOrderId,
  disabled = false,
  onApproved,
  onCancel,
  onError,
  onProcessingChange,
}) => {
  const paypalContainerRef = useRef(null);
  

  /*
   * Guardamos los valores cambiantes en refs para evitar que
   * el SDK se destruya y vuelva a renderizar en cada cambio
   * de estado del CheckoutPage.
   */
  const disabledRef = useRef(disabled);
  const onApprovedRef = useRef(onApproved);
  const onCancelRef = useRef(onCancel);
  const onErrorRef = useRef(onError);
  const onProcessingChangeRef = useRef(onProcessingChange);

  const [isLoading, setIsLoading] = useState(true);
  const [sdkError, setSdkError] = useState('');

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    onApprovedRef.current = onApproved;
  }, [onApproved]);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onProcessingChangeRef.current = onProcessingChange;
  }, [onProcessingChange]);

  useEffect(() => {
    let cancelled = false;

    const renderPayPalButtons = async () => {
      if (!clientId || !localOrderId) {
        return;
      }

      if (!paypalContainerRef.current) {
        return;
      }

      setIsLoading(true);
      setSdkError('');

      paypalContainerRef.current.innerHTML = '';

      try {
        const paypal = await loadScript({
          clientId,
          currency: 'USD',
          intent: 'capture',
          components: 'buttons',
          locale: 'es_US',
          enableFunding: 'card,venmo,paylater',
        });

        if (cancelled) {
          return;
        }

        if (!paypal?.Buttons) {
          throw new Error(
            'El SDK de PayPal no devolvió el componente de botones.',
          );
        }

        const buttons = paypal.Buttons({
          style: {
            layout: 'vertical',
            shape: 'pill',
            label: 'paypal',
            height: 48,
            tagline: false,
          },

          createOrder: async () => {
            if (disabledRef.current) {
              throw new Error(
                'El pago está temporalmente deshabilitado.',
              );
            }

            if (!localOrderId) {
              throw new Error(
                'No existe una orden local para procesar.',
              );
            }

            try {
              onProcessingChangeRef.current?.(true);
              setSdkError('');

              const response = await api.post(
                '/paypal/create-order',
                {
                  orderId: localOrderId,
                },
              );

              console.log(
                '🔥 RESPUESTA COMPLETA CREATE PAYPAL:',
                response?.data,
              );

              const result = extractApiData(response);

              const paypalOrderId =
                result?.paypalOrderId || null;

              if (!paypalOrderId) {
                throw new Error(
                  'El backend no devolvió el identificador de PayPal.',
                );
              }

              console.log(
                '[PayPalPayment] Orden PayPal creada:',
                paypalOrderId,
              );

              return paypalOrderId;
            } catch (error) {
              console.error(
                '[PayPalPayment] Error creando orden:',
                error,
              );

              const message = getErrorMessage(error);

              if (!cancelled) {
                setSdkError(message);
              }

              onProcessingChangeRef.current?.(false);
              onErrorRef.current?.(error);

              throw error;
            }
          },

          onApprove: async (data) => {
            try {
              onProcessingChangeRef.current?.(true);
              setSdkError('');

              const paypalOrderId = data?.orderID;

              if (!paypalOrderId) {
                throw new Error(
                  'PayPal no devolvió el identificador de la orden aprobada.',
                );
              }

              const response = await api.post(
                '/paypal/capture-order',
                {
                  orderId: localOrderId,
                  paypalOrderId,
                },
              );

              const result = extractApiData(response);

              if (result?.status !== 'COMPLETED') {
                throw new Error(
                  'PayPal no confirmó el pago como completado.',
                );
              }

              console.log(
                '[PayPalPayment] Pago capturado correctamente:',
                {
                  localOrderId,
                  paypalOrderId,
                  captureId: result?.captureId,
                },
              );

              await onApprovedRef.current?.({
                localOrderId,
                paypalOrderId,
                captureId: result?.captureId || null,
                status: result?.status,
                rawResponse: response?.data,
              });
            } catch (error) {
              console.error(
                '[PayPalPayment] Error capturando pago:',
                error,
              );

              const message = getErrorMessage(error);

              if (!cancelled) {
                setSdkError(message);
              }

              onErrorRef.current?.(error);
            } finally {
              onProcessingChangeRef.current?.(false);
            }
          },

          onCancel: (data) => {
            console.log(
              '[PayPalPayment] Pago cancelado:',
              data,
            );

            onProcessingChangeRef.current?.(false);
            onCancelRef.current?.(data);
          },

          onError: (error) => {
            console.error(
              '[PayPalPayment] Error del SDK:',
              error,
            );

            /*
             * No mostramos el mensaje técnico interno de Zoid
             * directamente al comprador.
             */
            const rawMessage = getErrorMessage(error);

            const friendlyMessage =
              rawMessage
                .toLowerCase()
                .includes('zoid destroyed')
                ? 'El módulo de pago se reinició. Actualiza la página e intenta nuevamente.'
                : rawMessage;

            if (!cancelled) {
              setSdkError(friendlyMessage);
            }

            onProcessingChangeRef.current?.(false);
            onErrorRef.current?.(
              new Error(friendlyMessage),
            );
          },
        });

        if (
          typeof buttons.isEligible === 'function' &&
          !buttons.isEligible()
        ) {
          throw new Error(
            'PayPal no está disponible actualmente para este navegador o comprador.',
          );
        }

        await buttons.render(paypalContainerRef.current);

        if (!cancelled) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error(
          '[PayPalPayment] No se pudieron renderizar los botones:',
          error,
        );

        if (!cancelled) {
          setIsLoading(false);
          setSdkError(getErrorMessage(error));
        }

        onProcessingChangeRef.current?.(false);
        onErrorRef.current?.(error);
      }
    };

    renderPayPalButtons();

    return () => {
      /*
       * No llamamos buttons.close().
       *
       * close() estaba destruyendo los componentes globales de
       * Zoid durante los rerenders de React.
       */
      cancelled = true;
    };
  }, [clientId, localOrderId]);

  if (!clientId) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <p className="text-red-400 font-semibold text-sm">
          PayPal no está configurado
        </p>

        <p className="text-red-300/80 text-sm mt-1">
          No se encontró el Client ID del entorno de pago.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative min-h-[52px]">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#007AFF] animate-spin" />

            <span className="ml-2 text-white/60 text-sm">
              Cargando métodos de pago...
            </span>
          </div>
        )}

        <div
          ref={paypalContainerRef}
          className={
            disabled
              ? 'opacity-50 pointer-events-none'
              : ''
          }
        />
      </div>

      {sdkError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertTriangle
            size={18}
            className="text-red-400 flex-shrink-0 mt-0.5"
          />

          <div>
            <p className="text-red-400 font-semibold text-sm">
              Error al cargar el pago
            </p>

            <p className="text-red-300/80 text-sm mt-1">
              {sdkError}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white/5 border border-white/10 px-5 py-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <BadgeCheck
            size={16}
            className="text-[#22c55e]"
          />

          <span className="text-white/80 text-sm font-semibold">
            Formas de pago disponibles
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            'PayPal',
            'Tarjeta de débito',
            'Tarjeta de crédito',
          ].map((method) => (
            <div
              key={method}
              className="px-3 py-1.5 rounded-full bg-[#1A1A1A] border border-white/10 text-white/70 text-xs font-medium"
            >
              {method}
            </div>
          ))}
        </div>

        <p className="text-center text-white/40 text-[11px] mt-3 leading-relaxed">
          PayPal mostrará únicamente los métodos disponibles
          para el comprador, dispositivo y ubicación.
        </p>
      </div>

      <div className="flex items-center justify-center gap-1 pt-1">
        <Lock size={12} className="text-white/40" />

        <span className="text-white/40 text-xs">
          Pago procesado de forma segura por PayPal
        </span>
      </div>
    </div>
  );
};

export default PayPalPayment;