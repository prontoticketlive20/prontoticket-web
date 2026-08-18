import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CreditCard,
  Loader2,
  Lock,
} from 'lucide-react';

import api from '../../api/api';

const ACCEPT_JS_SANDBOX_URL =
  'https://jstest.authorize.net/v1/Accept.js';

const ACCEPT_JS_LIVE_URL =
  'https://js.authorize.net/v1/Accept.js';

const extractApiData = (response) => {
  let current = response;

  // Axios
  if (current?.data !== undefined) {
    current = current.data;
  }

  // Desenvuelve capas { success, data } del backend
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

  return 'No se pudo procesar el pago con tarjeta.';
};

const loadAcceptJs = (environment) => {
  return new Promise((resolve, reject) => {
    if (
      window.Accept &&
      typeof window.Accept.dispatchData === 'function'
    ) {
      resolve(window.Accept);
      return;
    }

    const scriptId = 'authorize-net-accept-js';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      const handleExistingLoad = () => {
        if (
          window.Accept &&
          typeof window.Accept.dispatchData === 'function'
        ) {
          resolve(window.Accept);
        } else {
          reject(
            new Error(
              'Accept.js cargó, pero Authorize.net no quedó disponible.',
            ),
          );
        }
      };

      existingScript.addEventListener(
        'load',
        handleExistingLoad,
        { once: true },
      );

      existingScript.addEventListener(
        'error',
        () => {
          reject(
            new Error(
              'No se pudo cargar el módulo seguro de Authorize.net.',
            ),
          );
        },
        { once: true },
      );

      /*
       * Si el script ya terminó de cargar antes de registrar
       * el listener, verificamos nuevamente.
       */
      setTimeout(() => {
        if (
          window.Accept &&
          typeof window.Accept.dispatchData === 'function'
        ) {
          resolve(window.Accept);
        }
      }, 0);

      return;
    }

    const script = document.createElement('script');

    script.id = scriptId;
    script.type = 'text/javascript';
    script.async = true;

    script.src =
      environment === 'live'
        ? ACCEPT_JS_LIVE_URL
        : ACCEPT_JS_SANDBOX_URL;

    script.onload = () => {
      if (
        window.Accept &&
        typeof window.Accept.dispatchData === 'function'
      ) {
        resolve(window.Accept);
        return;
      }

      reject(
        new Error(
          'Accept.js cargó, pero Authorize.net no quedó disponible.',
        ),
      );
    };

    script.onerror = () => {
      reject(
        new Error(
          'No se pudo cargar el módulo seguro de Authorize.net.',
        ),
      );
    };

    document.body.appendChild(script);
  });
};

const getAcceptErrorMessage = (response) => {
  const messages = response?.messages?.message;

  if (!Array.isArray(messages) || messages.length === 0) {
    return 'Authorize.net no pudo validar los datos de la tarjeta.';
  }

  return messages
    .map((item) => {
      const code = item?.code ? `${item.code}: ` : '';
      const text =
        item?.text ||
        'No se pudo validar la información de pago.';

      return `${code}${text}`;
    })
    .join(' | ');
};

