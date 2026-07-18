import React from "react";

export default function PatientQR() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-xl p-8 w-[400px] text-center">
        <h1 className="text-3xl font-bold mb-6">
          Patient QR ID
        </h1>

        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=PATIENT-001"
          alt="Patient QR"
          className="mx-auto rounded-lg"
        />

        <div className="mt-6 space-y-2">
          <p><strong>Name:</strong> Rahul Sharma</p>
          <p><strong>Patient ID:</strong> PATIENT-001</p>
          <p><strong>Blood Group:</strong> O+</p>
        </div>
      </div>
    </div>
  );
}