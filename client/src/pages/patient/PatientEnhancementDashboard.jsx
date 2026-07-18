import React from "react";
import { Link } from "react-router-dom";

const features = [
  {
    title: "QR Patient ID",
    description: "View your digital patient QR identification.",
    path: "/patient/qr",
    color: "bg-blue-500",
  },
  {
    title: "Patient Timeline",
    description: "Track your medical history and visits.",
    path: "/patient/timeline",
    color: "bg-green-500",
  },
  {
    title: "Voice Notes",
    description: "Store and manage voice recordings.",
    path: "/patient/voice-notes",
    color: "bg-purple-500",
  },
  {
    title: "Medical Certificate",
    description: "View and download medical certificates.",
    path: "/patient/medical-certificate",
    color: "bg-red-500",
  },
];

export default function PatientEnhancementDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-2">
        Patient Enhancement Dashboard
      </h1>

      <p className="text-gray-600 mb-8">
        Access all patient enhancement features from one place.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
          >
            <div
              className={`w-12 h-12 rounded-lg ${item.color} mb-4`}
            ></div>

            <h2 className="text-xl font-semibold mb-2">
              {item.title}
            </h2>

            <p className="text-gray-600 mb-5">
              {item.description}
            </p>

            <Link
              to={item.path}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Open
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}