const AuthorizeNetPayment = ({
  localOrderId,
  currency = 'USD',
  amount = 0,
  disabled = false,
  onApproved,
  onError,
  onProcessingChange,
}) => {
  const onApprovedRef = useRef(onApproved);
  const onErrorRef = useRef(onError);
  const onProcessingChangeRef = useRef(onProcessingChange);
  const disabledRef = useRef(disabled);

  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [sdkLoading, setSdkLoading] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const [cardData, setCardData] = useState({
    cardNumber: '',
    expirationMonth: '',
    expirationYear: '',
    cardCode: '',
  });

  useEffect(() => {
    onApprovedRef.current = onApproved;
  }, [onApproved]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onProcessingChangeRef.current = onProcessingChange;
  }, [onProcessingChange]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  /*
   * Cargamos únicamente configuración pública.
   *
   * El Transaction Key nunca llega al navegador.
   */
  useEffect(() => {
    let active = true;

    const loadConfig = async () => {
      try {
        setConfigLoading(true);
        setPaymentError('');

        const response = await api.get(
          '/authorize-net/config',
        );

        const data = extractApiData(response);

        const apiLoginId = data?.apiLoginId || '';
        const publicClientKey =
          data?.publicClientKey || '';

        const environment =
          data?.environment === 'live'
            ? 'live'
            : 'sandbox';

        if (!apiLoginId || !publicClientKey) {
          throw new Error(
            'El backend no devolvió la configuración pública de Authorize.net.',
          );
        }

        if (active) {
          setConfig({
            apiLoginId,
            publicClientKey,
            environment,
          });
        }
      } catch (error) {
        console.error(
          '[AuthorizeNetPayment] Error cargando configuración:',
          error,
        );

        if (active) {
          setPaymentError(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setConfigLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      active = false;
    };
  }, []);

  /*
   * Una vez conocida la configuración cargamos Accept.js
   * correspondiente a Sandbox o Live.
   */
  useEffect(() => {
    let active = true;

    const prepareAcceptJs = async () => {
      if (!config) {
        return;
      }

      try {
        setSdkLoading(true);

        await loadAcceptJs(config.environment);

        if (active) {
          setSdkLoading(false);
        }
      } catch (error) {
        console.error(
          '[AuthorizeNetPayment] Error cargando Accept.js:',
          error,
        );

        if (active) {
          setSdkLoading(false);
          setPaymentError(getErrorMessage(error));
        }
      }
    };

    prepareAcceptJs();

    return () => {
      active = false;
    };
  }, [config]);

  const handleCardInputChange = (event) => {
    if (isProcessing || disabledRef.current) {
      return;
    }

    const { name, value } = event.target;

    let normalizedValue = value;

    if (name === 'cardNumber') {
      normalizedValue = value
        .replace(/\D/g, '')
        .slice(0, 19);
    }

    if (name === 'expirationMonth') {
      normalizedValue = value
        .replace(/\D/g, '')
        .slice(0, 2);
    }

    if (name === 'expirationYear') {
      normalizedValue = value
        .replace(/\D/g, '')
        .slice(0, 4);
    }

    if (name === 'cardCode') {
      normalizedValue = value
        .replace(/\D/g, '')
        .slice(0, 4);
    }

    setCardData((previous) => ({
      ...previous,
      [name]: normalizedValue,
    }));

    if (paymentError) {
      setPaymentError('');
    }
  };

  const validateCardData = () => {
    const cardNumber = cardData.cardNumber.replace(/\D/g, '');

    if (cardNumber.length < 13) {
      return 'Ingresa un número de tarjeta válido.';
    }

    const month = Number(cardData.expirationMonth);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return 'Ingresa un mes de expiración válido.';
    }

    if (cardData.expirationYear.length !== 4) {
      return 'Ingresa el año de expiración con 4 dígitos.';
    }

    const year = Number(cardData.expirationYear);

    if (!Number.isInteger(year) || year < 2000) {
      return 'Ingresa un año de expiración válido.';
    }

    if (cardData.cardCode.length < 3) {
      return 'Ingresa un código de seguridad válido.';
    }

    return null;
  };

  const tokenizeCard = () => {
    return new Promise((resolve, reject) => {
      if (
        !window.Accept ||
        typeof window.Accept.dispatchData !== 'function'
      ) {
        reject(
          new Error(
            'El módulo seguro de Authorize.net no está disponible.',
          ),
        );
        return;
      }

      const secureData = {
        authData: {
          apiLoginID: config.apiLoginId,
          clientKey: config.publicClientKey,
        },

        cardData: {
          cardNumber: cardData.cardNumber.replace(/\D/g, ''),
          month: cardData.expirationMonth.padStart(2, '0'),
          year: cardData.expirationYear,
          cardCode: cardData.cardCode,
        },
      };

      /*
       * Accept.js recibe los datos directamente en el navegador
       * y devuelve opaqueData.
       *
       * Los datos de tarjeta NO se envían a nuestro backend.
       */
      window.Accept.dispatchData(
        secureData,
        (response) => {
          if (
            response?.messages?.resultCode === 'Error'
          ) {
            reject(
              new Error(
                getAcceptErrorMessage(response),
              ),
            );
            return;
          }

          const opaqueData = response?.opaqueData;

          if (
            !opaqueData?.dataDescriptor ||
            !opaqueData?.dataValue
          ) {
            reject(
              new Error(
                'Authorize.net no devolvió el token seguro de pago.',
              ),
            );
            return;
          }

          resolve({
            dataDescriptor:
              opaqueData.dataDescriptor,
            dataValue:
              opaqueData.dataValue,
          });
        },
      );
    });
  };

  const handlePayment = async () => {
    if (
      disabledRef.current ||
      isProcessing ||
      configLoading ||
      sdkLoading
    ) {
      return;
    }

    if (!localOrderId) {
      const error = new Error(
        'No existe una orden local para procesar.',
      );

      setPaymentError(error.message);
      onErrorRef.current?.(error);
      return;
    }

    if (
      String(currency || 'USD').toUpperCase() !==
      'USD'
    ) {
      const error = new Error(
        'El pago con tarjeta mediante Authorize.net está disponible actualmente solo para USD.',
      );

      setPaymentError(error.message);
      onErrorRef.current?.(error);
      return;
    }

    if (!config) {
      const error = new Error(
        'Authorize.net no está configurado correctamente.',
      );

      setPaymentError(error.message);
      onErrorRef.current?.(error);
      return;
    }

    const validationError = validateCardData();

    if (validationError) {
      const error = new Error(validationError);

      setPaymentError(validationError);
      onErrorRef.current?.(error);
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentError('');
      onProcessingChangeRef.current?.(true);

      /*
       * PASO 1:
       * Accept.js tokeniza la tarjeta.
       */
      const opaqueData = await tokenizeCard();

      /*
       * PASO 2:
       * Nuestro backend recibe únicamente:
       *
       * - orderId
       * - opaqueData
       *
       * El monto real y la moneda se obtienen nuevamente
       * desde PostgreSQL.
       */
      const response = await api.post(
        '/authorize-net/charge-order',
        {
          orderId: localOrderId,
          opaqueData,
        },
      );

      const result = extractApiData(response);

      if (result?.status !== 'COMPLETED') {
        throw new Error(
          'Authorize.net no confirmó el pago como completado.',
        );
      }

      const transactionId =
        result?.transactionId || null;

      if (!transactionId) {
        throw new Error(
          'Authorize.net no devolvió el identificador de la transacción.',
        );
      }

      console.log(
        '[AuthorizeNetPayment] Pago procesado correctamente:',
        {
          localOrderId,
          transactionId,
          authorizationCode:
            result?.authorizationCode || null,
          amount: result?.amount,
          currency: result?.currency,
        },
      );

      await onApprovedRef.current?.({
        localOrderId,
        transactionId,
        authorizationCode:
          result?.authorizationCode || null,
        status: result?.status,
        amount: result?.amount,
        currency: result?.currency,
        accountNumber:
          result?.accountNumber || null,
        accountType:
          result?.accountType || null,
        rawResponse: response?.data,
      });
    } catch (error) {
      console.error(
        '[AuthorizeNetPayment] Error procesando pago:',
        error,
      );

      const message = getErrorMessage(error);

      setPaymentError(message);
      onErrorRef.current?.(error);
    } finally {
      setIsProcessing(false);
      onProcessingChangeRef.current?.(false);
    }
  };

  const isUnavailable =
    disabled ||
    configLoading ||
    sdkLoading ||
    isProcessing ||
    !config;

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-[#007AFF] animate-spin" />

        <span className="ml-2 text-white/60 text-sm">
          Preparando pago seguro con tarjeta...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
            <CreditCard
              size={20}
              className="text-[#007AFF]"
            />
          </div>

          <div>
            <h3 className="text-white font-bold">
              Tarjeta de crédito o débito
            </h3>

            <p className="text-white/50 text-xs mt-0.5">
              Ingresa los datos de tu tarjeta de forma segura.
            </p>
          </div>
        </div>

        {sdkLoading && !paymentError && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-[#007AFF] animate-spin" />

            <span className="ml-2 text-white/60 text-sm">
              Cargando módulo seguro...
            </span>
          </div>
        )}

        {!sdkLoading && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="authorizeCardNumber"
                className="block text-white/70 text-sm mb-2"
              >
                Número de tarjeta
              </label>

              <input
                id="authorizeCardNumber"
                name="cardNumber"
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                value={cardData.cardNumber}
                onChange={handleCardInputChange}
                disabled={isUnavailable}
                className="w-full px-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="authorizeExpirationMonth"
                  className="block text-white/70 text-sm mb-2"
                >
                  Mes
                </label>

                <input
                  id="authorizeExpirationMonth"
                  name="expirationMonth"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp-month"
                  placeholder="MM"
                  value={cardData.expirationMonth}
                  onChange={handleCardInputChange}
                  disabled={isUnavailable}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="authorizeExpirationYear"
                  className="block text-white/70 text-sm mb-2"
                >
                  Año
                </label>

                <input
                  id="authorizeExpirationYear"
                  name="expirationYear"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp-year"
                  placeholder="AAAA"
                  value={cardData.expirationYear}
                  onChange={handleCardInputChange}
                  disabled={isUnavailable}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label
                  htmlFor="authorizeCardCode"
                  className="block text-white/70 text-sm mb-2"
                >
                  CVV
                </label>

                <input
                  id="authorizeCardCode"
                  name="cardCode"
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  value={cardData.cardCode}
                  onChange={handleCardInputChange}
                  disabled={isUnavailable}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={isUnavailable}
              className="w-full py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-bold rounded-full transition-all duration-300 hover:brightness-110 shadow-lg hover:shadow-[#007AFF]/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />

                  <span>Procesando pago...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />

                  <span>
                    Pagar con tarjeta
                    {Number(amount) > 0
                      ? ` ${Number(amount).toFixed(2)} ${String(
                          currency || 'USD',
                        ).toUpperCase()}`
                      : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {paymentError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertTriangle
            size={18}
            className="text-red-400 flex-shrink-0 mt-0.5"
          />

          <div>
            <p className="text-red-400 font-semibold text-sm">
              No se pudo procesar el pago
            </p>

            <p className="text-red-300/80 text-sm mt-1">
              {paymentError}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white/5 border border-white/10 px-5 py-4">
        <div className="flex items-center justify-center gap-2">
          <BadgeCheck
            size={16}
            className="text-[#22c55e]"
          />

          <span className="text-white/70 text-xs text-center">
            Los datos de tu tarjeta se tokenizan de forma segura
            mediante Authorize.net y no se envían a
            ProntoTicketLive.
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 pt-1">
        <Lock size={12} className="text-white/40" />

        <span className="text-white/40 text-xs">
          Pago seguro con tarjeta
        </span>
      </div>
    </div>
  );
};

export default AuthorizeNetPayment;