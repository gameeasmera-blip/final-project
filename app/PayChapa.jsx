import React, { useState } from "react";
import axios from "axios";

export default function PayChapa({ applicationId }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // Backend API gaafachuu
      const response = await axios.post("http://localhost:5000/api/pay-chapa", {
        app_id: applicationId,
      });

      if (response.data.status === "success" && response.data.checkout_url) {
        // Gara Fuula Chapa Checkout URL redirect gochuu
        window.location.href = response.data.checkout_url;
      } else {
        setErrorMsg("Payment initialization failed!");
      }
    } catch (err) {
      console.error("Payment Error:", err);
      setErrorMsg(
        err.response?.data?.error?.message ||
          "Payment Gateway Direct Error or Network issue.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="card shadow-sm p-4 mx-auto style-card"
      style={{ maxWidth: "500px" }}
    >
      <h4 className="text-primary mb-3">WU Admission Fee Payment</h4>
      <p>Kaffaltii iyyannoo keessaniif br. 200 Chapaa fayyadamtuu kaffalaa.</p>

      {errorMsg && (
        <div className="alert alert-danger text-start">
          <strong>Payment Error:</strong>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(errorMsg, null, 2)}
          </pre>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading}
        className="btn btn-success w-100 mt-2"
      >
        {loading ? (
          <span>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
            />
            Processing...
          </span>
        ) : (
          "Pay with Chapa (ETB 200)"
        )}
      </button>
    </div>
  );
}
